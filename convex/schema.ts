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
    // Cover customization options
    coverDesign: v.optional(v.object({
      title: v.string(),
      subtitle: v.optional(v.string()),
      authorLine: v.optional(v.string()),
      heroImageId: v.optional(v.id("_storage")),
      spineImageId: v.optional(v.id("_storage")), // Small thumbnail for spine
      theme: v.union(
        v.literal("purple-magic"),
        v.literal("ocean-adventure"),
        v.literal("sunset-wonder"),
        v.literal("forest-dreams")
      ),
      dedication: v.optional(v.string()),
    })),
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
    // Text overlay baking fields
    bakedImageId: v.optional(v.id("_storage")), // Cartoon with baked text overlays
    bakingStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("baking"),
      v.literal("completed"),
      v.literal("failed")
    )),
    lastBakedAt: v.optional(v.number()),
    // Crop settings for square format (1:1 aspect ratio for print)
    cropSettings: v.optional(v.object({
      scale: v.number(),         // 1.0 = fit, >1 = zoom in
      offsetX: v.number(),       // -50 to 50 (percentage pan)
      offsetY: v.number(),       // -50 to 50 (percentage pan)
      originalWidth: v.number(), // Original image dimensions
      originalHeight: v.number(),
    })),
    order: v.number(), // For 1-3 images per page ordering
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_page", ["pageId"])
    .index("by_status", ["generationStatus"]),

  // Text overlays for images - user-positioned text boxes
  textOverlays: defineTable({
    imageId: v.id("images"),
    content: v.string(),
    overlayType: v.union(
      v.literal("title"),
      v.literal("story"),
      v.literal("custom")
    ),
    position: v.object({
      x: v.number(),        // Percentage from left (0-100)
      y: v.number(),        // Percentage from top (0-100)
      width: v.number(),    // Width as percentage of image
    }),
    style: v.object({
      fontFamily: v.union(
        v.literal("storybook"),
        v.literal("adventure"),
        v.literal("playful"),
        v.literal("classic")
      ),
      fontSize: v.union(
        v.literal("small"),
        v.literal("medium"),
        v.literal("large"),
        v.literal("title")
      ),
      color: v.string(),
      textAlign: v.union(
        v.literal("left"),
        v.literal("center"),
        v.literal("right")
      ),
      hasBackground: v.optional(v.boolean()),
      hasShadow: v.optional(v.boolean()),
    }),
    zIndex: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_image", ["imageId"]),

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
