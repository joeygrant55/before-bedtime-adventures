"use client";

import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { MARGIN_PERCENTAGES } from "@/lib/print-specs";
import { DraggableTextBox, TextOverlayStyle, TextOverlayPosition } from "./DraggableTextBox";
import { TextStyleToolbar } from "./TextStyleToolbar";
import { QuickPositionPresets, POSITION_PRESETS } from "./QuickPositionPresets";

type TextOverlayEditorProps = {
  imageId: Id<"images">;
  imageUrl: string;
  onClose: () => void;
};

export function TextOverlayEditor({ imageId, imageUrl, onClose }: TextOverlayEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedOverlayId, setSelectedOverlayId] = useState<Id<"textOverlays"> | null>(null);
  const [editingOverlayId, setEditingOverlayId] = useState<Id<"textOverlays"> | null>(null);
  const [isBaking, setIsBaking] = useState(false);

  // Fetch existing overlays
  const overlays = useQuery(api.textOverlays.getImageOverlays, { imageId });

  // Mutations & Actions
  const createOverlay = useMutation(api.textOverlays.create);
  const updateOverlay = useMutation(api.textOverlays.update);
  const deleteOverlay = useMutation(api.textOverlays.remove);
  const createPreset = useMutation(api.textOverlays.createPreset);
  const bakeTextOverlay = useAction(api.bakeTextOverlay.bakeTextOverlay);

  // Get selected overlay data
  const selectedOverlay = overlays?.find((o) => o._id === selectedOverlayId);

  // Handle preset application
  const handleApplyPreset = useCallback(
    async (preset: "title-top" | "title-bottom" | "story-bottom", content?: string) => {
      await createPreset({
        imageId,
        preset,
        content: content || POSITION_PRESETS[preset].defaultContent,
      });
    },
    [createPreset, imageId]
  );

  // Handle adding custom text box
  const handleAddCustom = useCallback(async () => {
    const MARGIN = MARGIN_PERCENTAGES.safetyMargin;
    await createOverlay({
      imageId,
      content: "Click to edit",
      overlayType: "custom",
      position: { x: 50, y: 50, width: 100 - MARGIN * 2 },
      style: {
        fontFamily: "classic",
        fontSize: "medium",
        color: "#1F2937",
        textAlign: "center",
        hasBackground: true,
        hasShadow: false,
      },
    });
  }, [createOverlay, imageId]);

  // Handle content change
  const handleContentChange = useCallback(
    async (overlayId: Id<"textOverlays">, content: string) => {
      await updateOverlay({ overlayId, content });
    },
    [updateOverlay]
  );

  // Handle position change
  const handlePositionChange = useCallback(
    async (overlayId: Id<"textOverlays">, position: TextOverlayPosition) => {
      await updateOverlay({ overlayId, position });
    },
    [updateOverlay]
  );

  // Handle style change
  const handleStyleChange = useCallback(
    async (overlayId: Id<"textOverlays">, styleUpdates: Partial<TextOverlayStyle>) => {
      const overlay = overlays?.find((o) => o._id === overlayId);
      if (!overlay) return;

      await updateOverlay({
        overlayId,
        style: { ...overlay.style, ...styleUpdates },
      });
    },
    [updateOverlay, overlays]
  );

  // Handle delete
  const handleDelete = useCallback(
    async (overlayId: Id<"textOverlays">) => {
      await deleteOverlay({ overlayId });
      if (selectedOverlayId === overlayId) {
        setSelectedOverlayId(null);
      }
    },
    [deleteOverlay, selectedOverlayId]
  );

  // Handle done - bake text and close
  const handleDone = useCallback(async () => {
    // Only bake if there are overlays
    if (overlays && overlays.length > 0) {
      setIsBaking(true);
      try {
        await bakeTextOverlay({ imageId });
      } catch (error) {
        console.error("Error baking text overlay:", error);
      } finally {
        setIsBaking(false);
      }
    }
    onClose();
  }, [bakeTextOverlay, imageId, overlays, onClose]);

  // Print-safe margin percentage
  const MARGIN = MARGIN_PERCENTAGES.safetyMargin;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-900/95">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">Text Overlay Editor</h2>
          <span className="text-sm text-gray-400">
            {overlays?.length || 0} text element{overlays?.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAddCustom}
            disabled={isBaking}
            className="px-3 py-1.5 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            + Add Text
          </button>
          <button
            onClick={handleDone}
            disabled={isBaking}
            className="px-4 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-500 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isBaking ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Baking...</span>
              </>
            ) : (
              <>
                <span>Save & Close</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Presets & Tools */}
        <div className="w-64 p-4 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <QuickPositionPresets onApplyPreset={handleApplyPreset} />

          <div className="mt-6 pt-4 border-t border-gray-700">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Tips</h4>
            <ul className="text-xs text-gray-400 space-y-1.5">
              <li>- Double-click text to edit</li>
              <li>- Drag edges to resize</li>
              <li>- Press Delete to remove</li>
              <li>- Keep text inside the safe zone</li>
            </ul>
          </div>

          {/* Overlay list */}
          {overlays && overlays.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-700">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Layers</h4>
              <div className="space-y-1">
                {overlays.map((overlay) => (
                  <button
                    key={overlay._id}
                    onClick={() => setSelectedOverlayId(overlay._id)}
                    className={`w-full px-2 py-1.5 text-left text-xs rounded transition-colors truncate ${
                      selectedOverlayId === overlay._id
                        ? "bg-purple-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {overlay.content.substring(0, 30)}
                    {overlay.content.length > 30 ? "..." : ""}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center - Image with overlays */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-auto">
          <div
            ref={containerRef}
            className="relative max-w-2xl w-full aspect-square bg-gray-800 rounded-lg overflow-hidden shadow-2xl"
            onClick={() => {
              setSelectedOverlayId(null);
              setEditingOverlayId(null);
            }}
          >
            {/* Background image */}
            <img
              src={imageUrl}
              alt="Cartoon image"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Print-safe zone indicator */}
            <div
              className="absolute border-2 border-dashed border-yellow-400/40 pointer-events-none"
              style={{
                left: `${MARGIN}%`,
                top: `${MARGIN}%`,
                right: `${MARGIN}%`,
                bottom: `${MARGIN}%`,
              }}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-yellow-400/80 text-yellow-900 text-xs font-medium rounded">
                Print Safe Zone
              </div>
            </div>

            {/* Render overlays */}
            {overlays?.map((overlay) => (
              <DraggableTextBox
                key={overlay._id}
                id={overlay._id}
                content={overlay.content}
                position={overlay.position}
                style={overlay.style}
                isSelected={selectedOverlayId === overlay._id}
                isEditing={editingOverlayId === overlay._id}
                containerRef={containerRef}
                onSelect={() => setSelectedOverlayId(overlay._id)}
                onDeselect={() => setSelectedOverlayId(null)}
                onStartEdit={() => {
                  setSelectedOverlayId(overlay._id);
                  setEditingOverlayId(overlay._id);
                }}
                onEndEdit={() => setEditingOverlayId(null)}
                onContentChange={(content) => handleContentChange(overlay._id, content)}
                onPositionChange={(position) => handlePositionChange(overlay._id, position)}
                onDelete={() => handleDelete(overlay._id)}
              />
            ))}
          </div>
        </div>

        {/* Right sidebar - Style controls */}
        <div className="w-80 p-4 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          {selectedOverlay ? (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-300">Style Settings</h4>
              <TextStyleToolbar
                style={selectedOverlay.style}
                onStyleChange={(updates) => handleStyleChange(selectedOverlay._id, updates)}
              />

              <div className="pt-4 border-t border-gray-700">
                <button
                  onClick={() => handleDelete(selectedOverlay._id)}
                  className="w-full px-3 py-2 text-sm font-medium text-red-400 bg-red-900/30 rounded-md hover:bg-red-900/50 transition-colors"
                >
                  Delete Text Element
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <p className="text-sm">Select a text element to edit its style</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
