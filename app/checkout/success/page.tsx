"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppHeader } from "@/components/AppHeader";
import { OrderStatusBadge } from "@/components/OrderStatus";
import Link from "next/link";
import { trackCheckoutCompleted, trackFunnelStep } from "@/lib/analytics";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [isLoading, setIsLoading] = useState(true);
  const hasTracked = useRef(false);

  // TODO: Replace with real query when backend is ready
  // const order = useQuery(api.orders.getByStripeSession, { sessionId });

  // Simulate loading for demo
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Track checkout completed (only once per session)
  useEffect(() => {
    if (!isLoading && sessionId && !hasTracked.current) {
      hasTracked.current = true;
      // Track completion with session ID as placeholder for order/book IDs
      // In production, you'd get these from the order query
      trackCheckoutCompleted(sessionId, sessionId, 4999);
      trackFunnelStep("purchase_complete", { sessionId });
    }
  }, [isLoading, sessionId]);

  // Mock order data
  const mockOrder = {
    _id: "mock-order-123",
    status: "payment_received" as const,
    bookTitle: "Our Amazing Disney Adventure",
    price: 4999,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">
            Confirming your payment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader showBackButton backHref="/dashboard" backLabel="Back to My Books" />

      <main className="container mx-auto px-4 py-12 max-w-lg text-center">
        {/* Success Animation */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <span className="text-5xl">🎉</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Order Confirmed!
          </h1>
          <p className="text-gray-600">
            Thank you for your purchase. Your book is on its way!
          </p>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8 text-left">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Order Summary</h2>
            <OrderStatusBadge status={mockOrder.status} compact />
          </div>

          <div className="flex items-center gap-4 py-4 border-t border-gray-100">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📖</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {mockOrder.bookTitle}
              </p>
              <p className="text-sm text-gray-500">Hardcover • 8.5" x 8.5"</p>
            </div>
            <p className="font-bold text-gray-900">
              ${(mockOrder.price / 100).toFixed(2)}
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Subtotal</span>
              <span>${(mockOrder.price / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Shipping</span>
              <span className="text-green-600">Free</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span>
              <span>${(mockOrder.price / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-purple-50 rounded-2xl p-6 mb-8 text-left">
          <h3 className="font-bold text-purple-900 mb-3">What happens next?</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-lg">📧</span>
              <p className="text-purple-800 text-sm">
                You'll receive a confirmation email shortly
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-lg">🖨️</span>
              <p className="text-purple-800 text-sm">
                Your book will be printed within 2-3 business days
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-lg">📦</span>
              <p className="text-purple-800 text-sm">
                Delivery typically takes 5-7 business days after printing
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-lg">📱</span>
              <p className="text-purple-800 text-sm">
                Track your order anytime from your dashboard
              </p>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href={`/orders/${mockOrder._id}`}
            className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 rounded-xl transition-all hover:shadow-lg"
          >
            Track Your Order
          </Link>
          <Link
            href="/dashboard"
            className="block w-full bg-white border-2 border-gray-200 hover:border-purple-300 text-gray-700 font-semibold py-4 rounded-xl transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Session ID for debugging */}
        {sessionId && (
          <p className="mt-8 text-xs text-gray-400">
            Session: {sessionId.slice(0, 20)}...
          </p>
        )}
      </main>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto" />
            <p className="text-gray-600 font-medium">Loading...</p>
          </div>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
