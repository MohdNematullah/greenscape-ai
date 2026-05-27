/**
 * External Integrations — Slack Webhooks & Email (Resend)
 *
 * Slack: Real-time channel notifications for leads, proposals, projects
 * Email: Customer update emails via Resend API
 *
 * All integrations are best-effort — they fail silently if not configured.
 */
import { v } from "convex/values";
import { action, query, internalQuery, internalMutation, mutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

declare const process: { env: Record<string, string | undefined> };

const APP_URL = "https://greenscape-ai-navy.vercel.app";

// ─── Slack Core ───────────────────────────────────────────────────────────────

type SlackBlock = Record<string, unknown>;

async function sendSlackWebhook(blocks: SlackBlock[], fallbackText: string, webhookOverride?: string): Promise<boolean> {
  const webhookUrl = webhookOverride || process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("SLACK_WEBHOOK_URL not configured — skipping");
    return false;
  }
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: fallbackText, blocks }),
    });
    if (!res.ok) {
      console.error(`Slack error: ${res.status} ${await res.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Slack webhook error:", err);
    return false;
  }
}

/** Resolve webhook URL from env vars or DB settings */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveSlackWebhook(ctx: { runQuery: any }): Promise<string | undefined> {
  const envUrl = process.env.SLACK_WEBHOOK_URL;
  if (envUrl) return envUrl;
  const dbUrl: string | null = await ctx.runQuery(api.settings.get, { key: "SLACK_WEBHOOK_URL" });
  return dbUrl || undefined;
}

/** Enqueue a Slack message for Viktor relay (always works, no webhook needed) */
export const enqueueSlackMessage = mutation({
  args: { blocksJson: v.string(), text: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("slackQueue", {
      blocksJson: args.blocksJson,
      text: args.text,
      status: "pending",
    });
  },
});

/** Internal version for actions to call */
export const enqueueSlackInternal = internalMutation({
  args: { blocksJson: v.string(), text: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("slackQueue", {
      blocksJson: args.blocksJson,
      text: args.text,
      status: "pending",
    });
  },
});

/** Send Slack notification — tries webhook first, always enqueues for Viktor relay */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendSlackNotification(ctx: { runQuery: any; runMutation: any }, blocks: SlackBlock[], fallbackText: string): Promise<boolean> {
  // Always enqueue for Viktor relay
  try {
    await ctx.runMutation(internal.integrations.enqueueSlackInternal, {
      blocksJson: JSON.stringify(blocks),
      text: fallbackText,
    });
  } catch (err) {
    console.error("Failed to enqueue Slack message:", err);
  }
  // Also try direct webhook if configured
  const url = await resolveSlackWebhook(ctx);
  if (url) {
    return await sendSlackWebhook(blocks, fallbackText, url);
  }
  return true; // queued successfully
}

function divider(): SlackBlock {
  return { type: "divider" };
}

function context(text: string): SlackBlock {
  return { type: "context", elements: [{ type: "mrkdwn", text }] };
}

// ─── Test Connection ──────────────────────────────────────────────────────────

export const testSlackConnection = action({
  args: { webhookUrl: v.optional(v.string()) },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const url = args.webhookUrl || await resolveSlackWebhook(ctx);
    if (!url) return false;
    return await sendSlackWebhook(
      [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "✅ *Greenscape AI — Slack Connected!*\nNotifications are live. You'll get alerts for:\n• New qualified leads\n• Proposal approvals & signatures\n• Daily pipeline digest\n• Approval requests",
          },
        },
        context(`Connected at ${new Date().toLocaleString("en-US", { timeZone: "America/Phoenix" })} · Phoenix AZ`),
      ],
      "Greenscape AI — Slack integration test ✅",
      url
    );
  },
});

// ─── Lead Notifications ───────────────────────────────────────────────────────

export const notifyNewLead = action({
  args: {
    name: v.string(),
    source: v.string(),
    projectType: v.optional(v.string()),
    budget: v.optional(v.string()),
    qualified: v.optional(v.boolean()),
    score: v.optional(v.number()),
    estimatedValue: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const isQualified = args.qualified === true;
    const isDisqualified = args.qualified === false;

    const emoji = isQualified ? "🟢" : isDisqualified ? "🔴" : "🔵";
    const statusLabel = isQualified
      ? `Qualified ✅  |  Score: ${args.score ?? "—"}/100`
      : isDisqualified
        ? "Disqualified ❌"
        : "Pending Review ⏳";

    const sourceLabel: Record<string, string> = {
      meta_ad: "Meta Ad 📱", google_lsa: "Google LSA 🔍", referral: "Referral 🤝",
      website: "Website 🌐", manual: "Manual Entry ✍️", ghl_import: "GHL Import 🔄",
    };

    const blocks: SlackBlock[] = [
      {
        type: "header",
        text: { type: "plain_text", text: `${emoji} New Lead: ${args.name}`, emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Source*\n${sourceLabel[args.source] || args.source}` },
          { type: "mrkdwn", text: `*Project*\n${args.projectType?.replace(/_/g, " ") || "Not specified"}` },
          { type: "mrkdwn", text: `*Budget*\n${args.budget ? `$${Number(args.budget).toLocaleString()}` : "Not specified"}` },
          { type: "mrkdwn", text: `*Status*\n${statusLabel}` },
        ],
      },
    ];

    if (args.estimatedValue) {
      blocks.push(context(`💰 Estimated value: ${args.estimatedValue}  ·  <${APP_URL}/leads|Open Leads>`));
    } else {
      blocks.push(context(`<${APP_URL}/leads|Open Leads in Dashboard>`));
    }

    return await sendSlackNotification(ctx, blocks, `${emoji} New lead: ${args.name} — ${statusLabel}`);
  },
});

// ─── Proposal Notifications ───────────────────────────────────────────────────

export const notifyProposalApproved = action({
  args: {
    clientName: v.string(),
    projectType: v.string(),
    totalAmount: v.optional(v.number()),
    approvedBy: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const blocks: SlackBlock[] = [
      {
        type: "header",
        text: { type: "plain_text", text: `📋 Proposal Approved — ${args.clientName}`, emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Client*\n${args.clientName}` },
          { type: "mrkdwn", text: `*Project*\n${args.projectType.replace(/_/g, " ")}` },
          { type: "mrkdwn", text: `*Amount*\n${args.totalAmount ? `$${args.totalAmount.toLocaleString()}` : "TBD"}` },
          { type: "mrkdwn", text: `*Approved by*\n${args.approvedBy}` },
        ],
      },
      context(`🚀 Ready to send to client for signature  ·  <${APP_URL}/proposals|Open Proposals>`),
    ];
    return await sendSlackNotification(ctx, blocks, `📋 Proposal approved for ${args.clientName}`);
  },
});

export const notifyProposalSigned = action({
  args: {
    clientName: v.string(),
    projectType: v.string(),
    totalAmount: v.optional(v.number()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const blocks: SlackBlock[] = [
      {
        type: "header",
        text: { type: "plain_text", text: `🎉 PROPOSAL SIGNED — ${args.clientName}!`, emoji: true },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*New project confirmed!* ${args.clientName} signed the proposal.\n\n*Project:* ${args.projectType.replace(/_/g, " ")}\n*Contract Value:* ${args.totalAmount ? `$${args.totalAmount.toLocaleString()}` : "TBD"}`,
        },
      },
      context(`🏗️ Next: Create project, send deposit invoice  ·  <${APP_URL}/projects|Open Projects>`),
    ];
    return await sendSlackNotification(ctx, blocks, `🎉 Signed! ${args.clientName} — $${args.totalAmount?.toLocaleString() ?? "TBD"}`);
  },
});

// ─── Approval Request Notification ───────────────────────────────────────────

export const notifyApprovalRequest = action({
  args: {
    title: v.string(),
    type: v.string(),
    requestedBy: v.string(),
    amount: v.optional(v.number()),
    urgency: v.string(),
    clientName: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const urgencyEmoji = args.urgency === "urgent" ? "🔴" : args.urgency === "normal" ? "🟡" : "🟢";
    const blocks: SlackBlock[] = [
      {
        type: "header",
        text: { type: "plain_text", text: `${urgencyEmoji} Approval Needed: ${args.title}`, emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Type*\n${args.type.replace(/_/g, " ")}` },
          { type: "mrkdwn", text: `*Requested by*\n${args.requestedBy}` },
          { type: "mrkdwn", text: `*Amount*\n${args.amount ? `$${args.amount.toLocaleString()}` : "N/A"}` },
          { type: "mrkdwn", text: `*Urgency*\n${args.urgency.toUpperCase()}` },
        ],
      },
      context(`${args.clientName ? `Client: ${args.clientName}  ·  ` : ""}<${APP_URL}/approvals|Review in Dashboard>`),
    ];
    return await sendSlackNotification(ctx, blocks, `${urgencyEmoji} Approval needed: ${args.title}`);
  },
});

// ─── Project Milestone Notification ──────────────────────────────────────────

export const notifyProjectMilestone = action({
  args: {
    clientName: v.string(),
    projectType: v.string(),
    milestone: v.string(),
    crewLead: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const milestoneEmojis: Record<string, string> = {
      deposit_paid: "💰", hoa_approved: "🏘️", permit_approved: "📜",
      crew_scheduled: "👷", work_started: "🔨", halfway: "📐",
      final_walkthrough: "🔍", completed: "🎉",
    };
    const emoji = milestoneEmojis[args.milestone.toLowerCase().replace(/ /g, "_")] || "✅";

    const blocks: SlackBlock[] = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${emoji} *${args.clientName}* — ${args.milestone.replace(/_/g, " ")}\n_${args.projectType.replace(/_/g, " ")}_${args.crewLead ? `  ·  Crew: ${args.crewLead}` : ""}`,
        },
      },
    ];
    if (args.notes) blocks.push(context(args.notes));
    blocks.push(context(`<${APP_URL}/projects|Open Projects>`));

    return await sendSlackNotification(ctx, blocks, `${emoji} ${args.clientName}: ${args.milestone}`);
  },
});

// ─── Daily Digest ─────────────────────────────────────────────────────────────

export const sendDailyDigest = action({
  args: {
    newLeads: v.number(),
    qualifiedLeads: v.number(),
    openProposals: v.number(),
    activeProjects: v.number(),
    pendingApprovals: v.number(),
    pipelineValue: v.optional(v.number()),
    todayDate: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const blocks: SlackBlock[] = [
      {
        type: "header",
        text: { type: "plain_text", text: `☀️ Greenscape Daily Brief — ${args.todayDate}`, emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*🆕 New Leads*\n${args.newLeads}` },
          { type: "mrkdwn", text: `*✅ Qualified*\n${args.qualifiedLeads}` },
          { type: "mrkdwn", text: `*📋 Open Proposals*\n${args.openProposals}` },
          { type: "mrkdwn", text: `*🏗️ Active Projects*\n${args.activeProjects}` },
        ],
      },
      divider(),
    ];

    if (args.pendingApprovals > 0) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `⚠️ *${args.pendingApprovals} approval${args.pendingApprovals > 1 ? "s" : ""} pending* — <${APP_URL}/approvals|Review now>`,
        },
      });
    }

    if (args.pipelineValue) {
      blocks.push(context(`💰 Total pipeline value: *$${args.pipelineValue.toLocaleString()}*`));
    }

    blocks.push(context(`<${APP_URL}|Open Greenscape AI Dashboard>`));

    return await sendSlackNotification(ctx, blocks, `☀️ Daily brief: ${args.newLeads} new leads, ${args.openProposals} open proposals, ${args.pendingApprovals} approvals pending`);
  },
});

// ─── GHL Sync Notification ────────────────────────────────────────────────────

export const notifyGHLSync = action({
  args: {
    imported: v.number(),
    skipped: v.number(),
    direction: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    return await sendSlackNotification(ctx,
      [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `🔄 *GHL Sync Complete*\n*Direction:* ${args.direction}\n*Imported:* ${args.imported} contacts\n*Skipped:* ${args.skipped} (duplicates)`,
          },
        },
        context(`<${APP_URL}/leads|View Leads>`),
      ],
      `GHL sync: ${args.imported} imported, ${args.skipped} skipped`
    );
  },
});

// ─── Email: Customer Update ───────────────────────────────────────────────────

export const sendCustomerEmail = action({
  args: {
    to: v.string(),
    clientName: v.string(),
    subject: v.string(),
    content: v.string(),
    updateType: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    messageId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Read API key from env vars first, then fall back to database settings
    let resendApiKey = process.env.RESEND_API_KEY;
    let fromEmail = process.env.FROM_EMAIL;
    if (!resendApiKey) {
      const dbKey: string | null = await ctx.runQuery(api.settings.get, { key: "RESEND_API_KEY" });
      if (dbKey) resendApiKey = dbKey;
    }
    if (!fromEmail) {
      const dbFrom: string | null = await ctx.runQuery(api.settings.get, { key: "FROM_EMAIL" });
      fromEmail = dbFrom || "onboarding@resend.dev";
    }
    if (!resendApiKey) {
      return { success: false, error: "Email not configured (RESEND_API_KEY missing)" };
    }

    const htmlContent = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb;">
  <div style="background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);padding:28px 32px;border-radius:12px 12px 0 0;">
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="font-size:24px;">🌿</span>
      <div>
        <h1 style="margin:0;color:white;font-size:20px;font-weight:700;">Greenscape</h1>
        <p style="margin:2px 0 0;color:rgba(255,255,255,0.8);font-size:12px;">Project Update · Phoenix, AZ</p>
      </div>
    </div>
  </div>
  <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:none;padding:32px;border-radius:0 0 12px 12px;">
    <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#374151;white-space:pre-wrap;">${args.content.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
    <table style="width:100%">
      <tr>
        <td style="font-size:12px;color:#9ca3af;">
          Greenscape · Premium Landscape &amp; Hardscape · Phoenix, AZ<br>
          <a href="${APP_URL}" style="color:#16a34a;text-decoration:none;">View your project status</a>
        </td>
        <td style="text-align:right;">
          <span style="display:inline-block;background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:600;">🔒 Secure Message</span>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;

    try {
      const response: Response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: `Greenscape AI <${fromEmail}>`, to: [args.to], subject: args.subject, html: htmlContent }),
      });

      if (!response.ok) {
        await response.text();
        return { success: false, error: `Email API error: ${response.status}` };
      }

      const result = await response.json() as { id: string };
      console.log(`Email sent to ${args.to}: ${result.id}`);

      // Notify Slack
      await sendSlackNotification(ctx,
        [{ type: "context", elements: [{ type: "mrkdwn", text: `📧 Customer update emailed to *${args.clientName}* (${args.to}) — ${args.updateType}` }] }],
        `Email sent to ${args.clientName}`
      );

      return { success: true, messageId: result.id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },
});

// ─── Integration Status Query ─────────────────────────────────────────────────
// Called by IntegrationsPage to show which env vars are set.

export const getIntegrationStatus = query({
  args: {},
  handler: async (ctx) => {
    // Check env vars first, then database settings as fallback
    const dbResendKey = await ctx.db.query("settings").withIndex("by_key", (q) => q.eq("key", "RESEND_API_KEY")).first();
    const dbFromEmail = await ctx.db.query("settings").withIndex("by_key", (q) => q.eq("key", "FROM_EMAIL")).first();
    const dbGhlKey = await ctx.db.query("settings").withIndex("by_key", (q) => q.eq("key", "GHL_API_KEY")).first();
    const dbGhlLoc = await ctx.db.query("settings").withIndex("by_key", (q) => q.eq("key", "GHL_LOCATION_ID")).first();
    const dbGhlPipe = await ctx.db.query("settings").withIndex("by_key", (q) => q.eq("key", "GHL_PIPELINE_ID")).first();
    const dbSlack = await ctx.db.query("settings").withIndex("by_key", (q) => q.eq("key", "SLACK_WEBHOOK_URL")).first();

    const ghlApiKey = process.env.GHL_API_KEY || dbGhlKey?.value;
    const ghlLocationId = process.env.GHL_LOCATION_ID || dbGhlLoc?.value;
    const ghlPipelineId = process.env.GHL_PIPELINE_ID || dbGhlPipe?.value;
    const slackWebhook = process.env.SLACK_WEBHOOK_URL || dbSlack?.value;
    const resendApiKey = process.env.RESEND_API_KEY || dbResendKey?.value;
    const fromEmail = process.env.FROM_EMAIL || dbFromEmail?.value;

    return {
      ghl: {
        configured: !!(ghlApiKey && ghlLocationId),
        hasApiKey: !!ghlApiKey,
        hasLocationId: !!ghlLocationId,
        hasPipelineId: !!ghlPipelineId,
      },
      slack: {
        configured: !!slackWebhook,
        hasWebhook: !!slackWebhook,
      },
      email: {
        configured: !!(resendApiKey && fromEmail),
        hasApiKey: !!resendApiKey,
        hasFromEmail: !!fromEmail,
      },
    };
  },
});

// ─── GHL: Test Connection ─────────────────────────────────────────────────────

export const testGHLConnection = action({
  args: {},
  handler: async (): Promise<{ success: boolean; message: string }> => {
    const apiKey = process.env.GHL_API_KEY;
    const locationId = process.env.GHL_LOCATION_ID;
    if (!apiKey || !locationId) {
      return { success: false, message: "GHL_API_KEY and GHL_LOCATION_ID not configured. Add them in Vercel environment variables." };
    }
    try {
      const resp = await fetch(`https://rest.gohighlevel.com/v1/contacts/?locationId=${locationId}&limit=1`, {
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      });
      if (resp.ok) {
        return { success: true, message: "✅ Connected to GoHighLevel successfully!" };
      }
      return { success: false, message: `GHL API returned ${resp.status} — check your API key` };
    } catch (err) {
      return { success: false, message: `Connection failed: ${String(err)}` };
    }
  },
});

// ─── GHL: Import Contacts as Leads ───────────────────────────────────────────

export const importGHLContacts = action({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args): Promise<{ success: boolean; imported: number; skipped: number; error?: string }> => {
    const apiKey = process.env.GHL_API_KEY;
    const locationId = process.env.GHL_LOCATION_ID;
    if (!apiKey || !locationId) {
      return { success: false, imported: 0, skipped: 0, error: "GHL not configured. Add GHL_API_KEY and GHL_LOCATION_ID in Vercel." };
    }
    try {
      const limit = args.limit ?? 50;
      const resp = await fetch(`https://rest.gohighlevel.com/v1/contacts/?locationId=${locationId}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      });
      if (!resp.ok) {
        return { success: false, imported: 0, skipped: 0, error: `GHL API error: ${resp.status}` };
      }
      const data = await resp.json() as { contacts: Array<Record<string, unknown>> };
      const contacts = data.contacts || [];
      let imported = 0, skipped = 0;
      for (const c of contacts) {
        try {
          const result = await ctx.runMutation(internal.integrations.createLeadFromGHLInternal, {
            name: `${c.firstName || ""} ${c.lastName || ""}`.trim() || "GHL Contact",
            email: (c.email as string) || undefined,
            phone: (c.phone as string) || undefined,
            address: (c.address1 as string) || undefined,
            source: "ghl_import",
            notes: "Imported from GoHighLevel",
            tags: Array.isArray(c.tags) ? (c.tags as string[]) : undefined,
          });
          if (result.created) imported++; else skipped++;
        } catch { skipped++; }
      }
      if (imported > 0) {
        // Fire-and-forget Slack notification (best effort)
        try {
          await sendSlackNotification(ctx,
            [{ type: "section", text: { type: "mrkdwn", text: `🔄 *GHL Import Complete*\n*Imported:* ${imported} contacts\n*Skipped:* ${skipped} (duplicates)` } }],
            `GHL import: ${imported} contacts imported`
          );
        } catch { /* non-critical */ }
      }
      return { success: true, imported, skipped };
    } catch (err) {
      return { success: false, imported: 0, skipped: 0, error: String(err) };
    }
  },
});

// ─── GHL: Create Lead from Webhook / Import (internal) ───────────────────────

export const createLeadFromGHLInternal = internalMutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    source: v.optional(v.string()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args): Promise<{ created: boolean }> => {
    // Deduplicate by email
    if (args.email) {
      const existing = await ctx.db
        .query("leads")
        .filter((q) => q.eq(q.field("email"), args.email))
        .first();
      if (existing) return { created: false };
    }
    // Determine score from tags
    let score = 50;
    if (args.tags) {
      if (args.tags.some((t) => t.toLowerCase().includes("hot"))) score = 85;
      else if (args.tags.some((t) => t.toLowerCase().includes("warm"))) score = 65;
      else if (args.tags.some((t) => t.toLowerCase().includes("cold"))) score = 25;
    }
    await ctx.db.insert("leads", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      address: args.address,
      source: args.source || "ghl_import",
      status: "new",
      qualificationScore: score,
      notes: args.notes,
      createdBy: "system" as unknown as import("./_generated/dataModel").Id<"users">,
    });
    return { created: true };
  },
});

// ─── Slack Queue (Viktor Relay) ──────────────────────────────────────────────

/** Get pending Slack messages for Viktor relay */
export const getPendingSlackMessages = internalQuery({
  args: {},
  returns: v.array(v.object({
    _id: v.id("slackQueue"),
    blocksJson: v.string(),
    text: v.string(),
  })),
  handler: async (ctx) => {
    const pending = await ctx.db
      .query("slackQueue")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(20);
    return pending.map((m) => ({ _id: m._id, blocksJson: m.blocksJson, text: m.text }));
  },
});

/** Mark a Slack message as sent after Viktor relay */
export const markSlackMessageSent = internalMutation({
  args: { id: v.id("slackQueue") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "sent", sentAt: Date.now() });
  },
});
