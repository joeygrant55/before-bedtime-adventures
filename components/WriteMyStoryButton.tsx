"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";

type PageWithImages = Doc<"pages"> & {
  images: any[];
};

interface WriteMyStoryButtonProps {
  bookTitle: string;
  pages: PageWithImages[];
  variant?: "header" | "inline";
}

export function WriteMyStoryButton({
  bookTitle,
  pages,
  variant = "header",
}: WriteMyStoryButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updatePageText = useMutation(api.pages.updatePageText);
  const pageCount = pages.length;

  const handleGenerateStories = async () => {
    if (pageCount === 0) {
      setError("No pages found. Please add some spreads first.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(false);
    setProgress({ current: 0, total: pageCount });

    try {
      // Call the simplified batch API (text-only generation)
      const response = await fetch("/api/suggest-story-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookTitle,
          pageCount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate story suggestions");
      }

      const data = await response.json();
      const suggestions: string[] = data.suggestions || [];

      // Update each page with its suggested story text
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const suggestion = suggestions[i] || "A magical moment from our adventure.";

        setProgress({ current: i + 1, total: pageCount });

        await updatePageText({
          pageId: page._id,
          storyText: suggestion,
        });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error generating stories:", err);
      setError(err instanceof Error ? err.message : "Failed to generate stories. Please try again.");
    } finally {
      setIsGenerating(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const isDisabled = pageCount === 0 || isGenerating;

  if (variant === "inline") {
    return (
      <div className="space-y-2">
        <button
          onClick={handleGenerateStories}
          disabled={isDisabled}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>
                Writing... {progress.current}/{progress.total}
              </span>
            </>
          ) : success ? (
            <>
              <span>✅</span>
              <span>Stories Generated!</span>
            </>
          ) : (
            <>
              <span>✨</span>
              <span>Write My Story</span>
            </>
          )}
        </button>
        
        {pageCount === 0 && (
          <p className="text-amber-600 text-xs text-center">
            Add some spreads first
          </p>
        )}
        
        {error && (
          <p className="text-red-500 text-xs text-center">{error}</p>
        )}
        
        {success && (
          <p className="text-emerald-600 text-xs text-center">
            ✨ Story captions generated for {pageCount} pages!
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
      {!isGenerating && !success && pageCount > 0 && (
        <div className="hidden group-hover:block absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap shadow-lg z-50">
          AI will write story text for all {pageCount} pages
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 border-4 border-transparent border-b-gray-900" />
        </div>
      )}

      {error && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-red-500 text-white text-xs rounded-lg whitespace-nowrap shadow-lg z-50 max-w-xs">
          {error}
        </div>
      )}
    </div>
  );
}
