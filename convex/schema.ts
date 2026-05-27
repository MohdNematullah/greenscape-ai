import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  leads: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    source: v.string(), // "meta_ad", "google_lsa", "referral", "website", "manual"
    projectType: v.optional(v.string()), // "patio", "pergola", "fire_pit", "outdoor_kitchen", "retaining_wall", "full_outdoor_living", "artificial_turf", "water_feature", "irrigation", "other"
    budget: v.optional(v.string()),
    timeline: v.optional(v.string()),
    notes: v.optional(v.string()),
    // Qualification fields
    isHomeowner: v.optional(v.boolean()),
    hasHoa: v.optional(v.boolean()),
    propertyType: v.optional(v.string()), // "single_family", "townhome", "commercial"
    // AI qualification
    qualified: v.optional(v.boolean()),
    qualificationReason: v.optional(v.string()),
    qualificationScore: v.optional(v.number()), // 0-100
    estimatedValue: v.optional(v.string()),
    recommendedNextStep: v.optional(v.string()),
    // Pipeline
    status: v.string(), // "new", "contacted", "qualified", "disqualified", "site_walk_booked", "site_walk_done", "proposal_sent", "won", "lost", "closed_lost"
    siteWalkDate: v.optional(v.string()),
    assignedTo: v.optional(v.string()), // "marcus", "brittany"
    lastContactDate: v.optional(v.string()),
    lostReason: v.optional(v.string()),
    createdBy: v.id("users"),
  })
    .index("by_status", ["status"])
    .index("by_qualified", ["qualified"])
    .index("by_createdBy", ["createdBy"])
    .index("by_source", ["source"]),

  proposals: defineTable({
    leadId: v.id("leads"),
    clientName: v.string(),
    projectType: v.string(),
    // Site walk data
    siteWalkNotes: v.optional(v.string()),
    siteWalkDate: v.optional(v.string()),
    // Scope and pricing
    scopeJson: v.optional(v.string()), // JSON: scope details
    lineItemsJson: v.optional(v.string()), // JSON: array of {item, category, qty, unit, unitPrice, total}
    subtotal: v.optional(v.number()),
    markupPercent: v.optional(v.number()),
    totalAmount: v.optional(v.number()),
    // Proposal content
    proposalContent: v.optional(v.string()),
    // Render tracking
    needsRender: v.optional(v.boolean()), // flagged if > $30K
    renderStatus: v.optional(v.string()), // "pending", "in_progress", "done"
    renderNotes: v.optional(v.string()),
    // Cycle tracking
    daysToGenerate: v.optional(v.number()),
    // Workflow status
    status: v.string(), // "draft", "review", "approved", "sent", "signed", "rejected"
    approvedBy: v.optional(v.string()),
    approvedAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    signedAt: v.optional(v.number()),
    createdBy: v.id("users"),
  })
    .index("by_leadId", ["leadId"])
    .index("by_status", ["status"])
    .index("by_createdBy", ["createdBy"]),

  projects: defineTable({
    proposalId: v.optional(v.id("proposals")),
    leadId: v.optional(v.id("leads")),
    clientName: v.string(),
    projectType: v.string(),
    address: v.optional(v.string()),
    totalAmount: v.optional(v.number()),
    // Post-sign checklist (the specific items from Anna's workflow)
    depositInvoiceSent: v.boolean(),
    depositPaid: v.boolean(),
    welcomePacketSent: v.boolean(),
    hoaRequired: v.boolean(),
    hoaSubmitted: v.boolean(),
    hoaApproved: v.boolean(),
    permitRequired: v.boolean(),
    permitPulled: v.boolean(),
    permitApproved: v.boolean(),
    finalDesignApproved: v.boolean(),
    // Crew assignment
    crewLead: v.optional(v.string()), // "andre", "tyler", "diego", "mateo"
    crewScheduled: v.boolean(),
    startDate: v.optional(v.string()),
    estimatedCompletion: v.optional(v.string()),
    // Phase tracking
    phase: v.string(), // "onboarding", "pre_construction", "in_progress", "final_walkthrough", "completed"
    status: v.string(), // "active", "on_hold", "completed", "cancelled"
    // Dates for cycle tracking
    signedDate: v.optional(v.string()),
    depositPaidDate: v.optional(v.string()),
    hoaApprovedDate: v.optional(v.string()),
    permitApprovedDate: v.optional(v.string()),
    actualStartDate: v.optional(v.string()),
    completedDate: v.optional(v.string()),
    createdBy: v.id("users"),
  })
    .index("by_status", ["status"])
    .index("by_phase", ["phase"])
    .index("by_proposalId", ["proposalId"])
    .index("by_crewLead", ["crewLead"])
    .index("by_createdBy", ["createdBy"]),

  pricingItems: defineTable({
    itemName: v.string(),
    category: v.string(), // "hardscaping", "landscaping", "lighting", "water_features", "structures", "outdoor_kitchen", "turf_irrigation", "other"
    unit: v.string(), // "sqft", "linear_ft", "each", "hour", "project", "pallet", "yard"
    baseCost: v.number(),
    markup: v.number(), // percentage
    finalPrice: v.number(),
    description: v.optional(v.string()),
    createdBy: v.id("users"),
  })
    .index("by_category", ["category"])
    .index("by_createdBy", ["createdBy"]),

  customerUpdates: defineTable({
    projectId: v.id("projects"),
    clientName: v.string(),
    updateType: v.string(), // "welcome", "progress", "milestone", "halfway", "completion", "delay", "general"
    milestone: v.optional(v.string()), // "deposit_received", "hoa_approved", "permits_approved", "crew_scheduled", "work_started", "halfway", "final_walkthrough", "completed"
    content: v.string(),
    sentVia: v.optional(v.string()), // "email", "sms", "both"
    sentAt: v.optional(v.number()),
    createdBy: v.id("users"),
  })
    .index("by_projectId", ["projectId"])
    .index("by_createdBy", ["createdBy"]),

  approvals: defineTable({
    type: v.string(), // "change_order", "add_on", "refund", "material", "schedule_change", "pricing", "other"
    title: v.string(),
    description: v.string(),
    amount: v.optional(v.number()),
    projectId: v.optional(v.id("projects")),
    clientName: v.optional(v.string()),
    requestedBy: v.string(), // name of person requesting
    urgency: v.string(), // "low", "normal", "urgent"
    status: v.string(), // "pending", "approved", "denied"
    decision: v.optional(v.string()), // notes on the decision
    decidedAt: v.optional(v.number()),
    createdBy: v.id("users"),
  })
    .index("by_status", ["status"])
    .index("by_projectId", ["projectId"])
    .index("by_createdBy", ["createdBy"]),

  activities: defineTable({
    type: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    relatedId: v.optional(v.string()),
    createdBy: v.id("users"),
  }).index("by_createdBy", ["createdBy"]),

  settings: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),

  slackQueue: defineTable({
    blocksJson: v.string(),   // JSON-encoded Slack blocks
    text: v.string(),         // fallback text
    status: v.string(),       // "pending" | "sent" | "failed"
    sentAt: v.optional(v.number()),
  }).index("by_status", ["status"]),
});

export default schema;
