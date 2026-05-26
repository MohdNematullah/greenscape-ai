import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    projectId: v.optional(v.id("projects")),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    if (args.projectId) {
      return await ctx.db
        .query("customerUpdates")
        .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId!))
        .order("desc")
        .collect();
    }

    return await ctx.db
      .query("customerUpdates")
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    clientName: v.string(),
    updateType: v.string(),
    content: v.string(),
    milestone: v.optional(v.string()),
    sentVia: v.optional(v.string()),
  },
  returns: v.id("customerUpdates"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const updateId = await ctx.db.insert("customerUpdates", {
      ...args,
      createdBy: userId,
    });

    await ctx.db.insert("activities", {
      type: "update_sent",
      title: `Update sent to ${args.clientName}`,
      description: args.updateType,
      relatedId: updateId,
      createdBy: userId,
    });

    return updateId;
  },
});

export const remove = mutation({
  args: { id: v.id("customerUpdates") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.delete(args.id);
    return null;
  },
});

export const markSent = mutation({
  args: {
    id: v.id("customerUpdates"),
    sentVia: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(args.id, {
      sentVia: args.sentVia,
      sentAt: Date.now(),
    });
    return null;
  },
});
