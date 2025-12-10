"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { BookPreview } from "@/components/BookPreview";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ImageWithUrls = Doc<"images"> & {
  originalUrl: string | null;
  cartoonUrl: string | null;
};

type PageWithImages = Doc<"pages"> & {
  images: ImageWithUrls[];
};

export default function BookPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const bookId = id as Id<"books">;
  const router = useRouter();

  const book = useQuery(api.books.getBook, { bookId });
  const pages = useQuery(api.pages.getBookPages, { bookId });

  // Loading state
  if (!book || !pages) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full" />
            <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="text-purple-300 text-lg">Loading your storybook...</p>
        </div>
      </div>
    );
  }

  // Check if book has content
  const hasImages = pages.some((page: PageWithImages) => page.images && page.images.length > 0);
  const hasCompletedImages = pages.some((page: PageWithImages) =>
    page.images?.some((img) => img.generationStatus === "completed")
  );

  // If no images at all, show a helpful message
  if (!hasImages) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">📸</div>
          <h1 className="text-2xl font-bold text-white mb-4">No Photos Yet</h1>
          <p className="text-purple-300 mb-8">
            Your storybook needs some photos first! Go back to the editor and upload your vacation memories.
          </p>
          <Link
            href={`/books/${bookId}/edit`}
            className="inline-block bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-4 rounded-xl transition-colors"
          >
            Add Photos
          </Link>
        </div>
      </div>
    );
  }

  // If images are still generating, show progress
  if (!hasCompletedImages) {
    const totalImages = pages.reduce((sum: number, page: PageWithImages) => sum + (page.images?.length || 0), 0);
    const generatingCount = pages.reduce((sum: number, page: PageWithImages) =>
      sum + (page.images?.filter((img) => img.generationStatus === "generating").length || 0), 0
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full" />
            <div className="absolute inset-0 border-4 border-amber-400 rounded-full border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-3xl">
              🎨
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Creating Magic...</h1>
          <p className="text-purple-300 mb-4">
            Your photos are being transformed into Disney-style illustrations.
          </p>
          <p className="text-amber-400 font-semibold">
            {generatingCount} of {totalImages} images transforming
          </p>
          <p className="text-purple-400 text-sm mt-4">
            This usually takes 10-30 seconds per image
          </p>
          <Link
            href={`/books/${bookId}/edit`}
            className="inline-block mt-8 text-purple-300 hover:text-white transition-colors"
          >
            ← Back to Editor
          </Link>
        </div>
      </div>
    );
  }

  const handleOrderClick = () => {
    router.push(`/books/${bookId}/checkout`);
  };

  const handleBackClick = () => {
    router.push(`/books/${bookId}/edit`);
  };

  return (
    <BookPreview
      book={book}
      pages={pages as PageWithImages[]}
      onOrderClick={handleOrderClick}
      onBackClick={handleBackClick}
    />
  );
}
