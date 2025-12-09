"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";

export default function NewBookPage() {
  const router = useRouter();
  const { user } = useUser();
  const [title, setTitle] = useState("");
  const [pageCount, setPageCount] = useState(15);
  const [isCreating, setIsCreating] = useState(false);

  const getUserByClerkId = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );
  const createBook = useMutation(api.books.createBook);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!getUserByClerkId || !title.trim()) return;

    setIsCreating(true);
    try {
      const bookId = await createBook({
        userId: getUserByClerkId._id,
        title: title.trim(),
        pageCount,
      });

      router.push(`/books/${bookId}/edit`);
    } catch (error) {
      console.error("Error creating book:", error);
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader showBackButton backHref="/dashboard" backLabel="Back to Dashboard" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Create a New Adventure Book
          </h1>

          <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm p-8">
            {/* Book Title */}
            <div className="mb-6">
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Book Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Our Amazing Vacation"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                Give your adventure book a memorable title
              </p>
            </div>

            {/* Page Count */}
            <div className="mb-8">
              <label
                htmlFor="pageCount"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Number of Pages (Stops on Your Journey)
              </label>
              <input
                id="pageCount"
                type="number"
                min="10"
                max="20"
                value={pageCount}
                onChange={(e) => setPageCount(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-2">
                Choose between 10-20 pages (one for each stop on your vacation)
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-blue-900 mb-2">
                📸 What's Next?
              </h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Upload 1-3 photos for each page/stop</li>
                <li>• We'll transform them into Disney-style cartoons</li>
                <li>• Write your own story text for each page</li>
                <li>• Order a premium hardcover book when you're done!</li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isCreating || !title.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-semibold px-8 py-4 rounded-lg transition-colors"
            >
              {isCreating ? "Creating..." : "Create Book & Start Editing"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
