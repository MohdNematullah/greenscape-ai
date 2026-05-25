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
    const prompt = `${COMPANY_CONTEXT}

TASK: Write a premium proposal from the site walk notes. This is the #1 bottleneck — proposals currently take 6-9 days. This AI draft should take minutes.

SITE WALK NOTES:
${args.siteWalkNotes}

CLIENT: ${args.clientName}
PROJECT TYPE: ${args.projectType}
FEATURES: ${args.features || "See site walk notes"}
BUDGET RANGE: ${args.budget || "To be determined from scope"}
TIMELINE: ${args.timeline || "Standard 4-6 week lead time"}

${args.pricingData ? `PRICING REFERENCE:\n${args.pricingData}` : ""}

Write the proposal with these sections:
1. **Project Overview** — Warm, professional intro addressed to the client
2. **Scope of Work** — Detailed breakdown of what's included
3. **Materials & Specifications** — Key materials, brands, finishes
4. **Installation Process** — Phase-by-phase how the work gets done
5. **Timeline** — Realistic schedule with milestones
6. **Investment Summary** — Line items with pricing (use pricing reference if provided, otherwise estimate based on project type and Phoenix market rates)
7. **Quality Guarantee** — Warranty, workmanship guarantee
8. **Exclusions** — What's NOT included
9. **Next Steps** — How to proceed (sign, deposit, onboarding)

RULES:
- Sound confident, direct, premium but not salesy
- Short paragraphs, no fluff
- Never sound robotic or use hype
- Use ## headers in markdown
- End with "— The Greenscape Team"

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
    const prompt = `${COMPANY_CONTEXT}

TASK: Write a customer update message to ${args.clientName} from the Greenscape owner.

When the owner sends personal updates (especially Loom-style), customers love it and refer friends. "You're the only contractor who kept us informed." This message should feel like a personal note from the owner — warm, confident, brief.

Update Type: ${args.updateType}
${args.milestone ? `Milestone: ${args.milestone}` : ""}
Project: ${args.projectType}
Progress: ${args.progressDetails}

RULES:
- Under 100 words
- Start with "Hi ${args.clientName},"
- Mention what was completed and what's next
- Reassuring, professional, genuinely warm
- End with "— The Greenscape Team"
- NO hype, NO corporate speak

Write ONLY the message.`;

    const result = await callTool<{ search_response: string }>("quick_ai_search", {
      search_question: prompt,
    });

    return { content: result.search_response };
  },
});
