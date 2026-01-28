"use client";

import { useState } from "react";
import { PhotoUploadSlot } from "./PhotoUploadSlot";
import { TemplateSelector } from "./TemplateSelector";
import { Id, Doc } from "@/convex/_generated/dataModel";

type TemplateType = "single" | "duo" | "trio";

type ImageWithUrls = Doc<"images"> & {
  originalUrl: string | null;
  cartoonUrl: string | null;
  bakedUrl: string | null;
};

type PageWithImages = Doc<"pages"> & {
  images: ImageWithUrls[];
};

interface SpreadEditorProps {
  leftPage: PageWithImages;
  rightPage?: PageWithImages;
  currentLayout: TemplateType;
  onLayoutChange: (layout: TemplateType) => void;
  onOpenTextEditor: (imageId: Id<"images">, imageUrl: string) => void;
}

export function SpreadEditor({
  leftPage,
  rightPage,
  currentLayout,
  onLayoutChange,
  onOpenTextEditor,
}: SpreadEditorProps) {
  // Combine images from both pages
  const leftImages = leftPage.images || [];
  const rightImages = rightPage?.images || [];
  const allImages = [...leftImages, ...rightImages];

  // Get image data for a specific slot
  const getImageForSlot = (index: number) => {
    const image = allImages[index];
    if (!image) return undefined;

    return {
      _id: image._id,
      originalImageUrl: image.originalUrl || undefined,
      cartoonImageUrl: image.cartoonUrl || undefined,
      bakedImageUrl: image.bakedUrl || undefined,
      status: image.generationStatus, // "pending" | "generating" | "completed" | "failed"
    };
  };

  const getPageIdForSlot = (index: number) => {
    // Slot 0 is always left page
    if (index === 0) return leftPage._id;
    // Slots 1+ are on right page (if it exists)
    return rightPage?._id || leftPage._id;
  };

  const handleAddText = (index: number) => {
    const image = allImages[index];
    const url = image?.bakedUrl || image?.cartoonUrl;
    if (image && url) {
      onOpenTextEditor(image._id, url);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {/* The Spread - Two Facing Pages */}
      <div className="relative">
        {/* Book shadow/background */}
        <div className="absolute -inset-4 bg-gradient-to-b from-gray-200 to-gray-300 rounded-3xl blur-xl opacity-50" />
        
        <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 shadow-2xl">
          <div className="flex gap-1">
            {/* Left Page */}
            <div className="w-[400px] h-[400px] bg-white rounded-l-2xl shadow-lg p-6 relative">
              {currentLayout === "single" && (
                <PhotoUploadSlot
                  pageId={getPageIdForSlot(0)}
                  imageIndex={0}
                  image={getImageForSlot(0)}
                  aspectRatio="1/1"
                  onAddText={() => handleAddText(0)}
                />
              )}
              {currentLayout === "duo" && (
                <PhotoUploadSlot
                  pageId={getPageIdForSlot(0)}
                  imageIndex={0}
                  image={getImageForSlot(0)}
                  aspectRatio="1/1"
                  onAddText={() => handleAddText(0)}
                />
              )}
              {currentLayout === "trio" && (
                <PhotoUploadSlot
                  pageId={getPageIdForSlot(0)}
                  imageIndex={0}
                  image={getImageForSlot(0)}
                  aspectRatio="1/1"
                  onAddText={() => handleAddText(0)}
                />
              )}
            </div>

            {/* Center fold line */}
            <div className="w-1 bg-gradient-to-b from-transparent via-gray-400 to-transparent" />

            {/* Right Page */}
            <div className="w-[400px] h-[400px] bg-white rounded-r-2xl shadow-lg p-6 relative">
              {currentLayout === "single" && (
                <div className="aspect-square rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-gray-400">
                  <span className="text-sm">Part of left image</span>
                </div>
              )}
              {currentLayout === "duo" && rightPage && (
                <PhotoUploadSlot
                  pageId={getPageIdForSlot(1)}
                  imageIndex={1}
                  image={getImageForSlot(1)}
                  aspectRatio="1/1"
                  onAddText={() => handleAddText(1)}
                />
              )}
              {currentLayout === "trio" && (
                <div className="flex flex-col gap-3 h-full">
                  <div className="flex-1">
                    {rightPage && (
                      <PhotoUploadSlot
                        pageId={getPageIdForSlot(1)}
                        imageIndex={1}
                        image={getImageForSlot(1)}
                        aspectRatio="1/1"
                        onAddText={() => handleAddText(1)}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    {rightPage && (
                      <PhotoUploadSlot
                        pageId={getPageIdForSlot(2)}
                        imageIndex={2}
                        image={getImageForSlot(2)}
                        aspectRatio="1/1"
                        onAddText={() => handleAddText(2)}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Page numbers */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-between px-12 text-xs text-gray-400 font-serif">
            <span>{leftPage.sortOrder !== undefined ? (leftPage.sortOrder * 2 + 1) : "—"}</span>
            <span>{rightPage?.sortOrder !== undefined ? (rightPage.sortOrder * 2 + 2) : "—"}</span>
          </div>
        </div>
      </div>

      {/* Template Selector */}
      <TemplateSelector selected={currentLayout} onChange={onLayoutChange} />
    </div>
  );
}
