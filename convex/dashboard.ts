import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "./_generated/server";

export const stats = query({
  args: {},
  returns: v.object({
    totalLeads: v.number(),
    qualifiedLeads: v.number(),
    activeProposals: v.number(),
    pipelineValue: v.number(),
    activeProjects: v.number(),
    projectsInLimbo: v.number(),
    pendingApprovals: v.number(),
    wonDeals: v.number(),
    avgQuoteCycleDays: v.number(),
    closedLostLeads: v.number(),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId)
      return {
        totalLeads: 0,
        qualifiedLeads: 0,
        activeProposals: 0,
        pipelineValue: 0,
        activeProjects: 0,
        projectsInLimbo: 0,
        pendingApprovals: 0,
        wonDeals: 0,
        avgQuoteCycleDays: 0,
        closedLostLeads: 0,
      };

    const leads = await ctx.db.query("leads").collect();
    const proposals = await ctx.db.query("proposals").collect();
    const projects = await ctx.db.query("projects").collect();
    const approvals = await ctx.db
      .query("approvals")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const qualifiedLeads = leads.filter((l) => l.status === "qualified" || l.status === "site_walk_booked" || l.status === "site_walk_done").length;
    const activeProposals = proposals.filter((p) => ["draft", "review", "approved", "sent"].includes(p.status)).length;
    const pipelineValue = proposals
      .filter((p) => ["draft", "review", "approved", "sent"].includes(p.status))
      .reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const activeProjects = projects.filter((p) => p.status === "active").length;
    // Projects in post-sign limbo: active but not yet in_progress phase
    const projectsInLimbo = projects.filter(
      (p) => p.status === "active" && (p.phase === "onboarding" || p.phase === "pre_construction")
    ).length;
    const wonDeals = leads.filter((l) => l.status === "won").length;
    const closedLostLeads = leads.filter((l) => l.status === "closed_lost" || l.status === "lost").length;

    // Average quote cycle
    const withCycle = proposals.filter((p) => p.daysToGenerate && p.daysToGenerate > 0);
    const avgQuoteCycleDays =
      withCycle.length > 0
        ? Math.round(withCycle.reduce((s, p) => s + (p.daysToGenerate ?? 0), 0) / withCycle.length)
        : 0;

    return {
      totalLeads: leads.length,
      qualifiedLeads,
      activeProposals,
      pipelineValue,
      activeProjects,
      projectsInLimbo,
      pendingApprovals: approvals.length,
      wonDeals,
      avgQuoteCycleDays,
      closedLostLeads,
    };
  },
});

export const recentActivity = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db.query("activities").order("desc").take(15);
  },
});

export const pipelineSummary = query({
  args: {},
  returns: v.array(
    v.object({
      stage: v.string(),
      count: v.number(),
      value: v.number(),
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const leads = await ctx.db.query("leads").collect();
    const proposals = await ctx.db.query("proposals").collect();

    const stages = [
      { key: "new", label: "New Leads" },
      { key: "contacted", label: "Contacted" },
      { key: "qualified", label: "Qualified" },
      { key: "site_walk_booked", label: "Site Walk Booked" },
      { key: "site_walk_done", label: "Site Walk Done" },
      { key: "proposal_sent", label: "Proposal Sent" },
      { key: "won", label: "Won" },
    ];

    return stages.map((s) => {
      const stageLeads = leads.filter((l) => l.status === s.key);
      // For proposal_sent and won, try to get actual values
      let value = 0;
      if (s.key === "proposal_sent" || s.key === "won") {
        for (const lead of stageLeads) {
          const prop = proposals.find((p) => p.leadId === lead._id);
          value += prop?.totalAmount || 0;
        }
      } else {
        value = stageLeads.reduce((sum, l) => {
          const b = parseInt(l.budget || "0", 10);
          return sum + (b || 28000); // default to avg project value
        }, 0);
      }
      return { stage: s.label, count: stageLeads.length, value };
    });
  },
});
