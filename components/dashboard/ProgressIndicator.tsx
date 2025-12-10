"use client";

import { motion } from "framer-motion";

interface ProgressIndicatorProps {
  total: number;
  completed: number;
  generating: number;
  isComplete: boolean;
}

export function ProgressIndicator({
  total,
  completed,
  generating,
  isComplete,
}: ProgressIndicatorProps) {
  const percent = total > 0 ? (completed / total) * 100 : 0;

  // No images uploaded yet
  if (total === 0) {
    return (
      <div className="mt-2">
        <p className="text-purple-400/60 text-xs">Upload photos to start</p>
      </div>
    );
  }

  // All complete
  if (isComplete) {
    return (
      <div className="mt-2">
        <div className="h-1.5 bg-purple-500/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
          <span>Ready to order!</span>
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ✨
          </motion.span>
        </p>
      </div>
    );
  }

  // In progress
  return (
    <div className="mt-2">
      <div className="h-1.5 bg-purple-500/30 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full relative"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Animated shimmer for generating state */}
          {generating > 0 && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          )}
        </motion.div>
      </div>
      <p className="text-purple-300 text-xs mt-1">
        {generating > 0 ? (
          <span className="flex items-center gap-1">
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Creating magic...
            </motion.span>
            <span className="text-purple-400/60">
              ({completed}/{total})
            </span>
          </span>
        ) : (
          <span>
            {completed}/{total} images ready
          </span>
        )}
      </p>
    </div>
  );
}
