"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export function Skeleton({ className, animate = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-gradient-to-r from-slate-700/50 via-slate-600/50 to-slate-700/50 rounded-lg",
        animate && "animate-pulse",
        className
      )}
      aria-hidden="true"
    />
  );
}

// Book card skeleton for dashboard
export function BookCardSkeleton() {
  return (
    <div className="bg-slate-800/50 rounded-2xl border border-purple-500/20 p-4">
      {/* Book preview placeholder */}
      <div className="flex justify-center mb-3">
        <Skeleton className="w-24 h-32 rounded-lg" />
      </div>
      
      {/* Title placeholder */}
      <div className="text-center space-y-2">
        <Skeleton className="h-4 w-3/4 mx-auto" />
        <Skeleton className="h-3 w-1/2 mx-auto" />
        <Skeleton className="h-2 w-full mt-3" />
      </div>
    </div>
  );
}

// Grid of book card skeletons
export function BookGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <BookCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
}

// Page editor skeleton
export function PageEditorSkeleton() {
  return (
    <div className="space-y-4">
      {/* Page navigator strip skeleton */}
      <div className="bg-slate-800/50 rounded-2xl p-4 border border-purple-500/20">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="w-8 h-8 rounded-lg" />
            ))}
          </div>
          <Skeleton className="w-10 h-10 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-24 mx-auto" />
      </div>

      {/* Page content skeleton */}
      <div className="bg-slate-800/50 rounded-2xl p-4 border border-purple-500/20">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16 mx-auto" />
            <Skeleton className="aspect-square rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-16 mx-auto" />
            <Skeleton className="aspect-square rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Order card skeleton
export function OrderCardSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-16 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
    </div>
  );
}

// Orders section skeleton
export function OrdersSectionSkeleton() {
  return (
    <div className="mb-10 space-y-4">
      <Skeleton className="h-6 w-32" />
      {Array.from({ length: 2 }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Full page loading skeleton
export function FullPageSkeleton({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      {/* Ambient light effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="text-center relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="text-5xl mb-4"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          📚
        </motion.div>
        <p className="text-purple-300">{message}</p>
      </motion.div>
    </div>
  );
}

// Image transformation progress indicator
export function ImageTransformationProgress({ 
  status,
  progress 
}: { 
  status: "pending" | "generating" | "completed" | "failed";
  progress?: number;
}) {
  const statusConfig = {
    pending: { label: "Waiting...", icon: "⏳", color: "text-purple-400" },
    generating: { label: "Creating magic...", icon: "✨", color: "text-blue-400" },
    completed: { label: "Ready!", icon: "✓", color: "text-green-400" },
    failed: { label: "Failed", icon: "✕", color: "text-red-400" },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2" role="status" aria-live="polite">
      {status === "generating" ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"
        />
      ) : (
        <span className={config.color}>{config.icon}</span>
      )}
      <span className={`text-sm ${config.color}`}>{config.label}</span>
      {status === "generating" && progress !== undefined && (
        <span className="text-xs text-purple-400">({Math.round(progress)}%)</span>
      )}
    </div>
  );
}

// Checkout form skeleton
export function CheckoutFormSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/10 space-y-4">
      <Skeleton className="h-6 w-40 mb-6" />
      
      {/* Form fields */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ))}

      {/* Submit button */}
      <Skeleton className="h-14 w-full rounded-xl mt-6" />
    </div>
  );
}

// Inline loading spinner
export function InlineSpinner({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn("w-4 h-4 border-2 border-current border-t-transparent rounded-full", className)}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }}
      role="status"
      aria-label="Loading"
    />
  );
}
