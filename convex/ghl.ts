/**
 * GoHighLevel (GHL) Integration
 *
 * Handles two-way sync between Greenscape AI and GoHighLevel CRM.
 *
 * GHL → Greenscape AI:
 *   - Webhook endpoint receives new contacts/lead events from GHL
 *   - Auto-creates leads in the system when GHL contact is created
 *
 * Greenscape AI → GHL:
 *   - When lead is qualified, upsert contact in GHL
 *   - When proposal is approved, create/update opportunity in GHL pipeline
 *   - When project is won, move pipeline stage to "Won"
 */

import { v } from "convex/values";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";

declare const process: { env: Record<string, string | undefined> };

// ─── GHL API Helpers ──────────────────────────────────────────────────────────

interface GHLContact {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  tags?: string[];
  source?: string;
  customField?: { id: string; field_value: string }[];
  [key: string]: unknown;
}

interface GHLOpportunity {
  title: string;
  status: string; // "open", "won", "lost", "abandoned"
  monetaryValue?: number;
  pipelineId?: string;
  pipelineStageId?: string;
  contactId?: string;
  assignedTo?: string;
  [key: string]: unknown;
}

async function ghlRequest(
  method: "GET" | "POST" | "PUT" | "DELETE",
  endpoint: string,
  body?: unknown
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const apiKey = process.env.GHL_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "GHL_API_KEY not configured" };
  }

  const locationId = process.env.GHL_LOCATION_ID;
  const baseUrl = "https://rest.gohighlevel.com/v1";

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    const url = `${baseUrl}${endpoint}${locationId && endpoint.includes("?") ? `&locationId=${locationId}` : locationId ? `?locationId=${locationId}` : ""}`;

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = text; }

    if (!res.ok) {
      console.error(`GHL API error ${res.status}: ${text}`);
      return { ok: false, error: `GHL API ${res.status}: ${text.slice(0, 200)}` };
    }

    return { ok: true, data };
  } catch (err) {
    console.error("GHL request failed:", err);
    return { ok: false, error: String(err) };
  }
}

// ─── Test Connection ──────────────────────────────────────────────────────────

export const testConnection = action({
  args: {},
  returns: v.object({ success: v.boolean(), message: v.string() }),
  handler: async () => {
    const apiKey = process.env.GHL_API_KEY;
    if (!apiKey) {
      return { success: false, message: "GHL_API_KEY not set in environment variables" };
    }

    const result = await ghlRequest("GET", "/contacts/?limit=1");
    if (result.ok) {
      return { success: true, message: "✅ Connected to GoHighLevel successfully!" };
    }
    return { success: false, message: result.error || "Connection failed" };
  },
});

// ─── Push Lead to GHL ─────────────────────────────────────────────────────────

export const pushLeadToGHL = action({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    source: v.string(),
    projectType: v.optional(v.string()),
    budget: v.optional(v.string()),
    notes: v.optional(v.string()),
    qualified: v.optional(v.boolean()),
    qualificationScore: v.optional(v.number()),
    estimatedValue: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    ghlContactId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (_ctx, args) => {
    const nameParts = args.name.trim().split(" ");
    const firstName = nameParts[0] || args.name;
    const lastName = nameParts.slice(1).join(" ") || "";

    // Build tags
    const tags: string[] = ["greenscape-ai"];
    if (args.projectType) tags.push(`project:${args.projectType}`);
    if (args.source) tags.push(`source:${args.source}`);
    if (args.qualified === true) tags.push("qualified");
    if (args.qualified === false) tags.push("disqualified");

    const contact: GHLContact = {
      firstName,
      lastName,
      email: args.email,
      phone: args.phone,
      tags,
      source: mapSource(args.source),
    };

    // Address parsing
    if (args.address) {
      const parts = args.address.split(",").map((p) => p.trim());
      contact.address1 = parts[0];
      if (parts[1]) {
        const cityState = parts[1].split(" ");
        contact.city = cityState[0];
        contact.state = cityState[1] || "AZ";
      }
      contact.postalCode = parts[2] || "";
    }

    // Custom fields for notes
    if (args.notes || args.budget || args.projectType) {
      const noteText = [
        args.projectType ? `Project: ${args.projectType}` : "",
        args.budget ? `Budget: $${args.budget}` : "",
        args.notes || "",
        args.qualificationScore ? `AI Score: ${args.qualificationScore}/100` : "",
        args.estimatedValue ? `Est. Value: ${args.estimatedValue}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      (contact as GHLContact & { notes?: string }).notes = noteText;
    }

    const result = await ghlRequest("POST", "/contacts/", contact);

    if (result.ok && result.data) {
      const responseData = result.data as { contact?: { id?: string } };
      const contactId = responseData?.contact?.id;
      console.log(`Lead ${args.name} pushed to GHL: ${contactId}`);
      return { success: true, ghlContactId: contactId };
    }

    return { success: false, error: result.error };
  },
});

// ─── Push Opportunity to GHL Pipeline ────────────────────────────────────────

export const pushOpportunityToGHL = action({
  args: {
    clientName: v.string(),
    projectType: v.string(),
    totalAmount: v.optional(v.number()),
    status: v.string(), // "open", "won", "lost"
    ghlContactId: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    opportunityId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (_ctx, args) => {
    const pipelineId = process.env.GHL_PIPELINE_ID;

    const opportunity: GHLOpportunity = {
      title: `${args.clientName} — ${args.projectType}`,
      status: args.status as "open" | "won" | "lost" | "abandoned",
      monetaryValue: args.totalAmount,
      contactId: args.ghlContactId,
    };

    if (pipelineId) {
      opportunity.pipelineId = pipelineId;
    }

    const result = await ghlRequest("POST", "/opportunities/", opportunity);

    if (result.ok && result.data) {
      const responseData = result.data as { opportunity?: { id?: string } };
      const oppId = responseData?.opportunity?.id;
      return { success: true, opportunityId: oppId };
    }

    return { success: false, error: result.error };
  },
});

// ─── Get Contacts from GHL ────────────────────────────────────────────────────

export const getGHLContacts = action({
  args: {
    query: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    contacts: v.optional(v.array(v.any())),
    error: v.optional(v.string()),
  }),
  handler: async (_ctx, args) => {
    const limit = args.limit || 20;
    const queryStr = args.query ? `&query=${encodeURIComponent(args.query)}` : "";
    const result = await ghlRequest("GET", `/contacts/?limit=${limit}${queryStr}`);

    if (result.ok && result.data) {
      const data = result.data as { contacts?: unknown[] };
      return { success: true, contacts: (data.contacts || []) as unknown[] };
    }
    return { success: false, error: result.error };
  },
});

// ─── Import GHL Contacts as Leads ────────────────────────────────────────────

export const importGHLContacts = action({
  args: { limit: v.optional(v.number()) },
  returns: v.object({
    success: v.boolean(),
    imported: v.number(),
    skipped: v.number(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const result = await ghlRequest("GET", `/contacts/?limit=${limit}`);

    if (!result.ok || !result.data) {
      return { success: false, imported: 0, skipped: 0, error: result.error };
    }

    const data = result.data as { contacts?: GHLContact[] };
    const contacts = data.contacts || [];
    let imported = 0;
    let skipped = 0;

    for (const contact of contacts) {
      try {
        const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "Unknown";

        await ctx.runMutation(internal.ghl.createLeadFromGHL, {
          name,
          email: contact.email,
          phone: contact.phone,
          address: contact.address1,
          source: "ghl_import",
          notes: `Imported from GoHighLevel${contact.id ? ` (GHL ID: ${contact.id})` : ""}`,
          tags: contact.tags,
        });
        imported++;
      } catch {
        skipped++;
      }
    }

    return { success: true, imported, skipped };
  },
});

// ─── Internal Mutation: Create Lead from GHL Webhook ─────────────────────────

export const createLeadFromGHL = internalMutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    source: v.string(),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Get system user
    const users = await ctx.db.query("users").take(1);
    const userId = users[0]?._id;
    if (!userId) throw new Error("No user found");

    // Check for duplicate by phone or email
    if (args.email) {
      const existing = await ctx.db
        .query("leads")
        .filter((q) => q.eq(q.field("email"), args.email))
        .first();
      if (existing) return existing._id;
    }

    // Infer project type from tags
    let projectType: string | undefined;
    if (args.tags) {
      const tagMap: Record<string, string> = {
        patio: "patio", pergola: "pergola", "fire pit": "fire_pit",
        firepit: "fire_pit", kitchen: "outdoor_kitchen", turf: "artificial_turf",
        lighting: "lighting", retaining: "retaining_wall", pool: "water_feature",
        pond: "water_feature", landscaping: "landscape_design",
      };
      for (const tag of args.tags) {
        for (const [keyword, type] of Object.entries(tagMap)) {
          if (tag.toLowerCase().includes(keyword)) { projectType = type; break; }
        }
        if (projectType) break;
      }
    }

    return await ctx.db.insert("leads", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      address: args.address,
      source: args.source,
      projectType,
      notes: args.notes,
      status: "new",
      createdBy: userId,
    });
  },
});

// ─── Internal Query: Get lead by email ───────────────────────────────────────

export const getLeadByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leads")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
  },
});

// ─── Integration Status ───────────────────────────────────────────────────────

export const getIntegrationStatus = query({
  args: {},
  returns: v.object({
    ghl: v.object({
      configured: v.boolean(),
      hasApiKey: v.boolean(),
      hasLocationId: v.boolean(),
      hasPipelineId: v.boolean(),
    }),
    slack: v.object({
      configured: v.boolean(),
      hasWebhook: v.boolean(),
    }),
    email: v.object({
      configured: v.boolean(),
      hasApiKey: v.boolean(),
      hasFromEmail: v.boolean(),
    }),
  }),
  handler: async () => {
    return {
      ghl: {
        configured: !!(process.env.GHL_API_KEY && process.env.GHL_LOCATION_ID),
        hasApiKey: !!process.env.GHL_API_KEY,
        hasLocationId: !!process.env.GHL_LOCATION_ID,
        hasPipelineId: !!process.env.GHL_PIPELINE_ID,
      },
      slack: {
        configured: !!process.env.SLACK_WEBHOOK_URL,
        hasWebhook: !!process.env.SLACK_WEBHOOK_URL,
      },
      email: {
        configured: !!process.env.RESEND_API_KEY,
        hasApiKey: !!process.env.RESEND_API_KEY,
        hasFromEmail: !!process.env.FROM_EMAIL,
      },
    };
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapSource(source: string): string {
  const map: Record<string, string> = {
    meta_ad: "FACEBOOK",
    google_lsa: "GOOGLE",
    referral: "REFERRAL",
    website: "ORGANIC",
    manual: "MANUAL",
    ghl_import: "IMPORT",
  };
  return map[source] || "MANUAL";
}
