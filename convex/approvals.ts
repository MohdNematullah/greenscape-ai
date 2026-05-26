import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db.query("approvals").order("desc").collect();
  },
});

export const pendingCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;
    const pending = await ctx.db
      .query("approvals")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    return pending.length;
  },
});

export const create = mutation({
  args: {
    type: v.string(),
    title: v.string(),
    description: v.string(),
    amount: v.optional(v.number()),
    projectId: v.optional(v.id("projects")),
    clientName: v.optional(v.string()),
    requestedBy: v.string(),
    urgency: v.string(),
  },
  returns: v.id("approvals"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const id = await ctx.db.insert("approvals", {
      ...args,
      status: "pending",
      createdBy: userId,
    });

    await ctx.db.insert("activities", {
      type: "approval_requested",
      title: `Approval needed: ${args.title}`,
      description: `${args.type} — ${args.requestedBy}${args.amount ? ` — $${args.amount}` : ""}`,
      relatedId: id,
      createdBy: userId,
    });

    return id;
  },
});

export const decide = mutation({
  args: {
    id: v.id("approvals"),
    status: v.string(), // "approved" or "denied"
    decision: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const approval = await ctx.db.get(args.id);
    if (!approval) throw new Error("Approval not found");

    await ctx.db.patch(args.id, {
      status: args.status,
      decision: args.decision,
      decidedAt: Date.now(),
    });

    await ctx.db.insert("activities", {
      type: "approval_decided",
      title: `${args.status === "approved" ? "Approved" : "Denied"}: ${approval.title}`,
      description: args.decision || `${args.status} by owner`,
      relatedId: args.id,
      createdBy: userId,
    });

    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("approvals") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.delete(args.id);
    return null;
  },
});
