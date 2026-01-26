import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { verifyBookOwnership, verifyOrderOwnership, AuthError } from "./auth";

// Create a new order - PROTECTED
export const createOrder = mutation({
  args: {
    clerkId: v.string(),
    bookId: v.id("books"),
    shippingAddress: v.object({
      name: v.string(),
      street1: v.string(),
      street2: v.optional(v.string()),
      city: v.string(),
      stateCode: v.string(),
      postalCode: v.string(),
      phoneNumber: v.string(),
    }),
    contactEmail: v.string(),
    price: v.number(), // In cents ($44.99 = 4499)
  },
  handler: async (ctx, args) => {
    // Verify user owns the book
    const isOwner = await verifyBookOwnership(ctx, args.bookId, args.clerkId);
    if (!isOwner) {
      throw new AuthError("You don't have permission to order this book");
    }

    // Estimated cost (Lulu print + shipping)
    const estimatedCost = 2000; // $20.00 in cents

    const orderId = await ctx.db.insert("printOrders", {
      bookId: args.bookId,
      status: "pending_payment",
      cost: estimatedCost,
      price: args.price,
      shippingAddress: {
        ...args.shippingAddress,
        countryCode: "US" as const, // US only for MVP
      },
      contactEmail: args.contactEmail,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return orderId;
  },
});

// Update order status - WEBHOOK USE ONLY
// Called by Stripe webhook after signature verification
// Do NOT expose this to client-side code
export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("printOrders"),
    status: v.union(
      v.literal("pending_payment"),
      v.literal("payment_received"),
      v.literal("generating_pdfs"),
      v.literal("submitting_to_lulu"),
      v.literal("submitted"),
      v.literal("in_production"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("failed")
    ),
    stripeSessionId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.stripeSessionId) {
      updates.stripeSessionId = args.stripeSessionId;
    }
    if (args.stripePaymentIntentId) {
      updates.stripePaymentIntentId = args.stripePaymentIntentId;
    }

    // Add timestamp for specific status changes
    if (args.status === "payment_received") {
      updates.paidAt = Date.now();
    } else if (args.status === "submitted") {
      updates.submittedAt = Date.now();
    } else if (args.status === "shipped") {
      updates.shippedAt = Date.now();
    } else if (args.status === "delivered") {
      updates.deliveredAt = Date.now();
    }

    await ctx.db.patch(args.orderId, updates);

    // If payment received, also update the book status
    if (args.status === "payment_received") {
      const order = await ctx.db.get(args.orderId);
      if (order) {
        await ctx.db.patch(order.bookId, {
          status: "ordered",
          updatedAt: Date.now(),
        });
      }
    }
  },
});

// Update Lulu integration fields - SERVER USE ONLY (called by backend processes)
// Do NOT expose this to client-side code
export const updateLuluStatus = mutation({
  args: {
    orderId: v.id("printOrders"),
    luluPrintJobId: v.optional(v.string()),
    luluStatus: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("submitted"),
      v.literal("in_production"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("failed")
    )),
    trackingNumber: v.optional(v.string()),
    trackingUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.luluPrintJobId !== undefined) {
      updates.luluPrintJobId = args.luluPrintJobId;
    }
    if (args.luluStatus !== undefined) {
      updates.luluStatus = args.luluStatus;
    }
    if (args.status !== undefined) {
      updates.status = args.status;

      // Add timestamps
      if (args.status === "submitted") {
        updates.submittedAt = Date.now();
      } else if (args.status === "shipped") {
        updates.shippedAt = Date.now();
      } else if (args.status === "delivered") {
        updates.deliveredAt = Date.now();
      }
    }
    if (args.trackingNumber !== undefined) {
      updates.trackingNumber = args.trackingNumber;
    }
    if (args.trackingUrl !== undefined) {
      updates.trackingUrl = args.trackingUrl;
    }

    await ctx.db.patch(args.orderId, updates);
  },
});

// Store PDF URLs after generation - SERVER USE ONLY
// Do NOT expose this to client-side code
export const updatePdfUrls = mutation({
  args: {
    orderId: v.id("printOrders"),
    interiorPdfUrl: v.string(),
    coverPdfUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, {
      interiorPdfUrl: args.interiorPdfUrl,
      coverPdfUrl: args.coverPdfUrl,
      updatedAt: Date.now(),
    });
  },
});

// Get order by ID - ownership verified at UI layer
export const getOrder = query({
  args: { orderId: v.id("printOrders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;

    // Get associated book
    const book = await ctx.db.get(order.bookId);

    return {
      ...order,
      book,
    };
  },
});

// Get order by ID with ownership check - PROTECTED
export const getOrderSecure = query({
  args: {
    clerkId: v.string(),
    orderId: v.id("printOrders"),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;

    // Verify ownership through book
    const isOwner = await verifyOrderOwnership(ctx, args.orderId, args.clerkId);
    if (!isOwner) {
      return null; // Don't reveal order exists
    }

    // Get associated book
    const book = await ctx.db.get(order.bookId);

    return {
      ...order,
      book,
    };
  },
});

// Get order by book ID
export const getOrderByBook = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("printOrders")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .order("desc")
      .first();

    return order;
  },
});

// Get all orders for admin - should be protected by admin check in future
export const getAllOrders = query({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db
      .query("printOrders")
      .order("desc")
      .collect();

    // Get book details for each order
    const ordersWithBooks = await Promise.all(
      orders.map(async (order) => {
        const book = await ctx.db.get(order.bookId);
        return {
          ...order,
          book,
        };
      })
    );

    return ordersWithBooks;
  },
});

// Get active orders (for status polling) - INTERNAL
export const getActiveOrders = query({
  args: {},
  handler: async (ctx) => {
    // Get orders that are in progress (submitted or in_production)
    const orders = await ctx.db
      .query("printOrders")
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "submitted"),
          q.eq(q.field("status"), "in_production")
        )
      )
      .collect();

    return orders;
  },
});

// Get orders by status
export const getOrdersByStatus = query({
  args: {
    status: v.union(
      v.literal("pending_payment"),
      v.literal("payment_received"),
      v.literal("generating_pdfs"),
      v.literal("submitting_to_lulu"),
      v.literal("submitted"),
      v.literal("in_production"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("printOrders")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();

    return orders;
  },
});
