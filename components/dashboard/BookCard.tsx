"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  const [isDeleting, setIsDeleting] = useState(false);
  const rotationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hoverDelayRef = useRef<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

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

  // Handle delete with confirmation
  const handleDelete = useCallback(async () => {
    if (isDeleting) return;
    
    const confirmed = window.confirm(`Delete "${displayTitle}"? This cannot be undone.`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      setIsDeleting(false);
      console.error("Failed to delete book:", error);
    }
  }, [onDelete, displayTitle, isDeleting]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onEdit();
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      handleDelete();
    }
  }, [onEdit, handleDelete]);

  // Progress status for accessibility
  const progressStatus = book.progress.isComplete 
    ? "Complete"
    : book.progress.generating > 0 
      ? `${book.progress.generating} images processing`
      : `${book.progress.completed} of ${book.progress.total} images ready`;

  return (
    <motion.div
      ref={cardRef}
      className="relative"
      onMouseEnter={() => {
        setIsHovered(true);
        setShowActions(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowActions(false);
      }}
      onFocus={() => setShowActions(true)}
      onBlur={(e) => {
        // Only hide if focus is leaving the card entirely
        if (!cardRef.current?.contains(e.relatedTarget as Node)) {
          setShowActions(false);
        }
      }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      role="article"
      aria-label={`${displayTitle}. ${progressStatus}.`}
    >
      <div 
        className={`bg-slate-800/50 rounded-2xl border backdrop-blur-sm p-4 transition-all ${
          isDeleting 
            ? "opacity-50 pointer-events-none border-red-500/30" 
            : "border-purple-500/20 hover:border-purple-500/40"
        }`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-busy={isDeleting}
      >
        {/* Book Preview */}
        <div className="flex justify-center mb-3" aria-hidden="true">
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
            {book.pageCount} stops
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
          {showActions && !isDeleting && (
            <motion.div
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              role="group"
              aria-label="Book actions"
            >
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={`Edit ${displayTitle}`}
              >
                Edit
              </motion.button>
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview();
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={`Preview ${displayTitle}`}
              >
                Preview
              </motion.button>
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={`Delete ${displayTitle}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Deleting overlay */}
        {isDeleting && (
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-red-300 text-sm">Deleting...</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
