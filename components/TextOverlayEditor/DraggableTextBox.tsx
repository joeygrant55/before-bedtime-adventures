"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useDragControls, PanInfo } from "framer-motion";
import { FONTS, FONT_SIZES, MARGIN_PERCENTAGES } from "@/lib/print-specs";

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
  isEditing: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onSelect: () => void;
  onDeselect: () => void;
  onStartEdit: () => void;
  onEndEdit: () => void;
  onContentChange: (content: string) => void;
  onPositionChange: (position: TextOverlayPosition) => void;
  onDelete: () => void;
};

export function DraggableTextBox({
  id,
  content,
  position,
  style,
  isSelected,
  isEditing,
  containerRef,
  onSelect,
  onDeselect,
  onStartEdit,
  onEndEdit,
  onContentChange,
  onPositionChange,
  onDelete,
}: DraggableTextBoxProps) {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Safe margin as percentage (enforced during drag)
  const SAFE_MARGIN = MARGIN_PERCENTAGES.safetyMargin;

  // Get font styles
  const fontConfig = FONTS[style.fontFamily];
  const sizeConfig = FONT_SIZES[style.fontSize];

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
      textRef.current.select();
    }
  }, [isEditing]);

  // Handle click outside to deselect
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        if (isEditing) {
          onEndEdit();
        } else if (isSelected) {
          onDeselect();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSelected, isEditing, onDeselect, onEndEdit]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSelected) return;

      // Delete on backspace/delete when selected but not editing
      if ((e.key === "Backspace" || e.key === "Delete") && !isEditing) {
        e.preventDefault();
        onDelete();
      }

      // Enter to start editing
      if (e.key === "Enter" && !isEditing) {
        e.preventDefault();
        onStartEdit();
      }

      // Escape to stop editing or deselect
      if (e.key === "Escape") {
        if (isEditing) {
          onEndEdit();
        } else {
          onDeselect();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSelected, isEditing, onDelete, onStartEdit, onEndEdit, onDeselect]);

  // Constrain position to print-safe area
  const constrainPosition = useCallback(
    (x: number, y: number, width: number): TextOverlayPosition => {
      const minX = SAFE_MARGIN + width / 2;
      const maxX = 100 - SAFE_MARGIN - width / 2;
      const minY = SAFE_MARGIN;
      const maxY = 100 - SAFE_MARGIN;

      return {
        x: Math.max(minX, Math.min(maxX, x)),
        y: Math.max(minY, Math.min(maxY, y)),
        width,
      };
    },
    [SAFE_MARGIN]
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();

      // Calculate new position as percentage
      const deltaXPercent = (info.offset.x / containerRect.width) * 100;
      const deltaYPercent = (info.offset.y / containerRect.height) * 100;

      const newX = position.x + deltaXPercent;
      const newY = position.y + deltaYPercent;

      const constrained = constrainPosition(newX, newY, position.width);
      onPositionChange(constrained);
      setIsDragging(false);
    },
    [containerRef, position, constrainPosition, onPositionChange]
  );

  // Handle resize
  const handleResize = useCallback(
    (e: React.MouseEvent, direction: "left" | "right") => {
      e.stopPropagation();
      if (!containerRef.current) return;

      setIsResizing(true);
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const startX = e.clientX;
      const startWidth = position.width;
      const startPosX = position.x;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaPercent = (deltaX / containerRect.width) * 100;

        let newWidth: number;
        let newX: number;

        if (direction === "right") {
          newWidth = Math.max(10, Math.min(100 - SAFE_MARGIN * 2, startWidth + deltaPercent));
          newX = startPosX;
        } else {
          newWidth = Math.max(10, Math.min(100 - SAFE_MARGIN * 2, startWidth - deltaPercent));
          newX = startPosX + deltaPercent / 2;
        }

        const constrained = constrainPosition(newX, position.y, newWidth);
        onPositionChange(constrained);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [containerRef, position, SAFE_MARGIN, constrainPosition, onPositionChange]
  );

  // Build inline styles
  const textStyles: React.CSSProperties = {
    fontFamily: fontConfig.family,
    fontSize: `${sizeConfig.pixels}px`,
    color: style.color,
    textAlign: style.textAlign,
    textShadow: style.hasShadow
      ? "2px 2px 4px rgba(0, 0, 0, 0.5), -1px -1px 2px rgba(0, 0, 0, 0.3)"
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
    <motion.div
      ref={boxRef}
      drag={!isEditing}
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        if (!isSelected) {
          onSelect();
        }
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onStartEdit();
      }}
      className={`absolute cursor-move select-none ${
        isSelected ? "ring-2 ring-purple-500 ring-offset-2" : ""
      } ${isDragging || isResizing ? "z-50" : ""}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: `${position.width}%`,
        transform: "translate(-50%, 0)",
        ...backgroundStyles,
      }}
    >
      {/* Resize handles (only when selected) */}
      {isSelected && !isEditing && (
        <>
          <div
            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-purple-500/30 -translate-x-1/2"
            onMouseDown={(e) => handleResize(e, "left")}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-purple-500/30 translate-x-1/2"
            onMouseDown={(e) => handleResize(e, "right")}
          />
        </>
      )}

      {/* Delete button (only when selected) */}
      {isSelected && !isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-md"
        >
          x
        </button>
      )}

      {/* Text content */}
      {isEditing ? (
        <textarea
          ref={textRef}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          onBlur={onEndEdit}
          className="w-full bg-transparent border-none outline-none resize-none"
          style={{
            ...textStyles,
            minHeight: "1.5em",
          }}
          rows={Math.max(1, content.split("\n").length)}
        />
      ) : (
        <div
          style={textStyles}
          className="whitespace-pre-wrap break-words"
        >
          {content || "Double-click to edit"}
        </div>
      )}
    </motion.div>
  );
}
