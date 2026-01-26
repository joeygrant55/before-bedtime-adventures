"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { motion } from "framer-motion";

// Status configuration
const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string; bgColor: string }> = {
  pending_payment: {
    label: "Awaiting Payment",
    icon: "💳",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
  payment_received: {
    label: "Payment Received",
    icon: "✅",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  generating_pdfs: {
    label: "Creating Book",
    icon: "📄",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  submitting_to_lulu: {
    label: "Submitting to Printer",
    icon: "📤",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  submitted: {
    label: "Sent to Printer",
    icon: "🖨️",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  in_production: {
    label: "Printing",
    icon: "📖",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
  },
  shipped: {
    label: "Shipped",
    icon: "📦",
    color: "text-teal-600",
    bgColor: "bg-teal-100",
  },
  delivered: {
    label: "Delivered",
    icon: "🎉",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  failed: {
    label: "Issue",
    icon: "⚠️",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
};

export function OrdersSection() {
  const { user } = useUser();
  
  // Wrap in try-catch via the query
  let orders;
  try {
    orders = useQuery(
      api.orders.getUserOrders,
      user ? { clerkId: user.id } : "skip"
    );
  } catch (error) {
    console.error("Failed to load orders:", error);
    return null; // Silently fail - don't crash the dashboard
  }

  // Loading state - show nothing while loading
  if (orders === undefined) {
    return null;
  }

  // Don't render if no orders
  if (!orders || orders.length === 0) {
    return null;
  }

  return (
    <motion.section
      className="mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span>📦</span> Your Orders
      </h2>

      <div className="space-y-3">
        {orders.map((order) => {
          const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_payment;
          const progressPercent = 
            order.status === "payment_received" ? 20 :
            order.status === "generating_pdfs" ? 40 :
            order.status === "submitting_to_lulu" ? 50 :
            order.status === "submitted" ? 60 :
            order.status === "in_production" ? 80 :
            order.status === "shipped" ? 90 :
            order.status === "delivered" ? 100 : 0;

          return (
            <Link
              key={order._id}
              href={`/orders/${order._id}`}
              className="block"
            >
              <div className="bg-white rounded-xl p-4 border border-gray-200 hover:border-purple-300 transition-all hover:shadow-sm">
                <div className="flex items-center gap-4">
                  {/* Book thumbnail */}
                  <div className="w-12 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                    📚
                  </div>

                  {/* Order info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 font-medium truncate">
                      {order.book?.title || "Your Book"}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Order #{order._id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Status badge */}
                  <div className={`${statusConfig.bgColor} px-3 py-1.5 rounded-full flex items-center gap-1.5`}>
                    <span className="text-sm">{statusConfig.icon}</span>
                    <span className={`text-sm font-medium ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                {/* Progress bar for active orders */}
                {["payment_received", "generating_pdfs", "submitting_to_lulu", "submitted", "in_production"].includes(order.status) && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                          initial={{ width: "0%" }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <span className="text-gray-400 text-xs">
                        {order.status === "payment_received" && "Processing..."}
                        {order.status === "generating_pdfs" && "Creating book..."}
                        {order.status === "submitting_to_lulu" && "Submitting..."}
                        {order.status === "submitted" && "In queue"}
                        {order.status === "in_production" && "Printing..."}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </motion.section>
  );
}
