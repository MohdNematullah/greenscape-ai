import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db.query("projects").order("desc").collect();
  },
});

export const get = query({
  args: { id: v.id("projects") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    proposalId: v.optional(v.id("proposals")),
    leadId: v.optional(v.id("leads")),
    clientName: v.string(),
    projectType: v.string(),
    address: v.optional(v.string()),
    totalAmount: v.optional(v.number()),
    hoaRequired: v.optional(v.boolean()),
    permitRequired: v.optional(v.boolean()),
    crewLead: v.optional(v.string()),
    startDate: v.optional(v.string()),
    estimatedCompletion: v.optional(v.string()),
    signedDate: v.optional(v.string()),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const projectId = await ctx.db.insert("projects", {
      proposalId: args.proposalId,
      leadId: args.leadId,
      clientName: args.clientName,
      projectType: args.projectType,
      address: args.address,
      totalAmount: args.totalAmount,
      // All checklist items start false
      depositInvoiceSent: false,
      depositPaid: false,
      welcomePacketSent: false,
      hoaRequired: args.hoaRequired ?? false,
      hoaSubmitted: false,
      hoaApproved: false,
      permitRequired: args.permitRequired ?? true,
      permitPulled: false,
      permitApproved: false,
      finalDesignApproved: false,
      crewLead: args.crewLead,
      crewScheduled: false,
      startDate: args.startDate,
      estimatedCompletion: args.estimatedCompletion,
      signedDate: args.signedDate ?? new Date().toISOString().split("T")[0],
      phase: "onboarding",
      status: "active",
      createdBy: userId,
    });

    await ctx.db.insert("activities", {
      type: "project_created",
      title: `Project started: ${args.clientName}`,
      description: `${args.projectType} — ${args.totalAmount ? `$${args.totalAmount.toLocaleString()}` : "TBD"}`,
      relatedId: projectId,
      createdBy: userId,
    });

    return projectId;
  },
});

export const updateChecklist = mutation({
  args: {
    id: v.id("projects"),
    field: v.string(),
    value: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.id);
    if (!project) throw new Error("Project not found");

    const updates: Record<string, unknown> = { [args.field]: args.value };

    // Track dates for specific milestones
    const now = new Date().toISOString().split("T")[0];
    if (args.field === "depositPaid" && args.value) updates.depositPaidDate = now;
    if (args.field === "hoaApproved" && args.value) updates.hoaApprovedDate = now;
    if (args.field === "permitApproved" && args.value) updates.permitApprovedDate = now;
    if (args.field === "crewScheduled" && args.value && !project.actualStartDate) updates.phase = "pre_construction";

    // Auto-advance phase based on checklist completion
    const p = { ...project, ...updates };
    if (p.depositPaid && p.finalDesignApproved && 
        (!p.hoaRequired || p.hoaApproved) && 
        (!p.permitRequired || p.permitApproved) &&
        p.crewScheduled) {
      updates.phase = "in_progress";
    }

    await ctx.db.patch(args.id, updates);

    await ctx.db.insert("activities", {
      type: "checklist_updated",
      title: `${args.field.replace(/([A-Z])/g, " $1").trim()} ${args.value ? "✓" : "✗"}: ${project.clientName}`,
      relatedId: args.id,
      createdBy: userId,
    });

    return null;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("projects"),
    status: v.optional(v.string()),
    phase: v.optional(v.string()),
    crewLead: v.optional(v.string()),
    startDate: v.optional(v.string()),
    estimatedCompletion: v.optional(v.string()),
    actualStartDate: v.optional(v.string()),
    completedDate: v.optional(v.string()),
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

export const remove = mutation({
  args: { id: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.delete(args.id);
    return null;
  },
});
