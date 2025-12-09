import { NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: Request) {
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
          await convex.mutation(api.orders.updateOrderStatus, {
            orderId,
            status: "payment_received",
            stripeSessionId: session.id,
          });

          console.log(`✅ Order ${orderId} marked as paid`);
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
        // Could mark order as expired/failed if needed
        console.log(`⚠️ Checkout session expired for order ${orderId}`);
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
