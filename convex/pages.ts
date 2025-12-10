import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get a single page with images and signed URLs
export const getPage = query({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) return null;

    const images = await ctx.db
      .query("images")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .collect();

    // Sort images by order field and add signed URLs
    const imagesWithUrls = await Promise.all(
      images
        .sort((a, b) => a.order - b.order)
        .map(async (image) => {
          const originalUrl = await ctx.storage.getUrl(image.originalImageId);
          const cartoonUrl = image.cartoonImageId
            ? await ctx.storage.getUrl(image.cartoonImageId)
            : null;
          const bakedUrl = image.bakedImageId
            ? await ctx.storage.getUrl(image.bakedImageId)
            : null;
          return { ...image, originalUrl, cartoonUrl, bakedUrl };
        })
    );

    return { ...page, images: imagesWithUrls };
  },
});

// Update page text content
export const updatePageText = mutation({
  args: {
    pageId: v.id("pages"),
    title: v.optional(v.string()),
    storyText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { pageId, ...updates } = args;
    await ctx.db.patch(pageId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Get all pages for a book with signed image URLs
export const getBookPages = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const pages = await ctx.db
      .query("pages")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .order("asc")
      .collect();

    // Get images for each page with signed URLs
    const pagesWithImages = await Promise.all(
      pages.map(async (page) => {
        const images = await ctx.db
          .query("images")
          .withIndex("by_page", (q) => q.eq("pageId", page._id))
          .collect();

        // Sort images by order field and add signed URLs
        const imagesWithUrls = await Promise.all(
          images
            .sort((a, b) => a.order - b.order)
            .map(async (image) => {
              const originalUrl = await ctx.storage.getUrl(image.originalImageId);
              const cartoonUrl = image.cartoonImageId
                ? await ctx.storage.getUrl(image.cartoonImageId)
                : null;
              const bakedUrl = image.bakedImageId
                ? await ctx.storage.getUrl(image.bakedImageId)
                : null;
              return { ...image, originalUrl, cartoonUrl, bakedUrl };
            })
        );

        return { ...page, images: imagesWithUrls };
      })
    );

    return pagesWithImages;
  },
});
