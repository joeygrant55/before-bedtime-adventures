"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { PhotoUploadSlot } from "./PhotoUploadSlot";
import { useToast } from "@/components/ui/Toast";

type ImageWithUrls = Doc<"images"> & {
  originalUrl: string | null;
  cartoonUrl: string | null;
  bakedUrl: string | null;
};

type PageWithImages = Doc<"pages"> & {
  images: ImageWithUrls[];
};

type CoverTheme = "purple-magic" | "ocean-adventure" | "sunset-wonder" | "forest-dreams";

interface CoverDesign {
  title: string;
  subtitle?: string;
  authorLine?: string;
  heroImageId?: Id<"_storage">;
  heroImageUrl?: string | null;
  theme: CoverTheme;
  dedication?: string;
}

interface BackCoverSpreadProps {
  bookId: Id<"books">;
  coverDesign?: CoverDesign;
  leftPage: PageWithImages; // Last content page
  onOpenTextEditor?: (imageId: Id<"images">, imageUrl: string) => void;
}

const THEME_GRADIENTS: Record<CoverTheme, string> = {
  "purple-magic": "from-purple-600 via-pink-500 to-indigo-600",
  "ocean-adventure": "from-blue-500 via-cyan-400 to-teal-500",
  "sunset-wonder": "from-orange-500 via-pink-500 to-purple-600",
  "forest-dreams": "from-green-600 via-emerald-500 to-teal-600",
};

export function BackCoverSpread({
  bookId,
  coverDesign,
  leftPage,
  onOpenTextEditor,
}: BackCoverSpreadProps) {
  const { user } = useUser();
  const { success, error: showError } = useToast();

  const [editingDedication, setEditingDedication] = useState(false);
  const [tempDedication, setTempDedication] = useState(coverDesign?.dedication || "");

  const updateCoverDesign = useMutation(api.books.updateCoverDesign);

  const currentTheme = coverDesign?.theme || "purple-magic";
  const currentDedication = coverDesign?.dedication || "";

  // Get images from left page (last content page)
  const leftImages = leftPage.images || [];
  const getImageForSlot = (index: number) => {
    const image = leftImages[index];
    if (!image) return undefined;

    return {
      _id: image._id,
      originalImageUrl: image.originalUrl || undefined,
      cartoonImageUrl: image.cartoonUrl || undefined,
      bakedImageUrl: image.bakedUrl || undefined,
      status: image.generationStatus,
    };
  };

  const handleAddText = (index: number) => {
    const image = leftImages[index];
    const url = image?.bakedUrl || image?.cartoonUrl;
    if (image && url && onOpenTextEditor) {
      onOpenTextEditor(image._id, url);
    }
  };

  const saveDedication = async () => {
    if (!user) return;

    try {
      await updateCoverDesign({
        clerkId: user.id,
        bookId,
        coverDesign: {
          title: coverDesign?.title || "",
          subtitle: coverDesign?.subtitle,
          authorLine: coverDesign?.authorLine,
          theme: currentTheme,
          heroImageId: coverDesign?.heroImageId,
          dedication: tempDedication.trim() || undefined,
        },
      });
      success("Dedication updated!");
    } catch (error) {
      console.error("Failed to update dedication:", error);
      showError("Failed to update dedication. Please try again.");
    }
    setEditingDedication(false);
  };

  const handleDedicationKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveDedication();
    }
    if (e.key === "Escape") {
      setTempDedication(currentDedication);
      setEditingDedication(false);
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
            {/* LEFT PAGE: Last Content Page */}
            <div className="w-[400px] h-[400px] bg-white rounded-l-2xl shadow-lg p-6 relative">
              <PhotoUploadSlot
                pageId={leftPage._id}
                imageIndex={0}
                image={getImageForSlot(0)}
                aspectRatio="1/1"
                onAddText={() => handleAddText(0)}
              />
            </div>

            {/* Center fold line */}
            <div className="w-1 bg-gradient-to-b from-transparent via-gray-400 to-transparent" />

            {/* RIGHT PAGE: Back Cover */}
            <div
              className="w-[400px] h-[400px] rounded-r-2xl shadow-lg relative overflow-hidden"
            >
              {/* Background with theme gradient (subtle) */}
              <div className={`absolute inset-0 bg-gradient-to-br ${THEME_GRADIENTS[currentTheme]} opacity-20`} />
              
              {/* Warm overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-amber-50 to-orange-50" />

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col items-center justify-between p-8">
                {/* Top spacer */}
                <div className="flex-1" />

                {/* Dedication text */}
                <div className="flex-1 flex items-center justify-center w-full">
                  {editingDedication ? (
                    <textarea
                      value={tempDedication}
                      onChange={(e) => setTempDedication(e.target.value)}
                      onBlur={saveDedication}
                      onKeyDown={handleDedicationKeyDown}
                      placeholder="This book was made for..."
                      autoFocus
                      className="w-full max-w-[300px] min-h-[100px] text-center bg-white/50 backdrop-blur-sm border-2 border-gray-300 rounded-lg px-4 py-3 outline-none resize-none text-gray-700"
                      style={{ fontFamily: "Georgia, serif" }}
                    />
                  ) : (
                    <p
                      onClick={() => {
                        setTempDedication(currentDedication);
                        setEditingDedication(true);
                      }}
                      className="text-center text-gray-700 italic cursor-text hover:scale-105 transition-transform max-w-[300px]"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {currentDedication || (
                        <span className="opacity-50 not-italic text-sm">
                          + Add dedication
                          <br />
                          <span className="text-xs">(click to edit)</span>
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Bottom: Made with love + BBA branding */}
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <span>Made with</span>
                    <span className="text-red-500 text-lg">❤️</span>
                  </div>
                  
                  {/* BBA logo/branding */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="text-xs text-gray-500 font-medium">
                      Before Bedtime Adventures
                    </div>
                    <div className="text-xs text-gray-400">
                      www.beforebedtimeadventures.com
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Page numbers */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-between px-12 text-xs text-gray-400 font-serif">
            <span>{leftPage.sortOrder !== undefined ? (leftPage.sortOrder * 2 + 1) : "—"}</span>
            <span>Back Cover</span>
          </div>
        </div>
      </div>

      {/* Instructions hint */}
      <div className="text-center max-w-md">
        <p className="text-sm text-gray-500">
          ✨ This is the back cover of your book. Add a personal dedication or leave it simple.
        </p>
      </div>
    </div>
  );
}
