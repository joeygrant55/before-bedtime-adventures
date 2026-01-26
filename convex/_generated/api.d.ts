/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as bakeTextOverlay from "../bakeTextOverlay.js";
import type * as books from "../books.js";
import type * as crons from "../crons.js";
import type * as emails from "../emails.js";
import type * as generatePdf from "../generatePdf.js";
import type * as http from "../http.js";
import type * as images from "../images.js";
import type * as lulu from "../lulu.js";
import type * as orders from "../orders.js";
import type * as pages from "../pages.js";
import type * as textOverlays from "../textOverlays.js";
import type * as transformImage from "../transformImage.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  bakeTextOverlay: typeof bakeTextOverlay;
  books: typeof books;
  crons: typeof crons;
  emails: typeof emails;
  generatePdf: typeof generatePdf;
  http: typeof http;
  images: typeof images;
  lulu: typeof lulu;
  orders: typeof orders;
  pages: typeof pages;
  textOverlays: typeof textOverlays;
  transformImage: typeof transformImage;
  users: typeof users;
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
