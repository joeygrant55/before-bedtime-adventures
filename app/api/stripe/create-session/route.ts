import { NextResponse } from "next/server";
import Stripe from "stripe";

// Lazy initialization of Stripe
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(key);
}

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const body = await request.json();
    const { bookId, orderId, bookTitle, price } = body;

    if (!bookId || !orderId || !bookTitle || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
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
