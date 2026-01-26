"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";

import { BookCard } from "@/components/dashboard/BookCard";
import { OrdersSection } from "@/components/dashboard/OrdersSection";
import { ErrorBoundary, ApiError } from "@/components/ui/ErrorBoundary";
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

  const books = useQuery(
    api.books.getUserBooksWithProgress,
    user ? { clerkId: user.id } : "skip"
  );

  const hasTrackedLogin = useRef(false);
  const hasRedirectedFirstTime = useRef(false);

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

  // Track user login
  useEffect(() => {
    if (user && books !== undefined && !hasTrackedLogin.current) {
      hasTrackedLogin.current = true;
      trackUserLogin(user.id);
      trackFunnelStep("signup", { userId: user.id });
      identifyUser({
        userId: user.id,
        totalBooks: books.length,
        isFirstBook: books.length === 0,
        signupDate: user.createdAt ? new Date(user.createdAt).toISOString() : undefined,
      });
    }
  }, [user, books]);

  // First-time user? Skip empty dashboard
  useEffect(() => {
    if (books !== undefined && books.length === 0 && !hasRedirectedFirstTime.current) {
      hasRedirectedFirstTime.current = true;
      router.push("/books/new");
    }
  }, [books, router]);

  // Filter books
  const filteredBooks = books?.filter((book) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "in_progress") return !book.progress.isComplete;
    if (activeFilter === "ready") return book.progress.isComplete;
    return true;
  });

  // Handle delete
  const handleDeleteBook = async (bookId: string) => {
    setDeleteError(null);
    try {
      await deleteBook({ bookId: bookId as any });
      success("Book deleted");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete book";
      setDeleteError(message);
      showError(message);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Before Bedtime Adventures"
              width={180}
              height={136}
              className="h-14 w-auto"
              priority
            />
          </Link>
          
          <div className="flex items-center gap-4">
            <Link
              href="/books/new"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Book
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">My Books</h1>
          <p className="text-gray-500">
            {books === undefined ? (
              "Loading..."
            ) : books.length === 0 ? (
              "Create your first storybook"
            ) : (
              `${books.length} ${books.length === 1 ? "book" : "books"} in your collection`
            )}
          </p>
        </div>

        {/* Filter Tabs */}
        {books && books.length > 0 && (
          <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
            {[
              { key: "all", label: "All" },
              { key: "in_progress", label: "In Progress" },
              { key: "ready", label: "Ready" },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key as FilterType)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeFilter === filter.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}

        {deleteError && (
          <div className="mb-6">
            <ApiError error={deleteError} onRetry={() => setDeleteError(null)} />
          </div>
        )}

        {/* Orders */}
        <OrdersSection />

        {/* Loading */}
        {books === undefined ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : books.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📚</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No books yet</h2>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Create your first magical storybook from your family photos
            </p>
            <Link
              href="/books/new"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6 py-3 rounded-xl transition-all"
            >
              Create Your First Book
            </Link>
          </motion.div>
        ) : (
          /* Book Grid */
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Create New Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Link
                href="/books/new"
                className="block aspect-[3/4] bg-white border-2 border-dashed border-gray-200 hover:border-purple-400 rounded-xl flex flex-col items-center justify-center text-center p-4 transition-all hover:bg-purple-50 group"
              >
                <div className="w-12 h-12 bg-purple-100 group-hover:bg-purple-200 rounded-full flex items-center justify-center mb-3 transition-colors">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="font-medium text-gray-900">New Book</span>
                <span className="text-sm text-gray-500">Start creating</span>
              </Link>
            </motion.div>

            {/* Book Cards */}
            <AnimatePresence mode="popLayout">
              {filteredBooks?.map((book, index) => (
                <motion.div
                  key={book._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
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

        {/* No filter results */}
        {books && books.length > 0 && filteredBooks?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No books match this filter</p>
            <button
              onClick={() => setActiveFilter("all")}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Show all books
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-5xl mb-4">😵</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-500 mb-6">We couldn't load your books</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors"
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
