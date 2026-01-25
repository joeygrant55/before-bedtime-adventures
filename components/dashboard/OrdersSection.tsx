"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { motion } from "framer-motion";
import { OrderCardSkeleton } from "@/components/ui/Skeleton";

// Status configuration
const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string; bgColor: string }> = {
  pending_payment: {
    label: "Awaiting Payment",
    icon: "💳",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
  },
  payment_received: {
    label: "Payment Received",
    icon: "✅",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
  },
  generating_pdfs: {
    label: "Creating Book",
    icon: "📄",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
  },
  submitting_to_lulu: {
    label: "Submitting to Printer",
    icon: "📤",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
  },
  submitted: {
    label: "Sent to Printer",
    icon: "🖨️",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
  },
  in_production: {
    label: "Printing",
    icon: "📖",
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/20",
  },
  shipped: {
    label: "Shipped",
    icon: "📦",
    color: "text-teal-400",
    bgColor: "bg-teal-500/20",
  },
  delivered: {
    label: "Delivered",
    icon: "🎉",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
  },
  failed: {
    label: "Issue",
    icon: "⚠️",
    color: "text-red-400",
    bgColor: "bg-red-500/20",
  },
};

export function OrdersSection() {
  const { user } = useUser();
  const orders = useQuery(
    api.orders.getUserOrders,
    user ? { clerkId: user.id } : "skip"
  );

  // Loading state
  if (orders === undefined) {
    return (
      <div className="mb-10" aria-busy="true" aria-label="Loading orders">
        <div className="h-6 w-32 bg-slate-700/50 rounded animate-pulse mb-4" />
        <div className="space-y-4">
          <OrderCardSkeleton />
        </div>
      </div>
    );
  }

  // Don't render if no orders
  if (!orders || orders.length === 0) {
    return null;
  }

  return (
    <motion.section
      className="mb-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      aria-labelledby="orders-heading"
    >
      <h2 
        id="orders-heading" 
        className="text-xl font-bold text-white mb-4 flex items-center gap-2"
      >
        <span aria-hidden="true">📦</span> Your Orders
      </h2>

      <div className="grid gap-4" role="list" aria-label="Order list">
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
              className="group focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-xl"
              role="listitem"
            >
              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10 hover:border-purple-500/50 transition-all hover:bg-white/10">
                <div className="flex items-center gap-4">
                  {/* Book thumbnail */}
                  <div 
                    className="w-12 h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                    aria-hidden="true"
                  >
                    📚
                  </div>

                  {/* Order info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">
                      {order.book?.title || "Your Book"}
                    </h3>
                    <p className="text-purple-400 text-sm">
                      Order #{order._id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-purple-500/60 text-xs">
                      <time dateTime={new Date(order.createdAt).toISOString()}>
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </time>
                    </p>
                  </div>

                  {/* Status badge */}
                  <div 
                    className={`${statusConfig.bgColor} px-3 py-1.5 rounded-full flex items-center gap-1.5`}
                    role="status"
                    aria-label={`Status: ${statusConfig.label}`}
                  >
                    <span className="text-sm" aria-hidden="true">{statusConfig.icon}</span>
                    <span className={`text-sm font-medium ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Tracking link if shipped */}
                  {order.trackingNumber && order.status === "shipped" && (
                    <div className="text-teal-400 text-sm" aria-label="Track shipment">
                      Track →
                    </div>
                  )}
                </div>

                {/* Progress bar for active orders */}
                {["payment_received", "generating_pdfs", "submitting_to_lulu", "submitted", "in_production"].includes(order.status) && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <div 
                        className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden"
                        role="progressbar"
                        aria-valuenow={progressPercent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Order progress: ${progressPercent}%`}
                      >
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                          initial={{ width: "0%" }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <span className="text-purple-400 text-xs" aria-hidden="true">
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
