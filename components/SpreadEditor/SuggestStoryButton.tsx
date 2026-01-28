"use client";

import { useState } from "react";

interface SuggestStoryButtonProps {
  imageUrl: string;
  bookTitle: string;
  pageNumber?: number;
  totalPages?: number;
  onSuggestion: (text: string) => void;
  hasContent?: boolean;
  variant?: "subtle" | "prominent";
}

export function SuggestStoryButton({
  imageUrl,
  bookTitle,
  pageNumber,
  totalPages,
  onSuggestion,
  hasContent = false,
  variant = "subtle",
}: SuggestStoryButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuggest = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call the batch API with a single image
      const response = await fetch("/api/suggest-story-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          images: [imageUrl],
          bookTitle,
          context: pageNumber && totalPages 
            ? `This is page ${pageNumber} of ${totalPages}.` 
            : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate suggestion");
      }

      const data = await response.json();
      if (data.suggestions && data.suggestions[0]) {
        onSuggestion(data.suggestions[0]);
      } else {
        throw new Error("No suggestion returned");
      }
    } catch (err) {
      console.error("Error suggesting story:", err);
      setError("Failed to generate suggestion. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === "prominent") {
    return (
      <div className="space-y-2">
        <button
          onClick={handleSuggest}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>✨ Writing your story...</span>
            </>
          ) : (
            <>
              <span>✨</span>
              <span>{hasContent ? "🔄 Try Again" : "Suggest Story"}</span>
            </>
          )}
        </button>
        {error && (
          <p className="text-red-500 text-xs text-center">{error}</p>
        )}
      </div>
    );
  }

  // Subtle variant (default)
  return (
    <div className="space-y-1">
      <button
        onClick={handleSuggest}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <span>Writing...</span>
          </>
        ) : (
          <>
            <span>✨</span>
            <span>{hasContent ? "Try Again" : "Suggest Story"}</span>
          </>
        )}
      </button>
      {error && (
        <p className="text-red-500 text-xs">{error}</p>
      )}
    </div>
  );
}
