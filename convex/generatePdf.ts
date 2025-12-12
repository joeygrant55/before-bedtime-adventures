import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { Id } from "./_generated/dataModel";

/**
 * PDF Generation for Lulu Print Integration
 *
 * Specifications:
 * - Interior: 8.75" × 8.75" (trim + bleed)
 * - Cover: Full wrap-around (back + spine + front)
 * - Resolution: 300 DPI
 * - Color: RGB (Lulu converts to CMYK)
 */

// Print specifications (in points, 72 per inch)
const SPECS = {
  // Interior page
  interiorWidth: 8.75 * 72,   // 630 points
  interiorHeight: 8.75 * 72,  // 630 points
  bleed: 0.125 * 72,          // 9 points
  safeMargin: 0.25 * 72,      // 18 points

  // Cover
  trimSize: 8.5 * 72,         // 612 points
  coverWrap: 0.75 * 72,       // 54 points

  // Spine width table lookup (in points)
  getSpineWidth: (pageCount: number): number => {
    // Simplified table - most books will be 24-84 pages = 0.25"
    if (pageCount <= 84) return 0.25 * 72;      // 18 points
    if (pageCount <= 140) return 0.5 * 72;      // 36 points
    if (pageCount <= 168) return 0.625 * 72;    // 45 points
    return 0.75 * 72;                           // 54 points
  },
};

// Theme colors for backgrounds
const THEME_COLORS: Record<string, { primary: [number, number, number]; secondary: [number, number, number] }> = {
  "purple-magic": {
    primary: [139 / 255, 92 / 255, 246 / 255],   // Purple
    secondary: [236 / 255, 72 / 255, 153 / 255], // Pink
  },
  "ocean-adventure": {
    primary: [59 / 255, 130 / 255, 246 / 255],   // Blue
    secondary: [6 / 255, 182 / 255, 212 / 255],  // Cyan
  },
  "sunset-wonder": {
    primary: [249 / 255, 115 / 255, 22 / 255],   // Orange
    secondary: [234 / 255, 179 / 255, 8 / 255],  // Yellow
  },
  "forest-dreams": {
    primary: [34 / 255, 197 / 255, 94 / 255],    // Green
    secondary: [16 / 255, 185 / 255, 129 / 255], // Teal
  },
};

/**
 * Generate the interior PDF for a book
 */
export const generateInteriorPdf = action({
  args: {
    bookId: v.id("books"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; pdfId?: Id<"_storage">; error?: string }> => {
    console.log("📄 Generating interior PDF for book:", args.bookId);

    try {
      // Fetch book data
      const book = await ctx.runQuery(api.books.getBook, { bookId: args.bookId });
      if (!book) {
        throw new Error("Book not found");
      }

      // Fetch all pages/stops
      const pages = await ctx.runQuery(api.pages.getBookPages, { bookId: args.bookId });

      // Create PDF document
      const pdf = await PDFDocument.create();

      // Embed fonts
      const titleFont = await pdf.embedFont(StandardFonts.HelveticaBold);
      const textFont = await pdf.embedFont(StandardFonts.Helvetica);

      // Get theme colors
      const theme = THEME_COLORS[book.coverDesign?.theme || "purple-magic"];

      // Calculate page structure
      const stopCount = book.pageCount;
      const printedPageCount = calculatePrintedPageCount(stopCount);

      console.log(`📖 Creating ${printedPageCount} pages for ${stopCount} stops`);

      // Page 1: Title page
      await addTitlePage(pdf, book, titleFont, textFont, theme);

      // Page 2: Dedication page
      await addDedicationPage(pdf, book, textFont, theme);

      // Add extra front matter if needed (for fewer stops)
      if (stopCount <= 9) {
        // Pages 3-4: Blank/intro pages
        addBlankPage(pdf, theme);
        addBlankPage(pdf, theme);
      }

      // Story pages (each stop = 2 pages)
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];

        // Fetch images for this page/stop
        const images = await ctx.runQuery(api.images.getPageImages, { pageId: page._id });

        // Add spread for this stop (2 pages)
        await addStorySpread(ctx, pdf, page, images, titleFont, textFont, theme);
      }

      // End page
      await addEndPage(pdf, book, titleFont, theme);

      // Fill remaining pages to reach minimum
      let currentPageCount = pdf.getPageCount();
      while (currentPageCount < printedPageCount) {
        addBlankPage(pdf, theme);
        currentPageCount++;
      }

      console.log(`✅ Created PDF with ${pdf.getPageCount()} pages`);

      // Save PDF to bytes
      const pdfBytes = await pdf.save();

      // Store in Convex (create copy for Blob compatibility)
      const pdfBlob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const pdfId = await ctx.storage.store(pdfBlob);

      // Update book with PDF reference
      await ctx.runMutation(api.books.updatePrintPdf, {
        bookId: args.bookId,
        interiorPdfId: pdfId,
      });

      console.log("💾 Interior PDF stored:", pdfId);

      return { success: true, pdfId };
    } catch (error) {
      console.error("❌ Error generating interior PDF:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Generate the cover PDF for a book
 */
export const generateCoverPdf = action({
  args: {
    bookId: v.id("books"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; pdfId?: Id<"_storage">; error?: string }> => {
    console.log("🎨 Generating cover PDF for book:", args.bookId);

    try {
      // Fetch book data
      const book = await ctx.runQuery(api.books.getBook, { bookId: args.bookId });
      if (!book) {
        throw new Error("Book not found");
      }

      // Calculate dimensions
      const printedPageCount = calculatePrintedPageCount(book.pageCount);
      const spineWidth = SPECS.getSpineWidth(printedPageCount);

      // Total cover dimensions
      const coverWidth =
        SPECS.bleed * 2 +           // Outer bleeds
        SPECS.coverWrap * 4 +       // 4 wrap areas
        SPECS.trimSize * 2 +        // Front + back covers
        spineWidth;                 // Spine

      const coverHeight =
        SPECS.bleed * 2 +           // Top/bottom bleeds
        SPECS.coverWrap * 2 +       // Top/bottom wraps
        SPECS.trimSize;             // Cover height

      console.log(`📐 Cover dimensions: ${coverWidth / 72}" × ${coverHeight / 72}" (spine: ${spineWidth / 72}")`);

      // Create PDF document
      const pdf = await PDFDocument.create();
      const page = pdf.addPage([coverWidth, coverHeight]);

      // Embed fonts
      const titleFont = await pdf.embedFont(StandardFonts.HelveticaBold);
      const textFont = await pdf.embedFont(StandardFonts.Helvetica);

      // Get theme colors
      const themeKey = book.coverDesign?.theme || "purple-magic";
      const theme = THEME_COLORS[themeKey];

      // Draw gradient background
      drawGradientBackground(page, coverWidth, coverHeight, theme);

      // Calculate layout positions
      const backCoverX = SPECS.bleed + SPECS.coverWrap;
      const spineX = backCoverX + SPECS.trimSize + SPECS.coverWrap;
      const frontCoverX = spineX + spineWidth + SPECS.coverWrap;

      const contentTop = coverHeight - SPECS.bleed - SPECS.coverWrap;
      const contentBottom = SPECS.bleed + SPECS.coverWrap;

      // Draw back cover (left side)
      await drawBackCover(
        page,
        book,
        backCoverX,
        contentBottom,
        SPECS.trimSize,
        contentTop - contentBottom,
        textFont,
        theme
      );

      // Draw spine (center)
      drawSpine(
        page,
        book,
        spineX,
        contentBottom,
        spineWidth,
        contentTop - contentBottom,
        textFont
      );

      // Draw front cover (right side)
      await drawFrontCover(
        ctx,
        pdf,
        page,
        book,
        frontCoverX,
        contentBottom,
        SPECS.trimSize,
        contentTop - contentBottom,
        titleFont,
        textFont,
        theme
      );

      console.log("✅ Cover PDF created");

      // Save PDF to bytes
      const pdfBytes = await pdf.save();

      // Store in Convex (create copy for Blob compatibility)
      const pdfBlob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const pdfId = await ctx.storage.store(pdfBlob);

      // Update book with PDF reference
      await ctx.runMutation(api.books.updatePrintPdf, {
        bookId: args.bookId,
        coverPdfId: pdfId,
      });

      console.log("💾 Cover PDF stored:", pdfId);

      return { success: true, pdfId };
    } catch (error) {
      console.error("❌ Error generating cover PDF:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Generate both PDFs and prepare for Lulu submission
 */
export const generateAllPdfs = action({
  args: {
    bookId: v.id("books"),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    interiorPdfId?: Id<"_storage">;
    coverPdfId?: Id<"_storage">;
    interiorUrl?: string;
    coverUrl?: string;
    error?: string;
  }> => {
    console.log("📚 Generating all PDFs for book:", args.bookId);

    try {
      // Update book status
      await ctx.runMutation(api.books.updatePrintStatus, {
        bookId: args.bookId,
        printStatus: "generating_pdfs",
      });

      // Generate interior PDF
      const interiorResult = await ctx.runAction(api.generatePdf.generateInteriorPdf, {
        bookId: args.bookId,
      });

      if (!interiorResult.success || !interiorResult.pdfId) {
        throw new Error(interiorResult.error || "Failed to generate interior PDF");
      }

      // Generate cover PDF
      const coverResult = await ctx.runAction(api.generatePdf.generateCoverPdf, {
        bookId: args.bookId,
      });

      if (!coverResult.success || !coverResult.pdfId) {
        throw new Error(coverResult.error || "Failed to generate cover PDF");
      }

      // Get public URLs for the PDFs
      const interiorUrl = await ctx.storage.getUrl(interiorResult.pdfId);
      const coverUrl = await ctx.storage.getUrl(coverResult.pdfId);

      // Update book status
      await ctx.runMutation(api.books.updatePrintStatus, {
        bookId: args.bookId,
        printStatus: "pdfs_ready",
      });

      console.log("✅ All PDFs generated successfully");

      return {
        success: true,
        interiorPdfId: interiorResult.pdfId,
        coverPdfId: coverResult.pdfId,
        interiorUrl: interiorUrl || undefined,
        coverUrl: coverUrl || undefined,
      };
    } catch (error) {
      console.error("❌ Error generating PDFs:", error);

      // Update status to indicate failure
      await ctx.runMutation(api.books.updatePrintStatus, {
        bookId: args.bookId,
        printStatus: "editing",
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Process a paid order - generate PDFs and submit to Lulu
 * This can be called after webhook confirmation or manually for testing
 */
export const processOrder = action({
  args: {
    orderId: v.id("printOrders"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    console.log("🚀 Processing order:", args.orderId);

    try {
      // Get the order
      const order = await ctx.runQuery(api.orders.getOrder, { orderId: args.orderId });
      if (!order) {
        throw new Error("Order not found");
      }

      // Update order status to payment_received if still pending
      if (order.status === "pending_payment") {
        await ctx.runMutation(api.orders.updateOrderStatus, {
          orderId: args.orderId,
          status: "payment_received",
        });
      }

      // Update to generating_pdfs
      await ctx.runMutation(api.orders.updateOrderStatus, {
        orderId: args.orderId,
        status: "generating_pdfs",
      });

      // Generate PDFs
      console.log("📄 Generating PDFs...");
      const pdfResult = await ctx.runAction(api.generatePdf.generateAllPdfs, {
        bookId: order.bookId,
      });

      if (!pdfResult.success) {
        throw new Error(pdfResult.error || "PDF generation failed");
      }

      // Store PDF URLs in order
      if (pdfResult.interiorUrl && pdfResult.coverUrl) {
        await ctx.runMutation(api.orders.updatePdfUrls, {
          orderId: args.orderId,
          interiorPdfUrl: pdfResult.interiorUrl,
          coverPdfUrl: pdfResult.coverUrl,
        });
      }

      // Submit to Lulu
      console.log("📚 Submitting to Lulu...");
      const luluResult = await ctx.runAction(api.lulu.submitPrintJob, {
        orderId: args.orderId,
      });

      if (!luluResult.success) {
        throw new Error(luluResult.error || "Lulu submission failed");
      }

      console.log("✅ Order processed successfully! Lulu Job ID:", luluResult.luluJobId);
      return { success: true };
    } catch (error) {
      console.error("❌ Error processing order:", error);

      await ctx.runMutation(api.orders.updateOrderStatus, {
        orderId: args.orderId,
        status: "failed",
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// Helper functions

function calculatePrintedPageCount(stopCount: number): number {
  const storyPages = stopCount * 2;
  const frontMatter = stopCount <= 9 ? 4 : 2;
  const backMatter = stopCount <= 9 ? 4 : 2;
  return Math.max(24, frontMatter + storyPages + backMatter);
}

async function addTitlePage(
  pdf: PDFDocument,
  book: { title: string; coverDesign?: { subtitle?: string; authorLine?: string } },
  titleFont: Awaited<ReturnType<typeof pdf.embedFont>>,
  textFont: Awaited<ReturnType<typeof pdf.embedFont>>,
  theme: { primary: [number, number, number]; secondary: [number, number, number] }
) {
  const page = pdf.addPage([SPECS.interiorWidth, SPECS.interiorHeight]);

  // Background
  page.drawRectangle({
    x: 0,
    y: 0,
    width: SPECS.interiorWidth,
    height: SPECS.interiorHeight,
    color: rgb(0.98, 0.98, 1),
  });

  // Title
  const titleSize = 48;
  const title = book.title || "Our Adventure";
  const titleWidth = titleFont.widthOfTextAtSize(title, titleSize);

  page.drawText(title, {
    x: (SPECS.interiorWidth - titleWidth) / 2,
    y: SPECS.interiorHeight * 0.6,
    size: titleSize,
    font: titleFont,
    color: rgb(...theme.primary),
  });

  // Subtitle
  if (book.coverDesign?.subtitle) {
    const subtitleSize = 24;
    const subtitleWidth = textFont.widthOfTextAtSize(book.coverDesign.subtitle, subtitleSize);

    page.drawText(book.coverDesign.subtitle, {
      x: (SPECS.interiorWidth - subtitleWidth) / 2,
      y: SPECS.interiorHeight * 0.5,
      size: subtitleSize,
      font: textFont,
      color: rgb(0.4, 0.4, 0.5),
    });
  }

  // Author
  if (book.coverDesign?.authorLine) {
    const authorSize = 18;
    const authorWidth = textFont.widthOfTextAtSize(book.coverDesign.authorLine, authorSize);

    page.drawText(book.coverDesign.authorLine, {
      x: (SPECS.interiorWidth - authorWidth) / 2,
      y: SPECS.interiorHeight * 0.35,
      size: authorSize,
      font: textFont,
      color: rgb(0.5, 0.5, 0.6),
    });
  }
}

async function addDedicationPage(
  pdf: PDFDocument,
  book: { coverDesign?: { dedication?: string } },
  textFont: Awaited<ReturnType<typeof pdf.embedFont>>,
  theme: { primary: [number, number, number]; secondary: [number, number, number] }
) {
  const page = pdf.addPage([SPECS.interiorWidth, SPECS.interiorHeight]);

  // Background
  page.drawRectangle({
    x: 0,
    y: 0,
    width: SPECS.interiorWidth,
    height: SPECS.interiorHeight,
    color: rgb(0.98, 0.98, 1),
  });

  // Dedication text
  const dedication = book.coverDesign?.dedication || "For all the adventurers...";
  const textSize = 20;
  const textWidth = textFont.widthOfTextAtSize(dedication, textSize);

  page.drawText(dedication, {
    x: (SPECS.interiorWidth - textWidth) / 2,
    y: SPECS.interiorHeight * 0.5,
    size: textSize,
    font: textFont,
    color: rgb(0.4, 0.4, 0.5),
  });
}

function addBlankPage(
  pdf: PDFDocument,
  theme: { primary: [number, number, number]; secondary: [number, number, number] }
) {
  const page = pdf.addPage([SPECS.interiorWidth, SPECS.interiorHeight]);

  // Light background
  page.drawRectangle({
    x: 0,
    y: 0,
    width: SPECS.interiorWidth,
    height: SPECS.interiorHeight,
    color: rgb(0.98, 0.98, 1),
  });
}

async function addStorySpread(
  ctx: { storage: { get: (id: Id<"_storage">) => Promise<Blob | null> } },
  pdf: PDFDocument,
  pageData: { title?: string; storyText?: string },
  images: Array<{
    cartoonImageId?: Id<"_storage">;
    bakedImageId?: Id<"_storage">;
  }>,
  titleFont: Awaited<ReturnType<typeof pdf.embedFont>>,
  textFont: Awaited<ReturnType<typeof pdf.embedFont>>,
  theme: { primary: [number, number, number]; secondary: [number, number, number] }
) {
  // Page 1: Primary image (right page in spread)
  const page1 = pdf.addPage([SPECS.interiorWidth, SPECS.interiorHeight]);

  // Background
  page1.drawRectangle({
    x: 0,
    y: 0,
    width: SPECS.interiorWidth,
    height: SPECS.interiorHeight,
    color: rgb(0.98, 0.98, 1),
  });

  // Try to add the image
  if (images.length > 0) {
    const imageId = images[0].bakedImageId || images[0].cartoonImageId;
    if (imageId) {
      try {
        const imageBlob = await ctx.storage.get(imageId);
        if (imageBlob) {
          const imageBytes = new Uint8Array(await imageBlob.arrayBuffer());

          // Detect image type and embed
          let embeddedImage;
          if (imageBlob.type === "image/png") {
            embeddedImage = await pdf.embedPng(imageBytes);
          } else {
            embeddedImage = await pdf.embedJpg(imageBytes);
          }

          // Calculate dimensions to fit with margins
          const margin = SPECS.safeMargin * 2;
          const maxWidth = SPECS.interiorWidth - margin;
          const maxHeight = SPECS.interiorHeight - margin - 80; // Leave room for title

          const imgAspect = embeddedImage.width / embeddedImage.height;
          let drawWidth = maxWidth;
          let drawHeight = drawWidth / imgAspect;

          if (drawHeight > maxHeight) {
            drawHeight = maxHeight;
            drawWidth = drawHeight * imgAspect;
          }

          const x = (SPECS.interiorWidth - drawWidth) / 2;
          const y = (SPECS.interiorHeight - drawHeight) / 2 + 20;

          page1.drawImage(embeddedImage, {
            x,
            y,
            width: drawWidth,
            height: drawHeight,
          });
        }
      } catch (error) {
        console.error("Error embedding image:", error);
      }
    }
  }

  // Add location title at bottom
  if (pageData.title) {
    const titleSize = 24;
    const titleWidth = titleFont.widthOfTextAtSize(pageData.title, titleSize);

    page1.drawText(pageData.title, {
      x: (SPECS.interiorWidth - titleWidth) / 2,
      y: SPECS.safeMargin + 20,
      size: titleSize,
      font: titleFont,
      color: rgb(...theme.primary),
    });
  }

  // Page 2: Story text or second image (left page in spread)
  const page2 = pdf.addPage([SPECS.interiorWidth, SPECS.interiorHeight]);

  // Background
  page2.drawRectangle({
    x: 0,
    y: 0,
    width: SPECS.interiorWidth,
    height: SPECS.interiorHeight,
    color: rgb(0.98, 0.98, 1),
  });

  // If there's a second image, show it
  if (images.length > 1) {
    const imageId = images[1].bakedImageId || images[1].cartoonImageId;
    if (imageId) {
      try {
        const imageBlob = await ctx.storage.get(imageId);
        if (imageBlob) {
          const imageBytes = new Uint8Array(await imageBlob.arrayBuffer());

          let embeddedImage;
          if (imageBlob.type === "image/png") {
            embeddedImage = await pdf.embedPng(imageBytes);
          } else {
            embeddedImage = await pdf.embedJpg(imageBytes);
          }

          const margin = SPECS.safeMargin * 2;
          const maxWidth = SPECS.interiorWidth - margin;
          const maxHeight = SPECS.interiorHeight - margin;

          const imgAspect = embeddedImage.width / embeddedImage.height;
          let drawWidth = maxWidth;
          let drawHeight = drawWidth / imgAspect;

          if (drawHeight > maxHeight) {
            drawHeight = maxHeight;
            drawWidth = drawHeight * imgAspect;
          }

          const x = (SPECS.interiorWidth - drawWidth) / 2;
          const y = (SPECS.interiorHeight - drawHeight) / 2;

          page2.drawImage(embeddedImage, {
            x,
            y,
            width: drawWidth,
            height: drawHeight,
          });
        }
      } catch (error) {
        console.error("Error embedding second image:", error);
      }
    }
  } else if (pageData.storyText) {
    // Show story text
    const textSize = 18;
    const maxWidth = SPECS.interiorWidth - SPECS.safeMargin * 4;
    const lines = wrapText(pageData.storyText, textFont, textSize, maxWidth);

    let y = SPECS.interiorHeight * 0.7;
    for (const line of lines) {
      const lineWidth = textFont.widthOfTextAtSize(line, textSize);
      page2.drawText(line, {
        x: (SPECS.interiorWidth - lineWidth) / 2,
        y,
        size: textSize,
        font: textFont,
        color: rgb(0.2, 0.2, 0.3),
      });
      y -= textSize * 1.5;
    }
  }
}

async function addEndPage(
  pdf: PDFDocument,
  book: { title: string },
  titleFont: Awaited<ReturnType<typeof pdf.embedFont>>,
  theme: { primary: [number, number, number]; secondary: [number, number, number] }
) {
  const page = pdf.addPage([SPECS.interiorWidth, SPECS.interiorHeight]);

  // Background
  page.drawRectangle({
    x: 0,
    y: 0,
    width: SPECS.interiorWidth,
    height: SPECS.interiorHeight,
    color: rgb(0.98, 0.98, 1),
  });

  // "The End" text
  const endText = "The End";
  const endSize = 48;
  const endWidth = titleFont.widthOfTextAtSize(endText, endSize);

  page.drawText(endText, {
    x: (SPECS.interiorWidth - endWidth) / 2,
    y: SPECS.interiorHeight * 0.5,
    size: endSize,
    font: titleFont,
    color: rgb(...theme.primary),
  });
}

function drawGradientBackground(
  page: ReturnType<PDFDocument["addPage"]>,
  width: number,
  height: number,
  theme: { primary: [number, number, number]; secondary: [number, number, number] }
) {
  // Simple gradient simulation with bands
  const bands = 20;
  const bandHeight = height / bands;

  for (let i = 0; i < bands; i++) {
    const t = i / bands;
    const r = theme.primary[0] + (theme.secondary[0] - theme.primary[0]) * t;
    const g = theme.primary[1] + (theme.secondary[1] - theme.primary[1]) * t;
    const b = theme.primary[2] + (theme.secondary[2] - theme.primary[2]) * t;

    page.drawRectangle({
      x: 0,
      y: height - (i + 1) * bandHeight,
      width,
      height: bandHeight + 1, // Overlap to prevent gaps
      color: rgb(r, g, b),
    });
  }
}

async function drawBackCover(
  page: ReturnType<PDFDocument["addPage"]>,
  book: { coverDesign?: { dedication?: string } },
  x: number,
  y: number,
  width: number,
  height: number,
  textFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  theme: { primary: [number, number, number]; secondary: [number, number, number] }
) {
  // Dedication text on back cover
  const dedication = book.coverDesign?.dedication || "";
  if (dedication) {
    const textSize = 16;
    const maxWidth = width - 72; // 0.5" margins
    const lines = wrapText(dedication, textFont, textSize, maxWidth);

    let textY = y + height * 0.5;
    for (const line of lines) {
      const lineWidth = textFont.widthOfTextAtSize(line, textSize);
      page.drawText(line, {
        x: x + (width - lineWidth) / 2,
        y: textY,
        size: textSize,
        font: textFont,
        color: rgb(1, 1, 1),
      });
      textY -= textSize * 1.5;
    }
  }
}

function drawSpine(
  page: ReturnType<PDFDocument["addPage"]>,
  book: { title: string; coverDesign?: { authorLine?: string } },
  x: number,
  y: number,
  width: number,
  height: number,
  textFont: Awaited<ReturnType<PDFDocument["embedFont"]>>
) {
  // Spine text (rotated 90 degrees)
  // Note: pdf-lib doesn't easily support rotated text, so we'll keep it simple
  // For a production system, you'd want to properly rotate the text

  if (width >= 36) {
    // Only add spine text if spine is wide enough (0.5"+)
    const spineText = book.title.substring(0, 20); // Truncate for spine
    const textSize = 10;

    // Draw vertically (simplified - just center it)
    page.drawText(spineText, {
      x: x + width / 2 - textSize / 2,
      y: y + height / 2,
      size: textSize,
      font: textFont,
      color: rgb(1, 1, 1),
      rotate: degrees(90),
    });
  }
}

async function drawFrontCover(
  ctx: { storage: { get: (id: Id<"_storage">) => Promise<Blob | null> } },
  pdf: PDFDocument,
  page: ReturnType<PDFDocument["addPage"]>,
  book: {
    title: string;
    coverDesign?: {
      heroImageId?: Id<"_storage">;
      title?: string;
      subtitle?: string;
      authorLine?: string;
    };
  },
  x: number,
  y: number,
  width: number,
  height: number,
  titleFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  textFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  theme: { primary: [number, number, number]; secondary: [number, number, number] }
) {
  // Hero image
  if (book.coverDesign?.heroImageId) {
    try {
      const imageBlob = await ctx.storage.get(book.coverDesign.heroImageId);
      if (imageBlob) {
        const imageBytes = new Uint8Array(await imageBlob.arrayBuffer());

        let embeddedImage;
        if (imageBlob.type === "image/png") {
          embeddedImage = await pdf.embedPng(imageBytes);
        } else {
          embeddedImage = await pdf.embedJpg(imageBytes);
        }

        // Draw hero image centered
        const imgMargin = 36; // 0.5" margin
        const maxImgWidth = width - imgMargin * 2;
        const maxImgHeight = height * 0.6;

        const imgAspect = embeddedImage.width / embeddedImage.height;
        let drawWidth = maxImgWidth;
        let drawHeight = drawWidth / imgAspect;

        if (drawHeight > maxImgHeight) {
          drawHeight = maxImgHeight;
          drawWidth = drawHeight * imgAspect;
        }

        const imgX = x + (width - drawWidth) / 2;
        const imgY = y + height * 0.35;

        page.drawImage(embeddedImage, {
          x: imgX,
          y: imgY,
          width: drawWidth,
          height: drawHeight,
        });
      }
    } catch (error) {
      console.error("Error embedding hero image:", error);
    }
  }

  // Title
  const title = book.coverDesign?.title || book.title;
  const titleSize = 36;
  const titleWidth = titleFont.widthOfTextAtSize(title, titleSize);

  page.drawText(title, {
    x: x + (width - titleWidth) / 2,
    y: y + height * 0.25,
    size: titleSize,
    font: titleFont,
    color: rgb(1, 1, 1),
  });

  // Subtitle
  if (book.coverDesign?.subtitle) {
    const subtitleSize = 18;
    const subtitleWidth = textFont.widthOfTextAtSize(book.coverDesign.subtitle, subtitleSize);

    page.drawText(book.coverDesign.subtitle, {
      x: x + (width - subtitleWidth) / 2,
      y: y + height * 0.18,
      size: subtitleSize,
      font: textFont,
      color: rgb(1, 1, 1),
    });
  }

  // Author
  if (book.coverDesign?.authorLine) {
    const authorSize = 14;
    const authorWidth = textFont.widthOfTextAtSize(book.coverDesign.authorLine, authorSize);

    page.drawText(book.coverDesign.authorLine, {
      x: x + (width - authorWidth) / 2,
      y: y + height * 0.1,
      size: authorSize,
      font: textFont,
      color: rgb(0.9, 0.9, 0.9),
    });
  }
}

function wrapText(
  text: string,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  fontSize: number,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}
