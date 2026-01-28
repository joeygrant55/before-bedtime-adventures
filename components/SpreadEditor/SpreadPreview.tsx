"use client";

import { Doc } from "@/convex/_generated/dataModel";
import { PrintPagePreview, TrioPagePreview } from "./PrintPagePreview";

type ImageWithUrls = Doc<"images"> & {
  originalUrl: string | null;
  cartoonUrl: string | null;
  bakedUrl?: string | null;
};

type PageWithImages = Doc<"pages"> & {
  images: ImageWithUrls[];
};

interface SpreadPreviewProps {
  leftPage?: PageWithImages;
  rightPage?: PageWithImages;
  leftPageNumber: number;
  rightPageNumber: number;
  isCover?: boolean;
  isBackCover?: boolean;
  book?: Doc<"books">;
}

/**
 * SpreadPreview - Shows two pages side by side like an open book
 * 
 * Design elements:
 * - Subtle gutter/fold line between pages
 * - Book shadow on outer edges
 * - Supports different layout templates (single, duo, trio)
 */
export function SpreadPreview({
  leftPage,
  rightPage,
  leftPageNumber,
  rightPageNumber,
  isCover = false,
  isBackCover = false,
  book,
}: SpreadPreviewProps) {
  // Determine layout - check the left page's spreadLayout
  const spreadLayout = leftPage?.spreadLayout || "duo";

  // For "single" layout, the image spans both pages
  if (spreadLayout === "single" && leftPage) {
    return <SingleSpreadLayout page={leftPage} pageNumbers={[leftPageNumber, rightPageNumber]} />;
  }

  // For "trio" layout, show the special 3-photo layout (spans both pages)
  if (spreadLayout === "trio" && leftPage) {
    return <TrioSpreadLayout page={leftPage} pageNumbers={[leftPageNumber, rightPageNumber]} />;
  }

  // Default "duo" layout - one page on left, one on right
  return (
    <div className="flex items-center gap-0 relative">
      {/* Book shadow on left edge */}
      <div className="absolute -left-4 top-0 bottom-0 w-8 bg-gradient-to-r from-stone-300/40 to-transparent pointer-events-none z-10" />

      {/* Left page */}
      <div className="flex-1 min-w-0">
        {isCover && book ? (
          <CoverPage book={book} />
        ) : (
          <PrintPagePreview 
            page={leftPage} 
            pageNumber={leftPageNumber}
            isBlank={!leftPage}
          />
        )}
      </div>

      {/* Gutter/spine - subtle fold line between pages */}
      <div className="w-1 bg-gradient-to-r from-stone-300/60 via-stone-400/40 to-stone-300/60 self-stretch shadow-inner z-20" />

      {/* Right page */}
      <div className="flex-1 min-w-0">
        {isBackCover && book ? (
          <BackCoverPage book={book} />
        ) : (
          <PrintPagePreview 
            page={rightPage} 
            pageNumber={rightPageNumber}
            isBlank={!rightPage}
          />
        )}
      </div>

      {/* Book shadow on right edge */}
      <div className="absolute -right-4 top-0 bottom-0 w-8 bg-gradient-to-l from-stone-300/40 to-transparent pointer-events-none z-10" />
    </div>
  );
}

/**
 * SingleSpreadLayout - One image spanning both pages
 */
function SingleSpreadLayout({ 
  page, 
  pageNumbers 
}: { 
  page: PageWithImages; 
  pageNumbers: [number, number];
}) {
  const image = page.images?.[0];
  const imageUrl = image?.bakedUrl || image?.cartoonUrl;
  const caption = page.storyText || "";

  return (
    <div className="flex items-center gap-0 relative">
      {/* Shadows */}
      <div className="absolute -left-4 top-0 bottom-0 w-8 bg-gradient-to-r from-stone-300/40 to-transparent pointer-events-none z-10" />
      <div className="absolute -right-4 top-0 bottom-0 w-8 bg-gradient-to-l from-stone-300/40 to-transparent pointer-events-none z-10" />

      {/* Single page spanning both sides */}
      <div 
        className="relative bg-[#FFF8F0] shadow-lg flex-1"
        style={{ aspectRatio: "2 / 1" }} // Two 8.5x8.5 pages side by side = 17x8.5
      >
        <div className="w-full h-full flex flex-col p-[5%]">
          {/* Large image taking ~80% */}
          <div className="relative flex-[0.8] mb-4">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Spread image"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-stone-100 rounded-lg border-2 border-dashed border-stone-300">
                <div className="text-center">
                  <div className="text-5xl mb-2">📸</div>
                  <p className="text-stone-400">No image</p>
                </div>
              </div>
            )}
          </div>

          {/* Caption below */}
          <div className="flex-[0.15] flex items-center justify-center">
            {caption ? (
              <p className="text-center text-stone-800 leading-relaxed px-8 text-base md:text-lg font-serif">
                {caption}
              </p>
            ) : (
              <p className="text-stone-300 italic">Caption text goes here...</p>
            )}
          </div>

          {/* Page numbers */}
          <div className="absolute bottom-3 left-8">
            <span className="text-stone-400 font-serif text-[10px]">{pageNumbers[0]}</span>
          </div>
          <div className="absolute bottom-3 right-8">
            <span className="text-stone-400 font-serif text-[10px]">{pageNumbers[1]}</span>
          </div>
        </div>

        {/* Gutter in the middle */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-r from-stone-300/60 via-stone-400/40 to-stone-300/60 shadow-inner z-20" />
        
        {/* Border */}
        <div className="absolute inset-0 pointer-events-none border border-stone-200" />
      </div>
    </div>
  );
}

/**
 * TrioSpreadLayout - Three photos spanning both pages
 */
function TrioSpreadLayout({ 
  page, 
  pageNumbers 
}: { 
  page: PageWithImages; 
  pageNumbers: [number, number];
}) {
  const images = page.images || [];
  const caption = page.storyText || "";

  const getImageUrl = (img?: ImageWithUrls) => img?.bakedUrl || img?.cartoonUrl;

  return (
    <div className="flex items-center gap-0 relative">
      {/* Shadows */}
      <div className="absolute -left-4 top-0 bottom-0 w-8 bg-gradient-to-r from-stone-300/40 to-transparent pointer-events-none z-10" />
      <div className="absolute -right-4 top-0 bottom-0 w-8 bg-gradient-to-l from-stone-300/40 to-transparent pointer-events-none z-10" />

      {/* Spread spanning both pages */}
      <div 
        className="relative bg-[#FFF8F0] shadow-lg flex-1"
        style={{ aspectRatio: "2 / 1" }}
      >
        <div className="w-full h-full flex flex-col p-[5%]">
          {/* Image grid - 70% */}
          <div className="flex-[0.7] grid grid-cols-3 gap-3 mb-3">
            {/* First two images */}
            {[0, 1].map((idx) => {
              const img = images[idx];
              const url = getImageUrl(img);
              return (
                <div key={idx} className="relative col-span-1">
                  {url ? (
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-full bg-stone-100 rounded border border-dashed border-stone-300 flex items-center justify-center">
                      <span className="text-stone-300">📷</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Third image spanning bottom */}
            <div className="col-span-1 relative">
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
                    <span className="text-stone-300">📷</span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Caption area */}
          <div className="flex-[0.25] flex items-start justify-center pt-2">
            {caption ? (
              <p className="text-center text-stone-800 leading-relaxed px-8 text-sm md:text-base font-serif">
                {caption}
              </p>
            ) : (
              <p className="text-stone-300 text-sm italic">Caption text goes here...</p>
            )}
          </div>

          {/* Page numbers */}
          <div className="absolute bottom-3 left-8">
            <span className="text-stone-400 font-serif text-[10px]">{pageNumbers[0]}</span>
          </div>
          <div className="absolute bottom-3 right-8">
            <span className="text-stone-400 font-serif text-[10px]">{pageNumbers[1]}</span>
          </div>
        </div>

        {/* Gutter */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-r from-stone-300/60 via-stone-400/40 to-stone-300/60 shadow-inner z-20" />
        
        {/* Border */}
        <div className="absolute inset-0 pointer-events-none border border-stone-200" />
      </div>
    </div>
  );
}

/**
 * CoverPage - Renders the book cover
 */
function CoverPage({ book }: { book: Doc<"books"> }) {
  const coverDesign = book.coverDesign || {} as Partial<NonNullable<Doc<"books">["coverDesign"]>>;
  const title = coverDesign.title || book.title;
  const subtitle = coverDesign.subtitle;

  return (
    <div 
      className="relative bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 shadow-lg rounded-sm overflow-hidden"
      style={{ aspectRatio: "1 / 1" }}
    >
      <div className="absolute inset-0 bg-black/20" />
      
      <div className="relative w-full h-full flex flex-col items-center justify-center p-8 text-white text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-3 drop-shadow-lg">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-white/90 mb-2">{subtitle}</p>
        )}
        <p className="text-sm text-white/70 mt-4">
          A Before Bedtime Adventure
        </p>
      </div>

      {/* Page edge effect */}
      <div className="absolute right-0 top-4 bottom-4 w-2 bg-gradient-to-r from-white/20 to-white/40 rounded-r" />
      <div className="absolute inset-0 pointer-events-none border border-white/20 rounded-sm" />
    </div>
  );
}

/**
 * BackCoverPage - Renders the back cover
 */
function BackCoverPage({ book }: { book: Doc<"books"> }) {
  const dedication = book.coverDesign?.dedication;
  const title = book.coverDesign?.title || book.title;

  return (
    <div 
      className="relative bg-gradient-to-br from-stone-100 to-stone-50 shadow-lg rounded-sm overflow-hidden"
      style={{ aspectRatio: "1 / 1" }}
    >
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
        {dedication ? (
          <p className="text-stone-600 italic mb-6 max-w-[80%] leading-relaxed">
            "{dedication}"
          </p>
        ) : (
          <p className="text-stone-500 italic mb-6 leading-relaxed">
            "The end of one adventure<br />is the beginning of another."
          </p>
        )}

        <div className="w-12 h-px bg-stone-300 my-4" />

        <p className="text-stone-700 font-semibold text-sm">{title}</p>
        <p className="text-stone-400 text-xs mt-2">
          Made with Before Bedtime Adventures
        </p>
      </div>

      {/* Page edge effect */}
      <div className="absolute left-0 top-4 bottom-4 w-2 bg-gradient-to-l from-stone-200 to-white rounded-l" />
      <div className="absolute inset-0 pointer-events-none border border-stone-200 rounded-sm" />
    </div>
  );
}
