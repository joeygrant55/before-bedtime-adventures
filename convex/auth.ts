import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Auth helper functions for Convex
 * These verify that a user owns resources before allowing mutations
 */

// Get internal user ID from Clerk ID
export async function getUserFromClerkId(
  ctx: QueryCtx | MutationCtx,
  clerkId: string
) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
    .first();

  return user;
}

// Verify user owns a book
export async function verifyBookOwnership(
  ctx: QueryCtx | MutationCtx,
  bookId: Id<"books">,
  clerkId: string
): Promise<boolean> {
  const book = await ctx.db.get(bookId);
  if (!book) return false;

  const user = await getUserFromClerkId(ctx, clerkId);
  if (!user) return false;

  return book.userId === user._id;
}

// Verify user owns an order (through book ownership)
export async function verifyOrderOwnership(
  ctx: QueryCtx | MutationCtx,
  orderId: Id<"printOrders">,
  clerkId: string
): Promise<boolean> {
  const order = await ctx.db.get(orderId);
  if (!order) return false;

  return verifyBookOwnership(ctx, order.bookId, clerkId);
}

// Auth error for consistent error messages
export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}
