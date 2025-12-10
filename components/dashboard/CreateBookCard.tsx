"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function CreateBookCard() {
  return (
    <Link href="/books/new">
      <motion.div
        className="h-full min-h-[280px] flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-purple-500/30 bg-slate-800/30 hover:bg-slate-800/50 hover:border-purple-500/60 transition-all cursor-pointer group"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Animated plus icon */}
        <motion.div
          className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center mb-4 group-hover:bg-purple-600/30 transition-colors"
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(147, 51, 234, 0)",
              "0 0 0 8px rgba(147, 51, 234, 0.1)",
              "0 0 0 0 rgba(147, 51, 234, 0)",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <motion.span
            className="text-3xl text-purple-400 group-hover:text-purple-300"
            animate={{ rotate: [0, 90, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            +
          </motion.span>
        </motion.div>

        <h3
          className="text-white font-semibold text-center mb-1"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Start a new adventure
        </h3>
        <p className="text-purple-400/60 text-xs text-center">
          Transform photos into magic
        </p>
      </motion.div>
    </Link>
  );
}
