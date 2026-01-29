"use client";

import { use, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { SpreadEditor, CoverSpread, BackCoverSpread } from "@/components/SpreadEditor";
import { MobilePageEditor } from "@/components/SpreadEditor/MobilePageEditor";
import { WriteMyStoryButton } from "@/components/WriteMyStoryButton";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type ImageWithUrls = Doc<"images"> & {
  originalUrl: string | null;
  cartoonUrl: string | null;
  bakedUrl: string | null;
};

type PageWithImages = Doc<"pages"> & {
  images: ImageWithUrls[];
};

type SpreadLayout = "single" | "duo" | "trio";

// Helper to group pages into spreads
interface Spread {
  spreadIndex: number;
  leftPage: PageWithImages;
  rightPage?: PageWithImages;
  layout: SpreadLayout;
}

function groupPagesIntoSpreads(pages: PageWithImages[]): Spread[] {
  const spreads: Spread[] = [];
  for (let i = 0; i < pages.length; i += 2) {
    const leftPage = pages[i];
    const rightPage = pages[i + 1];
    const layout = (leftPage.spreadLayout as SpreadLayout) || "duo";
    
    spreads.push({
      spreadIndex: i / 2,
      leftPage,
      rightPage,
      layout,
    });
  }
  return spreads;
}

export default function BookEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const bookId = id as Id<"books">;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();

  // Mode: edit (default) or readthrough
  const mode = searchParams.get("mode") === "readthrough" ? "readthrough" : "edit";
  const isReadThrough = mode === "readthrough";

  // State
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Queries & Mutations
  const book = useQuery(api.books.getBook, { bookId });
  const pages = useQuery(api.pages.getBookPages, { bookId });
  const updateBookTitle = useMutation(api.books.updateBookTitle);
  const addSpread = useMutation(api.books.addSpread);
  const removePage = useMutation(api.books.removePage);
  const updateSpreadLayout = useMutation(api.pages.updateSpreadLayout);

  // Sync page index with spread index
  useEffect(() => {
    if (isMobile) {
      // Mobile: page index drives spread index
      const newSpreadIndex = Math.floor(currentPageIndex / 2);
      if (newSpreadIndex !== currentSpreadIndex) {
        setCurrentSpreadIndex(newSpreadIndex);
      }
    } else {
      // Desktop: spread index drives page index
      const newPageIndex = currentSpreadIndex * 2;
      if (newPageIndex !== currentPageIndex) {
        setCurrentPageIndex(newPageIndex);
      }
    }
  }, [isMobile, currentPageIndex, currentSpreadIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditingTitle) return;
      
      const allPages = pages as PageWithImages[] || [];
      const spreads = groupPagesIntoSpreads(allPages);
      
      if (isMobile) {
        // Mobile: navigate by pages
        if (e.key === "ArrowLeft" && currentPageIndex > 0) {
          setCurrentPageIndex(currentPageIndex - 1);
        } else if (e.key === "ArrowRight" && currentPageIndex < allPages.length - 1) {
          setCurrentPageIndex(currentPageIndex + 1);
        }
      } else {
        // Desktop: navigate by spreads
        if (e.key === "ArrowLeft" && currentSpreadIndex > 0) {
          setCurrentSpreadIndex(currentSpreadIndex - 1);
        } else if (e.key === "ArrowRight" && currentSpreadIndex < spreads.length - 1) {
          setCurrentSpreadIndex(currentSpreadIndex + 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSpreadIndex, currentPageIndex, isEditingTitle, pages, isMobile]);

  // Auto-play for read-through mode
  useEffect(() => {
    if (!isAutoPlaying || !pages) return;

    const spreads = groupPagesIntoSpreads(pages as PageWithImages[]);
    const interval = setInterval(() => {
      setCurrentSpreadIndex((current) => {
        if (current >= spreads.length - 1) {
          setIsAutoPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, pages]);

  if (!book || !pages) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-purple-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="text-gray-600">Loading your book...</p>
        </div>
      </div>
    );
  }

  // Group pages into spreads
  const spreads = groupPagesIntoSpreads(pages as PageWithImages[]);
  const currentSpread = spreads[currentSpreadIndex];

  // Progress calculations
  const allImages = pages.flatMap((page: PageWithImages) => page.images || []);
  const totalImages = allImages.length;
  const completedImages = allImages.filter((img: ImageWithUrls) => img.generationStatus === "completed").length;
  const isAllComplete = totalImages > 0 && completedImages === totalImages;

  // Check if book is ready to order (at least 5 spreads = 10 pages minimum)
  const isReadyToOrder = isAllComplete && spreads.length >= 5;

  // Handle title editing
  const handleStartEditingTitle = () => {
    setEditedTitle(book.title);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = async () => {
    if (!user || !editedTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }
    
    if (editedTitle.trim() !== book.title) {
      await updateBookTitle({
        clerkId: user.id,
        bookId,
        title: editedTitle.trim(),
      });
    }
    setIsEditingTitle(false);
  };

  const handleCancelEditingTitle = () => {
    setIsEditingTitle(false);
    setEditedTitle("");
  };

  // Handle add spread
  const handleAddSpread = async () => {
    if (!user) return;
    await addSpread({
      clerkId: user.id,
      bookId,
      spreadLayout: "duo", // Default
    });
    // Navigate to the new spread
    setCurrentSpreadIndex(spreads.length);
  };

  // Handle delete spread
  const handleDeleteSpread = async (spreadIndex: number) => {
    if (!user) return;
    const spread = spreads[spreadIndex];
    if (!spread) return;

    if (!confirm("Delete this spread? This will remove both pages.")) {
      return;
    }

    // Delete both pages in the spread
    await removePage({ clerkId: user.id, pageId: spread.leftPage._id });
    if (spread.rightPage) {
      await removePage({ clerkId: user.id, pageId: spread.rightPage._id });
    }

    // Navigate to previous spread if needed
    if (currentSpreadIndex >= spreads.length - 1 && currentSpreadIndex > 0) {
      setCurrentSpreadIndex(currentSpreadIndex - 1);
    }
  };

  // Handle layout change
  const handleLayoutChange = async (layout: SpreadLayout) => {
    if (!user || !currentSpread) return;
    await updateSpreadLayout({
      pageId: currentSpread.leftPage._id,
      spreadLayout: layout,
    });
    setShowTemplateSelector(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      {/* Minimal Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Left: Back arrow + Book title */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link
              href="/dashboard"
              className="text-gray-500 hover:text-gray-900 transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>

            {isEditingTitle ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") handleCancelEditingTitle();
                }}
                autoFocus
                className="text-lg font-bold text-gray-900 flex-1 bg-purple-50 border-2 border-purple-400 rounded px-3 py-1 outline-none min-w-0"
                style={{ fontSize: "16px" }}
              />
            ) : (
              <button
                onClick={handleStartEditingTitle}
                className="group text-lg font-bold text-gray-900 truncate flex-1 text-left hover:text-purple-600 transition-colors flex items-center gap-2 min-w-0"
              >
                <span className="truncate">{book.title}</span>
                <svg className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>

          {/* Right: Mode-specific actions */}
          {isReadThrough ? (
            <button
              onClick={() => router.push(`/books/${bookId}/edit`)}
              className="px-4 sm:px-6 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 flex-shrink-0 bg-white border-2 border-gray-200 hover:border-purple-400 text-gray-700 hover:text-purple-600 min-h-[44px]"
            >
              <span>✏️</span>
              <span className="hidden sm:inline">Edit</span>
            </button>
          ) : (
            <>
              {isReadyToOrder ? (
                <Link href={`/books/${bookId}/checkout`}>
                  <button className="px-4 sm:px-6 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 flex-shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md min-h-[44px]">
                    <span>📦</span>
                    <span className="hidden sm:inline">Order Book</span>
                    <span className="sm:hidden">Order</span>
                  </button>
                </Link>
              ) : (
                <button
                  onClick={() => router.push(`/books/${bookId}/edit?mode=readthrough`)}
                  className="px-4 sm:px-6 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 min-h-[44px]"
                >
                  <span>👁️</span>
                  <span className="hidden sm:inline">Preview</span>
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {/* Progress Indicator (edit mode only) */}
      {!isReadThrough && spreads.length > 0 && (
        <div className="bg-white border-b border-gray-100 py-3 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className={completedImages === totalImages && totalImages > 0 ? "text-green-600" : "text-gray-600"}>
                  {completedImages === totalImages && totalImages > 0 ? "✅" : "📸"}
                </span>
                <span className="text-gray-700">
                  {completedImages} of {totalImages} photos transformed
                </span>
              </div>
              <div className="w-px h-4 bg-gray-300" />
              <div className="flex items-center gap-2">
                <span className={spreads.length >= 5 ? "text-green-600" : "text-gray-600"}>
                  {spreads.length >= 5 ? "✅" : "📖"}
                </span>
                <span className="text-gray-700">
                  {spreads.length} of 5 spreads (min)
                </span>
              </div>
              {isReadyToOrder && (
                <>
                  <div className="w-px h-4 bg-gray-300" />
                  <div className="flex items-center gap-2 text-green-600 font-semibold">
                    <span>✨</span>
                    <span>Ready to order!</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col items-center px-4 ${isReadThrough ? "py-12" : "py-8 pb-48"}`}>
        {spreads.length === 0 ? (
          <div className="max-w-2xl w-full bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="text-6xl mb-4">📖</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Start Your Story</h3>
            <p className="text-gray-600 mb-6">
              Add your first spread to start building your storybook!
            </p>
            <div className="bg-white rounded-xl p-4 text-left max-w-md mx-auto">
              <p className="text-sm text-gray-600 mb-3 font-medium">✨ How it works:</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">1.</span>
                  <span>Each spread = 2 facing pages in your book</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">2.</span>
                  <span>Upload photos and watch them transform!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">3.</span>
                  <span>Add captions to tell your story</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">4.</span>
                  <span>Most books need 5-10 spreads (10-20 pages)</span>
                </li>
              </ul>
            <button
              onClick={handleAddSpread}
              className="px-8 py-4 mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold text-base transition-all shadow-md hover:shadow-lg flex items-center gap-2 min-h-[44px] mx-auto"
            >
              <span className="text-lg">+</span>
              <span>Add Your First Spread</span>
            </button>
            </div>
          </div>
        ) : currentSpread ? (
          <>
            {/* Desktop: The Spread (≥768px) */}
            <div className="hidden md:block w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSpreadIndex}
                  initial={isReadThrough ? { opacity: 0, x: 100 } : {}}
                  animate={isReadThrough ? { opacity: 1, x: 0 } : {}}
                  exit={isReadThrough ? { opacity: 0, x: -100 } : {}}
                  transition={{ duration: 0.4 }}
                  className={`w-full mx-auto ${isReadThrough ? "max-w-6xl" : "max-w-5xl"}`}
                >
                  {/* First spread: Cover Spread */}
                  {currentSpreadIndex === 0 ? (
                    <CoverSpread
                      bookId={bookId}
                      bookTitle={book.title}
                      coverDesign={book.coverDesign}
                      rightPage={currentSpread.leftPage}
                    />
                  ) : /* Last spread: Back Cover Spread */
                  currentSpreadIndex === spreads.length - 1 && spreads.length > 1 ? (
                    <BackCoverSpread
                      bookId={bookId}
                      coverDesign={book.coverDesign}
                      leftPage={currentSpread.leftPage}
                    />
                  ) : /* Normal content spreads */
                  (
                    <SpreadEditor
                      leftPage={currentSpread.leftPage}
                      rightPage={currentSpread.rightPage}
                      currentLayout={currentSpread.layout}
                      onLayoutChange={handleLayoutChange}
                      showTemplateSelector={!isReadThrough && showTemplateSelector}
                      onToggleTemplateSelector={() => setShowTemplateSelector(!showTemplateSelector)}
                      editable={!isReadThrough}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Mobile: Single Page View (<768px) */}
            <div className="md:hidden w-full">
              <MobilePageEditor
                pages={pages as PageWithImages[]}
                currentPageIndex={currentPageIndex}
                currentLayout={currentSpread.layout}
                onPageChange={setCurrentPageIndex}
                onLayoutChange={handleLayoutChange}
                showTemplateSelector={!isReadThrough && showTemplateSelector}
                onToggleTemplateSelector={() => setShowTemplateSelector(!showTemplateSelector)}
              />
            </div>

            {/* Spread Navigation */}
            <div className={`mt-12 flex flex-col items-center gap-6 ${isReadThrough ? "mt-16" : ""}`}>
              {/* Read-through mode toggle */}
              {!isReadThrough && (
                <button
                  onClick={() => router.push(`/books/${bookId}/edit?mode=readthrough`)}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-2 border-purple-200 text-purple-700 rounded-xl font-medium text-sm transition-all flex items-center gap-2 shadow-sm"
                >
                  <span>📖</span>
                  <span>Read Through</span>
                </button>
              )}

              {/* Auto-play button (read-through mode only) */}
              {isReadThrough && (
                <button
                  onClick={() => {
                    setIsAutoPlaying(!isAutoPlaying);
                    if (!isAutoPlaying && currentSpreadIndex === spreads.length - 1) {
                      setCurrentSpreadIndex(0);
                    }
                  }}
                  className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 shadow-sm ${
                    isAutoPlaying
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-700"
                  }`}
                >
                  <span>{isAutoPlaying ? "⏸" : "▶"}</span>
                  <span>{isAutoPlaying ? "Pause" : "Play"}</span>
                </button>
              )}

              {/* Arrow navigation + text */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    if (isMobile) {
                      setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
                    } else {
                      setCurrentSpreadIndex(Math.max(0, currentSpreadIndex - 1));
                    }
                  }}
                  disabled={isMobile ? currentPageIndex === 0 : currentSpreadIndex === 0}
                  className={`p-3 rounded-full transition-all shadow-sm min-h-[44px] min-w-[44px] flex items-center justify-center ${
                    isReadThrough
                      ? "bg-white hover:bg-gray-50 border-2 border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                      : "bg-white hover:bg-gray-50 border-2 border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  }`}
                  aria-label={isMobile ? "Previous page" : "Previous spread"}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <span className={`text-sm font-medium min-w-[120px] text-center ${isReadThrough ? "text-gray-800" : "text-gray-700"}`}>
                  {/* Desktop: Show spread count, Mobile: Show page count */}
                  <span className="hidden md:inline">
                    {isReadThrough ? `Page ${currentSpreadIndex + 1} of ${spreads.length}` : `Spread ${currentSpreadIndex + 1} of ${spreads.length}`}
                  </span>
                  <span className="md:hidden">
                    Page {currentPageIndex + 1} of {pages.length}
                  </span>
                </span>

                <button
                  onClick={() => {
                    if (isMobile) {
                      setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + 1));
                    } else {
                      setCurrentSpreadIndex(Math.min(spreads.length - 1, currentSpreadIndex + 1));
                    }
                  }}
                  disabled={isMobile ? currentPageIndex === pages.length - 1 : currentSpreadIndex === spreads.length - 1}
                  className={`p-3 rounded-full transition-all shadow-sm min-h-[44px] min-w-[44px] flex items-center justify-center ${
                    isReadThrough
                      ? "bg-white hover:bg-gray-50 border-2 border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                      : "bg-white hover:bg-gray-50 border-2 border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  }`}
                  aria-label={isMobile ? "Next page" : "Next spread"}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Dot indicators - Desktop only (mobile has its own in MobilePageEditor) */}
              <div className="hidden md:flex items-center gap-2">
                {spreads.map((spread, index) => {
                  const isFirst = index === 0;
                  const isLast = index === spreads.length - 1;
                  const isCurrent = index === currentSpreadIndex;

                  return (
                    <button
                      key={spread.spreadIndex}
                      onClick={() => setCurrentSpreadIndex(index)}
                      className="transition-all hover:scale-110"
                      aria-label={`Go to spread ${index + 1}`}
                      title={`Spread ${index + 1}${isFirst ? " (Cover)" : ""}${isLast ? " (Back Cover)" : ""}`}
                    >
                      {isFirst ? (
                        <span className={`text-2xl ${isCurrent ? "scale-125" : ""} inline-block transition-transform`}>
                          📕
                        </span>
                      ) : isLast ? (
                        <span className={`text-2xl ${isCurrent ? "scale-125" : ""} inline-block transition-transform`}>
                          📗
                        </span>
                      ) : (
                        <div
                          className={`w-3 h-3 rounded-full transition-all ${
                            isCurrent
                              ? "bg-purple-600 w-4 h-4"
                              : "bg-gray-300 hover:bg-gray-400"
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Bottom actions (edit mode only) */}
              {!isReadThrough && (
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-4 w-full sm:w-auto px-4 sm:px-0">
                  <WriteMyStoryButton
                    bookTitle={book.title}
                    pages={pages as PageWithImages[]}
                    variant="inline"
                  />

                  <button
                    onClick={handleAddSpread}
                    className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-purple-300 text-gray-700 hover:text-purple-600 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm min-h-[44px]"
                  >
                    <span>+</span>
                    <span>Add Spread</span>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
