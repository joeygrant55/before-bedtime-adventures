"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { motion } from "framer-motion";
import { FullPageSkeleton } from "@/components/ui/Skeleton";
import { BookNotFoundEmpty } from "@/components/ui/EmptyStates";

export default function BookPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const bookId = resolvedParams.id as Id<"books">;
  const router = useRouter();
  const { user } = useUser();

  const book = useQuery(api.books.getBook, { bookId });
  const pages = useQuery(api.pages.getBookPages, { bookId });

  // Loading state
  if (book === undefined || pages === undefined) {
    return <FullPageSkeleton />;
  }

  // Not found
  if (book === null) {
    return <BookNotFoundEmpty />;
  }

  // Check if book is ready
  const isReadyToOrder = book.status === "ready_to_print" || book.status === "ordered";
  const allPagesComplete = pages?.every(p => 
    p.images.some(img => img.cartoonUrl && img.status === "completed")
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-white/20" />
            <h1 className="text-xl font-bold text-white">{book.title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/books/${bookId}/edit`}
              className="px-4 py-2 rounded-lg font-medium transition-all bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              Edit Book
            </Link>
            {isReadyToOrder && (
              <Link
                href={`/books/${bookId}/checkout`}
                className="px-6 py-2 rounded-lg font-semibold transition-all bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
              >
                📦 Order Book
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Cover Preview */}
        {book.coverDesign && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-white mb-6">📖 Cover</h2>
            <div className="relative aspect-square max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={book.coverDesign.heroImageUrl || "/placeholder-cover.png"}
                alt={book.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
                <h3 className="text-3xl font-bold text-white mb-2">{book.title}</h3>
                {book.coverDesign.subtitle && (
                  <p className="text-lg text-white/90">{book.coverDesign.subtitle}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Pages Preview */}
        {pages && pages.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">📄 Pages ({pages.length})</h2>
            <div className="space-y-8">
              {pages.map((page, index) => {
                const completedImage = page.images.find(
                  img => img.cartoonUrl && img.status === "completed"
                );

                return (
                  <motion.div
                    key={page._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 shadow-xl"
                  >
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 rounded-full bg-purple-600/20 text-purple-300 text-sm font-medium">
                          Page {index + 1}
                        </span>
                        {completedImage ? (
                          <span className="text-green-400 text-sm">✓ Ready</span>
                        ) : (
                          <span className="text-yellow-400 text-sm">⚠ In Progress</span>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Image */}
                        <div className="relative aspect-square rounded-xl overflow-hidden bg-white/5">
                          {completedImage?.cartoonUrl ? (
                            <img
                              src={completedImage.cartoonUrl}
                              alt={`Page ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                              <span className="text-sm">Image generating...</span>
                            </div>
                          )}
                        </div>

                        {/* Text Overlay */}
                        <div className="flex flex-col justify-center">
                          {page.textOverlay ? (
                            <div className="space-y-2">
                              <p className="text-sm text-gray-400 uppercase tracking-wide">Text Overlay:</p>
                              <p
                                className="text-2xl font-bold leading-relaxed"
                                style={{
                                  color: page.textOverlay.color || "#FFFFFF",
                                  fontFamily: page.textOverlay.fontFamily || "inherit",
                                }}
                              >
                                {page.textOverlay.text}
                              </p>
                            </div>
                          ) : (
                            <p className="text-gray-500 italic">No text overlay</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!pages || pages.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No pages yet!</p>
            <Link
              href={`/books/${bookId}/edit`}
              className="text-purple-400 hover:text-purple-300 underline"
            >
              Start editing your book →
            </Link>
          </div>
        )}

        {/* Status Banner */}
        {!isReadyToOrder && allPagesComplete && (
          <div className="mt-12 p-6 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-yellow-300 text-center">
              ✨ Your book is almost ready! Complete the cover design to order.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
