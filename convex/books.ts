import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { verifyBookOwnership, getUserFromClerkId, AuthError } from "./auth";

// Create a new book
export const createBook = mutation({
  args: {
    clerkId: v.string(), // Required for auth
    title: v.string(),
    pageCount: v.number(),
  },
  handler: async (ctx, args) => {
    // Get user from Clerk ID
    const user = await getUserFromClerkId(ctx, args.clerkId);
    if (!user) {
      throw new AuthError("User not found");
    }

    const bookId = await ctx.db.insert("books", {
      userId: user._id,
      title: args.title,
      pageCount: args.pageCount,
      status: "draft",
      characterImages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create empty pages for the book
    for (let i = 1; i <= args.pageCount; i++) {
      await ctx.db.insert("pages", {
        bookId,
        pageNumber: i,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return bookId;
  },
});

// Get all books for a user by Clerk ID
export const getUserBooksByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) return [];

    return await ctx.db
      .query("books")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

// Get a single book with all its pages
// Note: This is a query - we verify ownership at the UI layer
// Books are not sensitive data, but mutations on them are protected
export const getBook = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const book = await ctx.db.get(args.bookId);
    if (!book) return null;

    const pages = await ctx.db
      .query("pages")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .order("asc")
      .collect();

    // Get images for each page
    const pagesWithImages = await Promise.all(
      pages.map(async (page) => {
        const images = await ctx.db
          .query("images")
          .withIndex("by_page", (q) => q.eq("pageId", page._id))
          .collect();
        return { ...page, images };
      })
    );

    return { ...book, pages: pagesWithImages };
  },
});

// Update book title - PROTECTED
export const updateBookTitle = mutation({
  args: {
    clerkId: v.string(),
    bookId: v.id("books"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify ownership
    const isOwner = await verifyBookOwnership(ctx, args.bookId, args.clerkId);
    if (!isOwner) {
      throw new AuthError("You don't have permission to edit this book");
    }

    await ctx.db.patch(args.bookId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

// Update book status - PROTECTED
export const updateBookStatus = mutation({
  args: {
    clerkId: v.string(),
    bookId: v.id("books"),
    status: v.union(
      v.literal("draft"),
      v.literal("generating"),
      v.literal("ready_to_print"),
      v.literal("ordered"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    // Verify ownership
    const isOwner = await verifyBookOwnership(ctx, args.bookId, args.clerkId);
    if (!isOwner) {
      throw new AuthError("You don't have permission to edit this book");
    }

    await ctx.db.patch(args.bookId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

// Get all books for a user with progress data (for dashboard)
export const getUserBooksWithProgress = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) return [];

    const books = await ctx.db
      .query("books")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    // For each book, get pages with images and calculate progress
    return Promise.all(
      books.map(async (book) => {
        const pages = await ctx.db
          .query("pages")
          .withIndex("by_book", (q) => q.eq("bookId", book._id))
          .order("asc")
          .collect();

        const pagesWithImages = await Promise.all(
          pages.map(async (page) => {
            const images = await ctx.db
              .query("images")
              .withIndex("by_page", (q) => q.eq("pageId", page._id))
              .collect();

            const imagesWithUrls = await Promise.all(
              images.sort((a, b) => a.order - b.order).map(async (img) => ({
                ...img,
                originalUrl: await ctx.storage.getUrl(img.originalImageId),
                cartoonUrl: img.cartoonImageId
                  ? await ctx.storage.getUrl(img.cartoonImageId)
                  : null,
              }))
            );

            return { ...page, images: imagesWithUrls };
          })
        );

        // Calculate progress stats
        const allImages = pagesWithImages.flatMap((p) => p.images);
        const totalImages = allImages.length;
        const completedImages = allImages.filter(
          (i) => i.generationStatus === "completed"
        ).length;
        const generatingImages = allImages.filter(
          (i) => i.generationStatus === "generating"
        ).length;

        return {
          ...book,
          pages: pagesWithImages,
          progress: {
            total: totalImages,
            completed: completedImages,
            generating: generatingImages,
            percent: totalImages > 0 ? (completedImages / totalImages) * 100 : 0,
            isComplete: totalImages > 0 && completedImages === totalImages,
          },
        };
      })
    );
  },
});

// Delete a book and all its pages and images - PROTECTED
export const deleteBook = mutation({
  args: {
    clerkId: v.string(),
    bookId: v.id("books"),
  },
  handler: async (ctx, args) => {
    // Verify ownership
    const isOwner = await verifyBookOwnership(ctx, args.bookId, args.clerkId);
    if (!isOwner) {
      throw new AuthError("You don't have permission to delete this book");
    }

    // Get all pages for this book
    const pages = await ctx.db
      .query("pages")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .collect();

    // Delete all images for each page
    for (const page of pages) {
      const images = await ctx.db
        .query("images")
        .withIndex("by_page", (q) => q.eq("pageId", page._id))
        .collect();

      for (const image of images) {
        // Delete storage files
        await ctx.storage.delete(image.originalImageId);
        if (image.cartoonImageId) {
          await ctx.storage.delete(image.cartoonImageId);
        }
        // Delete image record
        await ctx.db.delete(image._id);
      }

      // Delete page
      await ctx.db.delete(page._id);
    }

    // Delete the book
    await ctx.db.delete(args.bookId);
  },
});

// Update cover design - PROTECTED
export const updateCoverDesign = mutation({
  args: {
    clerkId: v.string(),
    bookId: v.id("books"),
    coverDesign: v.object({
      title: v.string(),
      subtitle: v.optional(v.string()),
      authorLine: v.optional(v.string()),
      heroImageId: v.optional(v.id("_storage")),
      theme: v.union(
        v.literal("purple-magic"),
        v.literal("ocean-adventure"),
        v.literal("sunset-wonder"),
        v.literal("forest-dreams")
      ),
      dedication: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    // Verify ownership
    const isOwner = await verifyBookOwnership(ctx, args.bookId, args.clerkId);
    if (!isOwner) {
      throw new AuthError("You don't have permission to edit this book");
    }

    await ctx.db.patch(args.bookId, {
      coverDesign: args.coverDesign,
      updatedAt: Date.now(),
    });
  },
});

// === PRINT-RELATED MUTATIONS ===

// Update print status - PROTECTED
export const updatePrintStatus = mutation({
  args: {
    clerkId: v.string(),
    bookId: v.id("books"),
    printStatus: v.union(
      v.literal("editing"),
      v.literal("ready_for_pdf"),
      v.literal("generating_pdfs"),
      v.literal("pdfs_ready"),
      v.literal("submitted")
    ),
  },
  handler: async (ctx, args) => {
    // Verify ownership
    const isOwner = await verifyBookOwnership(ctx, args.bookId, args.clerkId);
    if (!isOwner) {
      throw new AuthError("You don't have permission to edit this book");
    }

    await ctx.db.patch(args.bookId, {
      printStatus: args.printStatus,
      updatedAt: Date.now(),
    });
  },
});

// Update print PDFs - PROTECTED
export const updatePrintPdf = mutation({
  args: {
    clerkId: v.string(),
    bookId: v.id("books"),
    interiorPdfId: v.optional(v.id("_storage")),
    coverPdfId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    // Verify ownership
    const isOwner = await verifyBookOwnership(ctx, args.bookId, args.clerkId);
    if (!isOwner) {
      throw new AuthError("You don't have permission to edit this book");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.interiorPdfId !== undefined) {
      updates.interiorPdfId = args.interiorPdfId;
    }
    if (args.coverPdfId !== undefined) {
      updates.coverPdfId = args.coverPdfId;
    }

    await ctx.db.patch(args.bookId, updates);
  },
});

// Initialize print format for a book - PROTECTED
export const initializePrintFormat = mutation({
  args: {
    clerkId: v.string(),
    bookId: v.id("books"),
  },
  handler: async (ctx, args) => {
    // Verify ownership
    const isOwner = await verifyBookOwnership(ctx, args.bookId, args.clerkId);
    if (!isOwner) {
      throw new AuthError("You don't have permission to edit this book");
    }

    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Book not found");

    // Calculate printed page count
    const stopCount = book.pageCount;
    const storyPages = stopCount * 2;
    const frontMatter = stopCount <= 9 ? 4 : 2;
    const backMatter = stopCount <= 9 ? 4 : 2;
    const printedPageCount = Math.max(24, frontMatter + storyPages + backMatter);

    await ctx.db.patch(args.bookId, {
      printFormat: "SQUARE_85_HARDCOVER",
      podPackageId: "0850X0850FCPRECW080CW444MXX",
      printedPageCount,
      printStatus: "editing",
      updatedAt: Date.now(),
    });
  },
});

// Check if book is ready for print (all images complete)
export const checkPrintReadiness = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const book = await ctx.db.get(args.bookId);
    if (!book) return { ready: false, reason: "Book not found" };

    // Get all pages
    const pages = await ctx.db
      .query("pages")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .collect();

    // Check if we have at least some pages with images
    let totalImages = 0;
    let completedImages = 0;
    let hasAnyImages = false;

    for (const page of pages) {
      const images = await ctx.db
        .query("images")
        .withIndex("by_page", (q) => q.eq("pageId", page._id))
        .collect();

      for (const image of images) {
        hasAnyImages = true;
        totalImages++;
        if (image.generationStatus === "completed") {
          completedImages++;
        }
      }
    }

    if (!hasAnyImages) {
      return { ready: false, reason: "No images uploaded yet" };
    }

    if (completedImages < totalImages) {
      return {
        ready: false,
        reason: `${completedImages}/${totalImages} images ready`,
        progress: { completed: completedImages, total: totalImages },
      };
    }

    // Check cover design
    if (!book.coverDesign?.title) {
      return { ready: false, reason: "Cover title not set" };
    }

    return {
      ready: true,
      progress: { completed: completedImages, total: totalImages },
    };
  },
});

// =====================================================
// INTERNAL MUTATIONS (for server-to-server calls only)
// These bypass auth checks and should only be called
// from other Convex functions (actions, crons, etc.)
// =====================================================

// Internal: Update print status
export const internalUpdatePrintStatus = internalMutation({
  args: {
    bookId: v.id("books"),
    printStatus: v.union(
      v.literal("editing"),
      v.literal("ready_for_pdf"),
      v.literal("generating_pdfs"),
      v.literal("pdfs_ready"),
      v.literal("submitted")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bookId, {
      printStatus: args.printStatus,
      updatedAt: Date.now(),
    });
  },
});

// Internal: Update print PDFs
export const internalUpdatePrintPdf = internalMutation({
  args: {
    bookId: v.id("books"),
    interiorPdfId: v.optional(v.id("_storage")),
    coverPdfId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.interiorPdfId !== undefined) {
      updates.interiorPdfId = args.interiorPdfId;
    }
    if (args.coverPdfId !== undefined) {
      updates.coverPdfId = args.coverPdfId;
    }

    await ctx.db.patch(args.bookId, updates);
  },
});

// Internal: Update book status
export const internalUpdateBookStatus = internalMutation({
  args: {
    bookId: v.id("books"),
    status: v.union(
      v.literal("draft"),
      v.literal("generating"),
      v.literal("ready_to_print"),
      v.literal("ordered"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bookId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});
