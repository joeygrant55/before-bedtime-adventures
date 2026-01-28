"use client";

import { Doc } from "@/convex/_generated/dataModel";
import { FONTS, FONT_SIZES } from "@/lib/print-specs";

type ImageWithUrls = Doc<"images"> & {
  originalUrl: string | null;
  cartoonUrl: string | null;
  bakedUrl?: string | null;
};

type PageWithImages = Doc<"pages"> & {
  images: ImageWithUrls[];
};

interface PrintPagePreviewProps {
  page?: PageWithImages;
  pageNumber: number;
  isBlank?: boolean;
  layout?: "single" | "duo" | "trio";
}

/**
 * PrintPagePreview - Renders a single page as it will appear in print
 * 
 * Design specs matching Lulu 8.5" x 8.5" print:
 * - Page background: warm cream (#FFF8F0)
 * - Image area: 70-75% of page height
 * - Caption area: 25-30% (below image)
 * - Storybook serif font
 * - Page number at bottom center
 */
export function PrintPagePreview({ 
  page, 
  pageNumber, 
  isBlank = false,
  layout = "duo"
}: PrintPagePreviewProps) {
  // Get the primary image for this page
  const image = page?.images?.[0];
  const imageUrl = image?.bakedUrl || image?.cartoonUrl;
  const caption = page?.storyText || "";

  return (
    <div 
      className="relative bg-[#FFF8F0] shadow-lg rounded-sm overflow-hidden"
      style={{ aspectRatio: "1 / 1" }} // 8.5" x 8.5" square
    >
      {isBlank ? (
        // Blank page
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-stone-300 text-4xl">✦</div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col p-[5%]"> {/* 5% = ~0.4" margin */}
          {/* Image Area - 70% of page */}
          <div className="relative flex-[0.7] mb-4">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`Page ${pageNumber}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-stone-100 rounded-lg border-2 border-dashed border-stone-300">
                <div className="text-center">
                  <div className="text-4xl mb-2">📸</div>
                  <p className="text-stone-400 text-sm">No image</p>
                </div>
              </div>
            )}
          </div>

          {/* Caption Area - 25% of page */}
          <div className="flex-[0.25] flex flex-col items-center justify-start">
            {caption ? (
              <p 
                className="text-center text-stone-800 leading-relaxed px-4"
                style={{
                  fontFamily: FONTS.storybook.family,
                  fontSize: "clamp(12px, 1.5vw, 18px)", // Responsive 14-18pt equivalent
                  lineHeight: "1.6",
                }}
              >
                {caption}
              </p>
            ) : (
              <p className="text-stone-300 text-sm italic">
                Caption text goes here...
              </p>
            )}
          </div>

          {/* Page Number - Bottom center */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
            <span 
              className="text-stone-400 font-serif"
              style={{ fontSize: "10px" }}
            >
              {pageNumber}
            </span>
          </div>
        </div>
      )}

      {/* Subtle page shadow/border effect */}
      <div className="absolute inset-0 pointer-events-none border border-stone-200 rounded-sm" />
    </div>
  );
}

/**
 * TrioPagePreview - Special layout for 3 photos
 * Two images on top row (each 50% width), one spanning bottom
 */
export function TrioPagePreview({ 
  page, 
  pageNumber 
}: { 
  page?: PageWithImages; 
  pageNumber: number;
}) {
  const images = page?.images || [];
  const caption = page?.storyText || "";

  const getImageUrl = (img?: ImageWithUrls) => img?.bakedUrl || img?.cartoonUrl;

  return (
    <div 
      className="relative bg-[#FFF8F0] shadow-lg rounded-sm overflow-hidden"
      style={{ aspectRatio: "1 / 1" }}
    >
      <div className="w-full h-full flex flex-col p-[5%]">
        {/* Image Grid Area - 65% of page */}
        <div className="flex-[0.65] grid grid-rows-2 gap-2 mb-3">
          {/* Top row: 2 images side by side */}
          <div className="grid grid-cols-2 gap-2">
            {[0, 1].map((idx) => {
              const img = images[idx];
              const url = getImageUrl(img);
              return (
                <div key={idx} className="relative">
                  {url ? (
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-full bg-stone-100 rounded border border-dashed border-stone-300 flex items-center justify-center">
                      <span className="text-stone-300 text-xs">📷</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom row: 1 image spanning full width */}
          <div className="relative">
            {(() => {
              const img = images[2];
              const url = getImageUrl(img);
              return url ? (
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <div className="w-full h-full bg-stone-100 rounded border border-dashed border-stone-300 flex items-center justify-center">
                  <span className="text-stone-300 text-xs">📷</span>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Caption Area - More compact for trio */}
        <div className="flex-[0.3] flex flex-col items-center justify-start">
          {caption ? (
            <p 
              className="text-center text-stone-800 leading-relaxed px-3"
              style={{
                fontFamily: FONTS.storybook.family,
                fontSize: "clamp(10px, 1.3vw, 16px)", // Slightly smaller
                lineHeight: "1.5",
              }}
            >
              {caption}
            </p>
          ) : (
            <p className="text-stone-300 text-xs italic">
              Caption text goes here...
            </p>
          )}
        </div>

        {/* Page Number */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
          <span className="text-stone-400 font-serif text-[10px]">
            {pageNumber}
          </span>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none border border-stone-200 rounded-sm" />
    </div>
  );
}
