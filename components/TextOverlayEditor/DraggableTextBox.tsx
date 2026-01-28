"use client";

import { FONTS, FONT_SIZES } from "@/lib/print-specs";

export type TextOverlayStyle = {
  fontFamily: keyof typeof FONTS;
  fontSize: keyof typeof FONT_SIZES;
  color: string;
  textAlign: "left" | "center" | "right";
  hasBackground?: boolean;
  hasShadow?: boolean;
};

export type TextOverlayPosition = {
  x: number; // Percentage from left (0-100)
  y: number; // Percentage from top (0-100)
  width: number; // Width as percentage of container
};

type DraggableTextBoxProps = {
  id: string;
  content: string;
  position: TextOverlayPosition;
  style: TextOverlayStyle;
  isSelected: boolean;
  onSelect: () => void;
};

/**
 * Simplified display-only text overlay component.
 * No drag, no inline editing, no resize handles.
 * Just renders the text with the given style and position.
 */
export function DraggableTextBox({
  id,
  content,
  position,
  style,
  isSelected,
  onSelect,
}: DraggableTextBoxProps) {
  // Get font styles
  const fontConfig = FONTS[style.fontFamily];
  const sizeConfig = FONT_SIZES[style.fontSize];

  // Build inline styles
  const textStyles: React.CSSProperties = {
    fontFamily: fontConfig.family,
    fontSize: `${sizeConfig.pixels}px`,
    color: style.color,
    textAlign: style.textAlign,
    textShadow: style.hasShadow
      ? "0 2px 8px rgba(0, 0, 0, 0.7), 0 1px 3px rgba(0, 0, 0, 0.8)"
      : undefined,
    lineHeight: 1.3,
  };

  const backgroundStyles: React.CSSProperties = style.hasBackground
    ? {
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        padding: "8px 12px",
        borderRadius: "4px",
      }
    : {};

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`absolute select-none cursor-pointer transition-all ${
        isSelected ? "ring-2 ring-purple-500 ring-offset-2" : ""
      }`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: `${position.width}%`,
        transform: "translate(-50%, 0)",
        ...backgroundStyles,
      }}
    >
      {/* Text content - display only */}
      <div style={textStyles} className="whitespace-pre-wrap break-words">
        {content || "Empty text"}
      </div>
    </div>
  );
}
