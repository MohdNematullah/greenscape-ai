import { mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/** Get a setting by key */
export const get = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const row = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    return row?.value ?? null;
  },
});

/** Set a setting (upsert) */
export const set = mutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, { key, value }) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { value });
    } else {
      await ctx.db.insert("settings", { key, value });
    }
  },
});

/** Get multiple settings at once */
export const getMultiple = query({
  args: { keys: v.array(v.string()) },
  handler: async (ctx, { keys }) => {
    const result: Record<string, string | null> = {};
    for (const key of keys) {
      const row = await ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", key))
        .first();
      result[key] = row?.value ?? null;
    }
    return result;
  },
});

/** Internal query for use by other Convex functions */
export const getInternal = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const row = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    return row?.value ?? null;
  },
});

/** Internal mutation for use by HTTP endpoints and other Convex functions */
export const setInternal = internalMutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, { key, value }) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { value });
    } else {
      await ctx.db.insert("settings", { key, value });
    }
  },
});
