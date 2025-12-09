import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new order
export const createOrder = mutation({
  args: {
    bookId: v.id("books"),
    shippingAddress: v.object({
      name: v.string(),
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
    }),
    price: v.number(), // In cents
  },
  handler: async (ctx, args) => {
    // Estimated cost (will be updated with actual Lulu pricing)
    const estimatedCost = 1500; // $15.00 in cents

    const orderId = await ctx.db.insert("printOrders", {
      bookId: args.bookId,
      status: "pending_payment",
      cost: estimatedCost,
      price: args.price,
      shippingAddress: args.shippingAddress,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return orderId;
  },
});

// Update order status after successful payment
export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("printOrders"),
    status: v.union(
      v.literal("pending_payment"),
      v.literal("payment_received"),
      v.literal("generating_pdf"),
      v.literal("submitted_to_lulu"),
      v.literal("printing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("failed")
    ),
    stripeSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, {
      status: args.status,
      updatedAt: Date.now(),
    });

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

// Get order by ID
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

// Get order by book ID
export const getOrderByBook = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("printOrders")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .order("desc")
      .first();

    return orders;
  },
});

// Get all orders for admin
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

// Update tracking information
export const updateTracking = mutation({
  args: {
    orderId: v.id("printOrders"),
    luluOrderId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, {
      luluOrderId: args.luluOrderId,
      status: "submitted_to_lulu",
      updatedAt: Date.now(),
    });
  },
});
