"use client";

import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { ErrorBoundary, FieldError } from "@/components/ui/ErrorBoundary";
import { motion } from "framer-motion";

interface FormErrors {
  title?: string;
}

const steps = [
  { icon: "📸", title: "Add Pages", description: "Create pages as you go" },
  { icon: "✨", title: "AI Magic", description: "We transform photos into Disney-style art" },
  { icon: "✏️", title: "Customize", description: "Add text, pick your cover design" },
  { icon: "📦", title: "Delivered", description: "Premium hardcover shipped to your door" },
];

function NewBookContent() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { success, error: showError } = useToast();
  
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const createBook = useMutation(api.books.createBook);

  const validateField = useCallback((field: string, value: string | number): string | undefined => {
    switch (field) {
      case "title":
        if (!String(value).trim()) return "Book title is required";
        if (String(value).trim().length < 2) return "Title must be at least 2 characters";
        if (String(value).trim().length > 100) return "Title must be less than 100 characters";
        break;
    }
    return undefined;
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {};
    const titleError = validateField("title", title);
    if (titleError) errors.title = titleError;
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [title, validateField]);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const value = field === "title" ? title : "";
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ title: true });
    
    if (!validateForm()) {
      showError("Please fix the errors in the form");
      return;
    }

    if (!user) {
      showError("Please wait while we set up your account");
      return;
    }

    setIsCreating(true);
    try {
      const bookId = await createBook({
        clerkId: user.id,
        title: title.trim(),
      });

      success("Book created! Start adding your pages and photos.");
      router.push(`/books/${bookId}/edit`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create book";
      showError(message);
      setIsCreating(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors w-fit">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to My Books</span>
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Hero Section */}
          <div className="text-center mb-12">
            <motion.h1 
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              Turn Your Photos Into a Storybook ✨
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-600 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Your family adventure, illustrated in Disney style
            </motion.p>

            {/* Before/After Teaser */}
            <motion.div
              className="max-w-2xl mx-auto mb-12"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-500 mb-3">Your Photo</div>
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-2">📸</div>
                        <div className="text-sm text-gray-500">Real family photo</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-purple-600 mb-3">AI Magic ✨</div>
                    <div className="aspect-square bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-xl flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🎨</div>
                        <div className="text-sm text-gray-700 font-medium">Disney-style art</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 text-center text-sm text-gray-500">
                  <span className="inline-flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    See your memories transformed into magical illustrations
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          <form onSubmit={handleCreate} noValidate>
            {/* Title Input */}
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <label htmlFor="title" className="block text-lg font-semibold text-gray-900 mb-3 text-center">
                What's your story called?
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={() => handleBlur("title")}
                placeholder="Our Amazing Summer Adventure"
                autoComplete="off"
                className={`w-full px-6 py-4 border-2 rounded-2xl text-gray-900 text-center text-lg placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all bg-white shadow-sm ${
                  formErrors.title ? "border-red-300" : "border-gray-200"
                }`}
              />
              <FieldError error={formErrors.title} id="title-error" />
              <p className="text-center text-sm text-gray-500 mt-2">
                💡 Most storybooks have 10-20 pages
              </p>
            </motion.div>

            {/* Journey Steps */}
            <motion.div
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">
                Your magical journey
              </h2>
              <div className="grid md:grid-cols-4 gap-6">
                {steps.map((step, index) => (
                  <motion.div
                    key={index}
                    className="relative"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
                  >
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="text-4xl mb-3 text-center">{step.icon}</div>
                      <h3 className="font-bold text-gray-900 text-center mb-2">{step.title}</h3>
                      <p className="text-sm text-gray-500 text-center">{step.description}</p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-purple-300 to-transparent" />
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="text-center"
            >
              <motion.button
                type="submit"
                disabled={isCreating || !user}
                className="relative px-12 py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white text-lg font-bold rounded-2xl transition-all disabled:cursor-not-allowed shadow-lg hover:shadow-xl overflow-hidden group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                <span className="relative flex items-center justify-center gap-2">
                  {isCreating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating magic...</span>
                    </>
                  ) : (
                    <>
                      <span>✨ Start My Storybook</span>
                    </>
                  )}
                </span>
              </motion.button>

              <p className="text-sm text-gray-500 mt-4">
                Premium hardcover • Free US shipping • $49.99
              </p>

              {!user && isLoaded && (
                <p className="text-center text-gray-400 text-sm mt-4">
                  Setting up your account...
                </p>
              )}
            </motion.div>
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
