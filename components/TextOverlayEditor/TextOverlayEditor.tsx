"use client";

import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { MARGIN_PERCENTAGES } from "@/lib/print-specs";
import { DraggableTextBox, TextOverlayStyle, TextOverlayPosition } from "./DraggableTextBox";
import { TextStyleToolbar } from "./TextStyleToolbar";
import { POSITION_PRESETS } from "./QuickPositionPresets";
import { TextOverlayModal } from "./TextOverlayModal";

type TextOverlayEditorProps = {
  imageId: Id<"images">;
  imageUrl: string;
  onClose: () => void;
};

type PositionPreset = "top" | "center" | "bottom";

export function TextOverlayEditor({ imageId, imageUrl, onClose }: TextOverlayEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedOverlayId, setSelectedOverlayId] = useState<Id<"textOverlays"> | null>(null);
  const [isBaking, setIsBaking] = useState(false);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [editingContent, setEditingContent] = useState("");

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

  // Position preset mappings
  const getPositionForPreset = (preset: PositionPreset): TextOverlayPosition => {
    const MARGIN = MARGIN_PERCENTAGES.safetyMargin;
    const width = 100 - MARGIN * 2;

    switch (preset) {
      case "top":
        return { x: 50, y: MARGIN + 5, width };
      case "center":
        return { x: 50, y: 50, width };
      case "bottom":
        return { x: 50, y: 85, width };
    }
  };

  // Show style panel when overlay is selected
  const handleSelectOverlay = useCallback(
    (id: Id<"textOverlays">) => {
      const overlay = overlays?.find((o) => o._id === id);
      if (overlay) {
        setSelectedOverlayId(id);
        setEditingContent(overlay.content);
        setShowStylePanel(true);
      }
    },
    [overlays]
  );

  // Handle preset application
  const handleApplyPreset = useCallback(
    async (preset: "title-top" | "title-bottom" | "story-bottom", content?: string) => {
      const newOverlay = await createPreset({
        imageId,
        preset,
        content: content || POSITION_PRESETS[preset].defaultContent,
      });
      // Select the newly created overlay
      if (newOverlay) {
        handleSelectOverlay(newOverlay);
      }
    },
    [createPreset, imageId, handleSelectOverlay]
  );

  // Handle adding custom text box
  const handleAddCustom = useCallback(async () => {
    const MARGIN = MARGIN_PERCENTAGES.safetyMargin;
    const newOverlayId = await createOverlay({
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
    // Select the newly created overlay
    if (newOverlayId) {
      handleSelectOverlay(newOverlayId);
    }
  }, [createOverlay, imageId, handleSelectOverlay]);

  // Handle content change from textarea
  const handleContentChange = useCallback(
    async (content: string) => {
      setEditingContent(content);
      if (selectedOverlayId) {
        await updateOverlay({ overlayId: selectedOverlayId, content });
      }
    },
    [selectedOverlayId, updateOverlay]
  );

  // Handle position preset change
  const handlePositionPresetChange = useCallback(
    async (preset: PositionPreset) => {
      if (!selectedOverlayId) return;
      const position = getPositionForPreset(preset);
      await updateOverlay({ overlayId: selectedOverlayId, position });
    },
    [selectedOverlayId, updateOverlay]
  );

  // Handle position change from drag/resize
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
        setShowStylePanel(false);
        setEditingContent("");
      }
    },
    [deleteOverlay, selectedOverlayId]
  );

  // Handle done - bake text and close
  const handleDone = useCallback(async () => {
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

  const MARGIN = MARGIN_PERCENTAGES.safetyMargin;

  return (
    <TextOverlayModal isOpen={true} onClose={onClose}>
      <div className="h-full flex flex-col bg-white">
        {/* Clean Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="font-medium">Close</span>
          </button>

          <h1 className="text-lg font-semibold text-gray-900">Add Text to Page</h1>

          <button
            onClick={handleDone}
            disabled={isBaking}
            className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isBaking ? (
              <>
                <span className="text-base">✨</span>
                <span>Baking your text...</span>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </>
            ) : (
              <span>Save</span>
            )}
          </button>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Text Editor & Controls */}
          <aside className="w-80 border-r border-gray-200 p-6 overflow-y-auto bg-gray-50">
            <div className="space-y-6">
              {/* Text Input (when layer selected) */}
              {selectedOverlayId && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Text Content
                  </label>
                  <textarea
                    value={editingContent}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="Type your text here..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-sans"
                    rows={4}
                  />
                </div>
              )}

              {/* Position Selector (when layer selected) */}
              {selectedOverlayId && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Position
                  </label>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handlePositionPresetChange("top")}
                        className="flex flex-col items-center gap-2 px-3 py-3 bg-white border border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all"
                      >
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-start justify-center pt-2">
                          <div className="w-6 h-1 bg-purple-500 rounded-full" />
                        </div>
                        <span className="text-xs font-medium text-gray-700">Top</span>
                      </button>
                      <button
                        onClick={() => handlePositionPresetChange("center")}
                        className="flex flex-col items-center gap-2 px-3 py-3 bg-white border border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all"
                      >
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <div className="w-6 h-1 bg-purple-500 rounded-full" />
                        </div>
                        <span className="text-xs font-medium text-gray-700">Center</span>
                      </button>
                      <button
                        onClick={() => handlePositionPresetChange("bottom")}
                        className="flex flex-col items-center gap-2 px-3 py-3 bg-white border border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all"
                      >
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-end justify-center pb-2">
                          <div className="w-6 h-1 bg-purple-500 rounded-full" />
                        </div>
                        <span className="text-xs font-medium text-gray-700">Bottom</span>
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      Or drag text on canvas to position freely
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Add Presets */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Add</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleApplyPreset("title-top")}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-left"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-start justify-center pt-2">
                      <div className="w-6 h-1 bg-gray-400 rounded-full" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Title at Top</div>
                      <div className="text-xs text-gray-500">Large heading text</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleApplyPreset("title-bottom")}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-left"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-end justify-center pb-2">
                      <div className="w-6 h-1 bg-gray-400 rounded-full" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Title at Bottom</div>
                      <div className="text-xs text-gray-500">Caption style</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleApplyPreset("story-bottom")}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-left"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex flex-col items-center justify-end p-1.5 gap-0.5">
                      <div className="w-5 h-0.5 bg-gray-400 rounded-full" />
                      <div className="w-4 h-0.5 bg-gray-400 rounded-full" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Story Text</div>
                      <div className="text-xs text-gray-500">Paragraph block</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Custom Text */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Custom</h3>
                <button
                  onClick={handleAddCustom}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 hover:bg-white transition-all text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium text-sm">Add Custom Text</span>
                </button>
              </div>

              {/* Text Layers */}
              {overlays && overlays.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Text Layers ({overlays.length})
                  </h3>
                  <div className="space-y-2">
                    {overlays.map((overlay, index) => (
                      <button
                        key={overlay._id}
                        onClick={() => handleSelectOverlay(overlay._id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                          selectedOverlayId === overlay._id
                            ? "bg-purple-500 text-white"
                            : "bg-white border border-gray-200 hover:border-gray-300 text-gray-900"
                        }`}
                      >
                        <span className={`text-xs font-mono ${selectedOverlayId === overlay._id ? "text-purple-200" : "text-gray-500"}`}>
                          {index + 1}
                        </span>
                        <span className="text-sm truncate flex-1">
                          {overlay.content.substring(0, 25)}
                          {overlay.content.length > 25 ? "..." : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tips</h3>
                <ul className="text-xs text-gray-500 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span>Edit text in the field above</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span>Drag text boxes on canvas to reposition</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span>Use handles on edges to resize width</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span>Keep text inside the yellow safe zone</span>
                  </li>
                </ul>
              </div>
            </div>
          </aside>

          {/* Center - Image Canvas */}
          <div className="flex-1 flex items-center justify-center p-8 bg-gray-100">
            <div
              ref={containerRef}
              className="relative w-full max-w-xl aspect-square bg-white rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => {
                if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === "IMG") {
                  setSelectedOverlayId(null);
                  setShowStylePanel(false);
                  setEditingContent("");
                }
              }}
            >
              {/* Background image */}
              <img
                src={imageUrl}
                alt="Page image"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Print-safe zone */}
              <div
                className="absolute pointer-events-none border-2 border-dashed border-amber-400/50"
                style={{
                  left: `${MARGIN}%`,
                  top: `${MARGIN}%`,
                  right: `${MARGIN}%`,
                  bottom: `${MARGIN}%`,
                }}
              >
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full whitespace-nowrap">
                  Safe Zone
                </div>
              </div>

              {/* Text Overlays - Draggable */}
              {overlays?.map((overlay) => (
                <DraggableTextBox
                  key={overlay._id}
                  id={overlay._id}
                  content={overlay.content}
                  position={overlay.position}
                  style={overlay.style}
                  isSelected={selectedOverlayId === overlay._id}
                  onSelect={() => handleSelectOverlay(overlay._id)}
                  onPositionChange={(position) => handlePositionChange(overlay._id, position)}
                  containerRef={containerRef}
                />
              ))}

              {/* Empty State */}
              {(!overlays || overlays.length === 0) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black/40 backdrop-blur-sm text-white px-6 py-4 rounded-2xl text-center">
                    <div className="text-lg font-medium mb-1">Add text to your page</div>
                    <div className="text-sm text-white/80">Choose a preset or add custom text</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Style Controls (shows when text selected) */}
          <aside
            className={`w-80 border-l border-gray-200 bg-white overflow-y-auto transition-all duration-300 ${
              showStylePanel && selectedOverlay ? "translate-x-0" : "translate-x-full w-0 border-0"
            }`}
          >
            {selectedOverlay && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-semibold text-gray-900">Style</h3>
                  <button
                    onClick={() => {
                      setShowStylePanel(false);
                      setSelectedOverlayId(null);
                      setEditingContent("");
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <TextStyleToolbar
                  style={selectedOverlay.style}
                  onStyleChange={(updates) => handleStyleChange(selectedOverlay._id, updates)}
                />

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => handleDelete(selectedOverlay._id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors font-medium text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete Text</span>
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </TextOverlayModal>
  );
}
