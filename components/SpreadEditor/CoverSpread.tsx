"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { PhotoUploadSlot } from "./PhotoUploadSlot";
import { useToast } from "@/components/ui/Toast";

type ImageWithUrls = Doc<"images"> & {
  originalUrl: string | null;
  cartoonUrl: string | null;
  bakedUrl: string | null;
};

type PageWithImages = Doc<"pages"> & {
  images: ImageWithUrls[];
};

type CoverTheme = "purple-magic" | "ocean-adventure" | "sunset-wonder" | "forest-dreams";

interface CoverDesign {
  title: string;
  subtitle?: string;
  authorLine?: string;
  heroImageId?: Id<"_storage">;
  heroImageUrl?: string | null;
  theme: CoverTheme;
  dedication?: string;
}

interface CoverSpreadProps {
  bookId: Id<"books">;
  bookTitle: string;
  coverDesign?: CoverDesign;
  rightPage: PageWithImages; // Page 1 of the book
  onOpenTextEditor?: (imageId: Id<"images">, imageUrl: string) => void;
}

const THEME_GRADIENTS: Record<CoverTheme, string> = {
  "purple-magic": "from-purple-600 via-pink-500 to-indigo-600",
  "ocean-adventure": "from-blue-500 via-cyan-400 to-teal-500",
  "sunset-wonder": "from-orange-500 via-pink-500 to-purple-600",
  "forest-dreams": "from-green-600 via-emerald-500 to-teal-600",
};

const THEME_NAMES: Record<CoverTheme, string> = {
  "purple-magic": "Purple Magic ✨",
  "ocean-adventure": "Ocean Adventure 🌊",
  "sunset-wonder": "Sunset Wonder 🌅",
  "forest-dreams": "Forest Dreams 🌲",
};

export function CoverSpread({
  bookId,
  bookTitle,
  coverDesign,
  rightPage,
  onOpenTextEditor,
}: CoverSpreadProps) {
  const { user } = useUser();
  const { success, error: showError } = useToast();

  const [showCustomizer, setShowCustomizer] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingSubtitle, setEditingSubtitle] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(false);

  const [tempTitle, setTempTitle] = useState(coverDesign?.title || bookTitle);
  const [tempSubtitle, setTempSubtitle] = useState(coverDesign?.subtitle || "");
  const [tempAuthor, setTempAuthor] = useState(coverDesign?.authorLine || "");
  const [tempTheme, setTempTheme] = useState<CoverTheme>(coverDesign?.theme || "purple-magic");

  const updateCoverDesign = useMutation(api.books.updateCoverDesign);

  const currentTheme = coverDesign?.theme || "purple-magic";
  const currentTitle = coverDesign?.title || bookTitle;
  const currentSubtitle = coverDesign?.subtitle || "";
  const currentAuthor = coverDesign?.authorLine || "";
  const heroImageUrl = coverDesign?.heroImageUrl;

  // Get first image from right page (page 1)
  const rightImages = rightPage.images || [];
  const getImageForSlot = (index: number) => {
    const image = rightImages[index];
    if (!image) return undefined;

    return {
      _id: image._id,
      originalImageUrl: image.originalUrl || undefined,
      cartoonImageUrl: image.cartoonUrl || undefined,
      bakedImageUrl: image.bakedUrl || undefined,
      status: image.generationStatus,
    };
  };

  const handleAddText = (index: number) => {
    const image = rightImages[index];
    const url = image?.bakedUrl || image?.cartoonUrl;
    if (image && url && onOpenTextEditor) {
      onOpenTextEditor(image._id, url);
    }
  };

  const saveCoverDesign = async (updates: Partial<CoverDesign>) => {
    if (!user) return;

    try {
      await updateCoverDesign({
        clerkId: user.id,
        bookId,
        coverDesign: {
          title: updates.title || currentTitle,
          subtitle: updates.subtitle !== undefined ? (updates.subtitle || undefined) : (currentSubtitle || undefined),
          authorLine: updates.authorLine !== undefined ? (updates.authorLine || undefined) : (currentAuthor || undefined),
          theme: updates.theme || currentTheme,
          heroImageId: updates.heroImageId || coverDesign?.heroImageId,
          dedication: coverDesign?.dedication,
        },
      });
      success("Cover updated!");
    } catch (error) {
      console.error("Failed to update cover:", error);
      showError("Failed to update cover. Please try again.");
    }
  };

  const handleTitleSave = () => {
    if (tempTitle.trim()) {
      saveCoverDesign({ title: tempTitle.trim() });
    }
    setEditingTitle(false);
  };

  const handleSubtitleSave = () => {
    saveCoverDesign({ subtitle: tempSubtitle.trim() });
    setEditingSubtitle(false);
  };

  const handleAuthorSave = () => {
    saveCoverDesign({ authorLine: tempAuthor.trim() });
    setEditingAuthor(false);
  };

  const handleThemeChange = (theme: CoverTheme) => {
    setTempTheme(theme);
    saveCoverDesign({ theme });
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {/* The Spread - Two Facing Pages */}
      <div className="relative">
        {/* Book shadow/background */}
        <div className="absolute -inset-4 bg-gradient-to-b from-gray-200 to-gray-300 rounded-3xl blur-xl opacity-50" />

        <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 shadow-2xl">
          <div className="flex gap-1">
            {/* LEFT PAGE: Front Cover */}
            <div
              className="w-[400px] h-[400px] rounded-l-2xl shadow-lg relative overflow-hidden cursor-pointer group"
              onClick={() => setShowCustomizer(!showCustomizer)}
            >
              {/* Cover background with theme gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${THEME_GRADIENTS[currentTheme]}`} />

              {/* Hero image if set */}
              {heroImageUrl && (
                <div className="absolute inset-0 opacity-30">
                  <img
                    src={heroImageUrl}
                    alt="Cover hero"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content overlay */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 text-center">
                {/* Title */}
                {editingTitle ? (
                  <input
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTitleSave();
                      if (e.key === "Escape") {
                        setTempTitle(currentTitle);
                        setEditingTitle(false);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    className="text-4xl font-bold text-white text-center bg-white/20 backdrop-blur-sm border-2 border-white/50 rounded-lg px-4 py-2 outline-none w-full max-w-[320px]"
                    style={{ fontFamily: "Georgia, serif" }}
                  />
                ) : (
                  <h1
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTitle(true);
                    }}
                    className="text-4xl font-bold text-white drop-shadow-2xl mb-4 hover:scale-105 transition-transform cursor-text"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {currentTitle}
                  </h1>
                )}

                {/* Subtitle */}
                {editingSubtitle ? (
                  <input
                    type="text"
                    value={tempSubtitle}
                    onChange={(e) => setTempSubtitle(e.target.value)}
                    onBlur={handleSubtitleSave}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSubtitleSave();
                      if (e.key === "Escape") {
                        setTempSubtitle(currentSubtitle);
                        setEditingSubtitle(false);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Add subtitle..."
                    autoFocus
                    className="text-lg text-white text-center bg-white/20 backdrop-blur-sm border-2 border-white/50 rounded-lg px-3 py-1 outline-none w-full max-w-[300px] mb-4"
                    style={{ fontFamily: "Georgia, serif" }}
                  />
                ) : (
                  <p
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSubtitle(true);
                    }}
                    className="text-lg text-white/90 drop-shadow-lg mb-8 hover:scale-105 transition-transform cursor-text italic"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {currentSubtitle || (
                      <span className="opacity-50 not-italic">+ Add subtitle</span>
                    )}
                  </p>
                )}

                {/* Author line */}
                {editingAuthor ? (
                  <input
                    type="text"
                    value={tempAuthor}
                    onChange={(e) => setTempAuthor(e.target.value)}
                    onBlur={handleAuthorSave}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAuthorSave();
                      if (e.key === "Escape") {
                        setTempAuthor(currentAuthor);
                        setEditingAuthor(false);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="By..."
                    autoFocus
                    className="text-base text-white text-center bg-white/20 backdrop-blur-sm border-2 border-white/50 rounded-lg px-3 py-1 outline-none w-full max-w-[250px]"
                    style={{ fontFamily: "Georgia, serif" }}
                  />
                ) : (
                  <p
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingAuthor(true);
                    }}
                    className="text-base text-white/80 drop-shadow-lg hover:scale-105 transition-transform cursor-text"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {currentAuthor || (
                      <span className="opacity-50">+ Add author</span>
                    )}
                  </p>
                )}
              </div>

              {/* Hover hint */}
              <div className="absolute bottom-4 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white/70 text-xs bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                  Click to customize
                </span>
              </div>
            </div>

            {/* Center fold line */}
            <div className="w-1 bg-gradient-to-b from-transparent via-gray-400 to-transparent" />

            {/* RIGHT PAGE: Page 1 */}
            <div className="w-[400px] h-[400px] bg-white rounded-r-2xl shadow-lg p-6 relative">
              <PhotoUploadSlot
                pageId={rightPage._id}
                imageIndex={0}
                image={getImageForSlot(0)}
                aspectRatio="1/1"
                onAddText={() => handleAddText(0)}
              />
            </div>
          </div>

          {/* Page numbers */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-between px-12 text-xs text-gray-400 font-serif">
            <span>Cover</span>
            <span>1</span>
          </div>
        </div>
      </div>

      {/* Cover Customization Panel */}
      {showCustomizer && (
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Cover Customization</h3>
            <button
              onClick={() => setShowCustomizer(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Theme Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Theme Color
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(THEME_GRADIENTS) as CoverTheme[]).map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleThemeChange(theme)}
                  className={`
                    relative h-20 rounded-lg overflow-hidden transition-all
                    ${currentTheme === theme ? "ring-4 ring-purple-500 ring-offset-2" : "hover:scale-105"}
                  `}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${THEME_GRADIENTS[theme]}`} />
                  <div className="relative h-full flex items-center justify-center">
                    <span className="text-white font-semibold drop-shadow-lg text-sm">
                      {THEME_NAMES[theme]}
                    </span>
                  </div>
                  {currentTheme === theme && (
                    <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                      <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Hero Image Selection - Coming Soon */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hero Image (Coming Soon)
            </label>
            <div className="h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
              <span className="text-gray-400 text-sm">Select from your uploaded photos</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
