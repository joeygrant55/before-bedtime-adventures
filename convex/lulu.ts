import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * Lulu Print API Integration
 *
 * API Documentation: https://api.lulu.com/docs/
 * Developer Portal: https://developers.lulu.com/
 *
 * Environment variables required:
 * - LULU_CLIENT_KEY: API client key
 * - LULU_CLIENT_SECRET: API client secret
 * - LULU_USE_SANDBOX: "true" for sandbox, "false" for production
 */

// API endpoints
const LULU_PRODUCTION_URL = "https://api.lulu.com";
const LULU_SANDBOX_URL = "https://api.sandbox.lulu.com";

function getLuluBaseUrl(): string {
  const useSandbox = process.env.LULU_USE_SANDBOX === "true";
  return useSandbox ? LULU_SANDBOX_URL : LULU_PRODUCTION_URL;
}

// POD Package ID for 8.5" x 8.5" Square Hardcover, Full Color, Premium
const POD_PACKAGE_ID = "0850X0850FCPRECW080CW444MXX";

// Types for Lulu API
interface LuluTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface LuluShippingAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state_code: string;
  postcode: string;
  country_code: string;
  phone_number: string;
}

interface LuluLineItem {
  external_id: string;
  title: string;
  cover: string;
  interior: string;
  pod_package_id: string;
  quantity: number;
}

interface LuluPrintJobRequest {
  contact_email: string;
  external_id: string;
  shipping_address: LuluShippingAddress;
  shipping_option_level: "MAIL" | "GROUND" | "EXPEDITED" | "EXPRESS";
  line_items: LuluLineItem[];
}

interface LuluPrintJobResponse {
  id: number;
  status: {
    name: string;
    message?: string;
  };
  line_items: Array<{
    id: number;
    external_id?: string;
    tracking_id?: string;
    tracking_urls?: string[];
  }>;
  shipping_address: LuluShippingAddress;
  estimated_shipping_dates?: {
    arrival_min: string;
    arrival_max: string;
  };
  costs?: {
    total_cost_excl_tax: string;
    total_cost_incl_tax: string;
    currency: string;
  };
}

// Lulu status to our status mapping
const LULU_STATUS_MAP: Record<string, string> = {
  CREATED: "submitted",
  UNPAID: "submitted",
  PAYMENT_IN_PROGRESS: "submitted",
  PRODUCTION_READY: "in_production",
  PRODUCTION_DELAYED: "in_production",
  IN_PRODUCTION: "in_production",
  MANUFACTURED: "in_production",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELED: "failed",
  ERROR: "failed",
  REJECTED: "failed",
};

/**
 * Get OAuth2 access token from Lulu
 */
async function getLuluAccessToken(): Promise<string> {
  const clientKey = process.env.LULU_CLIENT_KEY;
  const clientSecret = process.env.LULU_CLIENT_SECRET;

  if (!clientKey || !clientSecret) {
    throw new Error("LULU_CLIENT_KEY and LULU_CLIENT_SECRET must be configured");
  }

  const baseUrl = getLuluBaseUrl();
  const tokenUrl = `${baseUrl}/auth/realms/glasstree/protocol/openid-connect/token`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientKey,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Lulu auth failed: ${response.status} - ${error}`);
  }

  const data: LuluTokenResponse = await response.json();
  return data.access_token;
}

/**
 * Submit a print job to Lulu
 */
export const submitPrintJob = action({
  args: {
    orderId: v.id("printOrders"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; luluJobId?: string; error?: string }> => {
    console.log("📚 Submitting print job for order:", args.orderId);

    try {
      // Get order details
      const order = await ctx.runQuery(internal.orders.getOrder, { orderId: args.orderId });

      if (!order) {
        throw new Error("Order not found");
      }

      if (!order.book) {
        throw new Error("Book not found for order");
      }

      // Check for PDF URLs
      if (!order.interiorPdfUrl || !order.coverPdfUrl) {
        throw new Error("PDFs must be generated before submitting to Lulu");
      }

      // Update status to submitting
      await ctx.runMutation(internal.orders.updateOrderStatus, {
        orderId: args.orderId,
        status: "submitting_to_lulu",
      });

      // Get access token
      const token = await getLuluAccessToken();
      const baseUrl = getLuluBaseUrl();

      // Build the request
      const request: LuluPrintJobRequest = {
        contact_email: order.contactEmail,
        external_id: args.orderId,
        shipping_address: {
          name: order.shippingAddress.name,
          street1: order.shippingAddress.street1,
          street2: order.shippingAddress.street2,
          city: order.shippingAddress.city,
          state_code: order.shippingAddress.stateCode,
          postcode: order.shippingAddress.postalCode,
          country_code: order.shippingAddress.countryCode,
          phone_number: order.shippingAddress.phoneNumber,
        },
        shipping_option_level: "GROUND", // Free shipping = Ground
        line_items: [
          {
            external_id: order.bookId,
            title: order.book.title,
            cover: order.coverPdfUrl,
            interior: order.interiorPdfUrl,
            pod_package_id: POD_PACKAGE_ID,
            quantity: 1,
          },
        ],
      };

      console.log("📤 Sending request to Lulu:", JSON.stringify(request, null, 2));

      // Submit to Lulu
      const response = await fetch(`${baseUrl}/print-jobs/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("❌ Lulu API error:", response.status, error);

        await ctx.runMutation(internal.orders.updateOrderStatus, {
          orderId: args.orderId,
          status: "failed",
        });

        return { success: false, error: `Lulu API error: ${response.status} - ${error}` };
      }

      const result: LuluPrintJobResponse = await response.json();
      console.log("✅ Lulu print job created:", result.id);

      // Update order with Lulu job ID
      await ctx.runMutation(internal.orders.updateLuluStatus, {
        orderId: args.orderId,
        luluPrintJobId: String(result.id),
        luluStatus: result.status.name,
        status: "submitted",
      });

      return { success: true, luluJobId: String(result.id) };
    } catch (error) {
      console.error("❌ Error submitting print job:", error);

      await ctx.runMutation(internal.orders.updateOrderStatus, {
        orderId: args.orderId,
        status: "failed",
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Check status of a print job
 */
export const checkPrintJobStatus = action({
  args: {
    orderId: v.id("printOrders"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; status?: string; error?: string }> => {
    try {
      // Get order details
      const order = await ctx.runQuery(internal.orders.getOrder, { orderId: args.orderId });

      if (!order || !order.luluPrintJobId) {
        return { success: false, error: "No Lulu job ID found for order" };
      }

      // Get access token
      const token = await getLuluAccessToken();
      const baseUrl = getLuluBaseUrl();

      // Fetch job status
      const response = await fetch(`${baseUrl}/print-jobs/${order.luluPrintJobId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Lulu API error: ${response.status} - ${error}` };
      }

      const job: LuluPrintJobResponse = await response.json();
      const luluStatus = job.status.name;
      const ourStatus = LULU_STATUS_MAP[luluStatus] || order.status;

      // Get tracking info if shipped
      let trackingNumber: string | undefined;
      let trackingUrl: string | undefined;

      if (luluStatus === "SHIPPED" && job.line_items[0]) {
        trackingNumber = job.line_items[0].tracking_id;
        trackingUrl = job.line_items[0].tracking_urls?.[0];
      }

      // Update order status
      await ctx.runMutation(internal.orders.updateLuluStatus, {
        orderId: args.orderId,
        luluStatus,
        status: ourStatus as "submitted" | "in_production" | "shipped" | "delivered" | "failed",
        trackingNumber,
        trackingUrl,
      });

      return { success: true, status: ourStatus };
    } catch (error) {
      console.error("❌ Error checking print job status:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Poll all active orders for status updates
 * This should be called periodically (e.g., hourly) via a cron job
 */
export const pollActiveOrders = action({
  args: {},
  handler: async (ctx): Promise<{ checked: number; updated: number }> => {
    // Get all active orders
    const activeOrders = await ctx.runQuery(internal.orders.getActiveOrders);

    let updated = 0;

    for (const order of activeOrders) {
      try {
        const result = await ctx.runAction(api.lulu.checkPrintJobStatus, {
          orderId: order._id,
        });

        if (result.success) {
          updated++;
        }
      } catch (error) {
        console.error(`Failed to check order ${order._id}:`, error);
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return { checked: activeOrders.length, updated };
  },
});

/**
 * Get shipping cost estimate from Lulu
 * (Optional - for displaying estimated costs before checkout)
 */
export const getShippingEstimate = action({
  args: {
    pageCount: v.number(),
    postalCode: v.string(),
    countryCode: v.string(),
  },
  handler: async (ctx, args): Promise<{ cost?: number; currency?: string; error?: string }> => {
    try {
      const token = await getLuluAccessToken();
      const baseUrl = getLuluBaseUrl();

      // Use Lulu's shipping options endpoint
      const params = new URLSearchParams({
        page_count: String(args.pageCount),
        pod_package_id: POD_PACKAGE_ID,
        quantity: "1",
        postal_code: args.postalCode,
        country_code: args.countryCode,
        level: "GROUND",
      });

      const response = await fetch(`${baseUrl}/print-shipping-options/?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        return { error: `Lulu API error: ${response.status}` };
      }

      const data = await response.json();

      // Extract cost from response
      if (data.results && data.results.length > 0) {
        const groundOption = data.results.find(
          (opt: { level: string }) => opt.level === "GROUND"
        );
        if (groundOption) {
          return {
            cost: parseFloat(groundOption.total_cost_excl_tax),
            currency: groundOption.currency,
          };
        }
      }

      return { error: "No shipping options available" };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Calculate print cost estimate from Lulu
 */
export const getPrintCostEstimate = action({
  args: {
    pageCount: v.number(),
  },
  handler: async (ctx, args): Promise<{ cost?: number; currency?: string; error?: string }> => {
    try {
      const token = await getLuluAccessToken();
      const baseUrl = getLuluBaseUrl();

      // Use Lulu's cost calculator endpoint
      const params = new URLSearchParams({
        page_count: String(args.pageCount),
        pod_package_id: POD_PACKAGE_ID,
        quantity: "1",
      });

      const response = await fetch(`${baseUrl}/print-job-cost-calculations/?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        return { error: `Lulu API error: ${response.status}` };
      }

      const data = await response.json();

      if (data.total_cost_excl_tax) {
        return {
          cost: parseFloat(data.total_cost_excl_tax),
          currency: data.currency || "USD",
        };
      }

      return { error: "Could not calculate cost" };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
