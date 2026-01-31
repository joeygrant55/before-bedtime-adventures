"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";

export default function BookPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const bookId = resolvedParams.id as Id<"books">;
  const router = useRouter();
  const { user } = useUser();

  const book = useQuery(api.books.getBook, { bookId });
  const pages = useQuery(api.pages.getBookPages, { bookId });

  // Loading state
  if (book === undefined || pages === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Not found
  if (book === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Book not found</p>
          <Link href="/dashboard" className="text-purple-600 hover:text-purple-700 underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Check if book is ready
  const isReadyToOrder = book.status === "ready_to_print" || book.status === "ordered";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Image
                src="/logo.png"
                alt="Before Bedtime Adventures"
                width={180}
                height={136}
                className="h-14 w-auto"
              />
            </Link>
            <div className="h-8 w-px bg-gray-200" />
            <h1 className="text-xl font-semibold text-gray-900">{book.title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/books/${bookId}/edit`}
              className="px-4 py-2 rounded-lg font-medium transition-all bg-white border border-gray-200 hover:border-gray-300 text-gray-700"
            >
              Edit Book
            </Link>
            {isReadyToOrder && (
              <Link
                href={`/books/${bookId}/checkout`}
                className="px-6 py-2 rounded-lg font-semibold transition-all bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
              >
                Order Print ($49.99)
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Cover Preview */}
        {book.coverDesign && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Cover</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-8">
              <div className="relative aspect-square max-w-md mx-auto rounded-xl overflow-hidden shadow-lg">
                <img
                  src={book.coverDesign.heroImageUrl || "/placeholder-cover.png"}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
                  <h3 className="text-2xl font-bold text-white mb-1">{book.title}</h3>
                  {book.coverDesign.subtitle && (
                    <p className="text-base text-white/90">{book.coverDesign.subtitle}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pages Preview */}
        {pages && pages.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Pages <span className="text-gray-400 font-normal">({pages.length})</span>
            </h2>
            <div className="space-y-6">
              {pages.map((page, index) => {
                const completedImage = page.images.find(
                  img => img.cartoonUrl
                );

                return (
                  <div
                    key={page._id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                          Page {index + 1}
                        </span>
                        {page.title && (
                          <span className="text-gray-600 font-medium">{page.title}</span>
                        )}
                        {completedImage ? (
                          <span className="ml-auto text-green-600 text-sm flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Ready
                          </span>
                        ) : (
                          <span className="ml-auto text-yellow-600 text-sm flex items-center gap-1">
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Generating
                          </span>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Image */}
                        <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                          {completedImage?.cartoonUrl ? (
                            <img
                              src={completedImage.cartoonUrl}
                              alt={`Page ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-center text-gray-400">
                                <div className="w-12 h-12 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-2" />
                                <p className="text-sm">Generating image...</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Story Text */}
                        <div className="flex flex-col justify-center">
                          {page.storyText ? (
                            <div className="space-y-3">
                              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Story</p>
                              <p className="text-base text-gray-700 leading-relaxed">
                                {page.storyText}
                              </p>
                            </div>
                          ) : page.title ? (
                            <div className="space-y-3">
                              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Location</p>
                              <p className="text-2xl font-bold text-gray-900">{page.title}</p>
                            </div>
                          ) : (
                            <p className="text-gray-400 italic">No story text</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!pages || pages.length === 0) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-400 mb-4">No pages yet!</p>
            <Link
              href={`/books/${bookId}/edit`}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Start editing your book →
            </Link>
          </div>
        )}

        {/* Status Banner */}
        {!isReadyToOrder && (
          <div className="mt-8 p-4 rounded-xl bg-yellow-50 border border-yellow-100">
            <p className="text-yellow-800 text-center text-sm">
              ✨ Complete all pages and design your cover to order this book
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
