/**
 * HTTP Router — handles external webhooks
 *
 * Routes:
 *   POST /api/ghl/webhook    — GoHighLevel contact/lead webhooks
 *   GET  /api/health         — health check
 */

import { httpRouter, httpActionGeneric } from "convex/server";
import { auth } from "./auth";
import { internal } from "./_generated/api";

const http = httpRouter();

// Auth routes (required for convex-auth)
auth.addHttpRoutes(http);

// ─── GoHighLevel Webhook ──────────────────────────────────────────────────────
// Configure in GHL: Settings → Integrations → Webhooks → New Webhook
// Events: Contact Create, Contact Update, Opportunity Create
// URL: https://<your-convex-deployment>.convex.site/api/ghl/webhook

http.route({
  path: "/api/ghl/webhook",
  method: "POST",
  handler: httpActionGeneric(async (ctx, request) => {
    try {
      const body = await request.json() as Record<string, unknown>;
      const type = (body.type as string) || "";

      // Handle contact created / updated events
      if (type === "ContactCreate" || type === "contact.created" || body.contact) {
        const contact = (body.contact as Record<string, unknown>) || body;
        const firstName = (contact.firstName as string) || "";
        const lastName = (contact.lastName as string) || "";
        const name = `${firstName} ${lastName}`.trim() || "GHL Contact";

        await ctx.runMutation(internal.ghl.createLeadFromGHL, {
          name,
          email: (contact.email as string) || undefined,
          phone: (contact.phone as string) || undefined,
          address: (contact.address1 as string) || undefined,
          source: "ghl_import",
          notes: "Auto-imported from GoHighLevel webhook",
          tags: Array.isArray(contact.tags) ? (contact.tags as string[]) : undefined,
        });

        return new Response(JSON.stringify({ success: true, event: "lead_created" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, event: "acknowledged" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("GHL webhook error:", err);
      return new Response(JSON.stringify({ success: false, error: String(err) }), {
        status: 200, // Return 200 so GHL doesn't retry infinitely
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// ─── Health Check ─────────────────────────────────────────────────────────────

http.route({
  path: "/api/health",
  method: "GET",
  handler: httpActionGeneric(async () => {
    return new Response(
      JSON.stringify({ status: "ok", service: "Greenscape AI", version: "1.0.0" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

export default http;
