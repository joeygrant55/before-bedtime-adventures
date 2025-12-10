"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MiniBookPreview } from "@/components/BookPreview/MiniBookPreview";
import { Doc } from "@/convex/_generated/dataModel";

// Demo book data for empty state
const DEMO_BOOK: Doc<"books"> = {
  _id: "demo" as any,
  _creationTime: Date.now(),
  userId: "demo" as any,
  title: "Your Adventure Awaits",
  pageCount: 10,
  status: "draft",
  characterImages: [],
  coverDesign: {
    title: "Your Adventure Awaits",
    subtitle: "A magical journey",
    theme: "purple-magic",
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export function EmptyState() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Auto-rotating demo book */}
      <motion.div
        className="mb-8"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <MiniBookPreview
          book={DEMO_BOOK}
          pages={[]}
          size="large"
          autoRotate={true}
        />
      </motion.div>

      {/* Headline */}
      <h2
        className="text-3xl md:text-4xl font-bold text-white mb-3 text-center"
        style={{ fontFamily: "Georgia, serif" }}
      >
        Your Bookshelf Awaits
      </h2>

      {/* Subtext */}
      <p className="text-purple-300 text-center max-w-md mb-8">
        Transform your vacation photos into beautifully illustrated children&apos;s
        storybooks. Create a magical keepsake your family will treasure forever.
      </p>

      {/* CTA Button */}
      <Link href="/books/new">
        <motion.button
          className="relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-shadow"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur-lg opacity-50"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="relative flex items-center gap-2">
            <span>Create Your First Book</span>
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ✨
            </motion.span>
          </span>
        </motion.button>
      </Link>

      {/* Feature highlights */}
      <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-purple-400/80">
        <div className="flex items-center gap-2">
          <span>🎨</span>
          <span>AI-powered illustrations</span>
        </div>
        <div className="flex items-center gap-2">
          <span>📖</span>
          <span>Professional hardcover</span>
        </div>
        <div className="flex items-center gap-2">
          <span>💝</span>
          <span>Personalized stories</span>
        </div>
      </div>
    </motion.div>
  );
}
