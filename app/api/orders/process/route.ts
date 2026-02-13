import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

/**
 * Manual order processing endpoint (authenticated)
 * 
 * POST /api/orders/process
 * Body: { orderId: string }
 * 
 * This endpoint is useful for:
 * - Retrying failed orders
 * - Admin operations
 */

function getConvex() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(url);
}

export async function POST(request: Request) {
  try {
    // Require authentication
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing orderId" },
        { status: 400 }
      );
    }

    const convex = getConvex();

    // Trigger the order processing
    const result = await convex.action(api.generatePdf.processOrder, {
      orderId: orderId as Id<"printOrders">,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Order processing completed",
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing order:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
