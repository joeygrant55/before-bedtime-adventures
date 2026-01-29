"use client";

import { useState, TouchEvent as ReactTouchEvent } from "react";
import { PhotoUploadSlot } from "./PhotoUploadSlot";
import { TemplateSelector } from "./TemplateSelector";
import { Id, Doc } from "@/convex/_generated/dataModel";

type TemplateType = "single" | "duo" | "trio";

type ImageWithUrls = Doc<"images"> & {
  originalUrl: string | null;
  cartoonUrl: string | null;
  bakedUrl: string | null;
};

type PageWithImages = Doc<"pages"> & {
  images: ImageWithUrls[];
};

interface MobilePageEditorProps {
  pages: PageWithImages[];
  currentPageIndex: number;
  currentLayout: TemplateType;
  onPageChange: (index: number) => void;
  onLayoutChange: (layout: TemplateType) => void;
  showTemplateSelector?: boolean;
  onToggleTemplateSelector?: () => void;
}

const SWIPE_THRESHOLD = 50; // 50px minimum swipe distance

export function MobilePageEditor({
  pages,
  currentPageIndex,
  currentLayout,
  onPageChange,
  onLayoutChange,
  showTemplateSelector,
  onToggleTemplateSelector,
}: MobilePageEditorProps) {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const currentPage = pages[currentPageIndex];
  const totalPages = pages.length;

  const handleTouchStart = (e: ReactTouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setTouchEnd(e.touches[0].clientX);
    setIsSwiping(false);
  };

  const handleTouchMove = (e: ReactTouchEvent) => {
    setTouchEnd(e.touches[0].clientX);
    const diff = Math.abs(touchStart - e.touches[0].clientX);
    if (diff > 10) {
      setIsSwiping(true);
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;

    const diff = touchStart - touchEnd;
    
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) {
        // Swiped left → next page
        if (currentPageIndex < totalPages - 1) {
          onPageChange(currentPageIndex + 1);
        }
      } else {
        // Swiped right → previous page
        if (currentPageIndex > 0) {
          onPageChange(currentPageIndex - 1);
        }
      }
    }
    
    setIsSwiping(false);
    setTouchStart(0);
    setTouchEnd(0);
  };

  if (!currentPage) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-500">
        No page available
      </div>
    );
  }

  const pageImages = currentPage.images || [];

  // Get image data for a specific slot
  const getImageForSlot = (index: number) => {
    const image = pageImages[index];
    if (!image) return undefined;

    return {
      _id: image._id,
      originalImageUrl: image.originalUrl || undefined,
      cartoonImageUrl: image.cartoonUrl || undefined,
      bakedImageUrl: image.bakedUrl || undefined,
      status: image.generationStatus,
    };
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Single Page View - Mobile */}
      <div
        className="relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Page container */}
        <div className="relative bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
          {/* Photo slots based on layout */}
          <div className="space-y-4">
            {/* Single layout - one large photo */}
            {currentLayout === "single" && (
              <div className="aspect-square">
                <PhotoUploadSlot
                  pageId={currentPage._id}
                  imageIndex={0}
                  image={getImageForSlot(0)}
                  aspectRatio="1/1"
                />
              </div>
            )}

            {/* Duo layout - one photo (each page gets one) */}
            {currentLayout === "duo" && (
              <div className="aspect-square">
                <PhotoUploadSlot
                  pageId={currentPage._id}
                  imageIndex={0}
                  image={getImageForSlot(0)}
                  aspectRatio="1/1"
                />
              </div>
            )}

            {/* Trio layout - varies by page */}
            {currentLayout === "trio" && (
              <>
                {/* Left page (even index) gets one photo */}
                {currentPageIndex % 2 === 0 ? (
                  <div className="aspect-square">
                    <PhotoUploadSlot
                      pageId={currentPage._id}
                      imageIndex={0}
                      image={getImageForSlot(0)}
                      aspectRatio="1/1"
                    />
                  </div>
                ) : (
                  /* Right page (odd index) gets two photos stacked */
                  <div className="space-y-4">
                    <div className="aspect-square">
                      <PhotoUploadSlot
                        pageId={currentPage._id}
                        imageIndex={0}
                        image={getImageForSlot(0)}
                        aspectRatio="1/1"
                      />
                    </div>
                    <div className="aspect-square">
                      <PhotoUploadSlot
                        pageId={currentPage._id}
                        imageIndex={1}
                        image={getImageForSlot(1)}
                        aspectRatio="1/1"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Caption area */}
            <div className="pt-2">
              <textarea
                placeholder="Add a caption..."
                rows={3}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all text-base"
                style={{ fontSize: "16px" }} // Prevent iOS zoom
              />
            </div>
          </div>

          {/* Page number */}
          <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-gray-400 font-serif">
            {currentPageIndex + 1}
          </div>
        </div>

        {/* Swipe direction indicators (subtle) */}
        {currentPageIndex > 0 && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
        )}
        {currentPageIndex < totalPages - 1 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Mobile Navigation - Page Counter */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          onClick={() => onPageChange(Math.max(0, currentPageIndex - 1))}
          disabled={currentPageIndex === 0}
          className="p-3 rounded-full bg-white hover:bg-gray-50 border-2 border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Previous page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span className="text-sm font-medium text-gray-700 min-w-[100px] text-center">
          Page {currentPageIndex + 1} of {totalPages}
        </span>

        <button
          onClick={() => onPageChange(Math.min(totalPages - 1, currentPageIndex + 1))}
          disabled={currentPageIndex === totalPages - 1}
          className="p-3 rounded-full bg-white hover:bg-gray-50 border-2 border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Next page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Page indicator dots */}
      <div className="mt-4 flex items-center justify-center gap-1.5 flex-wrap max-w-full overflow-x-auto px-4">
        {pages.map((_, index) => (
          <button
            key={index}
            onClick={() => onPageChange(index)}
            className="transition-all hover:scale-110 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={`Go to page ${index + 1}`}
          >
            <div
              className={`rounded-full transition-all ${
                index === currentPageIndex
                  ? "bg-purple-600 w-3 h-3"
                  : "bg-gray-300 hover:bg-gray-400 w-2 h-2"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Template Selector */}
      {showTemplateSelector && onToggleTemplateSelector && (
        <div className="mt-6">
          <TemplateSelector selected={currentLayout} onChange={onLayoutChange} />
        </div>
      )}
    </div>
  );
}
