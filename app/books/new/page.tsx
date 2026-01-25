"use client";

import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { useToast } from "@/components/ui/Toast";
import { ErrorBoundary, FieldError } from "@/components/ui/ErrorBoundary";
import { FullPageSkeleton, InlineSpinner } from "@/components/ui/Skeleton";
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

  // Validate a field
  const validateField = useCallback((field: string, value: string | number): string | undefined => {
    switch (field) {
      case "title":
        if (!String(value).trim()) return "Book title is required";
        if (String(value).trim().length < 2) return "Title must be at least 2 characters";
        if (String(value).trim().length > 100) return "Title must be less than 100 characters";
        break;
      case "pageCount":
        const num = Number(value);
        if (num < 10) return "Minimum 10 stops required";
        if (num > 20) return "Maximum 20 stops allowed";
        break;
    }
    return undefined;
  }, []);

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {};
    
    const titleError = validateField("title", title);
    if (titleError) errors.title = titleError;
    
    const pageCountError = validateField("pageCount", pageCount);
    if (pageCountError) errors.pageCount = pageCountError;

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [title, pageCount, validateField]);

  // Handle field blur
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const value = field === "title" ? title : pageCount;
    const error = validateField(field, value);
    setFormErrors(prev => ({ ...prev, [field]: error }));
  };

  // Handle title change
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (touched.title) {
      const error = validateField("title", value);
      setFormErrors(prev => ({ ...prev, title: error }));
    }
  };

  // Handle page count change
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
    
    // Mark all fields as touched
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
      console.error("Error creating book:", error);
      const message = error instanceof Error ? error.message : "Failed to create book. Please try again.";
      showError(message);
      setIsCreating(false);
    }
  };

  // Loading state
  if (!isLoaded) {
    return <FullPageSkeleton message="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Ambient effects */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      <AppHeader showBackButton backHref="/dashboard" backLabel="Back to Dashboard" />

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-12" role="main">
        <motion.div 
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 
            className="text-4xl font-bold text-white mb-8"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Create a New Adventure Book
          </h1>

          <form 
            onSubmit={handleCreate} 
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
            noValidate
          >
            {/* Book Title */}
            <div className="mb-6">
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-purple-200 mb-2"
              >
                Book Title <span className="text-red-400" aria-hidden="true">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={() => handleBlur("title")}
                placeholder="Our Amazing Vacation"
                autoComplete="off"
                aria-required="true"
                aria-invalid={!!formErrors.title}
                aria-describedby={formErrors.title ? "title-error" : "title-hint"}
                className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                  formErrors.title ? "border-red-500/50" : "border-white/10"
                }`}
              />
              <FieldError error={formErrors.title} id="title-error" />
              {!formErrors.title && (
                <p id="title-hint" className="text-sm text-purple-400/70 mt-2">
                  Give your adventure book a memorable title
                </p>
              )}
            </div>

            {/* Stop Count */}
            <div className="mb-8">
              <label
                htmlFor="pageCount"
                className="block text-sm font-semibold text-purple-200 mb-2"
              >
                Number of Stops on Your Journey <span className="text-red-400" aria-hidden="true">*</span>
              </label>
              <input
                id="pageCount"
                type="number"
                min="10"
                max="20"
                value={pageCount}
                onChange={(e) => handlePageCountChange(e.target.value)}
                onBlur={() => handleBlur("pageCount")}
                aria-required="true"
                aria-invalid={!!formErrors.pageCount}
                aria-describedby={formErrors.pageCount ? "pageCount-error" : "pageCount-hint"}
                className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                  formErrors.pageCount ? "border-red-500/50" : "border-white/10"
                }`}
              />
              <FieldError error={formErrors.pageCount} id="pageCount-error" />
              {!formErrors.pageCount && (
                <p id="pageCount-hint" className="text-sm text-purple-400/70 mt-2">
                  Choose 10-20 stops (each stop becomes a 2-page spread in your book)
                </p>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-purple-200 mb-3 flex items-center gap-2">
                <span aria-hidden="true">📸</span> What's Next?
              </h3>
              <ul className="text-sm text-purple-300 space-y-2" role="list">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400" aria-hidden="true">•</span>
                  <span>Upload 1-3 photos for each stop</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400" aria-hidden="true">•</span>
                  <span>We'll transform them into Disney-style cartoons</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400" aria-hidden="true">•</span>
                  <span>Add custom text overlays to your images</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400" aria-hidden="true">•</span>
                  <span>Order a premium hardcover book when you're done!</span>
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isCreating || !getUserByClerkId}
              aria-busy={isCreating}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-purple-500/30 transition-all hover:shadow-xl hover:shadow-purple-500/40 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              {isCreating ? (
                <>
                  <InlineSpinner className="text-white" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>Create Book & Start Editing</span>
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    aria-hidden="true"
                  >
                    ✨
                  </motion.span>
                </>
              )}
            </button>

            {/* Account loading message */}
            {!getUserByClerkId && isLoaded && (
              <p className="text-center text-purple-400/60 text-sm mt-4">
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">😵</div>
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-purple-300 mb-6">We couldn't load the book creation form.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors"
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
