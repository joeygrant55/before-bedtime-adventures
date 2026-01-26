"use client";

import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/components/ui/Toast";
import { ErrorBoundary, FieldError } from "@/components/ui/ErrorBoundary";
import { motion } from "framer-motion";

interface FormErrors {
  title?: string;
  pageCount?: string;
}

function NewBookContent() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { success, error: showError } = useToast();
  
  const [title, setTitle] = useState("");
  const [pageCount, setPageCount] = useState(15);
  const [isCreating, setIsCreating] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const getUserByClerkId = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );
  const createBook = useMutation(api.books.createBook);

  const validateField = useCallback((field: string, value: string | number): string | undefined => {
    switch (field) {
      case "title":
        if (!String(value).trim()) return "Book title is required";
        if (String(value).trim().length < 2) return "Title must be at least 2 characters";
        if (String(value).trim().length > 100) return "Title must be less than 100 characters";
        break;
      case "pageCount":
        const num = Number(value);
        if (num < 10) return "Minimum 10 pages required";
        if (num > 20) return "Maximum 20 pages allowed";
        break;
    }
    return undefined;
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {};
    const titleError = validateField("title", title);
    if (titleError) errors.title = titleError;
    const pageCountError = validateField("pageCount", pageCount);
    if (pageCountError) errors.pageCount = pageCountError;
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [title, pageCount, validateField]);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const value = field === "title" ? title : pageCount;
    const error = validateField(field, value);
    setFormErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (touched.title) {
      const error = validateField("title", value);
      setFormErrors(prev => ({ ...prev, title: error }));
    }
  };

  const handlePageCountChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      setPageCount(num);
      if (touched.pageCount) {
        const error = validateField("pageCount", num);
        setFormErrors(prev => ({ ...prev, pageCount: error }));
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ title: true, pageCount: true });
    
    if (!validateForm()) {
      showError("Please fix the errors in the form");
      return;
    }

    if (!getUserByClerkId) {
      showError("Please wait while we set up your account");
      return;
    }

    setIsCreating(true);
    try {
      const bookId = await createBook({
        userId: getUserByClerkId._id,
        title: title.trim(),
        pageCount,
      });

      success("Book created! Let's add some photos.");
      router.push(`/books/${bookId}/edit`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create book";
      showError(message);
      setIsCreating(false);
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
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors w-fit">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to My Books</span>
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-lg mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create a New Book</h1>
          <p className="text-gray-500 mb-8">Set up your storybook, then add photos</p>

          <form onSubmit={handleCreate} noValidate>
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              {/* Title */}
              <div className="mb-6">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Book Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  onBlur={() => handleBlur("title")}
                  placeholder="Our Amazing Vacation"
                  autoComplete="off"
                  className={`w-full px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                    formErrors.title ? "border-red-300" : "border-gray-200"
                  }`}
                />
                <FieldError error={formErrors.title} id="title-error" />
              </div>

              {/* Page Count */}
              <div>
                <label htmlFor="pageCount" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Pages
                </label>
                <input
                  id="pageCount"
                  type="number"
                  min="10"
                  max="20"
                  value={pageCount}
                  onChange={(e) => handlePageCountChange(e.target.value)}
                  onBlur={() => handleBlur("pageCount")}
                  className={`w-full px-4 py-3 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                    formErrors.pageCount ? "border-red-300" : "border-gray-200"
                  }`}
                />
                <FieldError error={formErrors.pageCount} id="pageCount-error" />
                {!formErrors.pageCount && (
                  <p className="text-sm text-gray-500 mt-2">
                    Choose 10-20 pages for your storybook
                  </p>
                )}
              </div>
            </div>

            {/* What's Next */}
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-5 mb-6">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <span>📸</span> What's next?
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">•</span>
                  <span>Upload 1-3 photos for each page</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">•</span>
                  <span>We'll transform them into Disney-style illustrations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">•</span>
                  <span>Add custom text overlays</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">•</span>
                  <span>Order your premium hardcover book!</span>
                </li>
              </ul>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isCreating || !getUserByClerkId}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold px-8 py-4 rounded-xl transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>Create Book</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>

            {!getUserByClerkId && isLoaded && (
              <p className="text-center text-gray-400 text-sm mt-4">
                Setting up your account...
              </p>
            )}
          </form>
        </motion.div>
      </main>
    </div>
  );
}

export default function NewBookPage() {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-5xl mb-4">😵</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-500 mb-6">We couldn't load the form</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      }
    >
      <NewBookContent />
    </ErrorBoundary>
  );
}
