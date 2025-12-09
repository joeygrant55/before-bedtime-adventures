import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new book
export const createBook = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    pageCount: v.number(),
  },
  handler: async (ctx, args) => {
    const bookId = await ctx.db.insert("books", {
      userId: args.userId,
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

// Get all books for a user
export const getUserBooks = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("books")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get a single book with all its pages
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

// Update book title
export const updateBookTitle = mutation({
  args: {
    bookId: v.id("books"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bookId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

// Update book status
export const updateBookStatus = mutation({
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
