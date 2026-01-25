"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { DashboardHeader } from "@/components/DashboardHeader";
import { BookCard } from "@/components/dashboard/BookCard";
import { CreateBookCard } from "@/components/dashboard/CreateBookCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { OrdersSection } from "@/components/dashboard/OrdersSection";

type FilterType = "all" | "in_progress" | "ready";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const deleteBook = useMutation(api.books.deleteBook);

  // Use the new query with progress data
  const books = useQuery(
    api.books.getUserBooksWithProgress,
    user ? { clerkId: user.id } : "skip"
  );

  // Sync user with Convex on first load
  useEffect(() => {
    if (user) {
      getOrCreateUser({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        name: user.fullName || undefined,
      });
    }
  }, [user, getOrCreateUser]);

  // Filter books based on active filter
  const filteredBooks = books?.filter((book) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "in_progress") return !book.progress.isComplete;
    if (activeFilter === "ready") return book.progress.isComplete;
    return true;
  });

  // Handle delete book
  const handleDeleteBook = async (bookId: string) => {
    try {
      await deleteBook({ bookId: bookId as any });
    } catch (error) {
      console.error("Failed to delete book:", error);
    }
  };

  // Loading state
  if (!isLoaded || books === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        {/* Ambient light effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        </div>

        <motion.div
          className="text-center"
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
          <p className="text-purple-300">Loading your bookshelf...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Ambient light effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <DashboardHeader
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
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
          <p className="text-purple-300">
            {books.length === 0 ? (
              "Your adventure begins here"
            ) : (
              <>
                {books.length} {books.length === 1 ? "book" : "books"} in your
                collection
              </>
            )}
          </p>
        </motion.div>

        {/* Orders Section - shows user's active and past orders */}
        <OrdersSection />

        {/* Empty State OR Book Grid */}
        {books.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Create new book card - always first */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
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
        {books.length > 0 && filteredBooks?.length === 0 && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-4xl mb-4">
              {activeFilter === "in_progress" ? "🎨" : "✨"}
            </div>
            <h3 className="text-xl text-white mb-2">
              {activeFilter === "in_progress"
                ? "No books in progress"
                : "No books ready to order"}
            </h3>
            <p className="text-purple-400/60">
              {activeFilter === "in_progress"
                ? "All your books are complete!"
                : "Keep working on your books to get them ready."}
            </p>
            <button
              onClick={() => setActiveFilter("all")}
              className="mt-4 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded-lg transition-colors"
            >
              View all books
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
