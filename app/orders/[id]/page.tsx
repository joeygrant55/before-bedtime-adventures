"use client";

import { use, useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";

const statusSteps = [
  { key: "payment_received", label: "Payment Confirmed", icon: "💳" },
  { key: "generating_pdf", label: "Creating Your Book", icon: "🎨" },
  { key: "submitted_to_lulu", label: "Sent to Printer", icon: "🖨️" },
  { key: "printing", label: "Printing", icon: "📖" },
  { key: "shipped", label: "Shipped", icon: "📦" },
  { key: "delivered", label: "Delivered", icon: "🎉" },
];

const statusIndex = (status: string): number => {
  if (status === "pending_payment") return -1;
  const index = statusSteps.findIndex((s) => s.key === status);
  return index >= 0 ? index : 0;
};

export default function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const orderId = id as Id<"printOrders">;
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";

  const [showConfetti, setShowConfetti] = useState(isSuccess);

  const order = useQuery(api.orders.getOrder, { orderId });

  // Hide confetti after animation
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full" />
            <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="text-purple-300">Loading order...</p>
        </div>
      </div>
    );
  }

  const currentStep = statusIndex(order.status);
  const isPending = order.status === "pending_payment";
  const isFailed = order.status === "failed";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                backgroundColor: ["#fbbf24", "#a855f7", "#3b82f6", "#22c55e", "#f43f5e"][i % 5],
                left: `${Math.random() * 100}%`,
              }}
              initial={{ y: -20, opacity: 1 }}
              animate={{
                y: "100vh",
                opacity: 0,
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 0.5,
                ease: "easeIn",
              }}
            />
          ))}
        </div>
      )}

      {/* Ambient effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
        {/* Success Header */}
        {isSuccess && !isPending && !isFailed && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="text-center mb-12"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Order Confirmed!
            </h1>
            <p className="text-purple-300 text-lg">
              Thank you for your order. Your magical storybook is on its way!
            </p>
          </motion.div>
        )}

        {/* Regular Header (non-success view) */}
        {!isSuccess && !isPending && !isFailed && (
          <div className="text-center mb-12">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Order Status
            </h1>
            <p className="text-purple-300">
              Track your book's journey to your doorstep
            </p>
          </div>
        )}

        {/* Pending Payment Warning */}
        {isPending && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 mb-8 text-center"
          >
            <div className="text-4xl mb-4">⏳</div>
            <h2 className="text-xl font-bold text-amber-200 mb-2">
              Payment Pending
            </h2>
            <p className="text-amber-300/80 mb-4">
              Your order is waiting for payment to be processed.
            </p>
            <Link
              href={`/books/${order.bookId}/checkout`}
              className="inline-block bg-amber-500 hover:bg-amber-400 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Complete Payment
            </Link>
          </motion.div>
        )}

        {/* Failed Order */}
        {isFailed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-8 text-center"
          >
            <div className="text-4xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-red-200 mb-2">
              Order Issue
            </h2>
            <p className="text-red-300/80 mb-4">
              There was an issue with your order. Please contact support.
            </p>
            <a
              href="mailto:support@beforebedtimeadventures.com"
              className="inline-block bg-red-500 hover:bg-red-400 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Contact Support
            </a>
          </motion.div>
        )}

        {/* Order Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/10 mb-8"
        >
          {/* Book Info */}
          <div className="flex items-start gap-4 mb-8 pb-6 border-b border-white/10">
            <div className="w-16 h-20 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
              📚
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">
                {order.book?.title || "Your Storybook"}
              </h3>
              <p className="text-purple-300 text-sm">
                Premium Hardcover · 8.5" × 8.5"
              </p>
              <p className="text-purple-400 text-sm mt-1">
                Order #{order._id.slice(-8).toUpperCase()}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-white font-bold text-lg">
                ${(order.price / 100).toFixed(2)}
              </p>
              <p className="text-purple-400 text-xs">Paid</p>
            </div>
          </div>

          {/* Progress Steps */}
          {!isPending && !isFailed && (
            <div className="space-y-4">
              <h4 className="text-white font-medium mb-4">Order Progress</h4>
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-white/10" />
                <div
                  className="absolute left-5 top-0 w-0.5 bg-gradient-to-b from-green-500 to-purple-500 transition-all duration-500"
                  style={{
                    height: `${((currentStep + 1) / statusSteps.length) * 100}%`,
                  }}
                />

                {/* Steps */}
                <div className="space-y-6">
                  {statusSteps.map((step, index) => {
                    const isCompleted = index <= currentStep;
                    const isCurrent = index === currentStep;

                    return (
                      <div key={step.key} className="flex items-center gap-4 relative">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg z-10 transition-all ${
                            isCompleted
                              ? "bg-gradient-to-br from-green-500 to-purple-500 shadow-lg shadow-purple-500/25"
                              : "bg-white/10"
                          } ${isCurrent ? "ring-4 ring-purple-500/30" : ""}`}
                        >
                          {step.icon}
                        </div>
                        <div>
                          <p
                            className={`font-medium ${
                              isCompleted ? "text-white" : "text-purple-400"
                            }`}
                          >
                            {step.label}
                          </p>
                          {isCurrent && (
                            <p className="text-purple-300 text-sm">
                              {step.key === "payment_received" && "We've received your payment!"}
                              {step.key === "generating_pdf" && "Creating your print-ready book..."}
                              {step.key === "submitted_to_lulu" && "Your book has been sent to our printing partner"}
                              {step.key === "printing" && "Your book is being printed with care"}
                              {step.key === "shipped" && "Your book is on its way!"}
                              {step.key === "delivered" && "Enjoy your magical storybook!"}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Shipping Info */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <h4 className="text-white font-medium mb-3">Shipping To</h4>
            <div className="text-purple-300 text-sm space-y-1">
              <p className="font-medium text-purple-200">{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.street}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.zipCode}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>

          {/* Tracking Number */}
          {order.luluOrderId && (
            <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <p className="text-purple-200 text-sm font-medium">Tracking Number</p>
              <p className="text-white font-mono">{order.luluOrderId}</p>
            </div>
          )}
        </motion.div>

        {/* Estimated Delivery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl">📅</span>
            <div>
              <p className="text-amber-200 font-semibold">Estimated Delivery</p>
              <p className="text-amber-300/80">
                {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors text-center"
          >
            Back to Dashboard
          </Link>
          {order.book && (
            <Link
              href={`/books/${order.bookId}/preview`}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors text-center"
            >
              View Your Book
            </Link>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-12 text-center text-purple-400 text-sm">
          <p>
            Questions about your order?{" "}
            <a href="mailto:support@beforebedtimeadventures.com" className="text-purple-300 hover:text-white underline">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
