"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface EmptyStateBaseProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyStateBase({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = "",
}: EmptyStateBaseProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      <motion.div
        className="text-5xl mb-4"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {icon}
      </motion.div>
      
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-purple-300/80 max-w-md mb-6">{description}</p>

      <div className="flex flex-wrap gap-3 justify-center">
        {action && (
          action.href ? (
            <Link href={action.href}>
              <motion.button
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {action.label}
              </motion.button>
            </Link>
          ) : (
            <motion.button
              onClick={action.onClick}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {action.label}
            </motion.button>
          )
        )}
        
        {secondaryAction && (
          secondaryAction.href ? (
            <Link href={secondaryAction.href}>
              <button className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-purple-300 font-medium rounded-xl transition-colors">
                {secondaryAction.label}
              </button>
            </Link>
          ) : (
            <button
              onClick={secondaryAction.onClick}
              className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-purple-300 font-medium rounded-xl transition-colors"
            >
              {secondaryAction.label}
            </button>
          )
        )}
      </div>
    </motion.div>
  );
}

// Empty state for no pages/photos in a book
export function NoPagesEmpty({ onAddPhoto }: { onAddPhoto?: () => void }) {
  return (
    <EmptyStateBase
      icon="📸"
      title="No photos yet"
      description="Upload your first photo to start creating your magical storybook. Each stop on your journey can have up to 3 photos."
      action={
        onAddPhoto
          ? { label: "Upload First Photo", onClick: onAddPhoto }
          : undefined
      }
    />
  );
}

// Empty state for no orders
export function NoOrdersEmpty() {
  return (
    <EmptyStateBase
      icon="📦"
      title="No orders yet"
      description="Once you've finished creating your book, you can order a beautiful hardcover copy here."
      action={{
        label: "Browse My Books",
        href: "/dashboard",
      }}
    />
  );
}

// Empty state for filtered results
export function NoFilterResultsEmpty({
  filterType,
  onClearFilter,
}: {
  filterType: string;
  onClearFilter: () => void;
}) {
  return (
    <EmptyStateBase
      icon={filterType === "in_progress" ? "🎨" : "✨"}
      title={`No ${filterType === "in_progress" ? "books in progress" : "books ready to order"}`}
      description={
        filterType === "in_progress"
          ? "All your books are complete and ready to order!"
          : "Keep working on your books to get them ready for printing."
      }
      action={{
        label: "View All Books",
        onClick: onClearFilter,
      }}
    />
  );
}

// Empty state for book preview with no images
export function NoImagesPreviewEmpty({ bookId }: { bookId: string }) {
  return (
    <EmptyStateBase
      icon="🎨"
      title="Nothing to preview yet"
      description="Add some photos to your book to see them transformed into beautiful illustrations."
      action={{
        label: "Add Photos",
        href: `/books/${bookId}/edit`,
      }}
    />
  );
}

// Generic loading error state with retry
export function LoadingErrorEmpty({
  onRetry,
  error,
}: {
  onRetry: () => void;
  error?: string;
}) {
  return (
    <EmptyStateBase
      icon="😵"
      title="Something went wrong"
      description={error || "We couldn't load this content. Please try again."}
      action={{
        label: "Try Again",
        onClick: onRetry,
      }}
      secondaryAction={{
        label: "Go Home",
        href: "/dashboard",
      }}
    />
  );
}

// Empty cart / checkout state
export function EmptyCartState() {
  return (
    <EmptyStateBase
      icon="🛒"
      title="Your cart is empty"
      description="Create a beautiful storybook from your photos and come back to order a printed copy."
      action={{
        label: "Create a Book",
        href: "/books/new",
      }}
      secondaryAction={{
        label: "View My Books",
        href: "/dashboard",
      }}
    />
  );
}

// Book not found state
export function BookNotFoundEmpty() {
  return (
    <EmptyStateBase
      icon="📚"
      title="Book not found"
      description="We couldn't find this book. It may have been deleted or you may not have access to it."
      action={{
        label: "Back to Dashboard",
        href: "/dashboard",
      }}
    />
  );
}
