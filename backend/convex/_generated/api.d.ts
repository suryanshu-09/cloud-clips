/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as addresses_mutations from "../addresses/mutations.js";
import type * as addresses_queries from "../addresses/queries.js";
import type * as admin_announcements from "../admin/announcements.js";
import type * as admin_auth from "../admin/auth.js";
import type * as admin_featuredBarbers from "../admin/featuredBarbers.js";
import type * as admin_mutations from "../admin/mutations.js";
import type * as admin_productCatalog from "../admin/productCatalog.js";
import type * as admin_queries from "../admin/queries.js";
import type * as admin_supportTickets from "../admin/supportTickets.js";
import type * as analytics_queries from "../analytics/queries.js";
import type * as appointments_mutations from "../appointments/mutations.js";
import type * as appointments_queries from "../appointments/queries.js";
import type * as auth from "../auth.js";
import type * as auth_index from "../auth/index.js";
import type * as auth_mutations from "../auth/mutations.js";
import type * as barbers_dashboard from "../barbers/dashboard.js";
import type * as barbers_mutations from "../barbers/mutations.js";
import type * as barbers_queries from "../barbers/queries.js";
import type * as coupons_mutations from "../coupons/mutations.js";
import type * as coupons_queries from "../coupons/queries.js";
import type * as dev from "../dev.js";
import type * as earnings_queries from "../earnings/queries.js";
import type * as index from "../index.js";
import type * as lib_authIdentity from "../lib/authIdentity.js";
import type * as lib_timezone from "../lib/timezone.js";
import type * as messages_mutations from "../messages/mutations.js";
import type * as messages_queries from "../messages/queries.js";
import type * as notifications_mutations from "../notifications/mutations.js";
import type * as notifications_queries from "../notifications/queries.js";
import type * as notifications_tokens from "../notifications/tokens.js";
import type * as orders_mutations from "../orders/mutations.js";
import type * as orders_queries from "../orders/queries.js";
import type * as payments_actions from "../payments/actions.js";
import type * as products_mutations from "../products/mutations.js";
import type * as products_queries from "../products/queries.js";
import type * as receipts_mutations from "../receipts/mutations.js";
import type * as receipts_queries from "../receipts/queries.js";
import type * as reviews from "../reviews.js";
import type * as reviews_mutations from "../reviews/mutations.js";
import type * as reviews_queries from "../reviews/queries.js";
import type * as storage from "../storage.js";
import type * as storage_actions from "../storage/actions.js";
import type * as timeOff_mutations from "../timeOff/mutations.js";
import type * as timeOff_queries from "../timeOff/queries.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "addresses/mutations": typeof addresses_mutations;
  "addresses/queries": typeof addresses_queries;
  "admin/announcements": typeof admin_announcements;
  "admin/auth": typeof admin_auth;
  "admin/featuredBarbers": typeof admin_featuredBarbers;
  "admin/mutations": typeof admin_mutations;
  "admin/productCatalog": typeof admin_productCatalog;
  "admin/queries": typeof admin_queries;
  "admin/supportTickets": typeof admin_supportTickets;
  "analytics/queries": typeof analytics_queries;
  "appointments/mutations": typeof appointments_mutations;
  "appointments/queries": typeof appointments_queries;
  auth: typeof auth;
  "auth/index": typeof auth_index;
  "auth/mutations": typeof auth_mutations;
  "barbers/dashboard": typeof barbers_dashboard;
  "barbers/mutations": typeof barbers_mutations;
  "barbers/queries": typeof barbers_queries;
  "coupons/mutations": typeof coupons_mutations;
  "coupons/queries": typeof coupons_queries;
  dev: typeof dev;
  "earnings/queries": typeof earnings_queries;
  index: typeof index;
  "lib/authIdentity": typeof lib_authIdentity;
  "lib/timezone": typeof lib_timezone;
  "messages/mutations": typeof messages_mutations;
  "messages/queries": typeof messages_queries;
  "notifications/mutations": typeof notifications_mutations;
  "notifications/queries": typeof notifications_queries;
  "notifications/tokens": typeof notifications_tokens;
  "orders/mutations": typeof orders_mutations;
  "orders/queries": typeof orders_queries;
  "payments/actions": typeof payments_actions;
  "products/mutations": typeof products_mutations;
  "products/queries": typeof products_queries;
  "receipts/mutations": typeof receipts_mutations;
  "receipts/queries": typeof receipts_queries;
  reviews: typeof reviews;
  "reviews/mutations": typeof reviews_mutations;
  "reviews/queries": typeof reviews_queries;
  storage: typeof storage;
  "storage/actions": typeof storage_actions;
  "timeOff/mutations": typeof timeOff_mutations;
  "timeOff/queries": typeof timeOff_queries;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
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
