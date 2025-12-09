import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  books: defineTable({
    userId: v.id("users"),
    title: v.string(),
    pageCount: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("generating"),
      v.literal("ready_to_print"),
      v.literal("ordered"),
      v.literal("completed")
    ),
    // Array of storage IDs for character reference images
    characterImages: v.array(v.id("_storage")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  pages: defineTable({
    bookId: v.id("books"),
    pageNumber: v.number(),
    title: v.optional(v.string()), // Stop/location name
    storyText: v.optional(v.string()), // User-written text
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_book", ["bookId"])
    .index("by_book_and_page", ["bookId", "pageNumber"]),

  images: defineTable({
    pageId: v.id("pages"),
    originalImageId: v.id("_storage"), // Original vacation photo in Convex storage
    cartoonImageId: v.optional(v.id("_storage")), // Generated cartoon in Convex storage
    generationStatus: v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed")
    ),
    order: v.number(), // For 1-3 images per page ordering
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_page", ["pageId"])
    .index("by_status", ["generationStatus"]),

  printOrders: defineTable({
    bookId: v.id("books"),
    luluOrderId: v.optional(v.string()),
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
    pdfStorageId: v.optional(v.id("_storage")), // Print-ready PDF in Convex storage
    cost: v.number(), // In cents
    price: v.number(), // In cents
    shippingAddress: v.object({
      name: v.string(),
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_book", ["bookId"])
    .index("by_status", ["status"]),
});
