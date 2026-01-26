import { NextResponse } from "next/server";
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
  const stripe = getStripe();
  const convex = getConvex();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // Get order ID from metadata
      const orderId = session.metadata?.orderId as Id<"printOrders">;

      if (orderId) {
        try {
          // Update order status to payment_received
          const webhookToken = process.env.CONVEX_WEBHOOK_TOKEN;
          if (!webhookToken) {
            throw new Error("CONVEX_WEBHOOK_TOKEN is not configured");
          }

          await convex.mutation(api.orders.webhookUpdateOrderStatus, {
            webhookToken,
            orderId,
            status: "payment_received",
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent as string | undefined,
          });

          console.log(`✅ Order ${orderId} marked as paid`);

          // Trigger the order processing (PDF generation + Lulu submission)
          // This runs asynchronously - we don't wait for it
          convex.action(api.generatePdf.processOrder, { orderId })
            .then((result) => {
              if (result.success) {
                console.log(`✅ Order ${orderId} processing completed successfully`);
              } else {
                console.error(`❌ Order ${orderId} processing failed:`, result.error);
              }
            })
            .catch((error) => {
              console.error(`❌ Error triggering order processing for ${orderId}:`, error);
            });

        } catch (error) {
          console.error("Failed to update order status:", error);
        }
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId as Id<"printOrders">;

      if (orderId) {
        // Mark order as failed/expired
        try {
          await convex.mutation(api.orders.updateOrderStatus, {
            orderId,
            status: "failed",
          });
          console.log(`⚠️ Checkout session expired for order ${orderId}, marked as failed`);
        } catch (error) {
          console.error(`Failed to update expired order ${orderId}:`, error);
        }
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`❌ Payment failed for intent ${paymentIntent.id}`);
      // Could look up order by payment intent ID and mark as failed
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
