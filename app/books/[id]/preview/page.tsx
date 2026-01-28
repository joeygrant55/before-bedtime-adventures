"use client";

import { use, useState, useCallback, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { SpreadPreview } from "@/components/SpreadEditor/SpreadPreview";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type ImageWithUrls = Doc<"images"> & {
  originalUrl: string | null;
  cartoonUrl: string | null;
  bakedUrl?: string | null;
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

  const [currentSpread, setCurrentSpread] = useState(0);

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
    <PrintReadyPreview
      book={book}
      pages={pages as PageWithImages[]}
      currentSpread={currentSpread}
      setCurrentSpread={setCurrentSpread}
      onOrderClick={handleOrderClick}
      onBackClick={handleBackClick}
    />
  );
}

/**
 * PrintReadyPreview - Shows spreads (page pairs) as they'll appear in print
 */
function PrintReadyPreview({
  book,
  pages,
  currentSpread,
  setCurrentSpread,
  onOrderClick,
  onBackClick,
}: {
  book: Doc<"books">;
  pages: PageWithImages[];
  currentSpread: number;
  setCurrentSpread: (n: number) => void;
  onOrderClick: () => void;
  onBackClick: () => void;
}) {
  // Calculate total spreads: cover + page pairs + back cover
  // Each spread = 2 pages, so total spreads = 1 (cover) + ceil(pages/2) + 1 (back)
  const totalSpreads = 1 + Math.ceil(pages.length / 2) + 1;

  const goToNextSpread = useCallback(() => {
    if (currentSpread < totalSpreads - 1) {
      setCurrentSpread(currentSpread + 1);
    }
  }, [currentSpread, totalSpreads, setCurrentSpread]);

  const goToPrevSpread = useCallback(() => {
    if (currentSpread > 0) {
      setCurrentSpread(currentSpread - 1);
    }
  }, [currentSpread, setCurrentSpread]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goToNextSpread();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevSpread();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextSpread, goToPrevSpread]);

  // Determine what to show based on currentSpread
  const getSpreadContent = () => {
    // First spread: cover + first page
    if (currentSpread === 0) {
      return {
        type: "cover" as const,
        leftPage: undefined,
        rightPage: pages[0],
        leftPageNum: 0,
        rightPageNum: 1,
      };
    }

    // Last spread: last page (or blank) + back cover
    if (currentSpread === totalSpreads - 1) {
      const lastPageIndex = pages.length - 1;
      const isOddPageCount = pages.length % 2 === 1;
      
      return {
        type: "back" as const,
        leftPage: isOddPageCount ? pages[lastPageIndex] : undefined,
        rightPage: undefined,
        leftPageNum: isOddPageCount ? pages.length : 0,
        rightPageNum: pages.length + 1,
      };
    }

    // Middle spreads: pairs of pages
    // Spread 1 = pages [0,1] (but page 0 is with cover, so spread 1 = [1,2])
    const firstPageIndex = currentSpread * 2 - 1;
    const secondPageIndex = firstPageIndex + 1;

    return {
      type: "pages" as const,
      leftPage: pages[firstPageIndex],
      rightPage: pages[secondPageIndex],
      leftPageNum: firstPageIndex + 1,
      rightPageNum: secondPageIndex + 1,
    };
  };

  const spread = getSpreadContent();

  const getSpreadLabel = () => {
    if (spread.type === "cover") return "Cover";
    if (spread.type === "back") return "Back Cover";
    return `Pages ${spread.leftPageNum}–${spread.rightPageNum}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBackClick && (
              <button
                onClick={onBackClick}
                className="p-2 -ml-2 rounded-full hover:bg-stone-100 transition-colors"
              >
                <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div>
              <h1 className="text-xl font-semibold text-stone-900">{book.title}</h1>
              <p className="text-sm text-stone-500">Print Preview</p>
            </div>
          </div>
          <button
            onClick={onOrderClick}
            className="bg-stone-900 hover:bg-stone-800 text-white font-medium px-6 py-3 rounded-xl transition-colors shadow-sm"
          >
            Order — $49.99
          </button>
        </div>
      </header>

      {/* Main preview area */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-6xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSpread}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SpreadPreview
                leftPage={spread.leftPage}
                rightPage={spread.rightPage}
                leftPageNumber={spread.leftPageNum}
                rightPageNumber={spread.rightPageNum}
                isCover={spread.type === "cover"}
                isBackCover={spread.type === "back"}
                book={book}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Navigation */}
      <footer className="sticky bottom-0 bg-white/90 backdrop-blur-md border-t border-stone-200 py-4 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-sm font-medium text-stone-600 min-w-[120px] text-right">
              {getSpreadLabel()}
            </span>
            <div className="flex gap-1.5">
              {Array.from({ length: totalSpreads }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSpread(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentSpread
                      ? "bg-stone-900 w-6"
                      : "bg-stone-300 hover:bg-stone-400 w-1.5"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-stone-400 min-w-[120px]">
              {pages.length} pages
            </span>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={goToPrevSpread}
              disabled={currentSpread === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Previous</span>
            </button>

            <span className="text-sm text-stone-400 hidden md:block">
              Use arrow keys to navigate
            </span>

            <button
              onClick={goToNextSpread}
              disabled={currentSpread === totalSpreads - 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Next</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </footer>

      {/* Print and responsive styles */}
      <style jsx global>{`
        @media print {
          header, footer {
            display: none !important;
          }
          main {
            padding: 0 !important;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
        
        @media (max-width: 768px) {
          /* On mobile, stack pages vertically or show one at a time */
          main {
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
}
