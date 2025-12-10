"use client";

import { FONTS, FONT_SIZES } from "@/lib/print-specs";
import type { TextOverlayStyle } from "./DraggableTextBox";

type TextStyleToolbarProps = {
  style: TextOverlayStyle;
  onStyleChange: (style: Partial<TextOverlayStyle>) => void;
  disabled?: boolean;
};

const PRESET_COLORS = [
  { value: "#FFFFFF", label: "White" },
  { value: "#1F2937", label: "Dark Gray" },
  { value: "#000000", label: "Black" },
  { value: "#7C3AED", label: "Purple" },
  { value: "#2563EB", label: "Blue" },
  { value: "#059669", label: "Green" },
  { value: "#DC2626", label: "Red" },
  { value: "#D97706", label: "Orange" },
  { value: "#EC4899", label: "Pink" },
];

export function TextStyleToolbar({
  style,
  onStyleChange,
  disabled = false,
}: TextStyleToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Font Family */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 font-medium">Font</label>
        <select
          value={style.fontFamily}
          onChange={(e) =>
            onStyleChange({ fontFamily: e.target.value as keyof typeof FONTS })
          }
          disabled={disabled}
          className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
        >
          {Object.entries(FONTS).map(([key, font]) => (
            <option key={key} value={key}>
              {font.description}
            </option>
          ))}
        </select>
      </div>

      {/* Font Size */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 font-medium">Size</label>
        <select
          value={style.fontSize}
          onChange={(e) =>
            onStyleChange({ fontSize: e.target.value as keyof typeof FONT_SIZES })
          }
          disabled={disabled}
          className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
        >
          {Object.entries(FONT_SIZES).map(([key, size]) => (
            <option key={key} value={key}>
              {size.label}
            </option>
          ))}
        </select>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-gray-300" />

      {/* Text Alignment */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 font-medium">Align</label>
        <div className="flex gap-0.5">
          {(["left", "center", "right"] as const).map((align) => (
            <button
              key={align}
              onClick={() => onStyleChange({ textAlign: align })}
              disabled={disabled}
              className={`px-2.5 py-1.5 text-sm border transition-colors ${
                style.textAlign === align
                  ? "bg-purple-500 text-white border-purple-500"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              } ${align === "left" ? "rounded-l-md" : ""} ${
                align === "right" ? "rounded-r-md" : ""
              } disabled:opacity-50`}
            >
              {align === "left" && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 4.5A.5.5 0 012.5 4h11a.5.5 0 010 1h-11A.5.5 0 012 4.5zm0 4A.5.5 0 012.5 8h7a.5.5 0 010 1h-7A.5.5 0 012 8.5zm0 4a.5.5 0 01.5-.5h11a.5.5 0 010 1h-11a.5.5 0 01-.5-.5zm0 4a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7a.5.5 0 01-.5-.5z" />
                </svg>
              )}
              {align === "center" && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4.5A.5.5 0 014.5 4h11a.5.5 0 010 1h-11A.5.5 0 014 4.5zm2 4a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7A.5.5 0 016 8.5zm-2 4a.5.5 0 01.5-.5h11a.5.5 0 010 1h-11a.5.5 0 01-.5-.5zm2 4a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7a.5.5 0 01-.5-.5z" />
                </svg>
              )}
              {align === "right" && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6 4.5A.5.5 0 016.5 4h11a.5.5 0 010 1h-11A.5.5 0 016 4.5zm4 4a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7a.5.5 0 01-.5-.5zm-4 4a.5.5 0 01.5-.5h11a.5.5 0 010 1h-11a.5.5 0 01-.5-.5zm4 4a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7a.5.5 0 01-.5-.5z" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-gray-300" />

      {/* Color Picker */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 font-medium">Color</label>
        <div className="flex items-center gap-1.5">
          {PRESET_COLORS.slice(0, 5).map((color) => (
            <button
              key={color.value}
              onClick={() => onStyleChange({ color: color.value })}
              disabled={disabled}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                style.color === color.value
                  ? "border-purple-500 ring-2 ring-purple-300"
                  : "border-gray-300"
              } disabled:opacity-50`}
              style={{ backgroundColor: color.value }}
              title={color.label}
            />
          ))}
          <input
            type="color"
            value={style.color}
            onChange={(e) => onStyleChange({ color: e.target.value })}
            disabled={disabled}
            className="w-6 h-6 rounded cursor-pointer border border-gray-300 disabled:opacity-50"
            title="Custom color"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-gray-300" />

      {/* Effects */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 font-medium">Effects</label>
        <div className="flex gap-1.5">
          <button
            onClick={() => onStyleChange({ hasBackground: !style.hasBackground })}
            disabled={disabled}
            className={`px-2.5 py-1.5 text-xs font-medium border rounded-md transition-colors ${
              style.hasBackground
                ? "bg-purple-500 text-white border-purple-500"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            } disabled:opacity-50`}
            title="Add background"
          >
            BG
          </button>
          <button
            onClick={() => onStyleChange({ hasShadow: !style.hasShadow })}
            disabled={disabled}
            className={`px-2.5 py-1.5 text-xs font-medium border rounded-md transition-colors ${
              style.hasShadow
                ? "bg-purple-500 text-white border-purple-500"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            } disabled:opacity-50`}
            title="Add shadow"
          >
            Shadow
          </button>
        </div>
      </div>
    </div>
  );
}
