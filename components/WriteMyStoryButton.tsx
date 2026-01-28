"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface ImageWithInfo {
  _id: Id<"images">;
  cartoonUrl: string | null;
  bakedUrl: string | null;
}

interface WriteMyStoryButtonProps {
  bookTitle: string;
  allImages: ImageWithInfo[];
  variant?: "header" | "inline";
}

export function WriteMyStoryButton({
  bookTitle,
  allImages,
  variant = "header",
}: WriteMyStoryButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createOrUpdateStoryOverlay = useMutation(api.textOverlays.createOrUpdateStoryOverlay);

  // Filter to only completed images that have cartoon/baked URLs
  const validImages = allImages.filter(
    (img) => img.cartoonUrl || img.bakedUrl
  );

  const handleGenerateStories = async () => {
    if (validImages.length === 0) {
      setError("No transformed images found. Please wait for images to complete.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(false);
    setProgress({ current: 0, total: validImages.length });

    try {
      // Prepare image URLs
      const imageUrls = validImages.map((img) => img.bakedUrl || img.cartoonUrl!);

      // Call the batch API
      const response = await fetch("/api/suggest-story-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          images: imageUrls,
          bookTitle,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate story suggestions");
      }

      const data = await response.json();
      const suggestions: string[] = data.suggestions || [];

      // Create or update text overlays for each image
      for (let i = 0; i < validImages.length; i++) {
        const image = validImages[i];
        const suggestion = suggestions[i] || "A magical moment from our adventure.";

        setProgress({ current: i + 1, total: validImages.length });

        // Use the mutation that creates or updates story overlays
        await createOrUpdateStoryOverlay({
          imageId: image._id,
          content: suggestion,
        });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error generating stories:", err);
      setError("Failed to generate stories. Please try again.");
    } finally {
      setIsGenerating(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const isDisabled = validImages.length === 0 || isGenerating;

  if (variant === "inline") {
    return (
      <div className="space-y-2">
        <button
          onClick={handleGenerateStories}
          disabled={isDisabled}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25 hover:shadow-xl hover:scale-105"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
              <span>
                ✨ Writing... {progress.current}/{progress.total}
              </span>
            </>
          ) : success ? (
            <>
              <span className="text-lg">✅</span>
              <span>Stories Generated!</span>
            </>
          ) : (
            <>
              <span className="text-lg">✨</span>
              <span>Write My Story</span>
            </>
          )}
        </button>
        
        {validImages.length === 0 && (
          <p className="text-amber-600 text-xs text-center">
            Upload and transform photos first
          </p>
        )}
        
        {error && (
          <p className="text-red-500 text-xs text-center">{error}</p>
        )}
        
        {success && (
          <p className="text-emerald-600 text-xs text-center">
            ✨ Story text added to all pages! Click "Add Text" on any image to edit.
          </p>
        )}
      </div>
    );
  }

  // Header variant - compact button
  return (
    <div className="relative group">
      <button
        onClick={handleGenerateStories}
        disabled={isDisabled}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>
              {progress.current}/{progress.total}
            </span>
          </>
        ) : success ? (
          <>
            <span>✅</span>
            <span className="hidden sm:inline">Done!</span>
          </>
        ) : (
          <>
            <span>✨</span>
            <span>Write My Story</span>
          </>
        )}
      </button>

      {/* Tooltip */}
      {!isGenerating && !success && validImages.length > 0 && (
        <div className="hidden group-hover:block absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap shadow-lg z-50">
          AI will write story text for all {validImages.length} images
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 border-4 border-transparent border-b-gray-900" />
        </div>
      )}

      {error && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-red-500 text-white text-xs rounded-lg whitespace-nowrap shadow-lg z-50">
          {error}
        </div>
      )}
    </div>
  );
}
