"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MiniBookPreview } from "@/components/BookPreview/MiniBookPreview";
import { ProgressIndicator } from "./ProgressIndicator";
import { Doc } from "@/convex/_generated/dataModel";

type ImageWithUrls = Doc<"images"> & {
  originalUrl: string | null;
  cartoonUrl: string | null;
};

type PageWithImages = Doc<"pages"> & {
  images: ImageWithUrls[];
};

type BookWithProgress = Doc<"books"> & {
  pages: PageWithImages[];
  progress: {
    total: number;
    completed: number;
    generating: number;
    percent: number;
    isComplete: boolean;
  };
};

type BookView = "front" | "spine" | "back";

interface BookCardProps {
  book: BookWithProgress;
  onEdit: () => void;
  onPreview: () => void;
  onDelete: () => void;
}

export function BookCard({ book, onEdit, onPreview, onDelete }: BookCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [currentView, setCurrentView] = useState<BookView>("front");
  const rotationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hoverDelayRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-rotate views on hover after delay
  useEffect(() => {
    if (isHovered) {
      // Start rotation after 0.5s delay
      hoverDelayRef.current = setTimeout(() => {
        const views: BookView[] = ["front", "spine", "back"];
        let index = 0;

        rotationTimerRef.current = setInterval(() => {
          index = (index + 1) % views.length;
          setCurrentView(views[index]);
        }, 2000);
      }, 500);
    } else {
      // Clear timers and reset to front
      if (hoverDelayRef.current) clearTimeout(hoverDelayRef.current);
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
      setCurrentView("front");
    }

    return () => {
      if (hoverDelayRef.current) clearTimeout(hoverDelayRef.current);
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
    };
  }, [isHovered]);

  const displayTitle = book.coverDesign?.title || book.title;

  return (
    <motion.div
      className="relative"
      onMouseEnter={() => {
        setIsHovered(true);
        setShowActions(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowActions(false);
      }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="bg-slate-800/50 rounded-2xl border border-purple-500/20 backdrop-blur-sm p-4 hover:border-purple-500/40 transition-colors">
        {/* Book Preview */}
        <div className="flex justify-center mb-3">
          <MiniBookPreview
            book={book}
            pages={book.pages}
            size="small"
            currentView={currentView}
            onViewChange={setCurrentView}
          />
        </div>

        {/* Book Info */}
        <div className="text-center">
          <h3
            className="text-white font-semibold text-sm truncate px-1"
            style={{ fontFamily: "Georgia, serif" }}
            title={displayTitle}
          >
            {displayTitle}
          </h3>
          <p className="text-purple-400/60 text-xs mt-0.5">
            {book.pageCount} pages
          </p>

          {/* Progress */}
          <ProgressIndicator
            total={book.progress.total}
            completed={book.progress.completed}
            generating={book.progress.generating}
            isComplete={book.progress.isComplete}
          />
        </div>

        {/* Quick Actions Overlay */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Edit
              </motion.button>
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview();
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Preview
              </motion.button>
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Delete this book? This cannot be undone.")) {
                    onDelete();
                  }
                }}
                className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Delete book"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
