"use client";

import { MARGIN_PERCENTAGES } from "@/lib/print-specs";

type PresetType = "title-top" | "title-bottom" | "story-bottom";

type QuickPositionPresetsProps = {
  onApplyPreset: (preset: PresetType, content?: string) => void;
  disabled?: boolean;
};

// Print-safe margin (approx 3% from edges)
const MARGIN = MARGIN_PERCENTAGES.safetyMargin;

export const POSITION_PRESETS: Record<
  PresetType,
  {
    label: string;
    description: string;
    icon: React.ReactNode;
    position: { x: number; y: number; width: number };
    style: {
      fontFamily: "storybook" | "adventure" | "playful" | "classic";
      fontSize: "small" | "medium" | "large" | "title";
      color: string;
      textAlign: "left" | "center" | "right";
      hasBackground: boolean;
      hasShadow: boolean;
    };
    defaultContent: string;
  }
> = {
  "title-top": {
    label: "Title at Top",
    description: "Large title text at the top of the image",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
        <rect x="2" y="2" width="28" height="28" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="6" y="5" width="20" height="4" rx="1" fill="currentColor" opacity="0.6" />
      </svg>
    ),
    position: { x: 50, y: MARGIN + 5, width: 100 - MARGIN * 2 },
    style: {
      fontFamily: "storybook",
      fontSize: "title",
      color: "#FFFFFF",
      textAlign: "center",
      hasBackground: false,
      hasShadow: true,
    },
    defaultContent: "Chapter Title",
  },
  "title-bottom": {
    label: "Title at Bottom",
    description: "Title text at the bottom of the image",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
        <rect x="2" y="2" width="28" height="28" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="6" y="23" width="20" height="4" rx="1" fill="currentColor" opacity="0.6" />
      </svg>
    ),
    position: { x: 50, y: 85, width: 100 - MARGIN * 2 },
    style: {
      fontFamily: "storybook",
      fontSize: "large",
      color: "#FFFFFF",
      textAlign: "center",
      hasBackground: true,
      hasShadow: true,
    },
    defaultContent: "Scene Title",
  },
  "story-bottom": {
    label: "Story Text",
    description: "Story paragraph at the bottom",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
        <rect x="2" y="2" width="28" height="28" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="6" y="20" width="20" height="2" rx="0.5" fill="currentColor" opacity="0.4" />
        <rect x="6" y="24" width="16" height="2" rx="0.5" fill="currentColor" opacity="0.4" />
      </svg>
    ),
    position: { x: 50, y: 80, width: 100 - MARGIN * 2 },
    style: {
      fontFamily: "classic",
      fontSize: "medium",
      color: "#1F2937",
      textAlign: "center",
      hasBackground: true,
      hasShadow: false,
    },
    defaultContent: "And so the adventure began...",
  },
};

export function QuickPositionPresets({
  onApplyPreset,
  disabled = false,
}: QuickPositionPresetsProps) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-sm font-medium text-gray-700">Quick Add</h4>
      <div className="flex gap-2">
        {(Object.entries(POSITION_PRESETS) as [PresetType, typeof POSITION_PRESETS["title-top"]][]).map(
          ([key, preset]) => (
            <button
              key={key}
              onClick={() => onApplyPreset(key, preset.defaultContent)}
              disabled={disabled}
              className="flex flex-col items-center gap-1 p-2 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={preset.description}
            >
              <span className="text-purple-600">{preset.icon}</span>
              <span className="text-xs text-gray-600">{preset.label}</span>
            </button>
          )
        )}
      </div>
    </div>
  );
}
