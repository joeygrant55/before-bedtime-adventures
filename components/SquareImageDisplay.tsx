"use client";

import { cn } from "@/lib/utils";

// Crop settings type matching the schema
export type CropSettings = {
  scale: number;
  offsetX: number;
  offsetY: number;
  originalWidth: number;
  originalHeight: number;
};

// Size presets for the square display
const SIZE_CLASSES = {
  sm: "w-16 h-16",        // 64px - thumbnails
  md: "w-32 h-32",        // 128px - mini previews
  lg: "w-64 h-64",        // 256px - editor thumbnails
  xl: "w-96 h-96",        // 384px - medium preview
  full: "w-full aspect-square", // Responsive full-width
} as const;

type SquareImageDisplayProps = {
  src: string;
  alt: string;
  cropSettings?: CropSettings;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
  showPlaceholder?: boolean;
  onClick?: () => void;
};

/**
 * Reusable component for displaying images in a 1:1 square format
 * with optional crop settings for pan/zoom control.
 *
 * Used throughout the app to ensure consistent print-ready aspect ratio.
 */
export function SquareImageDisplay({
  src,
  alt,
  cropSettings,
  size = "full",
  className,
  showPlaceholder = true,
  onClick,
}: SquareImageDisplayProps) {
  // Calculate CSS transform based on crop settings
  const getImageStyle = (): React.CSSProperties => {
    if (!cropSettings) {
      // Default: cover the square area (may crop edges)
      return {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center",
      };
    }

    const { scale, offsetX, offsetY, originalWidth, originalHeight } = cropSettings;

    // Calculate the transform to apply the crop
    // Scale is applied first, then translate
    const translateX = offsetX; // Already in percentage
    const translateY = offsetY;

    return {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: "center",
      transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
      transformOrigin: "center center",
    };
  };

  const containerClasses = cn(
    SIZE_CLASSES[size],
    "relative overflow-hidden bg-gray-100 rounded-lg",
    onClick && "cursor-pointer hover:ring-2 hover:ring-purple-400 transition-all",
    className
  );

  if (!src && showPlaceholder) {
    return (
      <div className={containerClasses} onClick={onClick}>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-12 h-12 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses} onClick={onClick}>
      <img
        src={src}
        alt={alt}
        style={getImageStyle()}
        draggable={false}
      />
    </div>
  );
}

/**
 * Helper function to calculate default crop settings for an image
 * that will fit in a square frame.
 */
export function calculateDefaultCropSettings(
  originalWidth: number,
  originalHeight: number
): CropSettings {
  // For a square crop, we want to center the image
  // Scale of 1 means the image fits within the square (letterboxed if not square)
  // We calculate the minimum scale to cover the square (no letterboxing)

  const aspectRatio = originalWidth / originalHeight;

  // If wider than tall, we need to scale to fit height
  // If taller than wide, we need to scale to fit width
  const scale = aspectRatio > 1
    ? 1 / aspectRatio  // Wider: scale down
    : aspectRatio;     // Taller: scale down

  // But actually for "cover" behavior, we want minimum scale of 1
  // and center the image
  return {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    originalWidth,
    originalHeight,
  };
}
