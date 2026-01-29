"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PhotoUploadSlot } from "./PhotoUploadSlot";
import { CaptionArea } from "./CaptionArea";
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
  showTemplateSelector?: boolean;
  onToggleTemplateSelector?: () => void;
  editable?: boolean;
}

export function SpreadEditor({
  leftPage,
  rightPage,
  currentLayout,
  onLayoutChange,
  showTemplateSelector = false,
  onToggleTemplateSelector,
  editable = true,
}: SpreadEditorProps) {
  const updatePageText = useMutation(api.pages.updatePageText);

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

  // Handle caption save
  const handleCaptionSave = async (pageId: Id<"pages">, text: string) => {
    await updatePageText({
      pageId,
      storyText: text,
    });
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* The Spread - Two Facing Pages */}
      <div className="relative">
        {/* Book shadow/background */}
        <div className="absolute -inset-4 bg-gradient-to-b from-gray-200 to-gray-300 rounded-3xl blur-xl opacity-50" />
        
        <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 shadow-2xl">
          <div className="flex gap-1">
            {/* Left Page */}
            <div className="w-[400px] bg-white rounded-l-2xl shadow-lg overflow-hidden relative">
              {currentLayout === "single" && (
                <div className="flex flex-col h-full">
                  <div className="flex-[3]">
                    <PhotoUploadSlot
                      pageId={getPageIdForSlot(0)}
                      imageIndex={0}
                      image={getImageForSlot(0)}
                      aspectRatio="1/1"
                    />
                  </div>
                  <div className="flex-1 border-t border-gray-100">
                    <CaptionArea
                      pageId={leftPage._id}
                      initialText={leftPage.storyText || ""}
                      placeholder="Write your story here..."
                      onSave={(text) => handleCaptionSave(leftPage._id, text)}
                    />
                  </div>
                </div>
              )}
              {currentLayout === "duo" && (
                <div className="flex flex-col h-full">
                  <div className="flex-[3]">
                    <PhotoUploadSlot
                      pageId={getPageIdForSlot(0)}
                      imageIndex={0}
                      image={getImageForSlot(0)}
                      aspectRatio="1/1"
                    />
                  </div>
                  <div className="flex-1 border-t border-gray-100">
                    <CaptionArea
                      pageId={leftPage._id}
                      initialText={leftPage.storyText || ""}
                      placeholder="Write your story here..."
                      onSave={(text) => handleCaptionSave(leftPage._id, text)}
                    />
                  </div>
                </div>
              )}
              {currentLayout === "trio" && (
                <div className="flex flex-col h-full">
                  <div className="flex-[3]">
                    <PhotoUploadSlot
                      pageId={getPageIdForSlot(0)}
                      imageIndex={0}
                      image={getImageForSlot(0)}
                      aspectRatio="1/1"
                    />
                  </div>
                  <div className="flex-1 border-t border-gray-100">
                    <CaptionArea
                      pageId={leftPage._id}
                      initialText={leftPage.storyText || ""}
                      placeholder="Write your story here..."
                      onSave={(text) => handleCaptionSave(leftPage._id, text)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Center fold line */}
            <div className="w-1 bg-gradient-to-b from-transparent via-gray-400 to-transparent" />

            {/* Right Page */}
            <div className="w-[400px] bg-white rounded-r-2xl shadow-lg overflow-hidden relative">
              {currentLayout === "single" && (
                <div className="flex flex-col h-full items-center justify-center p-6">
                  <div className="aspect-square w-full rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-gray-400">
                    <span className="text-sm text-center px-4">
                      Single layout uses full spread<br/>for one large image
                    </span>
                  </div>
                </div>
              )}
              {currentLayout === "duo" && rightPage && (
                <div className="flex flex-col h-full">
                  <div className="flex-[3]">
                    <PhotoUploadSlot
                      pageId={getPageIdForSlot(1)}
                      imageIndex={1}
                      image={getImageForSlot(1)}
                      aspectRatio="1/1"
                    />
                  </div>
                  <div className="flex-1 border-t border-gray-100">
                    <CaptionArea
                      pageId={rightPage._id}
                      initialText={rightPage.storyText || ""}
                      placeholder="Write your story here..."
                      onSave={(text) => handleCaptionSave(rightPage._id, text)}
                    />
                  </div>
                </div>
              )}
              {currentLayout === "trio" && (
                <div className="flex flex-col h-full">
                  <div className="flex-[3] flex flex-col gap-2 p-4">
                    <div className="flex-1">
                      {rightPage && (
                        <PhotoUploadSlot
                          pageId={getPageIdForSlot(1)}
                          imageIndex={1}
                          image={getImageForSlot(1)}
                          aspectRatio="16/9"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      {rightPage && (
                        <PhotoUploadSlot
                          pageId={getPageIdForSlot(2)}
                          imageIndex={2}
                          image={getImageForSlot(2)}
                          aspectRatio="16/9"
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 border-t border-gray-100">
                    {rightPage && (
                      <CaptionArea
                        pageId={rightPage._id}
                        initialText={rightPage.storyText || ""}
                        placeholder="Write your story here..."
                        onSave={(text) => handleCaptionSave(rightPage._id, text)}
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

          {/* Template selector toggle button - bottom right corner */}
          {onToggleTemplateSelector && (
            <button
              onClick={onToggleTemplateSelector}
              className="absolute bottom-4 right-4 w-10 h-10 bg-white/90 hover:bg-white border-2 border-gray-200 hover:border-purple-400 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
              title="Change layout"
            >
              <span className="text-lg">⚙️</span>
            </button>
          )}
        </div>
      </div>

      {/* Template Selector - shown on demand */}
      {showTemplateSelector && (
        <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-purple-200">
          <TemplateSelector selected={currentLayout} onChange={onLayoutChange} />
        </div>
      )}
    </div>
  );
}
