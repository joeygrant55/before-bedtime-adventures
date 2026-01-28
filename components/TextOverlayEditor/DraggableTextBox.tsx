"use client";

import { useState, useRef, useCallback } from "react";
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
  onSelect: () => void;
  onPositionChange: (position: TextOverlayPosition) => void;
  containerRef: React.RefObject<HTMLElement | null>;
};

/**
 * Draggable and resizable text overlay component.
 * Text editing happens in sidebar - this is only for visual positioning.
 */
export function DraggableTextBox({
  id,
  content,
  position,
  style,
  isSelected,
  onSelect,
  onPositionChange,
  containerRef,
}: DraggableTextBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; startPos: TextOverlayPosition } | null>(null);
  const resizeStartRef = useRef<{ x: number; startWidth: number; startX: number } | null>(null);

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

  // Constrain position to safe margins
  const constrainPosition = useCallback((pos: TextOverlayPosition): TextOverlayPosition => {
    const MARGIN = MARGIN_PERCENTAGES.safetyMargin;
    const halfWidth = pos.width / 2;
    
    return {
      x: Math.max(MARGIN + halfWidth, Math.min(100 - MARGIN - halfWidth, pos.x)),
      y: Math.max(MARGIN, Math.min(100 - MARGIN, pos.y)),
      width: Math.max(10, Math.min(100 - MARGIN * 2, pos.width)),
    };
  }, []);

  // Handle drag start
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isResizing) return;
    e.stopPropagation();
    
    const container = containerRef.current;
    if (!container) return;

    onSelect();

    const rect = container.getBoundingClientRect();
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPos: { ...position },
    };

    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [containerRef, position, onSelect, isResizing]);

  // Handle drag move (also handles resize move)
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();

    // Handle dragging
    if (isDragging && dragStartRef.current) {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      const deltaXPercent = (deltaX / rect.width) * 100;
      const deltaYPercent = (deltaY / rect.height) * 100;

      const newPosition = constrainPosition({
        x: dragStartRef.current.startPos.x + deltaXPercent,
        y: dragStartRef.current.startPos.y + deltaYPercent,
        width: position.width,
      });

      onPositionChange(newPosition);
    }

    // Handle resizing
    if (isResizing && resizeStartRef.current) {
      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaXPercent = (deltaX / rect.width) * 100;

      let newWidth = resizeStartRef.current.startWidth;
      let newX = resizeStartRef.current.startX;

      if (isResizing === 'right') {
        // Resize from right: increase width
        newWidth = resizeStartRef.current.startWidth + deltaXPercent;
      } else {
        // Resize from left: decrease width and adjust x position
        newWidth = resizeStartRef.current.startWidth - deltaXPercent;
        newX = resizeStartRef.current.startX + (deltaXPercent / 2); // Keep centered
      }

      const newPosition = constrainPosition({
        x: newX,
        y: position.y,
        width: newWidth,
      });

      onPositionChange(newPosition);
    }
  }, [isDragging, isResizing, containerRef, position.width, position.y, constrainPosition, onPositionChange]);

  // Handle drag/resize end
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      dragStartRef.current = null;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
    if (isResizing) {
      setIsResizing(null);
      resizeStartRef.current = null;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  }, [isDragging, isResizing]);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.PointerEvent, side: 'left' | 'right') => {
    e.stopPropagation();
    e.preventDefault();
    
    const container = containerRef.current;
    if (!container) return;

    onSelect(); // Select the text box when starting to resize

    resizeStartRef.current = {
      x: e.clientX,
      startWidth: position.width,
      startX: position.x,
    };

    setIsResizing(side);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [containerRef, position.width, position.x, onSelect]);

  // Determine cursor style
  const getCursor = () => {
    if (isDragging) return "grabbing";
    if (isResizing) return "ew-resize";
    return "default";
  };

  // Determine border style
  const getBorderStyle = () => {
    if (isDragging) return "2px solid rgba(139, 92, 246, 0.8)";
    if (isHovering || isSelected) return "2px dashed rgba(139, 92, 246, 0.5)";
    return "2px dashed transparent";
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`absolute select-none transition-all ${
        isSelected ? "ring-2 ring-purple-500 ring-offset-2" : ""
      }`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: `${position.width}%`,
        transform: "translate(-50%, 0)",
        cursor: getCursor(),
        opacity: isDragging ? 0.8 : 1,
        ...backgroundStyles,
        border: getBorderStyle(),
      }}
    >
      {/* Text content - display only */}
      <div style={textStyles} className="whitespace-pre-wrap break-words pointer-events-none">
        {content || "Empty text"}
      </div>

      {/* Resize handles - only show when selected or hovering */}
      {(isSelected || isHovering) && (
        <>
          {/* Left resize handle */}
          <div
            onPointerDown={(e) => handleResizeStart(e, 'left')}
            className="absolute top-0 left-0 w-4 h-full cursor-ew-resize bg-purple-500 opacity-0 hover:opacity-100 transition-opacity z-10"
            style={{ transform: "translateX(-50%)", touchAction: "none" }}
          >
            <div className="absolute inset-y-0 left-1/2 w-1 bg-white rounded-full" />
          </div>

          {/* Right resize handle */}
          <div
            onPointerDown={(e) => handleResizeStart(e, 'right')}
            className="absolute top-0 right-0 w-4 h-full cursor-ew-resize bg-purple-500 opacity-0 hover:opacity-100 transition-opacity z-10"
            style={{ transform: "translateX(50%)", touchAction: "none" }}
          >
            <div className="absolute inset-y-0 left-1/2 w-1 bg-white rounded-full" />
          </div>
        </>
      )}
    </div>
  );
}
