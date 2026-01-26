import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Lazy initialization of Stripe
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(key);
}

// Lazy initialization of Convex
function getConvex() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(url);
}

export async function POST(request: Request) {
  try {
    // Verify user is authenticated
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const stripe = getStripe();
    const convex = getConvex();
    const body = await request.json();
    const { bookId, orderId, bookTitle, price } = body;

    if (!bookId || !orderId || !bookTitle || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify user owns the order
    const order = await convex.query(api.orders.getOrderSecure, {
      clerkId,
      orderId: orderId as Id<"printOrders">,
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or unauthorized" },
        { status: 403 }
      );
    }

    // Verify the orderId matches the bookId
    if (order.bookId !== bookId) {
      return NextResponse.json(
        { error: "Invalid order" },
        { status: 400 }
      );
    }

    // Get the base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: bookTitle,
              description: "Premium hardcover children's storybook with Disney-style illustrations",
              images: [], // Add product image URL if available
            },
            unit_amount: price, // Price in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/orders/${orderId}?success=true`,
      cancel_url: `${baseUrl}/books/${bookId}/checkout?canceled=true`,
      metadata: {
        bookId,
        orderId,
        clerkId, // Track who made the purchase
      },
      // Enable automatic tax calculation if configured
      // automatic_tax: { enabled: true },

      // Allow promotion codes
      allow_promotion_codes: true,

      // Billing address collection
      billing_address_collection: "auto",
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe session creation error:", error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
