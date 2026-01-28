"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Doc } from "@/convex/_generated/dataModel";

type ImageWithUrls = Doc<"images"> & {
  originalUrl: string | null;
  cartoonUrl: string | null;
  bakedUrl?: string | null;
};

type PageWithImages = Doc<"pages"> & {
  images: ImageWithUrls[];
};

interface BookPreviewProps {
  book: Doc<"books"> & { coverDesign?: { heroImageUrl?: string | null } };
  pages: PageWithImages[];
  onOrderClick?: () => void;
  onBackClick?: () => void;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  return isMobile;
}

export function BookPreview({ book, pages, onOrderClick, onBackClick }: BookPreviewProps) {
  const [currentSpread, setCurrentSpread] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next");
  const isMobile = useIsMobile();

  const totalSpreads = isMobile
    ? pages.length + 2
    : Math.ceil(pages.length / 2) + 2;

  const goToNextSpread = useCallback(() => {
    if (currentSpread < totalSpreads - 1 && !isFlipping) {
      setFlipDirection("next");
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentSpread((prev) => prev + 1);
        setIsFlipping(false);
      }, 300);
    }
  }, [currentSpread, totalSpreads, isFlipping]);

  const goToPrevSpread = useCallback(() => {
    if (currentSpread > 0 && !isFlipping) {
      setFlipDirection("prev");
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentSpread((prev) => prev - 1);
        setIsFlipping(false);
      }, 300);
    }
  }, [currentSpread, isFlipping]);

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

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 50;
      if (info.offset.x < -threshold) goToNextSpread();
      else if (info.offset.x > threshold) goToPrevSpread();
    },
    [goToNextSpread, goToPrevSpread]
  );

  const getSpreadPages = () => {
    if (currentSpread === 0) return { type: "cover" as const };
    if (currentSpread === totalSpreads - 1) return { type: "back" as const };
    if (isMobile) {
      const pageIndex = currentSpread - 1;
      return { type: "single" as const, page: pages[pageIndex], pageNum: pageIndex + 1 };
    }
    const spreadIndex = currentSpread - 1;
    const leftPageIndex = spreadIndex * 2;
    const rightPageIndex = leftPageIndex + 1;
    return {
      type: "pages" as const,
      left: pages[leftPageIndex],
      right: pages[rightPageIndex],
      leftPageNum: leftPageIndex + 1,
      rightPageNum: rightPageIndex + 1,
    };
  };

  const spread = getSpreadPages();

  const getPageInfo = () => {
    if (currentSpread === 0) return "Cover";
    if (currentSpread === totalSpreads - 1) return "Back";
    if (isMobile) return `Page ${currentSpread}`;
    return `Pages ${(currentSpread - 1) * 2 + 1}–${Math.min((currentSpread - 1) * 2 + 2, pages.length)}`;
  };

  const getAllCartoonUrls = (): string[] => {
    return pages.flatMap((page) =>
      (page.images || [])
        .filter((img) => img.generationStatus === "completed" && (img.bakedUrl || img.cartoonUrl))
        .map((img) => (img.bakedUrl || img.cartoonUrl) as string)
    );
  };

  const getHeroImageUrl = (): string | null => {
    const urls = getAllCartoonUrls();
    return urls.length > 0 ? urls[0] : null;
  };

  const getImageCollage = (): string[] => getAllCartoonUrls().slice(0, 6);

  // Get hero image - use saved one or fall back to first cartoon
  const heroImageUrl = (book.coverDesign as { heroImageUrl?: string | null })?.heroImageUrl || getHeroImageUrl();

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 to-white flex flex-col">
      {/* Header - Clean Airbnb style */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
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
              <p className="text-sm text-stone-500">Preview your storybook</p>
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

      {/* Book Display */}
      <motion.main
        className="flex-1 flex items-center justify-center px-4 py-8 md:py-12"
        drag={isMobile ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
      >
        <div className="relative">
          {/* Subtle shadow beneath book */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[80%] h-8 bg-stone-900/10 blur-2xl rounded-full" />

          <AnimatePresence mode="wait">
            {spread.type === "cover" ? (
              <BookCover
                key="cover"
                book={book}
                pageCount={pages.length}
                onOpen={goToNextSpread}
                isMobile={isMobile}
                heroImageUrl={heroImageUrl}
              />
            ) : spread.type === "back" ? (
              <BackCover
                key="back"
                book={book}
                isMobile={isMobile}
                imageCollage={getImageCollage()}
              />
            ) : spread.type === "single" ? (
              <SinglePage
                key={`page-${currentSpread}`}
                page={spread.page}
                pageNum={spread.pageNum}
                totalPages={pages.length}
                flipDirection={flipDirection}
              />
            ) : (
              <OpenBook
                key={`spread-${currentSpread}`}
                leftPage={spread.left}
                rightPage={spread.right}
                leftPageNum={spread.leftPageNum}
                rightPageNum={spread.rightPageNum}
                totalPages={pages.length}
                flipDirection={flipDirection}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.main>

      {/* Navigation - Clean and minimal */}
      <footer className="sticky bottom-0 bg-white/80 backdrop-blur-md border-t border-stone-200 py-4 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-sm font-medium text-stone-600 min-w-[80px] text-right">
              {getPageInfo()}
            </span>
            <div className="flex gap-1.5">
              {Array.from({ length: totalSpreads }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => !isFlipping && setCurrentSpread(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentSpread
                      ? "bg-stone-900 w-6"
                      : "bg-stone-300 hover:bg-stone-400 w-1.5"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-stone-400 min-w-[80px]">
              {pages.length} pages
            </span>
          </div>

          {/* Nav buttons */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={goToPrevSpread}
              disabled={currentSpread === 0 || isFlipping}
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
              disabled={currentSpread === totalSpreads - 1 || isFlipping}
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
    </div>
  );
}

// ============ BOOK COVER ============
function BookCover({
  book,
  pageCount,
  onOpen,
  isMobile,
  heroImageUrl,
}: {
  book: Doc<"books">;
  pageCount: number;
  onOpen: () => void;
  isMobile: boolean;
  heroImageUrl: string | null;
}) {
  const size = isMobile ? "w-[300px] h-[300px]" : "w-[420px] h-[420px]";
  const title = book.coverDesign?.title || book.title;
  const subtitle = book.coverDesign?.subtitle;

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onOpen}
      className="cursor-pointer group"
    >
      <div className={`relative ${size} rounded-xl overflow-hidden shadow-2xl shadow-stone-400/30 group-hover:shadow-stone-400/50 transition-shadow`}>
        {/* Background - either hero image or gradient */}
        {heroImageUrl ? (
          <img
            src={heroImageUrl}
            alt="Cover"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-orange-50 to-rose-100" />
        )}

        {/* Overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-end p-8 text-center text-white">
          <h1 className={`${isMobile ? "text-2xl" : "text-4xl"} font-bold mb-2 drop-shadow-lg`}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-white/80 text-sm mb-1">{subtitle}</p>
          )}
          <p className="text-white/60 text-xs">{pageCount} pages</p>
          
          {/* Open hint */}
          <motion.div
            className="mt-6 text-white/70 text-sm flex items-center gap-2"
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span>Tap to open</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.div>
        </div>

        {/* Page edge effect */}
        <div className="absolute right-0 top-4 bottom-4 w-2 bg-gradient-to-r from-stone-200 to-white rounded-r" />
      </div>
    </motion.div>
  );
}

// ============ BACK COVER ============
function BackCover({
  book,
  isMobile,
  imageCollage,
}: {
  book: Doc<"books">;
  isMobile: boolean;
  imageCollage: string[];
}) {
  const size = isMobile ? "w-[300px] h-[300px]" : "w-[420px] h-[420px]";
  const title = book.coverDesign?.title || book.title;
  const dedication = book.coverDesign?.dedication;

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`relative ${size} rounded-xl overflow-hidden shadow-2xl shadow-stone-400/30 bg-gradient-to-br from-stone-100 to-stone-50`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
          {/* Image collage */}
          {imageCollage.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-6">
              {imageCollage.slice(0, 6).map((url, i) => (
                <div
                  key={i}
                  className={`${isMobile ? "w-12 h-12" : "w-16 h-16"} rounded-lg overflow-hidden shadow-md`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Dedication */}
          {dedication ? (
            <p className="text-stone-600 text-sm italic mb-4 max-w-[80%]">
              "{dedication}"
            </p>
          ) : (
            <p className="text-stone-500 text-sm italic mb-4">
              "The end of one adventure<br />is the beginning of another."
            </p>
          )}

          <div className="w-12 h-px bg-stone-300 my-4" />

          <p className="text-stone-700 font-medium text-sm">{title}</p>
          <p className="text-stone-400 text-xs mt-2">
            Made with Before Bedtime Adventures
          </p>
        </div>

        {/* Page edge effect */}
        <div className="absolute left-0 top-4 bottom-4 w-2 bg-gradient-to-l from-stone-200 to-white rounded-l" />
      </div>
    </motion.div>
  );
}

// ============ SINGLE PAGE (Mobile) ============
function SinglePage({
  page,
  pageNum,
  totalPages,
  flipDirection,
}: {
  page?: PageWithImages;
  pageNum: number;
  totalPages: number;
  flipDirection: "next" | "prev";
}) {
  return (
    <motion.div
      initial={{ x: flipDirection === "next" ? 50 : -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: flipDirection === "next" ? -50 : 50, opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="w-[300px] h-[300px] bg-white rounded-xl shadow-2xl shadow-stone-400/20 overflow-hidden">
        <PageContent page={page} pageNum={pageNum} totalPages={totalPages} />
      </div>
    </motion.div>
  );
}

// ============ OPEN BOOK (Desktop) ============
function OpenBook({
  leftPage,
  rightPage,
  leftPageNum,
  rightPageNum,
  totalPages,
  flipDirection,
}: {
  leftPage?: PageWithImages;
  rightPage?: PageWithImages;
  leftPageNum: number;
  rightPageNum: number;
  totalPages: number;
  flipDirection: "next" | "prev";
}) {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex"
    >
      {/* Spine shadow */}
      <div className="absolute left-1/2 top-4 bottom-4 w-4 -translate-x-1/2 bg-gradient-to-r from-stone-300/50 via-stone-400/30 to-stone-300/50 z-10 pointer-events-none" />

      {/* Left page */}
      <div className="w-[400px] h-[400px] bg-white rounded-l-xl shadow-xl shadow-stone-400/20 overflow-hidden">
        <PageContent page={leftPage} pageNum={leftPageNum} totalPages={totalPages} side="left" />
      </div>

      {/* Right page */}
      <div className="w-[400px] h-[400px] bg-white rounded-r-xl shadow-xl shadow-stone-400/20 overflow-hidden">
        <PageContent page={rightPage} pageNum={rightPageNum} totalPages={totalPages} side="right" />
      </div>
    </motion.div>
  );
}

// ============ PAGE CONTENT ============
function PageContent({
  page,
  pageNum,
  totalPages,
  side,
}: {
  page?: PageWithImages;
  pageNum: number;
  totalPages: number;
  side?: "left" | "right";
}) {
  const image = page?.images?.[0];
  const imageUrl = image?.bakedUrl || image?.cartoonUrl;

  // Empty page or beyond total
  if (!page || pageNum > totalPages) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-stone-50">
        <div className="text-stone-300 text-4xl">✦</div>
      </div>
    );
  }

  // Page without image yet - differentiate between processing and no upload
  if (!imageUrl) {
    const isProcessing = image && (image.generationStatus === "generating" || image.generationStatus === "pending");
    
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100 p-6">
        {isProcessing ? (
          <>
            {/* Processing spinner */}
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 border-4 border-amber-200 rounded-full" />
              <div className="absolute inset-0 border-4 border-amber-400 rounded-full border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-2xl">
                ✨
              </div>
            </div>
            <p className="text-amber-600 text-sm font-medium text-center">Transforming...</p>
            <p className="text-stone-400 text-xs text-center mt-1">This takes 10-30 seconds</p>
          </>
        ) : (
          <>
            {/* No upload yet */}
            <div className="w-16 h-16 rounded-full bg-stone-200 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-stone-400 text-sm text-center mb-3">📷 No photo uploaded</p>
            <a
              href={`/books/${page.bookId}/edit`}
              className="text-purple-600 hover:text-purple-700 text-xs font-medium underline"
            >
              Go to editor
            </a>
          </>
        )}
        <span className="absolute bottom-4 text-stone-300 text-xs font-medium" style={{ [side === "left" ? "left" : "right"]: "16px" }}>
          {pageNum}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {/* Full-bleed image */}
      <img
        src={imageUrl}
        alt={`Page ${pageNum}`}
        className="w-full h-full object-cover"
      />

      {/* Story text overlay at bottom if exists */}
      {page.storyText && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 pt-12">
          <p className="text-white text-sm leading-relaxed line-clamp-3" style={{ textShadow: "0 2px 8px rgba(0, 0, 0, 0.7), 0 1px 3px rgba(0, 0, 0, 0.8)" }}>
            {page.storyText}
          </p>
        </div>
      )}

      {/* Page number */}
      <span 
        className="absolute bottom-3 text-white/60 text-xs font-medium drop-shadow"
        style={{ [side === "left" ? "left" : "right"]: "12px" }}
      >
        {pageNum}
      </span>
    </div>
  );
}
