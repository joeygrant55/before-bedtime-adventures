"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const getUserBooks = useQuery(
    api.books.getUserBooksByClerkId,
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

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">My Books</h2>
          <Link href="/books/new">
            <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
              + Create New Book
            </button>
          </Link>
        </div>

        {/* Books Grid */}
        {!getUserBooks || getUserBooks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              No books yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first adventure book from your vacation photos!
            </p>
            <Link href="/books/new">
              <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                Create Your First Book
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getUserBooks.map((book: Doc<"books">) => (
              <Link
                key={book._id}
                href={`/books/${book._id}/edit`}
                className="block"
              >
                <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer">
                  <div className="aspect-square bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-6xl">📖</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {book.title}
                  </h3>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{book.pageCount} pages</span>
                    <span className="capitalize">{book.status}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
