"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Doc } from "@/convex/_generated/dataModel";

type ImageWithUrls = Doc<"images"> & {
  originalUrl: string | null;
  cartoonUrl: string | null;
};

type PageWithImages = Doc<"pages"> & {
  images: ImageWithUrls[];
};

interface BookPreviewProps {
  book: Doc<"books">;
  pages: PageWithImages[];
  onOrderClick?: () => void;
}

// Custom hook for detecting mobile
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

export function BookPreview({ book, pages, onOrderClick }: BookPreviewProps) {
  const [currentSpread, setCurrentSpread] = useState(0); // 0 = cover, 1+ = page spreads
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next");
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);

  // On mobile, show single pages. On desktop, show spreads.
  // Mobile: cover (0), each page individually, back cover
  // Desktop: cover (0), pages in pairs, back cover
  const totalSpreads = isMobile
    ? pages.length + 2 // cover + each page + back
    : Math.ceil(pages.length / 2) + 2; // cover + page pairs + back

  const goToNextSpread = useCallback(() => {
    if (currentSpread < totalSpreads - 1 && !isFlipping) {
      setFlipDirection("next");
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentSpread((prev) => prev + 1);
        setIsFlipping(false);
      }, 400);
    }
  }, [currentSpread, totalSpreads, isFlipping]);

  const goToPrevSpread = useCallback(() => {
    if (currentSpread > 0 && !isFlipping) {
      setFlipDirection("prev");
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentSpread((prev) => prev - 1);
        setIsFlipping(false);
      }, 400);
    }
  }, [currentSpread, isFlipping]);

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

  // Touch/swipe handling
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 50;
      if (info.offset.x < -threshold) {
        goToNextSpread();
      } else if (info.offset.x > threshold) {
        goToPrevSpread();
      }
    },
    [goToNextSpread, goToPrevSpread]
  );

  // Get pages for current spread
  const getSpreadPages = () => {
    if (currentSpread === 0) return { type: "cover" as const };
    if (currentSpread === totalSpreads - 1) return { type: "back" as const };

    if (isMobile) {
      // Single page view for mobile
      const pageIndex = currentSpread - 1;
      return {
        type: "single" as const,
        page: pages[pageIndex],
        pageNum: pageIndex + 1,
      };
    }

    // Desktop: spread view (two pages)
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

  // Get current page info for display
  const getPageInfo = () => {
    if (currentSpread === 0) return "Cover";
    if (currentSpread === totalSpreads - 1) return "Back Cover";
    if (isMobile) {
      return `Page ${currentSpread}`;
    }
    return `Pages ${(currentSpread - 1) * 2 + 1}-${Math.min((currentSpread - 1) * 2 + 2, pages.length)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Ambient light effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-white truncate">{book.title}</h1>
            <p className="text-purple-300 text-xs md:text-sm mt-1 hidden sm:block">
              Preview your storybook
            </p>
          </div>
          <button
            onClick={onOrderClick}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold px-4 md:px-8 py-3 md:py-4 rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:shadow-amber-500/40 hover:scale-105 text-sm md:text-base whitespace-nowrap flex-shrink-0"
          >
            <span className="hidden sm:inline">Order This Book — </span>$44.99
          </button>
        </div>
      </header>

      {/* Book Display Area - with swipe support */}
      <motion.main
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-4 md:p-8 relative z-10 touch-pan-y"
        drag={isMobile ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
      >
        <div className="relative" style={{ perspective: "2000px" }}>
          {/* Book Shadow */}
          <div className="absolute -bottom-4 md:-bottom-8 left-1/2 -translate-x-1/2 w-[90%] h-4 md:h-8 bg-black/40 blur-xl rounded-full" />

          {/* The Book */}
          <div
            className="relative"
            style={{ transformStyle: "preserve-3d" }}
          >
            <AnimatePresence mode="wait">
              {spread.type === "cover" ? (
                <BookCover
                  key="cover"
                  title={book.title}
                  pageCount={pages.length}
                  onOpen={goToNextSpread}
                  isMobile={isMobile}
                />
              ) : spread.type === "back" ? (
                <BackCover
                  key="back"
                  title={book.title}
                  isMobile={isMobile}
                />
              ) : spread.type === "single" ? (
                <SinglePage
                  key={`page-${currentSpread}`}
                  page={spread.page}
                  pageNum={spread.pageNum}
                  totalPages={pages.length}
                  isFlipping={isFlipping}
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
                  isFlipping={isFlipping}
                  flipDirection={flipDirection}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.main>

      {/* Navigation */}
      <footer className="relative z-10 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Progress bar */}
          <div className="flex items-center justify-center gap-2 md:gap-4 mb-4 md:mb-6">
            <span className="text-purple-300 text-xs md:text-sm">
              {getPageInfo()}
            </span>
            <div className="flex gap-0.5 md:gap-1 max-w-[200px] overflow-x-auto">
              {Array.from({ length: totalSpreads }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => !isFlipping && setCurrentSpread(i)}
                  className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all flex-shrink-0 ${
                    i === currentSpread
                      ? "bg-amber-400 w-4 md:w-6"
                      : "bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
            <span className="text-purple-300 text-xs md:text-sm">
              {pages.length} pages
            </span>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-center gap-3 md:gap-6">
            <button
              onClick={goToPrevSpread}
              disabled={currentSpread === 0 || isFlipping}
              className="flex items-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm text-sm md:text-base"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="text-white/60 text-xs md:text-sm hidden md:block">
              {isMobile ? "Swipe or tap to navigate" : "Use arrow keys or click to navigate"}
            </div>

            <button
              onClick={goToNextSpread}
              disabled={currentSpread === totalSpreads - 1 || isFlipping}
              className="flex items-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm text-sm md:text-base"
            >
              <span className="hidden sm:inline">Next</span>
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Swipe hint for mobile */}
          {isMobile && (
            <p className="text-center text-white/40 text-xs mt-3">
              Swipe left or right to turn pages
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}

// Book Cover Component
function BookCover({
  title,
  pageCount,
  onOpen,
  isMobile = false,
}: {
  title: string;
  pageCount: number;
  onOpen: () => void;
  isMobile?: boolean;
}) {
  const size = isMobile ? "w-[280px] h-[350px]" : "w-[400px] h-[500px]";

  return (
    <motion.div
      initial={{ rotateY: -30, scale: 0.9, opacity: 0 }}
      animate={{ rotateY: 0, scale: 1, opacity: 1 }}
      exit={{ rotateY: 30, opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      onClick={onOpen}
      className="cursor-pointer group"
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Book spine and depth */}
      <div
        className="absolute left-0 top-0 bottom-0 w-3 md:w-4 bg-gradient-to-r from-purple-950 to-purple-900 rounded-l-sm"
        style={{
          transform: `translateX(${isMobile ? "-12px" : "-16px"}) rotateY(-90deg)`,
          transformOrigin: "right center"
        }}
      />

      {/* Main cover */}
      <div className={`relative ${size} bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 rounded-r-lg rounded-l-sm shadow-2xl overflow-hidden transition-transform group-hover:scale-[1.02]`}>
        {/* Texture overlay */}
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Decorative border */}
        <div className="absolute inset-3 md:inset-4 border-2 border-amber-400/30 rounded-lg" />
        <div className="absolute inset-5 md:inset-6 border border-amber-400/20 rounded-lg" />

        {/* Stars decoration */}
        <div className="absolute top-6 md:top-8 left-6 md:left-8 text-amber-400/60 text-xl md:text-2xl">✦</div>
        <div className="absolute top-10 md:top-12 right-10 md:right-12 text-amber-400/40 text-lg md:text-xl">✦</div>
        <div className="absolute bottom-16 md:bottom-20 left-10 md:left-12 text-amber-400/50 text-base md:text-lg">✦</div>
        <div className="absolute bottom-12 md:bottom-16 right-6 md:right-8 text-amber-400/30 text-xl md:text-2xl">✦</div>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-8 text-center">
          {/* Moon/sun decoration */}
          <div className={`${isMobile ? "w-14 h-14" : "w-20 h-20"} rounded-full bg-gradient-to-br from-amber-300 to-amber-500 mb-4 md:mb-6 shadow-lg shadow-amber-400/30`} />

          <h1 className={`${isMobile ? "text-xl" : "text-3xl"} font-bold text-white mb-2 drop-shadow-lg px-4`} style={{ fontFamily: "Georgia, serif" }}>
            {title}
          </h1>

          <div className="w-16 md:w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent my-3 md:my-4" />

          <p className="text-amber-200/80 text-xs md:text-sm">
            A personalized adventure
          </p>
          <p className="text-amber-200/60 text-xs mt-1">
            {pageCount} pages of magic
          </p>
        </div>

        {/* Click/Tap hint */}
        <div className="absolute bottom-4 md:bottom-6 left-0 right-0 text-center">
          <motion.p
            className="text-amber-300/80 text-xs md:text-sm"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {isMobile ? "Tap to open" : "Click to open"}
          </motion.p>
        </div>

        {/* Glossy reflection */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Page edges */}
      <div
        className="absolute right-0 top-2 bottom-2 w-1.5 md:w-2 bg-gradient-to-r from-amber-50 to-white rounded-r-sm"
        style={{ transform: `translateX(${isMobile ? "6px" : "8px"})` }}
      >
        {/* Page lines */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 h-px bg-gray-200"
            style={{ top: `${(i + 1) * 7.5}%` }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// Back Cover Component
function BackCover({ title, isMobile = false }: { title: string; isMobile?: boolean }) {
  const size = isMobile ? "w-[280px] h-[350px]" : "w-[400px] h-[500px]";

  return (
    <motion.div
      initial={{ rotateY: 30, scale: 0.9, opacity: 0 }}
      animate={{ rotateY: 0, scale: 1, opacity: 1 }}
      exit={{ rotateY: -30, opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className={`relative ${size} bg-gradient-to-br from-purple-700 via-purple-800 to-purple-950 rounded-l-lg rounded-r-sm shadow-2xl overflow-hidden`}>
        {/* Texture */}
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 md:p-12 text-center">
          <div className={`${isMobile ? "text-3xl mb-4" : "text-4xl mb-6"}`}>🌙</div>
          <p className={`text-purple-200 ${isMobile ? "text-base" : "text-lg"} italic mb-3 md:mb-4`} style={{ fontFamily: "Georgia, serif" }}>
            "The end of one adventure
            <br />is the beginning of another."
          </p>
          <div className="w-12 md:w-16 h-0.5 bg-purple-400/40 my-3 md:my-4" />
          <p className="text-purple-300/80 text-xs md:text-sm">
            {title}
          </p>
          <p className="text-purple-400/60 text-xs mt-3 md:mt-4">
            Made with love by
            <br />
            Before Bedtime Adventures
          </p>
        </div>

        {/* Glossy reflection */}
        <div className="absolute inset-0 bg-gradient-to-tl from-white/5 via-transparent to-transparent pointer-events-none" />
      </div>
    </motion.div>
  );
}

// Single Page Component (for mobile)
function SinglePage({
  page,
  pageNum,
  totalPages,
  isFlipping,
  flipDirection,
}: {
  page?: PageWithImages;
  pageNum: number;
  totalPages: number;
  isFlipping: boolean;
  flipDirection: "next" | "prev";
}) {
  return (
    <motion.div
      initial={{ x: flipDirection === "next" ? 100 : -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: flipDirection === "next" ? -100 : 100, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative"
    >
      <div className="w-[280px] h-[350px] bg-amber-50 rounded-lg shadow-2xl overflow-hidden">
        <StoryPage
          page={page}
          pageNum={pageNum}
          totalPages={totalPages}
          side="right"
          isMobile={true}
        />
      </div>
      {/* Page edges */}
      <div
        className="absolute right-0 top-2 bottom-2 w-1 bg-gradient-to-r from-amber-100 to-amber-50 rounded-r-sm"
        style={{ transform: "translateX(4px)" }}
      />
    </motion.div>
  );
}

// Open Book with Two Pages
function OpenBook({
  leftPage,
  rightPage,
  leftPageNum,
  rightPageNum,
  totalPages,
  isFlipping,
  flipDirection,
}: {
  leftPage?: PageWithImages;
  rightPage?: PageWithImages;
  leftPageNum: number;
  rightPageNum: number;
  totalPages: number;
  isFlipping: boolean;
  flipDirection: "next" | "prev";
}) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex"
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Book spine shadow */}
      <div className="absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 bg-gradient-to-r from-black/20 via-black/40 to-black/20 z-10 pointer-events-none" />

      {/* Left page */}
      <motion.div
        className="relative"
        animate={isFlipping && flipDirection === "prev" ? {
          rotateY: [0, -5, 0],
          transition: { duration: 0.6 }
        } : {}}
      >
        <div className="w-[400px] h-[500px] bg-amber-50 rounded-l-sm shadow-xl overflow-hidden">
          <StoryPage
            page={leftPage}
            pageNum={leftPageNum}
            totalPages={totalPages}
            side="left"
          />
        </div>
        {/* Page curl shadow */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/10 to-transparent pointer-events-none" />
      </motion.div>

      {/* Right page */}
      <motion.div
        className="relative"
        animate={isFlipping && flipDirection === "next" ? {
          rotateY: [0, 5, 0],
          transition: { duration: 0.6 }
        } : {}}
      >
        <div className="w-[400px] h-[500px] bg-amber-50 rounded-r-sm shadow-xl overflow-hidden">
          <StoryPage
            page={rightPage}
            pageNum={rightPageNum}
            totalPages={totalPages}
            side="right"
          />
        </div>
        {/* Page curl shadow */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/10 to-transparent pointer-events-none" />
      </motion.div>

      {/* Page edges on right side */}
      <div className="absolute right-0 top-2 bottom-2 w-1 bg-gradient-to-r from-amber-100 to-amber-50 rounded-r-sm"
        style={{ transform: "translateX(4px)" }}
      />
    </motion.div>
  );
}

// Individual Story Page
function StoryPage({
  page,
  pageNum,
  totalPages,
  side,
  isMobile = false,
}: {
  page?: PageWithImages;
  pageNum: number;
  totalPages: number;
  side: "left" | "right";
  isMobile?: boolean;
}) {
  // Get the cartoon image (or first image if no cartoon yet)
  const image = page?.images?.[0];
  const imageUrl = image?.cartoonUrl || image?.originalUrl;

  if (!page || pageNum > totalPages) {
    // Empty page
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className={`text-amber-300/50 ${isMobile ? "text-4xl" : "text-6xl"}`}>✦</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-amber-50 to-orange-50/50 relative">
      {/* Subtle paper texture */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Image area */}
      <div className={`flex-1 ${isMobile ? "p-3 pb-1" : "p-4 pb-2"}`}>
        <div className="w-full h-full rounded-lg overflow-hidden shadow-inner bg-white/50 relative">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={page.title || `Page ${pageNum}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
              <div className="text-center text-purple-300">
                <div className={`${isMobile ? "text-3xl" : "text-4xl"} mb-2`}>🎨</div>
                <p className="text-xs md:text-sm">Image coming soon</p>
              </div>
            </div>
          )}

          {/* Page title overlay */}
          {page.title && (
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent ${isMobile ? "p-3 pt-6" : "p-4 pt-8"}`}>
              <h3 className={`text-white font-bold ${isMobile ? "text-base" : "text-lg"} drop-shadow-lg`} style={{ fontFamily: "Georgia, serif" }}>
                {page.title}
              </h3>
            </div>
          )}
        </div>
      </div>

      {/* Story text area */}
      <div className={`${isMobile ? "p-3 pt-1" : "p-4 pt-2"}`}>
        <p
          className={`text-gray-800 ${isMobile ? "text-xs line-clamp-3" : "text-sm line-clamp-4"} leading-relaxed`}
          style={{ fontFamily: "Georgia, serif" }}
        >
          {page.storyText || (
            <span className="text-gray-400 italic">
              Add your story text in the editor...
            </span>
          )}
        </p>
      </div>

      {/* Page number */}
      <div className={`absolute ${isMobile ? "bottom-2" : "bottom-3"} ${side === "left" ? "left-3 md:left-4" : "right-3 md:right-4"} text-amber-400/60 text-xs font-medium`}>
        {pageNum}
      </div>

      {/* Decorative corner */}
      <div className={`absolute ${isMobile ? "top-2" : "top-3"} ${side === "left" ? "left-2 md:left-3" : "right-2 md:right-3"} text-amber-300/30 text-xs`}>
        ✦
      </div>
    </div>
  );
}
