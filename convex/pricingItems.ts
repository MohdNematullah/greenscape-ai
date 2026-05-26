import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db.query("pricingItems").collect();
  },
});

export const create = mutation({
  args: {
    itemName: v.string(),
    category: v.string(),
    unit: v.string(),
    baseCost: v.number(),
    markup: v.number(),
    description: v.optional(v.string()),
  },
  returns: v.id("pricingItems"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const finalPrice = args.baseCost * (1 + args.markup / 100);
    return await ctx.db.insert("pricingItems", {
      ...args,
      finalPrice: Math.round(finalPrice * 100) / 100,
      createdBy: userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("pricingItems"),
    itemName: v.optional(v.string()),
    category: v.optional(v.string()),
    unit: v.optional(v.string()),
    baseCost: v.optional(v.number()),
    markup: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const { id, ...fields } = args;
    const item = await ctx.db.get(id);
    if (!item) throw new Error("Item not found");
    const baseCost = fields.baseCost ?? item.baseCost;
    const markup = fields.markup ?? item.markup;
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    updates.finalPrice = Math.round(baseCost * (1 + markup / 100) * 100) / 100;
    await ctx.db.patch(id, updates);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("pricingItems") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.delete(args.id);
    return null;
  },
});

// Seed with Greenscape's real service categories and Phoenix-market pricing
export const seed = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db.query("pricingItems").take(1);
    if (existing.length > 0) return null; // Already seeded

    const items = [
      // HARDSCAPING — Greenscape's bread and butter
      { itemName: "Travertine Paver Patio", category: "hardscaping", unit: "sqft", baseCost: 18, markup: 38, description: "Premium travertine pavers installed on compacted base" },
      { itemName: "Concrete Paver Patio (Belgard/Tremron)", category: "hardscaping", unit: "sqft", baseCost: 14, markup: 38, description: "Standard interlocking concrete pavers" },
      { itemName: "Flagstone Patio (Natural)", category: "hardscaping", unit: "sqft", baseCost: 22, markup: 38, description: "Natural flagstone set in mortar or dry-laid" },
      { itemName: "Retaining Wall (Block)", category: "hardscaping", unit: "linear_ft", baseCost: 45, markup: 40, description: "Segmental block retaining wall, up to 4ft" },
      { itemName: "Retaining Wall (Natural Stone)", category: "hardscaping", unit: "linear_ft", baseCost: 65, markup: 40, description: "Natural stone retaining wall" },
      { itemName: "Concrete Slab (Colored/Stamped)", category: "hardscaping", unit: "sqft", baseCost: 12, markup: 35, description: "Poured concrete with color and stamp pattern" },
      { itemName: "Paver Driveway Extension", category: "hardscaping", unit: "sqft", baseCost: 16, markup: 38, description: "Paver extension matching existing driveway" },
      { itemName: "Stepping Stone Pathway", category: "hardscaping", unit: "linear_ft", baseCost: 28, markup: 35, description: "Decorative stepping stones in decomposed granite" },
      { itemName: "Seat Wall / Raised Bond Beam", category: "hardscaping", unit: "linear_ft", baseCost: 55, markup: 40, description: "Masonry seat wall with cap" },
      { itemName: "Outdoor Stairway (Paver/Stone)", category: "hardscaping", unit: "each", baseCost: 350, markup: 40, description: "Per step, including riser and tread" },

      // STRUCTURES
      { itemName: "Alumawood Pergola", category: "structures", unit: "sqft", baseCost: 32, markup: 40, description: "Aluminum pergola, powder-coated, lattice or solid" },
      { itemName: "Wood Pergola (Cedar)", category: "structures", unit: "sqft", baseCost: 45, markup: 40, description: "Custom cedar pergola, stained/sealed" },
      { itemName: "Ramada / Shade Structure", category: "structures", unit: "sqft", baseCost: 55, markup: 42, description: "Full shade structure with roof, stucco columns" },
      { itemName: "Gazebo (Pre-Fab)", category: "structures", unit: "each", baseCost: 4500, markup: 35, description: "Pre-fabricated gazebo, installed" },
      { itemName: "Privacy Wall (Stucco)", category: "structures", unit: "linear_ft", baseCost: 85, markup: 40, description: "6ft stucco privacy wall with footing" },

      // FIRE FEATURES
      { itemName: "Gas Fire Pit (Round, 48in)", category: "fire_features", unit: "each", baseCost: 2200, markup: 42, description: "Built-in gas fire pit with ignition system" },
      { itemName: "Gas Fire Pit (Rectangle, Custom)", category: "fire_features", unit: "each", baseCost: 3200, markup: 42, description: "Custom rectangular fire pit, fire glass" },
      { itemName: "Fireplace (Outdoor, Full Masonry)", category: "fire_features", unit: "each", baseCost: 6500, markup: 45, description: "Full masonry outdoor fireplace with chimney" },
      { itemName: "Fire Bowl on Pedestal", category: "fire_features", unit: "each", baseCost: 1400, markup: 38, description: "Decorative fire bowl, copper or concrete" },

      // OUTDOOR KITCHEN
      { itemName: "Built-In Grill Island (L-Shape)", category: "outdoor_kitchen", unit: "each", baseCost: 5500, markup: 42, description: "Stucco/stone grill island, countertop, no appliances" },
      { itemName: "Built-In Grill Island (Straight)", category: "outdoor_kitchen", unit: "each", baseCost: 3800, markup: 42, description: "Straight grill island with countertop" },
      { itemName: "Granite Countertop (Outdoor)", category: "outdoor_kitchen", unit: "sqft", baseCost: 65, markup: 35, description: "Granite or quartz countertop, polished edges" },
      { itemName: "Outdoor Sink + Plumbing", category: "outdoor_kitchen", unit: "each", baseCost: 1200, markup: 38, description: "Stainless sink with hot/cold, drain to sewer" },
      { itemName: "Undercounter Refrigerator", category: "outdoor_kitchen", unit: "each", baseCost: 900, markup: 30, description: "Stainless outdoor-rated refrigerator, supplied + installed" },
      { itemName: "Built-In Smoker Nook", category: "outdoor_kitchen", unit: "each", baseCost: 2000, markup: 40, description: "Recessed nook for smoker with ventilation" },

      // WATER FEATURES
      { itemName: "Bubbler Fountain (Urn/Boulder)", category: "water_features", unit: "each", baseCost: 1800, markup: 38, description: "Self-contained recirculating fountain" },
      { itemName: "Pondless Waterfall", category: "water_features", unit: "each", baseCost: 4500, markup: 42, description: "Pondless waterfall with basin and pump" },
      { itemName: "Scupper Wall Water Feature", category: "water_features", unit: "each", baseCost: 3500, markup: 40, description: "Wall-mounted scupper spilling into basin" },

      // LANDSCAPING
      { itemName: "Desert Landscape Package", category: "landscaping", unit: "sqft", baseCost: 6, markup: 45, description: "Decomposed granite, boulders, desert plants" },
      { itemName: "Tropical Landscape Package", category: "landscaping", unit: "sqft", baseCost: 12, markup: 42, description: "Palms, tropical plants, river rock, mulch" },
      { itemName: "Sod Installation (Bermuda)", category: "landscaping", unit: "sqft", baseCost: 2.5, markup: 50, description: "Bermuda sod, graded and installed" },
      { itemName: "Tree (15-gal, Installed)", category: "landscaping", unit: "each", baseCost: 280, markup: 40, description: "15-gallon tree, planted with amendment" },
      { itemName: "Tree (24in Box, Installed)", category: "landscaping", unit: "each", baseCost: 650, markup: 40, description: "24-inch box tree, crane if needed" },
      { itemName: "Decomposed Granite (Spread)", category: "landscaping", unit: "yard", baseCost: 55, markup: 45, description: "DG delivered and spread, compacted" },
      { itemName: "River Rock / Rip Rap", category: "landscaping", unit: "yard", baseCost: 75, markup: 40, description: "Decorative river rock, delivered and placed" },
      { itemName: "Boulders (Decorative)", category: "landscaping", unit: "each", baseCost: 180, markup: 40, description: "Per boulder, placed by machine" },

      // TURF & IRRIGATION
      { itemName: "Artificial Turf (Premium)", category: "turf_irrigation", unit: "sqft", baseCost: 9, markup: 45, description: "Premium artificial turf, base prep, infill" },
      { itemName: "Artificial Turf (Standard)", category: "turf_irrigation", unit: "sqft", baseCost: 6.5, markup: 45, description: "Standard grade turf, full install" },
      { itemName: "Drip Irrigation System", category: "turf_irrigation", unit: "zone", baseCost: 450, markup: 40, description: "Per zone, including timer tie-in" },
      { itemName: "Sprinkler System (Pop-Up)", category: "turf_irrigation", unit: "zone", baseCost: 550, markup: 40, description: "Pop-up spray zone, PVC and heads" },

      // LIGHTING
      { itemName: "LED Path Light", category: "lighting", unit: "each", baseCost: 120, markup: 45, description: "Low-voltage LED path light, brass" },
      { itemName: "LED Up-Light (Tree/Wall Wash)", category: "lighting", unit: "each", baseCost: 140, markup: 45, description: "Low-voltage directional up-light" },
      { itemName: "LED Step Light (Recessed)", category: "lighting", unit: "each", baseCost: 95, markup: 45, description: "Recessed step/wall light" },
      { itemName: "String Lights (Commercial Grade)", category: "lighting", unit: "linear_ft", baseCost: 8, markup: 50, description: "Commercial-grade string lights, posts included" },
      { itemName: "Transformer (Low Voltage, 300W)", category: "lighting", unit: "each", baseCost: 280, markup: 35, description: "Low-voltage transformer with timer" },
      { itemName: "Lighting Design + Install (Full)", category: "lighting", unit: "project", baseCost: 1800, markup: 40, description: "Full lighting design, 10-15 fixtures, wiring, transformer" },

      // GENERAL / LABOR
      { itemName: "Demo & Haul-Off (Concrete)", category: "general", unit: "sqft", baseCost: 4, markup: 35, description: "Concrete demo, load, and haul to dump" },
      { itemName: "Demo & Haul-Off (Landscape)", category: "general", unit: "sqft", baseCost: 2.5, markup: 35, description: "Remove existing landscape, haul debris" },
      { itemName: "Grading & Compaction", category: "general", unit: "sqft", baseCost: 2, markup: 40, description: "Grade to slope, compact subbase" },
      { itemName: "Drainage (French Drain)", category: "general", unit: "linear_ft", baseCost: 35, markup: 38, description: "French drain with perforated pipe and gravel" },
      { itemName: "Electrical Run (Dedicated Circuit)", category: "general", unit: "each", baseCost: 800, markup: 30, description: "New circuit from panel to outdoor location" },
      { itemName: "Gas Line Extension", category: "general", unit: "linear_ft", baseCost: 45, markup: 30, description: "Gas line run to fire pit or grill" },
      { itemName: "Permit Fees (City of Phoenix)", category: "general", unit: "each", baseCost: 350, markup: 0, description: "Building permit, passed through at cost" },
      { itemName: "Design Fee (Carlos — 3D Render)", category: "general", unit: "each", baseCost: 750, markup: 0, description: "3D design render for projects over $30K" },
    ];

    for (const item of items) {
      const finalPrice = Math.round(item.baseCost * (1 + item.markup / 100) * 100) / 100;
      await ctx.db.insert("pricingItems", {
        ...item,
        finalPrice,
        createdBy: userId,
      });
    }

    return null;
  },
});
