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
    pageCount: v.number(), // Number of "stops" (each stop = 2 printed pages)
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

    // === PRINT FIELDS (NEW) ===
    // Print specifications
    printFormat: v.optional(v.literal("SQUARE_85_HARDCOVER")), // Book format
    podPackageId: v.optional(v.string()), // Lulu POD package ID

    // Print status tracking
    printStatus: v.optional(v.union(
      v.literal("editing"),          // Still working on book
      v.literal("ready_for_pdf"),    // All images complete
      v.literal("generating_pdfs"),  // Creating print files
      v.literal("pdfs_ready"),       // Ready to order
      v.literal("submitted"),        // Sent to Lulu
    )),

    // Generated PDFs stored in Convex
    interiorPdfId: v.optional(v.id("_storage")),
    coverPdfId: v.optional(v.id("_storage")),

    // Calculated printed page count (stops * 2 + front/back matter)
    printedPageCount: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // Pages table - each "page" represents one "stop" on the adventure
  // Each stop = 1 spread = 2 printed pages
  pages: defineTable({
    bookId: v.id("books"),
    pageNumber: v.number(), // Stop number (1-14)
    title: v.optional(v.string()), // Location name (e.g., "Magic Kingdom")
    storyText: v.optional(v.string()), // User-written narrative text

    // === PRINT FIELDS (NEW) ===
    // Layout type for this spread
    spreadType: v.optional(v.union(
      v.literal("single_image"),   // One image fills the spread
      v.literal("two_images"),     // One image per page
      v.literal("image_and_text"), // Image on one page, text on other
    )),

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

    // === PRINT FIELDS (NEW) ===
    // Print-ready image (upscaled to 300 DPI if needed)
    printReadyImageId: v.optional(v.id("_storage")),
    printDimensions: v.optional(v.object({
      width: v.number(),        // Pixels
      height: v.number(),       // Pixels
      originalWidth: v.number(), // Before upscaling
      originalHeight: v.number(),
    })),
    printStatus: v.optional(v.union(
      v.literal("pending"),       // Not checked yet
      v.literal("ready"),         // Good for print
      v.literal("upscaled"),      // Was upscaled for print
      v.literal("too_small"),     // Cannot meet print quality
    )),

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

  // Print orders - tracks Lulu integration
  printOrders: defineTable({
    bookId: v.id("books"),

    // === LULU INTEGRATION (UPDATED) ===
    luluPrintJobId: v.optional(v.string()), // Lulu's print job ID
    luluStatus: v.optional(v.string()),     // Raw status from Lulu API

    // Our status tracking
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

    // PDF URLs for Lulu to fetch
    interiorPdfUrl: v.optional(v.string()),
    coverPdfUrl: v.optional(v.string()),

    // Pricing
    cost: v.number(),  // What we pay Lulu (in cents)
    price: v.number(), // What customer pays (in cents) - $44.99 = 4499

    // Shipping (US only for MVP)
    shippingAddress: v.object({
      name: v.string(),
      street1: v.string(),
      street2: v.optional(v.string()),
      city: v.string(),
      stateCode: v.string(),      // 2-letter state code
      postalCode: v.string(),
      countryCode: v.literal("US"), // US only for MVP
      phoneNumber: v.string(),
    }),
    contactEmail: v.string(),

    // Tracking
    trackingNumber: v.optional(v.string()),
    trackingUrl: v.optional(v.string()),

    // Stripe
    stripeSessionId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    paidAt: v.optional(v.number()),
    submittedAt: v.optional(v.number()),
    shippedAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
  })
    .index("by_book", ["bookId"])
    .index("by_status", ["status"])
    .index("by_lulu_job", ["luluPrintJobId"]),
});
