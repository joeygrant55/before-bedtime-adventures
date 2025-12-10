"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CropSettings } from "../SquareImageDisplay";

type ImageCropEditorProps = {
  imageId: Id<"images">;
  imageUrl: string;
  initialCropSettings?: CropSettings;
  onClose: () => void;
  onSave?: (cropSettings: CropSettings) => void;
};

/**
 * Modal editor for cropping images to a 1:1 square format.
 * Allows zoom (scale) and pan (offset) adjustments.
 */
export function ImageCropEditor({
  imageId,
  imageUrl,
  initialCropSettings,
  onClose,
  onSave,
}: ImageCropEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);

  // Crop state
  const [scale, setScale] = useState(initialCropSettings?.scale ?? 1);
  const [offsetX, setOffsetX] = useState(initialCropSettings?.offsetX ?? 0);
  const [offsetY, setOffsetY] = useState(initialCropSettings?.offsetY ?? 0);
  const [imageDimensions, setImageDimensions] = useState({
    width: initialCropSettings?.originalWidth ?? 0,
    height: initialCropSettings?.originalHeight ?? 0,
  });

  const updateCropSettings = useMutation(api.images.updateCropSettings);

  // Load image dimensions when URL loads
  useEffect(() => {
    if (imageUrl && (!imageDimensions.width || !imageDimensions.height)) {
      const img = new Image();
      img.onload = () => {
        setImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
      img.src = imageUrl;
    }
  }, [imageUrl, imageDimensions.width, imageDimensions.height]);

  // Handle mouse/touch drag for panning
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      setIsDragging(true);

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      setDragStart({
        x: clientX - offsetX * 2, // Scale factor for sensitivity
        y: clientY - offsetY * 2,
      });
    },
    [offsetX, offsetY]
  );

  const handleDragMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging) return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      // Calculate new offset (limited to prevent image from going too far off-screen)
      const maxOffset = (scale - 1) * 50; // Allow more panning when zoomed in
      const newOffsetX = Math.max(
        -maxOffset,
        Math.min(maxOffset, (clientX - dragStart.x) / 2)
      );
      const newOffsetY = Math.max(
        -maxOffset,
        Math.min(maxOffset, (clientY - dragStart.y) / 2)
      );

      setOffsetX(newOffsetX);
      setOffsetY(newOffsetY);
    },
    [isDragging, dragStart, scale]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle zoom slider
  const handleZoomChange = (newScale: number) => {
    setScale(newScale);
    // Reduce offset if zooming out (to keep image centered)
    if (newScale < scale) {
      const maxOffset = (newScale - 1) * 50;
      setOffsetX(Math.max(-maxOffset, Math.min(maxOffset, offsetX)));
      setOffsetY(Math.max(-maxOffset, Math.min(maxOffset, offsetY)));
    }
  };

  // Reset to default
  const handleReset = () => {
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
  };

  // Save crop settings
  const handleSave = async () => {
    if (!imageDimensions.width || !imageDimensions.height) return;

    setIsSaving(true);
    const cropSettings: CropSettings = {
      scale,
      offsetX,
      offsetY,
      originalWidth: imageDimensions.width,
      originalHeight: imageDimensions.height,
    };

    try {
      await updateCropSettings({
        imageId,
        cropSettings,
      });

      onSave?.(cropSettings);
      onClose();
    } catch (error) {
      console.error("Failed to save crop settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Image transform style
  const imageStyle: React.CSSProperties = {
    transform: `scale(${scale}) translate(${offsetX}%, ${offsetY}%)`,
    transformOrigin: "center center",
    cursor: isDragging ? "grabbing" : "grab",
    userSelect: "none",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-white">Crop Image</h2>
            <p className="text-sm text-gray-400">
              Adjust how your image appears in the square book format
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Crop area */}
        <div className="p-6">
          <div
            ref={containerRef}
            className="relative mx-auto bg-gray-800 rounded-lg overflow-hidden"
            style={{ width: "400px", height: "400px" }}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            {/* Square frame indicator */}
            <div className="absolute inset-0 border-2 border-dashed border-purple-400/50 pointer-events-none z-10" />

            {/* Image */}
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Crop preview"
              className="w-full h-full object-cover"
              style={imageStyle}
              draggable={false}
            />

            {/* Corner indicators */}
            <div className="absolute top-2 left-2 w-8 h-8 border-l-2 border-t-2 border-white/60 pointer-events-none" />
            <div className="absolute top-2 right-2 w-8 h-8 border-r-2 border-t-2 border-white/60 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-8 h-8 border-l-2 border-b-2 border-white/60 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-8 h-8 border-r-2 border-b-2 border-white/60 pointer-events-none" />
          </div>

          {/* Instructions */}
          <p className="text-center text-gray-400 text-sm mt-3">
            Drag to pan, use slider to zoom
          </p>

          {/* Zoom slider */}
          <div className="mt-6">
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm w-12">Zoom</span>
              <input
                type="range"
                min="1"
                max="2"
                step="0.05"
                value={scale}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <span className="text-gray-400 text-sm w-12 text-right">
                {Math.round(scale * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700 bg-gray-800/50">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            Reset
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                "Apply Crop"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
