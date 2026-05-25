import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db.query("leads").order("desc").collect();
  },
});

export const get = query({
  args: { id: v.id("leads") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(args.id);
  },
});

export const listByStatus = query({
  args: { status: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("leads")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .collect();
  },
});

export const closedLostCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;
    const lost = await ctx.db
      .query("leads")
      .withIndex("by_status", (q) => q.eq("status", "closed_lost"))
      .collect();
    return lost.length;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    source: v.string(),
    projectType: v.optional(v.string()),
    budget: v.optional(v.string()),
    timeline: v.optional(v.string()),
    notes: v.optional(v.string()),
    isHomeowner: v.optional(v.boolean()),
    hasHoa: v.optional(v.boolean()),
    propertyType: v.optional(v.string()),
  },
  returns: v.id("leads"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const leadId = await ctx.db.insert("leads", {
      ...args,
      status: "new",
      createdBy: userId,
    });

    await ctx.db.insert("activities", {
      type: "lead_created",
      title: `New lead: ${args.name}`,
      description: `Source: ${args.source}${args.projectType ? `, Project: ${args.projectType}` : ""}${args.budget ? `, Budget: $${args.budget}` : ""}`,
      relatedId: leadId,
      createdBy: userId,
    });

    return leadId;
  },
});

export const update = mutation({
  args: {
    id: v.id("leads"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    source: v.optional(v.string()),
    projectType: v.optional(v.string()),
    budget: v.optional(v.string()),
    timeline: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
    isHomeowner: v.optional(v.boolean()),
    hasHoa: v.optional(v.boolean()),
    propertyType: v.optional(v.string()),
    siteWalkDate: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    lastContactDate: v.optional(v.string()),
    lostReason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const { id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(id, updates);
    return null;
  },
});

export const qualify = mutation({
  args: {
    id: v.id("leads"),
    qualified: v.boolean(),
    qualificationReason: v.string(),
    qualificationScore: v.optional(v.number()),
    estimatedValue: v.optional(v.string()),
    recommendedNextStep: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const lead = await ctx.db.get(args.id);
    if (!lead) throw new Error("Lead not found");

    await ctx.db.patch(args.id, {
      qualified: args.qualified,
      qualificationReason: args.qualificationReason,
      qualificationScore: args.qualificationScore,
      estimatedValue: args.estimatedValue,
      recommendedNextStep: args.recommendedNextStep,
      status: args.qualified ? "qualified" : "disqualified",
    });

    await ctx.db.insert("activities", {
      type: "lead_qualified",
      title: `Lead ${args.qualified ? "qualified" : "disqualified"}: ${lead.name}`,
      description: args.qualificationReason,
      relatedId: args.id,
      createdBy: userId,
    });

    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("leads") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.delete(args.id);
    return null;
  },
});
