# Lulu Print API Integration Plan

## Overview

Transform the current page-based book editor into a stop-based adventure creator that produces Lulu-compatible print-ready PDFs.

## Book Specifications (Fixed for MVP)

- **Format:** 8.5" × 8.5" Square Hardcover (Casewrap)
- **Interior:** Full color, premium 80# coated paper
- **Page count:** 24-32 pages (depending on stops)
- **POD Package ID:** `0850X0850FCPRECW080CW444MXX`
- **Price:** $44.99 (includes free shipping)
- **Shipping:** Ground only, US addresses only

## Print Specifications

### Interior Pages
- **Trim size:** 8.5" × 8.5"
- **With bleed:** 8.75" × 8.75" (0.125" bleed on all sides)
- **Safe area:** 8" × 8" (0.25" margin from trim)
- **Resolution:** 300 DPI minimum
- **Pixel dimensions:** 2625 × 2625 px (with bleed)
- **Color space:** sRGB (Lulu converts to CMYK)
- **Format:** Single multi-page PDF

### Cover
- **Spine width:** 0.25" (for 24-84 pages)
- **Wrap:** 0.75" on all edges (wraps around hardcover board)
- **Bleed:** 0.125" on outer edges
- **Total dimensions:** ~19.25" × 10.25" (varies by page count)
- **Format:** Single-page PDF (back + spine + front as one spread)

### Cover Dimension Formula
```
Width = (trim + wrap×2 + bleed) × 2 + spine
      = (8.5 + 1.5 + 0.125) × 2 + 0.25
      = 10.125 × 2 + 0.25
      = 20.5"

Height = trim + wrap×2 + bleed×2
       = 8.5 + 1.5 + 0.25
       = 10.25"
```

---

## Phase 1: Schema & Data Model Changes

### 1.1 Rename `pages` → `stops`

```typescript
// convex/schema.ts

stops: defineTable({
  bookId: v.id("books"),
  stopNumber: v.number(),           // 1-14
  locationName: v.string(),         // "Magic Kingdom"
  storyText: v.string(),            // The narrative text

  // Layout options (future)
  spreadType: v.union(
    v.literal("single_image"),      // One image fills spread
    v.literal("two_images"),        // One image per page
  ),

  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_book", ["bookId"])
.index("by_book_and_stop", ["bookId", "stopNumber"]),
```

### 1.2 Update `books` table

```typescript
books: defineTable({
  userId: v.id("users"),
  title: v.string(),
  subtitle: v.optional(v.string()),
  authorLine: v.string(),

  // Stop-based structure
  stopCount: v.number(),            // 8-14, user chosen
  pageCount: v.number(),            // Calculated: varies by stopCount

  // Print specifications
  format: v.literal("SQUARE_85_HARDCOVER"),
  podPackageId: v.literal("0850X0850FCPRECW080CW444MXX"),

  // Cover design
  coverDesign: v.optional(v.object({
    heroImageId: v.optional(v.id("_storage")),
    title: v.string(),
    subtitle: v.optional(v.string()),
    authorLine: v.string(),
    dedication: v.optional(v.string()),
    theme: v.union(
      v.literal("purple-magic"),
      v.literal("ocean-adventure"),
      v.literal("sunset-wonder"),
      v.literal("forest-dreams"),
    ),
  })),

  // Print readiness
  printStatus: v.union(
    v.literal("editing"),           // Still working on book
    v.literal("ready_for_pdf"),     // All images complete
    v.literal("generating_pdfs"),   // Creating print files
    v.literal("pdfs_ready"),        // Ready to order
    v.literal("ordered"),           // Sent to Lulu
  ),

  // Generated PDFs (stored in Convex)
  interiorPdfId: v.optional(v.id("_storage")),
  coverPdfId: v.optional(v.id("_storage")),

  status: v.union(/* existing */),
  createdAt: v.number(),
  updatedAt: v.number(),
}),
```

### 1.3 Update `images` table

```typescript
images: defineTable({
  stopId: v.id("stops"),            // Changed from pageId

  originalImageId: v.id("_storage"),
  cartoonImageId: v.optional(v.id("_storage")),
  generationStatus: v.union(/* existing */),

  // Print readiness
  printReadyImageId: v.optional(v.id("_storage")),
  printDimensions: v.optional(v.object({
    width: v.number(),              // pixels
    height: v.number(),
    needsUpscale: v.boolean(),
  })),

  // Existing fields
  bakedImageId: v.optional(v.id("_storage")),
  textOverlays: v.optional(/* ... */),
  order: v.number(),
  cropSettings: v.optional(/* ... */),

  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_stop", ["stopId"])
.index("by_generation_status", ["generationStatus"]),
```

### 1.4 Update `printOrders` table

```typescript
printOrders: defineTable({
  bookId: v.id("books"),

  // Lulu integration
  luluPrintJobId: v.optional(v.string()),
  luluStatus: v.optional(v.string()),
  trackingNumber: v.optional(v.string()),
  trackingUrl: v.optional(v.string()),

  // Our status tracking
  status: v.union(
    v.literal("pending_payment"),
    v.literal("payment_received"),
    v.literal("generating_pdfs"),
    v.literal("submitting_to_lulu"),
    v.literal("submitted"),
    v.literal("in_production"),
    v.literal("shipped"),
    v.literal("delivered"),
    v.literal("failed"),
  ),

  // Shipping (US only for MVP)
  shippingAddress: v.object({
    name: v.string(),
    street1: v.string(),
    street2: v.optional(v.string()),
    city: v.string(),
    stateCode: v.string(),          // 2-letter code
    postalCode: v.string(),
    countryCode: v.literal("US"),
    phoneNumber: v.string(),
  }),

  // Pricing
  price: v.number(),                // 4499 ($44.99)
  luluCost: v.optional(v.number()), // What Lulu charges us

  // PDF URLs (for Lulu to fetch)
  interiorPdfUrl: v.optional(v.string()),
  coverPdfUrl: v.optional(v.string()),

  // Timestamps
  createdAt: v.number(),
  paidAt: v.optional(v.number()),
  submittedAt: v.optional(v.number()),
  shippedAt: v.optional(v.number()),
}),
```

---

## Phase 2: Page Count Logic

### 2.1 Stop-to-Page Mapping

```typescript
// lib/book-structure.ts

interface BookStructure {
  stopCount: number;
  pageCount: number;
  structure: PageAllocation[];
}

interface PageAllocation {
  pageNumber: number;
  type: 'title' | 'dedication' | 'story' | 'end' | 'collage' | 'blank';
  stopNumber?: number;  // For story pages
  side: 'left' | 'right';
}

function calculateBookStructure(stopCount: number): BookStructure {
  // Minimum 24 pages required
  // Each stop = 2 pages (spread)
  // Need front/back matter to reach 24

  const storyPages = stopCount * 2;

  let frontMatter: number;
  let backMatter: number;

  if (stopCount <= 9) {
    // Need more padding to reach 24
    frontMatter = 4;  // Title, intro, dedication, character page
    backMatter = 4;   // The End, collage, about, blank
  } else {
    // Standard front/back matter
    frontMatter = 2;  // Title spread
    backMatter = 2;   // End spread
  }

  const pageCount = frontMatter + storyPages + backMatter;

  // Ensure we hit 24 minimum
  const finalPageCount = Math.max(24, pageCount);

  return {
    stopCount,
    pageCount: finalPageCount,
    structure: generateStructure(stopCount, finalPageCount),
  };
}

// Stop options for UI
const STOP_OPTIONS = [
  { stops: 8,  pages: 24, label: "8 stops (24 pages)" },
  { stops: 10, pages: 24, label: "10 stops (24 pages)" },
  { stops: 12, pages: 28, label: "12 stops (28 pages)" },
  { stops: 14, pages: 32, label: "14 stops (32 pages)" },
];
```

### 2.2 Default Book Structure (10 stops, 24 pages)

```
Page 1  (right): Title page - hero image + title
Page 2  (left):  Dedication - "For [name]..."
─────────────────────────────────────────────────
Page 3  (right): Stop 1 - Image
Page 4  (left):  Stop 1 - Image or text
─────────────────────────────────────────────────
Page 5  (right): Stop 2 - Image
Page 6  (left):  Stop 2 - Image or text
─────────────────────────────────────────────────
... (Stops 3-9) ...
─────────────────────────────────────────────────
Page 21 (right): Stop 10 - Image
Page 22 (left):  Stop 10 - Image or text
─────────────────────────────────────────────────
Page 23 (right): "The End" with small collage
Page 24 (left):  Blank or colophon
```

---

## Phase 3: Image Resolution & Upscaling

### 3.1 Resolution Requirements

```typescript
// lib/print-requirements.ts

const PRINT_REQUIREMENTS = {
  // Minimum for acceptable print quality
  minDPI: 300,

  // Target dimensions for 8.5" × 8.5" with bleed
  targetWidth: 2625,   // 8.75" × 300 DPI
  targetHeight: 2625,

  // Minimum acceptable (will show warning)
  minWidth: 2000,
  minHeight: 2000,

  // Below this, we must upscale
  upscaleThreshold: 1500,
};

interface ImageAnalysis {
  width: number;
  height: number;
  dpi: number;            // Calculated for 8.5" print
  status: 'ready' | 'acceptable' | 'needs_upscale' | 'too_small';
  recommendation: string;
}

function analyzeImageForPrint(width: number, height: number): ImageAnalysis {
  const printSizeInches = 8.5;
  const effectiveDPI = Math.min(width, height) / printSizeInches;

  if (width >= 2625 && height >= 2625) {
    return {
      width, height,
      dpi: effectiveDPI,
      status: 'ready',
      recommendation: 'Image is print-ready at 300+ DPI',
    };
  }

  if (width >= 2000 && height >= 2000) {
    return {
      width, height,
      dpi: effectiveDPI,
      status: 'acceptable',
      recommendation: 'Image quality is acceptable but not optimal',
    };
  }

  if (width >= 1500 && height >= 1500) {
    return {
      width, height,
      dpi: effectiveDPI,
      status: 'needs_upscale',
      recommendation: 'Image will be upscaled for print quality',
    };
  }

  return {
    width, height,
    dpi: effectiveDPI,
    status: 'too_small',
    recommendation: 'Image is too small for quality printing',
  };
}
```

### 3.2 Upscaling Strategy

For images below 2625×2625, we have options:

**Option A: Request larger from Gemini**
- Modify the transformation prompt to request higher resolution
- Gemini can output up to 1024×1024 natively (not enough)
- May need multiple passes or different approach

**Option B: AI Upscaling Service**
- Use Real-ESRGAN or similar
- Can 4x upscale: 1024 → 4096
- Adds processing time and potential cost

**Option C: Accept what we get**
- Gemini outputs ~1024×1024
- For 8.5" print, that's ~120 DPI
- Not ideal but may be acceptable for stylized cartoon images

**Recommendation for MVP:**
1. First, test what resolution Gemini actually outputs
2. If < 2000px, implement simple upscaling using Sharp (Node.js)
3. Sharp can do basic bicubic upscaling in Convex Actions
4. Quality may be acceptable for cartoon-style images

```typescript
// convex/upscaleImage.ts

import sharp from 'sharp';

export const upscaleForPrint = action({
  args: { imageId: v.id("_storage") },
  handler: async (ctx, { imageId }) => {
    const imageBlob = await ctx.storage.get(imageId);
    const buffer = Buffer.from(await imageBlob!.arrayBuffer());

    // Get current dimensions
    const metadata = await sharp(buffer).metadata();
    const { width, height } = metadata;

    // Calculate scale factor to reach 2625px
    const targetSize = 2625;
    const scaleFactor = Math.max(
      targetSize / width!,
      targetSize / height!
    );

    if (scaleFactor <= 1) {
      // Already large enough
      return imageId;
    }

    // Upscale using Lanczos (high quality)
    const upscaled = await sharp(buffer)
      .resize(
        Math.ceil(width! * scaleFactor),
        Math.ceil(height! * scaleFactor),
        { kernel: 'lanczos3' }
      )
      .jpeg({ quality: 95 })
      .toBuffer();

    // Store upscaled version
    const newId = await ctx.storage.store(
      new Blob([upscaled], { type: 'image/jpeg' })
    );

    return newId;
  },
});
```

---

## Phase 4: PDF Generation

### 4.1 Dependencies

```bash
npm install pdf-lib sharp
```

### 4.2 Interior PDF Generation

```typescript
// convex/generateInteriorPdf.ts

import { PDFDocument, rgb } from 'pdf-lib';

export const generateInteriorPdf = action({
  args: { bookId: v.id("books") },
  handler: async (ctx, { bookId }) => {
    // Fetch book and all stops with images
    const book = await ctx.runQuery(api.books.get, { bookId });
    const stops = await ctx.runQuery(api.stops.getByBook, { bookId });

    // Create PDF document
    const pdf = PDFDocument.create();

    // Page dimensions with bleed (in points, 72 per inch)
    const pageWidth = 8.75 * 72;   // 630 points
    const pageHeight = 8.75 * 72;

    // Add title page
    await addTitlePage(pdf, book, pageWidth, pageHeight);

    // Add dedication page
    await addDedicationPage(pdf, book, pageWidth, pageHeight);

    // Add story pages (each stop = 2 pages)
    for (const stop of stops) {
      const images = await ctx.runQuery(api.images.getByStop, {
        stopId: stop._id
      });

      await addStorySpread(pdf, stop, images, pageWidth, pageHeight);
    }

    // Add end pages
    await addEndPages(pdf, book, pageWidth, pageHeight);

    // Save PDF
    const pdfBytes = await pdf.save();

    // Store in Convex
    const pdfId = await ctx.storage.store(
      new Blob([pdfBytes], { type: 'application/pdf' })
    );

    // Update book with PDF reference
    await ctx.runMutation(api.books.updatePdf, {
      bookId,
      interiorPdfId: pdfId,
    });

    return pdfId;
  },
});

async function addStorySpread(
  pdf: PDFDocument,
  stop: Stop,
  images: Image[],
  width: number,
  height: number
) {
  // Page 1 of spread: Primary image
  const page1 = pdf.addPage([width, height]);
  if (images[0]?.bakedImageId || images[0]?.cartoonImageId) {
    const imageId = images[0].bakedImageId || images[0].cartoonImageId;
    // Fetch and embed image...
    const imageBytes = await fetchImageFromStorage(imageId);
    const image = await pdf.embedJpg(imageBytes);
    page1.drawImage(image, {
      x: 0,
      y: 0,
      width: width,
      height: height,
    });
  }

  // Page 2 of spread: Second image or text
  const page2 = pdf.addPage([width, height]);
  if (images[1]?.bakedImageId || images[1]?.cartoonImageId) {
    // Draw second image
  } else {
    // Draw story text
    // ... text rendering with fonts
  }
}
```

### 4.3 Cover PDF Generation

```typescript
// convex/generateCoverPdf.ts

export const generateCoverPdf = action({
  args: { bookId: v.id("books") },
  handler: async (ctx, { bookId }) => {
    const book = await ctx.runQuery(api.books.get, { bookId });

    // Calculate dimensions
    const trimSize = 8.5 * 72;           // 612 points
    const wrap = 0.75 * 72;              // 54 points
    const bleed = 0.125 * 72;            // 9 points
    const spineWidth = getSpineWidth(book.pageCount) * 72;

    // Total cover dimensions
    const coverWidth = (trimSize + wrap * 2 + bleed) * 2 + spineWidth;
    const coverHeight = trimSize + wrap * 2 + bleed * 2;

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([coverWidth, coverHeight]);

    // Layout:
    // [bleed][wrap][BACK COVER][wrap][SPINE][wrap][FRONT COVER][wrap][bleed]

    // Draw background/theme
    await drawCoverBackground(page, book.coverDesign.theme);

    // Draw back cover (left side)
    const backCoverX = bleed;
    await drawBackCover(page, book, backCoverX, wrap);

    // Draw spine (center)
    const spineX = bleed + wrap + trimSize + wrap;
    await drawSpine(page, book, spineX, spineWidth);

    // Draw front cover (right side)
    const frontCoverX = spineX + spineWidth + wrap;
    await drawFrontCover(page, book, frontCoverX, wrap, trimSize);

    // Save and store
    const pdfBytes = await pdf.save();
    const pdfId = await ctx.storage.store(
      new Blob([pdfBytes], { type: 'application/pdf' })
    );

    await ctx.runMutation(api.books.updatePdf, {
      bookId,
      coverPdfId: pdfId,
    });

    return pdfId;
  },
});

function getSpineWidth(pageCount: number): number {
  // Hardcover spine width table
  const table = [
    { min: 24, max: 84, width: 0.25 },
    { min: 85, max: 140, width: 0.5 },
    { min: 141, max: 168, width: 0.625 },
    // ... more entries
  ];

  const entry = table.find(e => pageCount >= e.min && pageCount <= e.max);
  return entry?.width ?? 0.25;
}
```

---

## Phase 5: Lulu API Integration

### 5.1 Environment Variables

```env
# .env.local (add to existing)
LULU_API_URL=https://api.sandbox.lulu.com  # Use https://api.lulu.com for production
LULU_AUTH_URL=https://api.sandbox.lulu.com/auth/realms/glasstree/protocol/openid-connect/token
```

### 5.2 Authentication

```typescript
// convex/lulu/auth.ts

interface LuluTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export async function getLuluAccessToken(): Promise<string> {
  const response = await fetch(process.env.LULU_AUTH_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.LULU_CLIENT_KEY!,
      client_secret: process.env.LULU_CLIENT_SECRET!,
    }),
  });

  if (!response.ok) {
    throw new Error(`Lulu auth failed: ${response.status}`);
  }

  const data: LuluTokenResponse = await response.json();
  return data.access_token;
}
```

### 5.3 Create Print Job

```typescript
// convex/lulu/createPrintJob.ts

interface LuluPrintJobRequest {
  contact_email: string;
  external_id: string;
  shipping_address: {
    name: string;
    street1: string;
    street2?: string;
    city: string;
    state_code: string;
    postcode: string;
    country_code: string;
    phone_number: string;
  };
  shipping_option_level: 'MAIL' | 'GROUND' | 'EXPEDITED' | 'EXPRESS';
  line_items: Array<{
    external_id: string;
    title: string;
    cover_source_url: string;
    interior_source_url: string;
    pod_package_id: string;
    quantity: number;
  }>;
}

interface LuluPrintJobResponse {
  id: number;
  status: {
    name: string;
    message?: string;
  };
  line_items: Array<{
    id: number;
    tracking_id?: string;
    tracking_urls?: string[];
  }>;
}

export const submitToLulu = action({
  args: { orderId: v.id("printOrders") },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.runQuery(api.orders.get, { orderId });
    const book = await ctx.runQuery(api.books.get, { bookId: order.bookId });

    // Get PDF URLs from Convex storage
    const interiorUrl = await ctx.storage.getUrl(book.interiorPdfId!);
    const coverUrl = await ctx.storage.getUrl(book.coverPdfId!);

    const token = await getLuluAccessToken();

    const request: LuluPrintJobRequest = {
      contact_email: order.contactEmail,
      external_id: orderId,
      shipping_address: {
        name: order.shippingAddress.name,
        street1: order.shippingAddress.street1,
        street2: order.shippingAddress.street2,
        city: order.shippingAddress.city,
        state_code: order.shippingAddress.stateCode,
        postcode: order.shippingAddress.postalCode,
        country_code: 'US',
        phone_number: order.shippingAddress.phoneNumber,
      },
      shipping_option_level: 'GROUND',  // Free shipping = Ground
      line_items: [{
        external_id: book._id,
        title: book.title,
        cover_source_url: coverUrl!,
        interior_source_url: interiorUrl!,
        pod_package_id: '0850X0850FCPRECW080CW444MXX',
        quantity: 1,
      }],
    };

    const response = await fetch(`${process.env.LULU_API_URL}/print-jobs/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Lulu API error: ${response.status} - ${error}`);
    }

    const result: LuluPrintJobResponse = await response.json();

    // Update order with Lulu job ID
    await ctx.runMutation(api.orders.updateLuluJob, {
      orderId,
      luluPrintJobId: String(result.id),
      status: 'submitted',
    });

    return result;
  },
});
```

### 5.4 Poll for Status Updates

```typescript
// convex/lulu/checkStatus.ts

export const checkLuluStatus = action({
  args: { orderId: v.id("printOrders") },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.runQuery(api.orders.get, { orderId });

    if (!order.luluPrintJobId) {
      return null;
    }

    const token = await getLuluAccessToken();

    const response = await fetch(
      `${process.env.LULU_API_URL}/print-jobs/${order.luluPrintJobId}/`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const job = await response.json();

    // Map Lulu status to our status
    const statusMap: Record<string, string> = {
      'CREATED': 'submitted',
      'UNPAID': 'submitted',
      'PAYMENT_IN_PROGRESS': 'submitted',
      'PRODUCTION_READY': 'in_production',
      'PRODUCTION_DELAYED': 'in_production',
      'IN_PRODUCTION': 'in_production',
      'SHIPPED': 'shipped',
      'CANCELED': 'failed',
      'ERROR': 'failed',
    };

    const newStatus = statusMap[job.status.name] || order.status;

    // Get tracking info if shipped
    let trackingNumber, trackingUrl;
    if (job.status.name === 'SHIPPED' && job.line_items[0]) {
      trackingNumber = job.line_items[0].tracking_id;
      trackingUrl = job.line_items[0].tracking_urls?.[0];
    }

    // Update order
    await ctx.runMutation(api.orders.updateStatus, {
      orderId,
      status: newStatus,
      luluStatus: job.status.name,
      trackingNumber,
      trackingUrl,
    });

    return job;
  },
});
```

### 5.5 Scheduled Status Polling

```typescript
// convex/crons.ts

import { cronJobs } from "convex/server";

const crons = cronJobs();

// Check Lulu status every hour for active orders
crons.interval(
  "check-lulu-orders",
  { hours: 1 },
  api.lulu.pollActiveOrders
);

export default crons;

// convex/lulu/pollActiveOrders.ts
export const pollActiveOrders = action({
  handler: async (ctx) => {
    // Get all orders in submitted/in_production status
    const activeOrders = await ctx.runQuery(api.orders.getActiveOrders);

    for (const order of activeOrders) {
      try {
        await ctx.runAction(api.lulu.checkStatus, { orderId: order._id });
      } catch (error) {
        console.error(`Failed to check order ${order._id}:`, error);
      }
    }
  },
});
```

---

## Phase 6: Updated User Flow

### 6.1 Book Creation Flow

```
1. CREATE BOOK
   └─> User enters: Title, Author name
   └─> User selects: Number of stops (8/10/12/14)
   └─> System creates: Book + empty stops

2. EDIT STOPS (main editor)
   └─> For each stop:
       ├─> Upload 1-2 photos
       ├─> Enter location name
       ├─> Write story text
       └─> AI transforms photos (real-time)

3. COVER DESIGN
   └─> Select hero image
   └─> Customize title/subtitle
   └─> Add dedication
   └─> Choose theme

4. PREVIEW
   └─> Full book preview (spread by spread)
   └─> Make final edits
   └─> System validates all images ready

5. CHECKOUT
   └─> Enter shipping address (US only)
   └─> Review order ($44.99 with free shipping)
   └─> Pay via Stripe

6. POST-PAYMENT
   └─> Generate PDFs (async, ~30-60 seconds)
   └─> Submit to Lulu
   └─> Show order confirmation with timeline

7. ORDER TRACKING
   └─> Real-time status updates
   └─> Tracking number when shipped
   └─> Email notifications
```

### 6.2 Order Status Timeline (shown to user)

```
[✓] Order Placed                    Dec 11, 2024
    Payment confirmed

[✓] Creating Your Book              Dec 11, 2024
    Generating print-ready files

[✓] Sent to Printer                 Dec 11, 2024
    Your book is in the production queue

[ ] Printing                        Est. Dec 13-16
    Your book is being printed and bound

[ ] Shipped                         Est. Dec 16-18
    On its way to you!

[ ] Delivered                       Est. Dec 20-26
    Enjoy your adventure book!
```

---

## Phase 7: UI Components to Build/Modify

### 7.1 New Components

1. **StopCountSelector** - Choose 8/10/12/14 stops during creation
2. **StopEditor** - Edit a single stop (replaces PageEditor)
3. **StopTimeline** - Visual timeline of all stops
4. **SpreadPreview** - Shows how two pages look together
5. **PrintPreview** - Realistic book mockup
6. **CoverDesigner** - Full cover editing (front + back + spine)
7. **OrderTimeline** - Visual order progress tracker

### 7.2 Modified Components

1. **BookEditor** - Restructure around stops instead of pages
2. **ImageUpload** - Add resolution check/warning
3. **Checkout** - US-only address form, simplified
4. **OrderPage** - Add Lulu status integration

---

## Phase 8: Migration Strategy

### 8.1 Database Migration

```typescript
// convex/migrations/pagesToStops.ts

export const migratePageToStops = mutation({
  handler: async (ctx) => {
    // Get all existing books
    const books = await ctx.db.query("books").collect();

    for (const book of books) {
      // Get pages for this book
      const pages = await ctx.db
        .query("pages")
        .withIndex("by_book", q => q.eq("bookId", book._id))
        .collect();

      // Create stops from pages
      for (const page of pages) {
        await ctx.db.insert("stops", {
          bookId: book._id,
          stopNumber: page.pageNumber,
          locationName: page.title || `Stop ${page.pageNumber}`,
          storyText: page.storyText || "",
          spreadType: "single_image",
          createdAt: page.createdAt,
          updatedAt: page.updatedAt,
        });

        // Update images to reference stop instead of page
        const images = await ctx.db
          .query("images")
          .withIndex("by_page", q => q.eq("pageId", page._id))
          .collect();

        // ... update image references
      }

      // Update book
      await ctx.db.patch(book._id, {
        stopCount: pages.length,
        pageCount: calculatePageCount(pages.length),
        printStatus: "editing",
      });
    }
  },
});
```

---

## Testing Plan

### Sandbox Testing

1. **Lulu Sandbox** - Use sandbox API for all development
   - URL: https://api.sandbox.lulu.com
   - Credentials: Get from https://developers.sandbox.lulu.com
   - Orders won't actually print or charge

2. **Test Cases**
   - [ ] Create book with 10 stops
   - [ ] Upload and transform images
   - [ ] Generate interior PDF
   - [ ] Generate cover PDF
   - [ ] Submit to Lulu sandbox
   - [ ] Check status polling
   - [ ] Verify PDF meets Lulu specs

3. **Production Cutover**
   - Switch to production Lulu API
   - Test with real order (to ourselves)
   - Verify print quality
   - Confirm shipping timeline

---

## Timeline Estimate

| Phase | Description | Effort |
|-------|-------------|--------|
| 1 | Schema changes | 1-2 days |
| 2 | Page count logic | 1 day |
| 3 | Image resolution/upscaling | 2-3 days |
| 4 | PDF generation | 3-4 days |
| 5 | Lulu API integration | 2-3 days |
| 6 | User flow updates | 2-3 days |
| 7 | UI components | 3-4 days |
| 8 | Migration & testing | 2-3 days |
| **Total** | | **~3 weeks** |

---

## Open Questions

1. **Font licensing** - Need to embed fonts in PDF. Use open source fonts (e.g., Google Fonts) to avoid licensing issues.

2. **Image quality** - Need to test actual Gemini output resolution and determine if upscaling is needed.

3. **PDF library** - pdf-lib is client-side friendly but may need server-side alternatives for complex layouts.

4. **Error handling** - What happens if PDF generation fails? Lulu rejects the files?

5. **Refunds** - How do we handle Lulu production failures?
