import { v } from "convex/values";
import { action } from "./_generated/server";
import { callTool } from "./viktorTools";

const COMPANY_CONTEXT = `Greenscape is a premium residential hardscape and landscape design-build company based in Phoenix, AZ.
- Founded 2017, ~$4.2M revenue, targeting $5.5M
- Average project: $28,000 (range $8,000–$120,000)
- ~150 completed projects/year
- Services: patios, pergolas, fire pits, water features, artificial turf, irrigation, outdoor kitchens, retaining walls
- Premium positioning: competes on quality, reliability, and finished aesthetics—NOT price
- Team: CEO/Owner (does all site walks and proposal approvals), Office Manager, Lead Designer (renders), Sales Coordinator
- 4 crew leads: Andre, Tyler, Diego (hardscape), Mateo (landscape)
- Current close rate: ~70% after site walk, ~20% phone-only, ~30% full-funnel`;

export const qualifyLead = action({
  args: {
    name: v.string(),
    projectType: v.optional(v.string()),
    budget: v.optional(v.string()),
    timeline: v.optional(v.string()),
    notes: v.optional(v.string()),
    source: v.string(),
    isHomeowner: v.optional(v.boolean()),
    hasHoa: v.optional(v.boolean()),
  },
  returns: v.object({
    qualified: v.boolean(),
    reason: v.string(),
    score: v.number(),
    estimatedValue: v.string(),
    recommendedNextStep: v.string(),
  }),
  handler: async (_ctx, args) => {
    const prompt = `${COMPANY_CONTEXT}

TASK: Qualify this lead. Score 0-100.

QUALIFY if:
- Budget ≥ $8,000 (or unspecified but project type implies it)
- Homeowner (not renter)
- Reasonable timeline (Greenscape is typically booked 4-6 weeks out)
- Real project with specific scope

DISQUALIFY if:
- Budget clearly < $8,000
- Renter
- Wants it done in < 2 weeks (unrealistic)
- No real project details (tire-kicker)
- Commercial project (residential only)

Lead:
- Name: ${args.name}
- Source: ${args.source}
- Project: ${args.projectType || "Not specified"}
- Budget: ${args.budget || "Not specified"}
- Timeline: ${args.timeline || "Not specified"}
- Homeowner: ${args.isHomeowner === true ? "Yes" : args.isHomeowner === false ? "No (renter)" : "Unknown"}
- HOA: ${args.hasHoa === true ? "Yes" : args.hasHoa === false ? "No" : "Unknown"}
- Notes: ${args.notes || "None"}

Reply with ONLY this JSON:
{"qualified":true/false,"reason":"...","score":0-100,"estimatedValue":"$XX,XXX","recommendedNextStep":"..."}`;

    let text = "";
    try {
      const result = await callTool<{ search_response: string }>("quick_ai_search", {
        search_question: prompt,
      });
      text = result.search_response || "";
      console.log("AI qualify response:", text.slice(0, 400));
    } catch (err) {
      console.error("AI tool call failed:", err);
    }

    // Parse JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          qualified: Boolean(parsed.qualified),
          reason: String(parsed.reason || ""),
          score: Number(parsed.score) || (parsed.qualified ? 75 : 25),
          estimatedValue: String(parsed.estimatedValue || parsed.estimated_value || "Unknown"),
          recommendedNextStep: String(parsed.recommendedNextStep || parsed.recommended_next_step || "Review manually"),
        };
      }
    } catch (e) {
      console.error("JSON parse failed:", e, "text:", text.slice(0, 200));
    }

    // Smart budget-based fallback
    const budgetNum = parseInt(args.budget || "0", 10);
    const isRenter = args.isHomeowner === false;

    if (isRenter) {
      return {
        qualified: false,
        reason: "Lead appears to be a renter. Greenscape serves homeowners only.",
        score: 10,
        estimatedValue: budgetNum > 0 ? `$${budgetNum.toLocaleString()}` : "N/A",
        recommendedNextStep: "Send polite decline with referral to maintenance services",
      };
    }

    if (budgetNum >= 8000) {
      const score = Math.min(95, 50 + Math.floor(budgetNum / 2000));
      return {
        qualified: true,
        reason: `Budget of $${budgetNum.toLocaleString()} meets the $8,000 minimum. ${args.projectType ? `Project type: ${args.projectType}.` : ""} Source: ${args.source}.`,
        score,
        estimatedValue: `$${budgetNum.toLocaleString()}`,
        recommendedNextStep: "Book site walk — call within 24 hours",
      };
    }

    if (budgetNum > 0 && budgetNum < 8000) {
      return {
        qualified: false,
        reason: `Budget of $${budgetNum.toLocaleString()} is below the $8,000 minimum project threshold.`,
        score: 15,
        estimatedValue: `$${budgetNum.toLocaleString()}`,
        recommendedNextStep: "Send polite decline with explanation of minimum project size",
      };
    }

    // Unknown budget — default to qualified if good source
    const goodSources = ["meta_ad", "google_lsa", "referral"];
    const isGoodSource = goodSources.includes(args.source);
    return {
      qualified: isGoodSource,
      reason: isGoodSource
        ? `No budget specified but source (${args.source}) is high-quality. Recommend phone qualification.`
        : "Insufficient information to qualify. Manual review needed.",
      score: isGoodSource ? 50 : 30,
      estimatedValue: "$28,000",
      recommendedNextStep: isGoodSource
        ? "Sales team to call for phone qualification — confirm budget, timeline, homeowner status"
        : "Manual review required",
    };
  },
});

export const generateProposal = action({
  args: {
    clientName: v.string(),
    projectType: v.string(),
    siteWalkNotes: v.string(),
    features: v.optional(v.string()),
    budget: v.optional(v.string()),
    timeline: v.optional(v.string()),
    pricingData: v.optional(v.string()),
  },
  returns: v.object({
    proposalContent: v.string(),
    scopeJson: v.string(),
    lineItemsJson: v.string(),
    estimatedTotal: v.number(),
  }),
  handler: async (_ctx, args) => {
    // Current date in Phoenix timezone
    const now = new Date();
    const todayStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "America/Phoenix" });
    const startDateEst = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "America/Phoenix" });

    const prompt = `${COMPANY_CONTEXT}

TASK: Write a premium, real-looking proposal from the site walk notes. This proposal will be sent directly to the client — it must look 100% professional and real.

TODAY'S DATE: ${todayStr}
ESTIMATED START DATE: ${startDateEst} (4 weeks from today — standard lead time)

SITE WALK NOTES:
${args.siteWalkNotes}

CLIENT: ${args.clientName}
PROJECT TYPE: ${args.projectType}
FEATURES: ${args.features || "See site walk notes"}
BUDGET RANGE: ${args.budget || "To be determined from scope"}

${args.pricingData ? `PRICING REFERENCE:\n${args.pricingData}` : ""}

Write the proposal with these sections:
1. Project Overview — Warm intro addressed to the client by name. Include today's date (${todayStr}) and proposal number (use format GS-2026-XXXX with random 4 digits).
2. Scope of Work — Detailed breakdown of what's included
3. Materials & Specifications — Specific materials, brands, finishes
4. Timeline — Use REAL dates starting from ${startDateEst}. Break into phases with actual date ranges.
5. Investment Summary — Line items with pricing
6. Terms — 50% deposit to schedule, balance on completion. 5-year workmanship warranty.
7. Next Steps — Sign below, deposit, project kickoff

CRITICAL RULES:
- ALL dates must be in 2026 or later. NEVER use 2024 or 2025 dates.
- The proposal date is ${todayStr}. The start date is approximately ${startDateEst}.
- Sound like a real contractor — confident, direct, premium
- Short paragraphs, no fluff, no hype
- Do NOT use markdown headers (no ## or **). Write plain text with section titles in ALL CAPS followed by a line break.
- Do NOT use asterisks, hashtags, or any markdown formatting
- End with "— The Greenscape Team" and company phone/address
- Keep it concise — a real proposal, not an essay

After the proposal, include a JSON block wrapped in \`\`\`json tags:
{
  "line_items": [{"item":"...","category":"...","qty":1,"unit":"sqft","unitPrice":25,"total":2500}],
  "subtotal": 0,
  "markup_percent": 38,
  "estimated_total": 0
}`;

    const result = await callTool<{ search_response: string }>("quick_ai_search", {
      search_question: prompt,
    });

    const text = result.search_response;

    // Extract JSON block
    let scopeJson = "{}";
    let lineItemsJson = "[]";
    let estimatedTotal = 0;
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim());
        lineItemsJson = JSON.stringify(parsed.line_items || []);
        estimatedTotal = parsed.estimated_total || parsed.subtotal || 0;
        scopeJson = JSON.stringify(parsed);
      } catch {
        scopeJson = jsonMatch[1].trim();
      }
    }

    const proposalContent = text.replace(/```json[\s\S]*?```/, "").trim();

    return {
      proposalContent,
      scopeJson,
      lineItemsJson,
      estimatedTotal,
    };
  },
});

export const generateCustomerUpdate = action({
  args: {
    clientName: v.string(),
    projectType: v.string(),
    progressDetails: v.string(),
    updateType: v.string(),
    milestone: v.optional(v.string()),
  },
  returns: v.object({
    content: v.string(),
  }),
  handler: async (_ctx, args) => {
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "America/Phoenix" });

    const prompt = `${COMPANY_CONTEXT}

TASK: Write a customer update message to ${args.clientName} from the Greenscape owner.

TODAY'S DATE: ${today}

When the owner sends personal updates, customers love it and refer friends. This should feel like a personal note — warm, confident, brief.

Update Type: ${args.updateType}
${args.milestone ? `Milestone: ${args.milestone}` : ""}
Project: ${args.projectType}
Progress: ${args.progressDetails}

RULES:
- Under 80 words
- Start with "Hi ${args.clientName},"
- Say what was done and what's next
- Warm, professional, real
- End with "— The Greenscape Team"
- Do NOT use markdown (no **, ##, *)
- Plain text only
- NO hype, NO corporate speak

Write ONLY the message.`;

    const result = await callTool<{ search_response: string }>("quick_ai_search", {
      search_question: prompt,
    });

    return { content: result.search_response };
  },
});
