/**
 * Print Specifications for Lulu Integration
 *
 * Book Format: 8.5" × 8.5" Square Hardcover (Casewrap)
 * POD Package ID: 0850X0850FCPRECW080CW444MXX
 */

// Lulu POD Package ID breakdown:
// 0850X0850 = 8.5" x 8.5" trim size
// FC = Full Color
// PRE = Premium quality
// CW = Casewrap (hardcover)
// 080CW444 = 80# coated white paper, 444 PPI
// M = Matte finish
// XX = No linen, no foil
export const LULU_POD_PACKAGE_ID = "0850X0850FCPRECW080CW444MXX";

// Book format specifications
export const PRINT_SPECS = {
  // Trim size (final book dimensions)
  trimWidth: 8.5,  // inches
  trimHeight: 8.5, // inches

  // Bleed (extra area that gets trimmed off)
  bleed: 0.125, // inches on each side

  // Safety margin (keep important content inside this)
  safetyMargin: 0.25, // inches from trim edge

  // Interior page dimensions (with bleed)
  get interiorWidth() { return this.trimWidth + (this.bleed * 2); },  // 8.75"
  get interiorHeight() { return this.trimHeight + (this.bleed * 2); }, // 8.75"

  // Cover specifications
  coverWrap: 0.75,      // inches (wraps around hardcover board)
  coverOverhang: 0.125, // inches (expected variance)

  // Resolution
  dpi: 300,

  // Calculated pixel dimensions at 300 DPI
  get interiorWidthPx() { return Math.ceil(this.interiorWidth * this.dpi); },   // 2625
  get interiorHeightPx() { return Math.ceil(this.interiorHeight * this.dpi); }, // 2625

  // Points (for PDF generation, 72 points per inch)
  ppi: 72,
  get interiorWidthPts() { return this.interiorWidth * this.ppi; },   // 630
  get interiorHeightPts() { return this.interiorHeight * this.ppi; }, // 630

  // Page count constraints
  minPages: 24,
  maxPages: 800,

  // Pricing
  priceInCents: 4499, // $44.99
  estimatedCostInCents: 2000, // ~$20 (print + shipping)
};

// Spine width lookup table for hardcover casewrap
// Based on Lulu's official spine width table
const SPINE_WIDTH_TABLE: Array<{ minPages: number; maxPages: number; width: number }> = [
  { minPages: 24, maxPages: 84, width: 0.25 },
  { minPages: 85, maxPages: 140, width: 0.5 },
  { minPages: 141, maxPages: 168, width: 0.625 },
  { minPages: 169, maxPages: 194, width: 0.6875 },
  { minPages: 195, maxPages: 222, width: 0.75 },
  { minPages: 223, maxPages: 250, width: 0.8125 },
  { minPages: 251, maxPages: 278, width: 0.875 },
  { minPages: 279, maxPages: 306, width: 0.9375 },
  { minPages: 307, maxPages: 334, width: 1.0 },
  { minPages: 335, maxPages: 362, width: 1.0625 },
  { minPages: 363, maxPages: 390, width: 1.125 },
  { minPages: 391, maxPages: 418, width: 1.1875 },
  { minPages: 419, maxPages: 446, width: 1.25 },
  { minPages: 447, maxPages: 474, width: 1.3125 },
  { minPages: 475, maxPages: 502, width: 1.375 },
  { minPages: 503, maxPages: 530, width: 1.4375 },
  { minPages: 531, maxPages: 558, width: 1.5 },
  { minPages: 559, maxPages: 586, width: 1.5625 },
  { minPages: 587, maxPages: 614, width: 1.625 },
  { minPages: 615, maxPages: 642, width: 1.6875 },
  { minPages: 643, maxPages: 670, width: 1.75 },
  { minPages: 671, maxPages: 698, width: 1.8125 },
  { minPages: 699, maxPages: 726, width: 1.875 },
  { minPages: 727, maxPages: 754, width: 1.9375 },
  { minPages: 755, maxPages: 782, width: 2.0 },
  { minPages: 783, maxPages: 800, width: 2.125 },
];

/**
 * Get spine width in inches based on page count
 */
export function getSpineWidth(pageCount: number): number {
  const entry = SPINE_WIDTH_TABLE.find(
    (e) => pageCount >= e.minPages && pageCount <= e.maxPages
  );
  return entry?.width ?? 0.25; // Default to minimum
}

/**
 * Calculate total cover dimensions
 */
export function getCoverDimensions(pageCount: number) {
  const spineWidth = getSpineWidth(pageCount);
  const { trimWidth, trimHeight, coverWrap, bleed } = PRINT_SPECS;

  // Total cover width:
  // [bleed][wrap][back cover][wrap][spine][wrap][front cover][wrap][bleed]
  const totalWidth =
    (bleed * 2) +           // Outer bleeds
    (coverWrap * 4) +       // 4 wrap areas (2 per cover)
    (trimWidth * 2) +       // Front + back covers
    spineWidth;             // Spine

  // Total cover height:
  // [bleed][wrap][cover height][wrap][bleed]
  const totalHeight =
    (bleed * 2) +           // Top/bottom bleeds
    (coverWrap * 2) +       // Top/bottom wraps
    trimHeight;             // Cover height

  return {
    // Dimensions in inches
    width: totalWidth,
    height: totalHeight,
    spineWidth,

    // Dimensions in pixels at 300 DPI
    widthPx: Math.ceil(totalWidth * PRINT_SPECS.dpi),
    heightPx: Math.ceil(totalHeight * PRINT_SPECS.dpi),
    spineWidthPx: Math.ceil(spineWidth * PRINT_SPECS.dpi),

    // Dimensions in points for PDF
    widthPts: totalWidth * PRINT_SPECS.ppi,
    heightPts: totalHeight * PRINT_SPECS.ppi,
    spineWidthPts: spineWidth * PRINT_SPECS.ppi,

    // Layout positions (x coordinates from left, in points)
    backCoverX: bleed * PRINT_SPECS.ppi,
    spineX: (bleed + coverWrap + trimWidth + coverWrap) * PRINT_SPECS.ppi,
    frontCoverX: (bleed + coverWrap + trimWidth + coverWrap + spineWidth + coverWrap) * PRINT_SPECS.ppi,
  };
}

/**
 * Calculate printed page count from number of stops
 * Each stop = 1 spread = 2 printed pages
 * Plus front matter (title, dedication) and back matter (end page)
 */
export function calculatePrintedPageCount(stopCount: number): number {
  const storyPages = stopCount * 2; // Each stop = 2 pages (spread)

  // Front/back matter varies based on stop count to ensure minimum 24 pages
  let frontMatter: number;
  let backMatter: number;

  if (stopCount <= 9) {
    // Need more padding to reach 24 pages
    frontMatter = 4; // Title spread + intro/dedication spread
    backMatter = 4;  // End spread + collage/blank spread
  } else {
    // Standard front/back matter
    frontMatter = 2; // Title/dedication spread
    backMatter = 2;  // End spread
  }

  const totalPages = frontMatter + storyPages + backMatter;

  // Ensure minimum 24 pages
  return Math.max(PRINT_SPECS.minPages, totalPages);
}

/**
 * Stop count options for UI
 */
export const STOP_OPTIONS = [
  { stops: 8, label: "8 stops", description: "Perfect for a short trip" },
  { stops: 10, label: "10 stops", description: "Most popular", recommended: true },
  { stops: 12, label: "12 stops", description: "Great for longer adventures" },
  { stops: 14, label: "14 stops", description: "Maximum memories" },
].map((opt) => ({
  ...opt,
  pageCount: calculatePrintedPageCount(opt.stops),
}));

/**
 * Analyze image dimensions for print readiness
 */
export interface ImagePrintAnalysis {
  width: number;
  height: number;
  effectiveDpi: number;
  status: 'ready' | 'acceptable' | 'needs_upscale' | 'too_small';
  message: string;
  targetWidth: number;
  targetHeight: number;
  scaleFactor: number;
}

export function analyzeImageForPrint(width: number, height: number): ImagePrintAnalysis {
  const targetWidth = PRINT_SPECS.interiorWidthPx;  // 2625
  const targetHeight = PRINT_SPECS.interiorHeightPx; // 2625

  // Calculate effective DPI if printed at 8.5"
  const effectiveDpi = Math.min(width, height) / PRINT_SPECS.trimWidth;

  // Calculate scale factor needed
  const scaleFactor = Math.max(targetWidth / width, targetHeight / height);

  if (width >= targetWidth && height >= targetHeight) {
    return {
      width,
      height,
      effectiveDpi,
      status: 'ready',
      message: 'Image is print-ready at 300+ DPI',
      targetWidth,
      targetHeight,
      scaleFactor: 1,
    };
  }

  if (width >= 2000 && height >= 2000) {
    return {
      width,
      height,
      effectiveDpi,
      status: 'acceptable',
      message: 'Image quality is acceptable (235+ DPI)',
      targetWidth,
      targetHeight,
      scaleFactor,
    };
  }

  if (width >= 1000 && height >= 1000) {
    return {
      width,
      height,
      effectiveDpi,
      status: 'needs_upscale',
      message: 'Image will be upscaled for better print quality',
      targetWidth,
      targetHeight,
      scaleFactor,
    };
  }

  return {
    width,
    height,
    effectiveDpi,
    status: 'too_small',
    message: 'Image is too small for quality printing',
    targetWidth,
    targetHeight,
    scaleFactor,
  };
}

/**
 * Book structure for PDF generation
 */
export interface BookPage {
  pageNumber: number; // 1-based printed page number
  type: 'title' | 'dedication' | 'story_left' | 'story_right' | 'end' | 'blank';
  stopNumber?: number; // For story pages, which stop this belongs to
  isLeftPage: boolean; // Left pages are even, right pages are odd
}

export function generateBookStructure(stopCount: number): BookPage[] {
  const pages: BookPage[] = [];
  const printedPageCount = calculatePrintedPageCount(stopCount);

  // Front matter
  const frontMatterPages = stopCount <= 9 ? 4 : 2;

  // Page 1: Title (right page)
  pages.push({ pageNumber: 1, type: 'title', isLeftPage: false });

  // Page 2: Dedication (left page)
  pages.push({ pageNumber: 2, type: 'dedication', isLeftPage: true });

  // Extra front matter if needed
  if (frontMatterPages === 4) {
    pages.push({ pageNumber: 3, type: 'blank', isLeftPage: false });
    pages.push({ pageNumber: 4, type: 'blank', isLeftPage: true });
  }

  // Story pages
  let pageNum = frontMatterPages + 1;
  for (let stop = 1; stop <= stopCount; stop++) {
    // First page of spread (right page - odd number)
    pages.push({
      pageNumber: pageNum,
      type: 'story_right',
      stopNumber: stop,
      isLeftPage: false,
    });
    pageNum++;

    // Second page of spread (left page - even number)
    pages.push({
      pageNumber: pageNum,
      type: 'story_left',
      stopNumber: stop,
      isLeftPage: true,
    });
    pageNum++;
  }

  // Back matter
  const backMatterPages = printedPageCount - pageNum + 1;

  // End page
  pages.push({ pageNumber: pageNum, type: 'end', isLeftPage: pageNum % 2 === 0 });
  pageNum++;

  // Fill remaining with blank pages
  while (pageNum <= printedPageCount) {
    pages.push({ pageNumber: pageNum, type: 'blank', isLeftPage: pageNum % 2 === 0 });
    pageNum++;
  }

  return pages;
}

/**
 * US State codes for shipping validation
 */
export const US_STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia',
};
