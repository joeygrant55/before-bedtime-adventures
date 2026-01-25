"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { DashboardHeader } from "@/components/DashboardHeader";
import { BookCard } from "@/components/dashboard/BookCard";
import { CreateBookCard } from "@/components/dashboard/CreateBookCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { OrdersSection } from "@/components/dashboard/OrdersSection";
import { BookGridSkeleton, FullPageSkeleton } from "@/components/ui/Skeleton";
import { ErrorBoundary, ApiError } from "@/components/ui/ErrorBoundary";
import { NoFilterResultsEmpty } from "@/components/ui/EmptyStates";
import { useToast } from "@/components/ui/Toast";
import { trackUserLogin, identifyUser, trackFunnelStep } from "@/lib/analytics";

type FilterType = "all" | "in_progress" | "ready";

function DashboardContent() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const deleteBook = useMutation(api.books.deleteBook);

  // Use the new query with progress data
  const books = useQuery(
    api.books.getUserBooksWithProgress,
    user ? { clerkId: user.id } : "skip"
  );

  const hasTrackedLogin = useRef(false);

  // Sync user with Convex on first load
  useEffect(() => {
    if (user) {
      getOrCreateUser({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        name: user.fullName || undefined,
      }).catch((err) => {
        console.error("Failed to sync user:", err);
      });
    }
  }, [user, getOrCreateUser]);

  // Track user login and funnel progress
  useEffect(() => {
    if (user && books !== undefined && !hasTrackedLogin.current) {
      hasTrackedLogin.current = true;
      
      // Track login
      trackUserLogin(user.id);
      trackFunnelStep("signup", { userId: user.id });
      
      // Identify user with properties
      identifyUser({
        userId: user.id,
        totalBooks: books.length,
        isFirstBook: books.length === 0,
        signupDate: user.createdAt ? new Date(user.createdAt).toISOString() : undefined,
      });
    }
  }, [user, books]);

  // Filter books based on active filter
  const filteredBooks = books?.filter((book) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "in_progress") return !book.progress.isComplete;
    if (activeFilter === "ready") return book.progress.isComplete;
    return true;
  });

  // Handle delete book
  const handleDeleteBook = async (bookId: string) => {
    setDeleteError(null);
    try {
      await deleteBook({ bookId: bookId as any });
      success("Book deleted successfully");
    } catch (error) {
      console.error("Failed to delete book:", error);
      const message = error instanceof Error ? error.message : "Failed to delete book";
      setDeleteError(message);
      showError(message, {
        action: {
          label: "Retry",
          onClick: () => handleDeleteBook(bookId),
        },
      });
    }
  };

  // Initial loading state (before user is loaded)
  if (!isLoaded) {
    return <FullPageSkeleton message="Loading your bookshelf..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Ambient light effects */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <DashboardHeader
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8" role="main">
        {/* Page Title */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1
            className="text-4xl md:text-5xl font-bold text-white mb-2"
            style={{ fontFamily: "Georgia, serif" }}
          >
            My Bookshelf
          </h1>
          <p className="text-purple-300" aria-live="polite">
            {books === undefined ? (
              "Loading..."
            ) : books.length === 0 ? (
              "Your adventure begins here"
            ) : (
              <>
                {books.length} {books.length === 1 ? "book" : "books"} in your
                collection
              </>
            )}
          </p>
        </motion.div>

        {/* Delete Error */}
        {deleteError && (
          <div className="mb-6">
            <ApiError error={deleteError} onRetry={() => setDeleteError(null)} />
          </div>
        )}

        {/* Orders Section - shows user's active and past orders */}
        <OrdersSection />

        {/* Loading State */}
        {books === undefined ? (
          <BookGridSkeleton count={4} />
        ) : books.length === 0 ? (
          /* Empty State */
          <EmptyState />
        ) : (
          /* Book Grid */
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            role="list"
            aria-label="Your books"
          >
            {/* Create new book card - always first */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              role="listitem"
            >
              <CreateBookCard />
            </motion.div>

            {/* Book cards */}
            <AnimatePresence mode="popLayout">
              {filteredBooks?.map((book, index) => (
                <motion.div
                  key={book._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: (index + 1) * 0.05 }}
                  layout
                  role="listitem"
                >
                  <BookCard
                    book={book}
                    onEdit={() => router.push(`/books/${book._id}/edit`)}
                    onPreview={() => router.push(`/books/${book._id}/preview`)}
                    onDelete={() => handleDeleteBook(book._id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Filter results message */}
        {books && books.length > 0 && filteredBooks?.length === 0 && (
          <NoFilterResultsEmpty
            filterType={activeFilter}
            onClearFilter={() => setActiveFilter("all")}
          />
        )}
      </main>

      {/* Skip to main content link for accessibility */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">😵</div>
            <h2 className="text-xl font-bold text-white mb-2">Dashboard Error</h2>
            <p className="text-purple-300 mb-6">Something went wrong loading your bookshelf.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </ErrorBoundary>
  );
}
