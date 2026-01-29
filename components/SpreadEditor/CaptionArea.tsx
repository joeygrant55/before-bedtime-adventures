"use client";

import { useState, useEffect, useRef } from "react";
import { Id } from "@/convex/_generated/dataModel";

interface CaptionAreaProps {
  pageId: Id<"pages">;
  initialText: string;
  placeholder?: string;
  onSave: (text: string) => void;
  editable?: boolean;
}

const MAX_CHARS = 150;
const DEBOUNCE_MS = 1500;

export function CaptionArea({
  pageId,
  initialText,
  placeholder = "Write your story here...",
  onSave,
  editable = true,
}: CaptionAreaProps) {
  const [text, setText] = useState(initialText);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Auto-save with debounce
  const triggerSave = async (newText: string) => {
    // Don't save if text hasn't changed
    if (newText === initialText) return;

    setIsSaving(true);
    try {
      await onSave(newText);
      // Show "saved" indicator
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save caption:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    
    // Enforce character limit
    if (newText.length > MAX_CHARS) {
      return;
    }

    setText(newText);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for auto-save
    debounceTimerRef.current = setTimeout(() => {
      triggerSave(newText);
    }, DEBOUNCE_MS);
  };

  const handleBlur = () => {
    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Save immediately on blur if text changed
    if (text !== initialText) {
      triggerSave(text);
    }
  };

  const charCount = text.length;
  const isNearLimit = charCount >= MAX_CHARS * 0.8; // Show count at 80%

  return (
    <div className="relative w-full h-full">
      {/* Caption text area */}
      <div className="relative h-full">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          readOnly={!editable}
          className={`
            w-full h-full px-4 py-3
            bg-gradient-to-b from-amber-50 to-orange-50
            border-none
            resize-none
            outline-none
            ${editable ? "focus:ring-2 focus:ring-purple-300 focus:ring-opacity-50" : "cursor-default"}
            transition-all duration-200
            text-gray-700 text-sm leading-relaxed
            placeholder:text-gray-400 placeholder:italic
          `}
          aria-label="Story caption text"
          maxLength={MAX_CHARS}
        />

        {/* Character count (shown when near limit) */}
        {isNearLimit && (
          <div
            className={`
              absolute bottom-2 right-2 text-xs
              ${charCount >= MAX_CHARS ? 'text-red-500 font-semibold' : 'text-gray-400'}
            `}
          >
            {charCount}/{MAX_CHARS}
          </div>
        )}
      </div>

      {/* Save indicator */}
      <div className="flex items-center justify-end gap-2 mt-1 min-h-[20px]">
        {isSaving && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <svg
              className="animate-spin h-3 w-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Saving...</span>
          </div>
        )}

        {showSaved && !isSaving && (
          <div className="flex items-center gap-1 text-xs text-green-600 animate-fade-in">
            <svg
              className="h-3 w-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>Saved</span>
          </div>
        )}
      </div>
    </div>
  );
}
