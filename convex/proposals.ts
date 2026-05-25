import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db.query("proposals").order("desc").collect();
  },
});

export const get = query({
  args: { id: v.id("proposals") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    leadId: v.id("leads"),
    clientName: v.string(),
    projectType: v.string(),
    siteWalkNotes: v.optional(v.string()),
    siteWalkDate: v.optional(v.string()),
    scopeJson: v.optional(v.string()),
    lineItemsJson: v.optional(v.string()),
    subtotal: v.optional(v.number()),
    markupPercent: v.optional(v.number()),
    totalAmount: v.optional(v.number()),
    proposalContent: v.optional(v.string()),
    needsRender: v.optional(v.boolean()),
  },
  returns: v.id("proposals"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const needsRender = args.needsRender ?? ((args.totalAmount ?? 0) > 30000);

    const proposalId = await ctx.db.insert("proposals", {
      ...args,
      needsRender,
      renderStatus: needsRender ? "pending" : undefined,
      status: "draft",
      createdBy: userId,
    });

    // Update lead status
    try {
      await ctx.db.patch(args.leadId, { status: "proposal_sent" });
    } catch {
      // Lead might not exist
    }

    await ctx.db.insert("activities", {
      type: "proposal_created",
      title: `Proposal created for ${args.clientName}`,
      description: `${args.projectType} — ${args.totalAmount ? `$${args.totalAmount.toLocaleString()}` : "Draft"}`,
      relatedId: proposalId,
      createdBy: userId,
    });

    return proposalId;
  },
});

export const update = mutation({
  args: {
    id: v.id("proposals"),
    scopeJson: v.optional(v.string()),
    lineItemsJson: v.optional(v.string()),
    subtotal: v.optional(v.number()),
    markupPercent: v.optional(v.number()),
    totalAmount: v.optional(v.number()),
    proposalContent: v.optional(v.string()),
    siteWalkNotes: v.optional(v.string()),
    renderStatus: v.optional(v.string()),
    renderNotes: v.optional(v.string()),
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

export const approve = mutation({
  args: { id: v.id("proposals"), approvedBy: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(args.id, {
      status: "approved",
      approvedBy: args.approvedBy,
      approvedAt: Date.now(),
    });
    const p = await ctx.db.get(args.id);
    await ctx.db.insert("activities", {
      type: "proposal_approved",
      title: `Proposal approved: ${p?.clientName}`,
      description: `Approved by ${args.approvedBy}`,
      relatedId: args.id,
      createdBy: userId,
    });
    return null;
  },
});

export const markSent = mutation({
  args: { id: v.id("proposals") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const proposal = await ctx.db.get(args.id);
    if (!proposal) throw new Error("Proposal not found");

    // Calculate days to generate
    let daysToGenerate: number | undefined;
    if (proposal.siteWalkDate) {
      const walkDate = new Date(proposal.siteWalkDate).getTime();
      daysToGenerate = Math.ceil((Date.now() - walkDate) / (1000 * 60 * 60 * 24));
    }

    await ctx.db.patch(args.id, {
      status: "sent",
      sentAt: Date.now(),
      daysToGenerate,
    });
    return null;
  },
});

export const markSigned = mutation({
  args: { id: v.id("proposals") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const proposal = await ctx.db.get(args.id);
    if (!proposal) throw new Error("Proposal not found");

    await ctx.db.patch(args.id, { status: "signed", signedAt: Date.now() });

    // Update lead to won
    try {
      await ctx.db.patch(proposal.leadId, { status: "won" });
    } catch {
      // skip
    }

    await ctx.db.insert("activities", {
      type: "proposal_signed",
      title: `Proposal signed: ${proposal.clientName}`,
      description: `$${proposal.totalAmount?.toLocaleString() ?? "N/A"} — ready for project onboarding`,
      relatedId: args.id,
      createdBy: userId,
    });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("proposals") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.delete(args.id);
    return null;
  },
});
