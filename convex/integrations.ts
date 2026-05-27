/**
 * External Integrations — Slack Webhooks & Email (Resend)
 *
 * Slack: Real-time channel notifications for leads, proposals, projects
 * Email: Customer update emails via Resend API
 *
 * All integrations are best-effort — they fail silently if not configured.
 */
import { v } from "convex/values";
import { action } from "./_generated/server";

declare const process: { env: Record<string, string | undefined> };

const APP_URL = "https://greenscape-ai-navy.vercel.app";

// ─── Slack Core ───────────────────────────────────────────────────────────────

type SlackBlock = Record<string, unknown>;

async function sendSlackWebhook(blocks: SlackBlock[], fallbackText: string): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
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

function divider(): SlackBlock {
  return { type: "divider" };
}

function context(text: string): SlackBlock {
  return { type: "context", elements: [{ type: "mrkdwn", text }] };
}

// ─── Test Connection ──────────────────────────────────────────────────────────

export const testSlackConnection = action({
  args: {},
  returns: v.boolean(),
  handler: async () => {
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
      "Greenscape AI — Slack integration test ✅"
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
  handler: async (_ctx, args) => {
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

    return await sendSlackWebhook(blocks, `${emoji} New lead: ${args.name} — ${statusLabel}`);
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
  handler: async (_ctx, args) => {
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
    return await sendSlackWebhook(blocks, `📋 Proposal approved for ${args.clientName}`);
  },
});

export const notifyProposalSigned = action({
  args: {
    clientName: v.string(),
    projectType: v.string(),
    totalAmount: v.optional(v.number()),
  },
  returns: v.boolean(),
  handler: async (_ctx, args) => {
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
    return await sendSlackWebhook(blocks, `🎉 Signed! ${args.clientName} — $${args.totalAmount?.toLocaleString() ?? "TBD"}`);
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
  handler: async (_ctx, args) => {
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
    return await sendSlackWebhook(blocks, `${urgencyEmoji} Approval needed: ${args.title}`);
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
  handler: async (_ctx, args) => {
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

    return await sendSlackWebhook(blocks, `${emoji} ${args.clientName}: ${args.milestone}`);
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
  handler: async (_ctx, args) => {
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

    return await sendSlackWebhook(blocks, `☀️ Daily brief: ${args.newLeads} new leads, ${args.openProposals} open proposals, ${args.pendingApprovals} approvals pending`);
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
  handler: async (_ctx, args) => {
    return await sendSlackWebhook(
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
  handler: async (_ctx, args) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return { success: false, error: "Email not configured (RESEND_API_KEY missing)" };
    }

    const fromEmail = process.env.FROM_EMAIL || "updates@greenscape.com";

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
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: fromEmail, to: [args.to], subject: args.subject, html: htmlContent }),
      });

      if (!response.ok) {
        await response.text();
        return { success: false, error: `Email API error: ${response.status}` };
      }

      const result = await response.json() as { id: string };
      console.log(`Email sent to ${args.to}: ${result.id}`);

      // Notify Slack
      await sendSlackWebhook(
        [{ type: "context", elements: [{ type: "mrkdwn", text: `📧 Customer update emailed to *${args.clientName}* (${args.to}) — ${args.updateType}` }] }],
        `Email sent to ${args.clientName}`
      );

      return { success: true, messageId: result.id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },
});
