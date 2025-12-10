import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Upload an image for a page
export const createImage = mutation({
  args: {
    pageId: v.id("pages"),
    originalImageId: v.id("_storage"),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const imageId = await ctx.db.insert("images", {
      pageId: args.pageId,
      originalImageId: args.originalImageId,
      generationStatus: "pending",
      order: args.order,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return imageId;
  },
});

// Get all images for a page
export const getPageImages = query({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("images")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .collect();
  },
});

// Get a single image by ID
export const getImage = query({
  args: { imageId: v.id("images") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.imageId);
  },
});

// Update image generation status
export const updateImageStatus = mutation({
  args: {
    imageId: v.id("images"),
    status: v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed")
    ),
    cartoonImageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.imageId, {
      generationStatus: args.status,
      cartoonImageId: args.cartoonImageId,
      updatedAt: Date.now(),
    });
  },
});

// Delete an image
export const deleteImage = mutation({
  args: { imageId: v.id("images") },
  handler: async (ctx, args) => {
    const image = await ctx.db.get(args.imageId);
    if (!image) return;

    // Delete from storage (with error handling)
    try {
      await ctx.storage.delete(image.originalImageId);
    } catch (error) {
      console.log("Could not delete original image from storage:", error);
    }

    // Only delete cartoon if it's different from original
    if (image.cartoonImageId && image.cartoonImageId !== image.originalImageId) {
      try {
        await ctx.storage.delete(image.cartoonImageId);
      } catch (error) {
        console.log("Could not delete cartoon image from storage:", error);
      }
    }

    // Delete from database
    await ctx.db.delete(args.imageId);
  },
});

// Generate upload URL for image
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Update crop settings for an image (for square aspect ratio)
export const updateCropSettings = mutation({
  args: {
    imageId: v.id("images"),
    cropSettings: v.object({
      scale: v.number(),
      offsetX: v.number(),
      offsetY: v.number(),
      originalWidth: v.number(),
      originalHeight: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.imageId, {
      cropSettings: args.cropSettings,
      updatedAt: Date.now(),
    });
  },
});
