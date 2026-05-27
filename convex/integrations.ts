/**
 * External Integrations — Slack Webhooks & Email Sending
 *
 * Slack: Sends real-time notifications to a Slack channel via incoming webhook
 * Email: Sends customer update emails via Resend API
 *
 * These are REAL external integrations that touch the outside world.
 */
import { v } from "convex/values";
import { action } from "./_generated/server";

declare const process: { env: Record<string, string | undefined> };

// ─── Slack Webhook Integration ────────────────────────────────────────────────

interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  fields?: { type: string; text: string }[];
  elements?: { type: string; text: string }[];
}

async function sendSlackWebhook(blocks: SlackBlock[], text: string): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("SLACK_WEBHOOK_URL not configured — skipping notification");
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, blocks }),
    });

    if (!response.ok) {
      console.error(`Slack webhook failed: ${response.status} ${await response.text()}`);
      return false;
    }
    console.log("Slack notification sent successfully");
    return true;
  } catch (error) {
    console.error("Slack webhook error:", error);
    return false;
  }
}

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
    const emoji = args.qualified ? "✅" : args.qualified === false ? "❌" : "🆕";
    const statusText = args.qualified
      ? `Qualified (Score: ${args.score ?? "—"}/100)`
      : args.qualified === false
        ? "Disqualified"
        : "Pending Review";

    const blocks: SlackBlock[] = [
      {
        type: "header",
        text: { type: "plain_text", text: `${emoji} New Lead: ${args.name}`, emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Source:*\n${args.source}` },
          { type: "mrkdwn", text: `*Project:*\n${args.projectType || "Not specified"}` },
          { type: "mrkdwn", text: `*Budget:*\n${args.budget ? `$${args.budget}` : "Not specified"}` },
          { type: "mrkdwn", text: `*Status:*\n${statusText}` },
        ],
      },
    ];

    if (args.estimatedValue) {
      blocks.push({
        type: "context",
        elements: [{ type: "mrkdwn", text: `💰 Estimated value: ${args.estimatedValue}` }],
      });
    }

    return await sendSlackWebhook(blocks, `New lead: ${args.name} — ${statusText}`);
  },
});

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
        text: { type: "plain_text", text: `📋 Proposal Approved: ${args.clientName}`, emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Client:*\n${args.clientName}` },
          { type: "mrkdwn", text: `*Project:*\n${args.projectType}` },
          {
            type: "mrkdwn",
            text: `*Amount:*\n${args.totalAmount ? `$${args.totalAmount.toLocaleString()}` : "TBD"}`,
          },
          { type: "mrkdwn", text: `*Approved by:*\n${args.approvedBy}` },
        ],
      },
      {
        type: "context",
        elements: [{ type: "mrkdwn", text: "🚀 Ready to send to client for signature" }],
      },
    ];

    return await sendSlackWebhook(
      blocks,
      `Proposal approved for ${args.clientName} — $${args.totalAmount?.toLocaleString() ?? "TBD"}`
    );
  },
});

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
    const urgencyEmoji =
      args.urgency === "urgent" ? "🔴" : args.urgency === "normal" ? "🟡" : "🟢";

    const blocks: SlackBlock[] = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${urgencyEmoji} Approval Needed: ${args.title}`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Type:*\n${args.type}` },
          { type: "mrkdwn", text: `*Requested by:*\n${args.requestedBy}` },
          {
            type: "mrkdwn",
            text: `*Amount:*\n${args.amount ? `$${args.amount.toLocaleString()}` : "N/A"}`,
          },
          { type: "mrkdwn", text: `*Urgency:*\n${args.urgency.toUpperCase()}` },
        ],
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `${args.clientName ? `Client: ${args.clientName} · ` : ""}Review in the Greenscape AI dashboard`,
          },
        ],
      },
    ];

    return await sendSlackWebhook(blocks, `Approval needed: ${args.title} — ${args.urgency}`);
  },
});

// ─── Email Integration (Resend API) ──────────────────────────────────────────

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
      console.log("RESEND_API_KEY not configured — skipping email");
      return { success: false, error: "Email not configured (RESEND_API_KEY missing)" };
    }

    const fromEmail = process.env.FROM_EMAIL || "updates@greenscape.com";

    // Build HTML email with Greenscape branding
    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 24px 32px; border-radius: 12px 12px 0 0;">
    <h1 style="margin: 0; color: white; font-size: 20px;">🌿 Greenscape</h1>
    <p style="margin: 4px 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">Project Update</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${args.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="margin: 0; font-size: 12px; color: #6b7280;">
      Greenscape · Premium Landscape & Hardscape · Phoenix, AZ<br>
      <a href="https://greenscape-ai-navy.vercel.app" style="color: #16a34a;">View your project portal</a>
    </p>
  </div>
</body>
</html>`;

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [args.to],
          subject: args.subject,
          html: htmlContent,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Resend API error: ${response.status} ${errorText}`);
        return { success: false, error: `Email API error: ${response.status}` };
      }

      const result = await response.json();
      console.log(`Email sent to ${args.to}: ${result.id}`);

      // Also notify Slack about the email
      await sendSlackWebhook(
        [
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `📧 Customer update emailed to *${args.clientName}* (${args.to}) — ${args.updateType}`,
              },
            ],
          },
        ],
        `Email sent to ${args.clientName}`
      );

      return { success: true, messageId: result.id };
    } catch (error) {
      console.error("Email send error:", error);
      return { success: false, error: String(error) };
    }
  },
});

// ─── Test/Health Check ────────────────────────────────────────────────────────

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
            text: "✅ *Greenscape AI connected!*\nSlack notifications are working. You'll receive alerts for new leads, proposal approvals, and approval requests.",
          },
        },
      ],
      "Greenscape AI — Slack integration test"
    );
  },
});
