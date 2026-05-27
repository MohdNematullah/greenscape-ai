/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ViktorSpacesEmail from "../ViktorSpacesEmail.js";
import type * as ai from "../ai.js";
import type * as approvals from "../approvals.js";
import type * as auth from "../auth.js";
import type * as constants from "../constants.js";
import type * as customerUpdates from "../customerUpdates.js";
import type * as dashboard from "../dashboard.js";
import type * as ghl from "../ghl.js";
import type * as http from "../http.js";
import type * as integrations from "../integrations.js";
import type * as leads from "../leads.js";
import type * as pricingItems from "../pricingItems.js";
import type * as projects from "../projects.js";
import type * as proposals from "../proposals.js";
import type * as seedTestUser from "../seedTestUser.js";
import type * as testAuth from "../testAuth.js";
import type * as users from "../users.js";
import type * as viktorTools from "../viktorTools.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ViktorSpacesEmail: typeof ViktorSpacesEmail;
  ai: typeof ai;
  approvals: typeof approvals;
  auth: typeof auth;
  constants: typeof constants;
  customerUpdates: typeof customerUpdates;
  dashboard: typeof dashboard;
  ghl: typeof ghl;
  http: typeof http;
  integrations: typeof integrations;
  leads: typeof leads;
  pricingItems: typeof pricingItems;
  projects: typeof projects;
  proposals: typeof proposals;
  seedTestUser: typeof seedTestUser;
  testAuth: typeof testAuth;
  users: typeof users;
  viktorTools: typeof viktorTools;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
