"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Doc } from "@/convex/_generated/dataModel";

type ImageWithUrls = Doc<"images"> & {
  originalUrl: string | null;
  cartoonUrl: string | null;
  bakedUrl?: string | null;
};

type PageWithImages = Doc<"pages"> & {
  images: ImageWithUrls[];
};

type BookView = "front" | "spine" | "back";

type CoverTheme = "purple-magic" | "ocean-adventure" | "sunset-wonder" | "forest-dreams";

interface MiniBookPreviewProps {
  book: Doc<"books">;
  pages: PageWithImages[];
  currentView?: BookView;
  onViewChange?: (view: BookView) => void;
  onFullPreview?: () => void;
  size?: "small" | "medium" | "large";
  autoRotate?: boolean;
  coverHeroImage?: string | null;
}

const THEME_COLORS: Record<CoverTheme, { primary: string; spine: string; accent: string }> = {
  "purple-magic": {
    primary: "from-purple-600 via-purple-700 to-purple-900",
    spine: "from-purple-950 via-purple-900 to-purple-800",
    accent: "amber",
  },
  "ocean-adventure": {
    primary: "from-blue-600 via-blue-700 to-blue-900",
    spine: "from-blue-950 via-blue-900 to-blue-800",
    accent: "cyan",
  },
  "sunset-wonder": {
    primary: "from-orange-500 via-orange-600 to-red-800",
    spine: "from-red-950 via-orange-900 to-orange-800",
    accent: "amber",
  },
  "forest-dreams": {
    primary: "from-emerald-600 via-emerald-700 to-teal-900",
    spine: "from-emerald-950 via-emerald-900 to-teal-800",
    accent: "lime",
  },
};

// Square format to match Lulu 8.5x8.5 print specifications
const SIZE_CONFIG = {
  small: { width: 120, height: 120, spine: 20 },
  medium: { width: 200, height: 200, spine: 32 },
  large: { width: 280, height: 280, spine: 40 },
};

export function MiniBookPreview({
  book,
  pages,
  currentView: controlledView,
  onViewChange,
  onFullPreview,
  size = "medium",
  autoRotate = false,
  coverHeroImage: propCoverHeroImage,
}: MiniBookPreviewProps) {
  const [internalView, setInternalView] = useState<BookView>("front");
  const currentView = controlledView ?? internalView;

  const setView = (view: BookView) => {
    if (onViewChange) {
      onViewChange(view);
    } else {
      setInternalView(view);
    }
  };

  // Auto-rotate effect
  useEffect(() => {
    if (!autoRotate) return;
    const views: BookView[] = ["front", "spine", "back"];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % views.length;
      setView(views[index]);
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRotate]);

  // Get theme colors
  const theme = (book.coverDesign?.theme as CoverTheme) || "purple-magic";
  const colors = THEME_COLORS[theme];
  const { width, height, spine: spineWidth } = SIZE_CONFIG[size];

  // Get hero image - use prop if provided, otherwise first completed image (prefer baked)
  const allImages = pages.flatMap(p => p.images || []);
  const defaultHeroImage = allImages
    .find(img => img.generationStatus === "completed" && (img.bakedUrl || img.cartoonUrl));
  const heroImage = propCoverHeroImage || defaultHeroImage?.bakedUrl || defaultHeroImage?.cartoonUrl;

  // Get image collage for back cover - prefer baked URLs
  const collageImages = allImages
    .filter(img => img.generationStatus === "completed" && (img.bakedUrl || img.cartoonUrl))
    .slice(0, 4)
    .map(img => (img.bakedUrl || img.cartoonUrl) as string);

  // Title for display
  const displayTitle = book.coverDesign?.title || book.title;

  // Rotation angle based on view
  const getRotation = () => {
    switch (currentView) {
      case "front": return 0;
      case "spine": return -90;
      case "back": return -180;
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 3D Book Container */}
      <div
        className="relative cursor-pointer group"
        style={{
          perspective: "1000px",
          width: width + spineWidth,
          height: height,
        }}
        onClick={onFullPreview}
      >
        {/* Book wrapper for 3D rotation */}
        <motion.div
          className="relative w-full h-full"
          style={{
            transformStyle: "preserve-3d",
          }}
          animate={{
            rotateY: getRotation(),
          }}
          transition={{
            duration: 0.6,
            ease: "easeInOut",
          }}
        >
          {/* FRONT COVER */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${colors.primary} rounded-r-lg shadow-2xl overflow-hidden backface-hidden`}
            style={{
              width: width,
              height: height,
              transform: `translateZ(${spineWidth / 2}px)`,
              backfaceVisibility: "hidden",
            }}
          >
            {/* Texture */}
            <div className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Decorative border */}
            <div className="absolute inset-2 border border-amber-400/30 rounded-lg" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              {/* Hero image */}
              {heroImage ? (
                <div
                  className="rounded-lg overflow-hidden mb-3 shadow-lg border-2 border-white/20"
                  style={{ width: width * 0.5, height: width * 0.5 }}
                >
                  <img
                    src={heroImage}
                    alt="Cover"
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              ) : (
                <div
                  className="rounded-full bg-gradient-to-br from-amber-300 to-amber-500 mb-3 shadow-lg"
                  style={{ width: width * 0.25, height: width * 0.25 }}
                />
              )}

              {/* Title */}
              <h3
                className="text-white font-bold drop-shadow-lg px-2 leading-tight"
                style={{
                  fontSize: size === "small" ? "10px" : size === "medium" ? "14px" : "18px",
                  fontFamily: "Georgia, serif",
                }}
              >
                {displayTitle}
              </h3>

              {/* Subtitle */}
              {book.coverDesign?.subtitle && (
                <p
                  className="text-amber-200/80 mt-1"
                  style={{ fontSize: size === "small" ? "8px" : "10px" }}
                >
                  {book.coverDesign.subtitle}
                </p>
              )}
            </div>

            {/* Stars */}
            <div className="absolute top-3 left-3 text-amber-400/50 text-xs">✦</div>
            <div className="absolute bottom-3 right-3 text-amber-400/30 text-sm">✦</div>

            {/* Glossy effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* SPINE */}
          <div
            className={`absolute bg-gradient-to-b ${colors.spine} flex items-center justify-center overflow-hidden`}
            style={{
              width: spineWidth,
              height: height,
              left: 0,
              transform: `translateX(-${spineWidth / 2}px) rotateY(-90deg)`,
              transformOrigin: "right center",
            }}
          >
            {/* Texture */}
            <div className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Decorative lines */}
            <div className="absolute top-2 left-1 right-1 h-px bg-amber-400/40" />
            <div className="absolute bottom-2 left-1 right-1 h-px bg-amber-400/40" />

            {/* Small thumbnail on spine */}
            {heroImage && size !== "small" && (
              <div
                className="absolute top-4 left-1/2 -translate-x-1/2 rounded-sm overflow-hidden border border-amber-400/30 shadow-md"
                style={{ width: spineWidth - 8, height: spineWidth - 8 }}
              >
                <img
                  src={heroImage}
                  alt=""
                  className="w-full h-full object-cover object-center"
                />
              </div>
            )}

            {/* Vertical title */}
            <div
              className="text-amber-200 font-bold tracking-wider whitespace-nowrap"
              style={{
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                transform: "rotate(180deg)",
                fontSize: size === "small" ? "8px" : size === "medium" ? "10px" : "12px",
                maxHeight: height - (size === "small" ? 20 : 60),
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontFamily: "Georgia, serif",
                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                marginTop: heroImage && size !== "small" ? "24px" : "0",
              }}
            >
              {displayTitle}
            </div>

            {/* Star decoration */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-amber-400/50 text-xs">✦</div>

            {/* Highlight */}
            <div className="absolute inset-y-0 left-0 w-0.5 bg-gradient-to-r from-white/10 to-transparent" />
          </div>

          {/* BACK COVER */}
          <div
            className={`absolute bg-gradient-to-br ${colors.primary} rounded-l-lg shadow-2xl overflow-hidden`}
            style={{
              width: width,
              height: height,
              transform: `translateZ(-${spineWidth / 2}px) rotateY(180deg)`,
              backfaceVisibility: "hidden",
            }}
          >
            {/* Texture */}
            <div className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              {/* Image collage */}
              {collageImages.length > 0 && (
                <div className="grid grid-cols-2 gap-1 mb-3">
                  {collageImages.map((url, i) => (
                    <div
                      key={i}
                      className="rounded overflow-hidden border border-white/20"
                      style={{
                        width: size === "small" ? 20 : size === "medium" ? 32 : 44,
                        height: size === "small" ? 20 : size === "medium" ? 32 : 44,
                      }}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover object-center" />
                    </div>
                  ))}
                </div>
              )}

              {/* Dedication or quote */}
              {book.coverDesign?.dedication ? (
                <p
                  className="text-white/80 italic"
                  style={{
                    fontSize: size === "small" ? "7px" : "9px",
                    fontFamily: "Georgia, serif",
                  }}
                >
                  &ldquo;{book.coverDesign.dedication}&rdquo;
                </p>
              ) : (
                <p
                  className="text-white/60 italic"
                  style={{
                    fontSize: size === "small" ? "7px" : "9px",
                    fontFamily: "Georgia, serif",
                  }}
                >
                  A magical adventure
                </p>
              )}

              {/* Branding Logo */}
              <div className="mt-2">
                <Image
                  src="/logo.png"
                  alt="Before Bedtime Adventures"
                  width={size === "small" ? 24 : 40}
                  height={size === "small" ? 24 : 40}
                  className={`${size === "small" ? "w-6 h-6" : "w-10 h-10"} mx-auto opacity-70`}
                />
              </div>
            </div>

            {/* Glossy */}
            <div className="absolute inset-0 bg-gradient-to-tl from-white/5 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Page edges (right side when viewing front) */}
          <div
            className="absolute bg-gradient-to-r from-amber-100 to-white rounded-r-sm"
            style={{
              width: 4,
              height: height - 8,
              top: 4,
              right: -4,
              transform: `translateZ(${spineWidth / 2}px)`,
            }}
          />
        </motion.div>

        {/* Click hint */}
        {onFullPreview && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
            <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">
              Click to preview
            </span>
          </div>
        )}
      </div>

      {/* View Controls */}
      <div className="flex items-center gap-1 bg-slate-800/50 rounded-full p-1">
        {(["front", "spine", "back"] as BookView[]).map((view) => (
          <button
            key={view}
            onClick={() => setView(view)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              currentView === view
                ? "bg-purple-600 text-white shadow-md"
                : "text-purple-300 hover:text-white hover:bg-slate-700"
            }`}
          >
            {view === "front" ? "Front" : view === "spine" ? "Spine" : "Back"}
          </button>
        ))}
      </div>
    </div>
  );
}
