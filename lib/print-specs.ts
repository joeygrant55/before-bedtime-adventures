/**
 * Print Specifications for Lulu Print-on-Demand
 *
 * These constants define the requirements for print-ready children's books.
 * All measurements are for an 8.5" x 8.5" square hardcover book.
 *
 * Sources:
 * - https://developers.lulu.com/
 * - https://help.api.lulu.com/en/support/solutions/articles/64000254609-pdf-creation-settings
 */

// Book dimensions (8.5" x 8.5" square format)
export const BOOK_TRIM_SIZE = {
  width: 8.5, // inches
  height: 8.5, // inches
};

// Bleed area - extends beyond trim, gets cut off during manufacturing
export const BLEED = {
  size: 0.125, // inches (3.18mm)
};

// Full page size including bleed
export const PAGE_SIZE_WITH_BLEED = {
  width: BOOK_TRIM_SIZE.width + (BLEED.size * 2), // 8.75"
  height: BOOK_TRIM_SIZE.height + (BLEED.size * 2), // 8.75"
};

// Safety margins - content must stay within these bounds
export const SAFETY_MARGIN = {
  interior: 0.25, // inches - for text and important content
  cover: 0.5, // inches - for cover text (more conservative)
};

// Safe content area (inside the safety margins)
export const SAFE_CONTENT_AREA = {
  width: BOOK_TRIM_SIZE.width - (SAFETY_MARGIN.interior * 2), // 8"
  height: BOOK_TRIM_SIZE.height - (SAFETY_MARGIN.interior * 2), // 8"
};

// DPI requirements
export const DPI = {
  minimum: 300,
  maximum: 600,
  recommended: 300,
};

// Pixel dimensions at 300 DPI
export const PIXELS_AT_300_DPI = {
  trimWidth: Math.round(BOOK_TRIM_SIZE.width * DPI.recommended), // 2550
  trimHeight: Math.round(BOOK_TRIM_SIZE.height * DPI.recommended), // 2550
  withBleedWidth: Math.round(PAGE_SIZE_WITH_BLEED.width * DPI.recommended), // 2625
  withBleedHeight: Math.round(PAGE_SIZE_WITH_BLEED.height * DPI.recommended), // 2625
  safeAreaWidth: Math.round(SAFE_CONTENT_AREA.width * DPI.recommended), // 2400
  safeAreaHeight: Math.round(SAFE_CONTENT_AREA.height * DPI.recommended), // 2400
};

// Calculate percentage-based margins for UI components
// These can be applied to relative positioning in the text overlay editor
export const MARGIN_PERCENTAGES = {
  // Safety margin as percentage of trim size
  safetyMargin: (SAFETY_MARGIN.interior / BOOK_TRIM_SIZE.width) * 100, // ~2.94%
  // Bleed as percentage of page with bleed
  bleed: (BLEED.size / PAGE_SIZE_WITH_BLEED.width) * 100, // ~1.43%
};

// Spine width calculation (based on page count)
// Formula from Lulu: pages × 0.0025" (for standard paper)
export function calculateSpineWidth(pageCount: number): number {
  return pageCount * 0.0025;
}

// Minimum page counts
export const PAGE_LIMITS = {
  minimum: 24, // Hardcover minimum
  maximum: 800,
  default: 24, // Default for children's books
};

// Color space
export const COLOR_SPACE = {
  preferred: 'sRGB', // Lulu prefers sRGB, converts to CMYK for print
  print: 'CMYK',
};

// Lulu Product Configuration
export const LULU_PRODUCT = {
  // Pod package ID components for 8.5x8.5 hardcover color
  trimSize: '0850X0850', // 8.5" x 8.5"
  color: 'FC', // Full Color
  printQuality: 'STD', // Standard
  binding: 'CW', // Case Wrap (Hardcover)
  paper: '060', // 60# paper
  finish: 'G', // Glossy
  linen: 'X', // No linen
  foil: 'X', // No foil
};

// Build full pod_package_id
export function buildPodPackageId(): string {
  const { trimSize, color, printQuality, binding, paper, finish, linen, foil } = LULU_PRODUCT;
  // Format: 0850X0850FCSTDCW060GXX (example, actual format may vary)
  return `${trimSize}${color}${printQuality}${binding}${paper}${finish}${linen}${foil}`;
}

// Font recommendations for children's books
export const FONTS = {
  storybook: {
    family: "Georgia, 'Times New Roman', serif",
    description: 'Classic fairy tale feel',
  },
  adventure: {
    family: "'Fredoka One', 'Comic Sans MS', cursive",
    description: 'Bold and fun',
  },
  playful: {
    family: "'Nunito', 'Quicksand', sans-serif",
    description: 'Rounded and friendly',
  },
  classic: {
    family: "'Lora', 'Palatino', serif",
    description: 'Timeless elegance',
  },
} as const;

export type FontFamily = keyof typeof FONTS;

// Font sizes mapped to print sizes
export const FONT_SIZES = {
  small: { label: 'Small', pixels: 14, printPt: '10pt' },
  medium: { label: 'Medium', pixels: 22, printPt: '16pt' },
  large: { label: 'Large', pixels: 36, printPt: '26pt' },
  title: { label: 'Title', pixels: 52, printPt: '38pt' },
} as const;

export type FontSize = keyof typeof FONT_SIZES;

/**
 * Calculate the total printed page count from the number of "stops" (user-created pages/spreads).
 * Each stop becomes 2 printed pages (image + text/second image).
 * Front/back matter is added for padding.
 * Lulu hardcover minimum is 24 pages.
 */
export function calculatePrintedPageCount(stopCount: number): number {
  const storyPages = stopCount * 2;
  const frontMatter = stopCount <= 9 ? 4 : 2;
  const backMatter = stopCount <= 9 ? 4 : 2;
  return Math.max(PAGE_LIMITS.minimum, frontMatter + storyPages + backMatter);
}
