import { v } from "convex/values";
import { mutation, query, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Delete old baked image from storage before clearing/replacing bakedImageId.
 * Prevents storage leaks from accumulating orphaned PNGs.
 */
async function cleanupBakedImage(ctx: MutationCtx, imageId: Id<"images">) {
  const image = await ctx.db.get(imageId);
  if (image?.bakedImageId) {
    await ctx.storage.delete(image.bakedImageId);
  }
}

// Types for text overlay
const overlayTypeValidator = v.union(
  v.literal("title"),
  v.literal("story"),
  v.literal("custom")
);

const fontFamilyValidator = v.union(
  v.literal("storybook"),
  v.literal("adventure"),
  v.literal("playful"),
  v.literal("classic")
);

const fontSizeValidator = v.union(
  v.literal("small"),
  v.literal("medium"),
  v.literal("large"),
  v.literal("title")
);

const textAlignValidator = v.union(
  v.literal("left"),
  v.literal("center"),
  v.literal("right")
);

const positionValidator = v.object({
  x: v.number(),
  y: v.number(),
  width: v.number(),
});

const styleValidator = v.object({
  fontFamily: fontFamilyValidator,
  fontSize: fontSizeValidator,
  color: v.string(),
  textAlign: textAlignValidator,
  hasBackground: v.optional(v.boolean()),
  hasShadow: v.optional(v.boolean()),
});

// Get all overlays for an image
export const getImageOverlays = query({
  args: { imageId: v.id("images") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("textOverlays")
      .withIndex("by_image", (q) => q.eq("imageId", args.imageId))
      .order("asc")
      .collect();
  },
});

// Get all overlays for a page (via images)
export const getPageOverlays = query({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    // Get all images for this page
    const images = await ctx.db
      .query("images")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .collect();

    // Get overlays for each image
    const overlaysByImage: Record<string, any[]> = {};
    for (const image of images) {
      const overlays = await ctx.db
        .query("textOverlays")
        .withIndex("by_image", (q) => q.eq("imageId", image._id))
        .order("asc")
        .collect();
      overlaysByImage[image._id] = overlays;
    }

    return overlaysByImage;
  },
});

// Create a new text overlay
export const create = mutation({
  args: {
    imageId: v.id("images"),
    content: v.string(),
    overlayType: overlayTypeValidator,
    position: positionValidator,
    style: styleValidator,
  },
  handler: async (ctx, args) => {
    // Get current max zIndex for this image
    const existingOverlays = await ctx.db
      .query("textOverlays")
      .withIndex("by_image", (q) => q.eq("imageId", args.imageId))
      .collect();

    const maxZIndex = existingOverlays.reduce(
      (max, overlay) => Math.max(max, overlay.zIndex),
      0
    );

    const now = Date.now();

    const overlayId = await ctx.db.insert("textOverlays", {
      imageId: args.imageId,
      content: args.content,
      overlayType: args.overlayType,
      position: args.position,
      style: args.style,
      zIndex: maxZIndex + 1,
      createdAt: now,
      updatedAt: now,
    });

    // Mark image as needing re-bake (clear baked image)
    await cleanupBakedImage(ctx, args.imageId);
    await ctx.db.patch(args.imageId, {
      bakingStatus: undefined,
      bakedImageId: undefined,
      updatedAt: now,
    });

    return overlayId;
  },
});

// Update an existing overlay
export const update = mutation({
  args: {
    overlayId: v.id("textOverlays"),
    content: v.optional(v.string()),
    position: v.optional(positionValidator),
    style: v.optional(styleValidator),
    zIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { overlayId, ...updates } = args;

    const overlay = await ctx.db.get(overlayId);
    if (!overlay) {
      throw new Error("Overlay not found");
    }

    const now = Date.now();

    // Apply updates
    const patch: any = { updatedAt: now };
    if (updates.content !== undefined) patch.content = updates.content;
    if (updates.position !== undefined) patch.position = updates.position;
    if (updates.style !== undefined) patch.style = updates.style;
    if (updates.zIndex !== undefined) patch.zIndex = updates.zIndex;

    await ctx.db.patch(overlayId, patch);

    await cleanupBakedImage(ctx, overlay.imageId);
    // Mark image as needing re-bake
    await ctx.db.patch(overlay.imageId, {
      bakingStatus: undefined,
      bakedImageId: undefined,
      updatedAt: now,
    });

    return overlayId;
  },
});

// Delete an overlay
export const remove = mutation({
  args: { overlayId: v.id("textOverlays") },
  handler: async (ctx, args) => {
    const overlay = await ctx.db.get(args.overlayId);
    if (!overlay) {
      throw new Error("Overlay not found");
    }

    await ctx.db.delete(args.overlayId);

    // Mark image as needing re-bake
    await cleanupBakedImage(ctx, overlay.imageId);
    const now = Date.now();
    await ctx.db.patch(overlay.imageId, {
      bakingStatus: undefined,
      bakedImageId: undefined,
      updatedAt: now,
    });
  },
});

// Delete all overlays for an image
export const removeAllForImage = mutation({
  args: { imageId: v.id("images") },
  handler: async (ctx, args) => {
    const overlays = await ctx.db
      .query("textOverlays")
      .withIndex("by_image", (q) => q.eq("imageId", args.imageId))
      .collect();

    for (const overlay of overlays) {
      await ctx.db.delete(overlay._id);
    }

    // Mark image as needing re-bake
    const now = Date.now();
    await cleanupBakedImage(ctx, args.imageId);
    await ctx.db.patch(args.imageId, {
      bakingStatus: undefined,
      bakedImageId: undefined,
      updatedAt: now,
    });

    return overlays.length;
  },
});

// Create a quick preset overlay
export const createPreset = mutation({
  args: {
    imageId: v.id("images"),
    preset: v.union(
      v.literal("title-top"),
      v.literal("title-bottom"),
      v.literal("story-bottom")
    ),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Define presets with print-safe margins
    // Using ~3% margin from edges (0.25" on 8.5" = ~2.94%)
    const MARGIN = 3;

    const presets: Record<string, {
      position: { x: number; y: number; width: number };
      style: {
        fontFamily: "storybook" | "adventure" | "playful" | "classic";
        fontSize: "small" | "medium" | "large" | "title";
        color: string;
        textAlign: "left" | "center" | "right";
        hasBackground: boolean;
        hasShadow: boolean;
      };
      overlayType: "title" | "story" | "custom";
    }> = {
      "title-top": {
        position: { x: 50, y: MARGIN + 5, width: 100 - (MARGIN * 2) },
        style: {
          fontFamily: "storybook",
          fontSize: "title",
          color: "#FFFFFF",
          textAlign: "center",
          hasBackground: false,
          hasShadow: true,
        },
        overlayType: "title",
      },
      "title-bottom": {
        position: { x: 50, y: 85, width: 100 - (MARGIN * 2) },
        style: {
          fontFamily: "storybook",
          fontSize: "large",
          color: "#FFFFFF",
          textAlign: "center",
          hasBackground: true,
          hasShadow: true,
        },
        overlayType: "title",
      },
      "story-bottom": {
        position: { x: 50, y: 80, width: 100 - (MARGIN * 2) },
        style: {
          fontFamily: "classic",
          fontSize: "medium",
          color: "#1F2937",
          textAlign: "center",
          hasBackground: true,
          hasShadow: false,
        },
        overlayType: "story",
      },
    };

    const presetConfig = presets[args.preset];
    if (!presetConfig) {
      throw new Error("Unknown preset");
    }

    // Get current max zIndex
    const existingOverlays = await ctx.db
      .query("textOverlays")
      .withIndex("by_image", (q) => q.eq("imageId", args.imageId))
      .collect();

    const maxZIndex = existingOverlays.reduce(
      (max, overlay) => Math.max(max, overlay.zIndex),
      0
    );

    const now = Date.now();

    const overlayId = await ctx.db.insert("textOverlays", {
      imageId: args.imageId,
      content: args.content,
      overlayType: presetConfig.overlayType,
      position: presetConfig.position,
      style: presetConfig.style,
      zIndex: maxZIndex + 1,
      createdAt: now,
      updatedAt: now,
    });

    await cleanupBakedImage(ctx, args.imageId);
    // Mark image as needing re-bake
    await ctx.db.patch(args.imageId, {
      bakingStatus: undefined,
      bakedImageId: undefined,
      updatedAt: now,
    });

    return overlayId;
  },
});

// Update baking status on an image
export const updateBakingStatus = mutation({
  args: {
    imageId: v.id("images"),
    status: v.union(
      v.literal("pending"),
      v.literal("baking"),
      v.literal("completed"),
      v.literal("failed")
    ),
    bakedImageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const patch: any = {
      bakingStatus: args.status,
      updatedAt: now,
    };

    if (args.bakedImageId) {
      // Delete the old baked image from storage to prevent leaks
      await cleanupBakedImage(ctx, args.imageId);
      patch.bakedImageId = args.bakedImageId;
      patch.lastBakedAt = now;
    }

    await ctx.db.patch(args.imageId, patch);
  },
});

// Create or update story overlay for an image (used by AI story generator)
export const createOrUpdateStoryOverlay = mutation({
  args: {
    imageId: v.id("images"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if this image already has overlays
    const existingOverlays = await ctx.db
      .query("textOverlays")
      .withIndex("by_image", (q) => q.eq("imageId", args.imageId))
      .collect();

    const now = Date.now();
    const MARGIN = 3;

    // Find a story overlay or any overlay to update
    const storyOverlay = existingOverlays.find((o) => o.overlayType === "story");
    const anyOverlay = existingOverlays[0];

    if (storyOverlay || anyOverlay) {
      // Update existing overlay
      const overlayToUpdate = storyOverlay || anyOverlay;
      await ctx.db.patch(overlayToUpdate._id, {
        content: args.content,
        updatedAt: now,
      });

      // Mark image as needing re-bake
      await cleanupBakedImage(ctx, args.imageId);
      await ctx.db.patch(args.imageId, {
        bakingStatus: undefined,
        bakedImageId: undefined,
        updatedAt: now,
      });

      return overlayToUpdate._id;
    } else {
      // Create new story overlay at the bottom
      const maxZIndex = 0;

      const overlayId = await ctx.db.insert("textOverlays", {
        imageId: args.imageId,
        content: args.content,
        overlayType: "story",
        position: { x: 50, y: 85, width: 100 - (MARGIN * 2) },
        style: {
          fontFamily: "classic",
          fontSize: "small",
          color: "#1F2937",
          textAlign: "center",
          hasBackground: true,
          hasShadow: false,
        },
        zIndex: maxZIndex + 1,
        createdAt: now,
        updatedAt: now,
      });

      // Mark image as needing re-bake
      await cleanupBakedImage(ctx, args.imageId);
      await ctx.db.patch(args.imageId, {
        bakingStatus: undefined,
        bakedImageId: undefined,
        updatedAt: now,
      });

      return overlayId;
    }
  },
});
