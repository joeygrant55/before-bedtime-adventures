/**
 * Client-Side Text Baking
 * 
 * Renders text overlays directly onto images using HTML Canvas API.
 * This replaces the AI-based text baking (convex/bakeTextOverlay.ts) with
 * instant, pixel-perfect, client-side rendering.
 * 
 * Benefits:
 * - Instant rendering (milliseconds vs 10-30 seconds)
 * - Pixel-perfect (matches CSS preview exactly)
 * - No AI costs
 * - No image distortion
 * - Reliable and consistent
 */

import { FONTS, FONT_SIZES } from './print-specs';

export type TextOverlay = {
  content: string;
  position: {
    x: number; // Percentage 0-100
    y: number; // Percentage 0-100
    width: number; // Percentage of container width
  };
  style: {
    fontFamily: keyof typeof FONTS;
    fontSize: keyof typeof FONT_SIZES;
    color: string;
    textAlign: 'left' | 'center' | 'right';
    hasBackground?: boolean;
    hasShadow?: boolean;
  };
  zIndex: number;
};

/**
 * Convert font family key to actual CSS font family string
 */
function getFontFamily(fontKey: keyof typeof FONTS): string {
  return FONTS[fontKey].family;
}

/**
 * Get pixel size for font at the target canvas resolution
 */
function getFontSize(sizeKey: keyof typeof FONT_SIZES, scaleFactor: number = 1): number {
  return FONT_SIZES[sizeKey].pixels * scaleFactor;
}

/**
 * Wrap text to fit within a given width
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): void {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + (line ? ' ' : '') + words[i];
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && line) {
      // Draw the current line
      ctx.fillText(line, x, currentY);
      line = words[i];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  
  // Draw the last line
  if (line) {
    ctx.fillText(line, x, currentY);
  }
}

/**
 * Calculate the bounding box for wrapped text
 */
function measureWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number
): { width: number; height: number; lines: string[] } {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  let maxLineWidth = 0;

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine + (currentLine ? ' ' : '') + words[i];
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      maxLineWidth = Math.max(maxLineWidth, ctx.measureText(currentLine).width);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
    maxLineWidth = Math.max(maxLineWidth, ctx.measureText(currentLine).width);
  }

  return {
    width: maxLineWidth,
    height: lines.length * lineHeight,
    lines,
  };
}

/**
 * Load an image from a URL
 */
async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Ensure fonts are loaded before rendering
 */
async function ensureFontsLoaded(): Promise<void> {
  if (typeof document === 'undefined') return;
  
  try {
    await document.fonts.ready;
  } catch (error) {
    console.warn('Font loading check failed:', error);
  }
}

/**
 * Bake text overlays onto an image using HTML Canvas
 * 
 * @param imageUrl - URL of the base cartoon image
 * @param overlays - Array of text overlays to render
 * @param targetWidth - Target canvas width in pixels (default: 2550 for Lulu print spec)
 * @param targetHeight - Target canvas height in pixels (default: 2550 for Lulu print spec)
 * @returns PNG blob of the baked image
 */
export async function bakeTextOnCanvas(
  imageUrl: string,
  overlays: TextOverlay[],
  targetWidth: number = 2550,
  targetHeight: number = 2550
): Promise<Blob> {
  // Ensure fonts are loaded
  await ensureFontsLoaded();

  // Load the base image first to get its natural dimensions
  const img = await loadImage(imageUrl);
  
  // Use the original image dimensions (scaled up if needed for print quality)
  // This preserves the exact aspect ratio — no squishing
  const naturalWidth = img.naturalWidth;
  const naturalHeight = img.naturalHeight;
  
  // Scale up to at least 2550px on the longest side for print quality
  const maxDim = Math.max(naturalWidth, naturalHeight);
  const scale = maxDim < targetWidth ? targetWidth / maxDim : 1;
  const canvasWidth = Math.round(naturalWidth * scale);
  const canvasHeight = Math.round(naturalHeight * scale);
  
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas 2D context');
  }

  // Calculate scale factor for font sizes
  // Base font sizes are designed for ~600px display
  const scaleFactor = canvasWidth / 600;

  // Draw image at its natural aspect ratio
  ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

  // Sort overlays by zIndex (paint order)
  const sortedOverlays = [...overlays].sort((a, b) => a.zIndex - b.zIndex);

  // Draw each text overlay
  for (const overlay of sortedOverlays) {
    // Convert percentage positions to pixel coordinates
    const x = (overlay.position.x / 100) * canvasWidth;
    const y = (overlay.position.y / 100) * canvasHeight;
    const width = (overlay.position.width / 100) * canvasWidth;

    // Set up text styling
    const fontSize = getFontSize(overlay.style.fontSize, scaleFactor);
    const fontFamily = getFontFamily(overlay.style.fontFamily);
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = overlay.style.color;
    ctx.textBaseline = 'top';

    // Line height (1.3x font size for readability)
    const lineHeight = fontSize * 1.3;

    // Set text alignment
    let textX = x;
    if (overlay.style.textAlign === 'center') {
      ctx.textAlign = 'center';
    } else if (overlay.style.textAlign === 'right') {
      ctx.textAlign = 'right';
      textX = x + width;
    } else {
      ctx.textAlign = 'left';
    }

    // Apply shadow if enabled
    if (overlay.style.hasShadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 8 * scaleFactor;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2 * scaleFactor;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    // Apply background if enabled
    if (overlay.style.hasBackground) {
      // Measure text to get background dimensions
      const textMetrics = measureWrappedText(ctx, overlay.content, width, lineHeight);
      
      // Calculate background position based on text alignment
      let bgX = x - 12 * scaleFactor;
      if (overlay.style.textAlign === 'center') {
        bgX = x - (textMetrics.width / 2) - 12 * scaleFactor;
      } else if (overlay.style.textAlign === 'right') {
        bgX = x + width - textMetrics.width - 12 * scaleFactor;
      }

      const bgY = y - 8 * scaleFactor;
      const bgWidth = textMetrics.width + 24 * scaleFactor;
      const bgHeight = textMetrics.height + 16 * scaleFactor;

      // Draw background rectangle (without shadow)
      const tempShadow = ctx.shadowColor;
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
      ctx.shadowColor = tempShadow;
      
      // Restore text color
      ctx.fillStyle = overlay.style.color;
    }

    // Draw text with word wrapping
    wrapText(ctx, overlay.content, textX, y, width, lineHeight);

    // Reset shadow for next overlay
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      },
      'image/png',
      1.0 // Maximum quality
    );
  });
}
