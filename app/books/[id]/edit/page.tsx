"use client";

import { use, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { SpreadEditor, SpreadNavigator } from "@/components/SpreadEditor";
import { MiniBookPreview } from "@/components/BookPreview/MiniBookPreview";
import { ExpandableTabs } from "@/components/ui/expandable-tabs";
import { TextOverlayEditor } from "@/components/TextOverlayEditor";
import { WriteMyStoryButton } from "@/components/WriteMyStoryButton";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ImageWithUrls = Doc<"images"> & {
  originalUrl: string | null;
  cartoonUrl: string | null;
  bakedUrl: string | null;
};

type PageWithImages = Doc<"pages"> & {
  images: ImageWithUrls[];
};

type EditorMode = "pages" | "cover" | "spine" | "preview";
type BookView = "front" | "spine" | "back";
type CoverTheme = "purple-magic" | "ocean-adventure" | "sunset-wonder" | "forest-dreams";
type SpreadLayout = "single" | "duo" | "trio";

const MODE_TABS = [
  { title: "Pages", icon: "📝" },
  { title: "Cover", icon: "🎨" },
  { title: "Spine", icon: "📚" },
  { type: "separator" as const },
  { title: "Preview", icon: "✨" },
];

const THEMES: { id: CoverTheme; name: string; gradient: string }[] = [
  { id: "purple-magic", name: "Purple Magic", gradient: "from-purple-600 to-purple-900" },
  { id: "ocean-adventure", name: "Ocean Adventure", gradient: "from-blue-600 to-blue-900" },
  { id: "sunset-wonder", name: "Sunset Wonder", gradient: "from-orange-500 to-red-800" },
  { id: "forest-dreams", name: "Forest Dreams", gradient: "from-emerald-600 to-teal-900" },
];

// Helper to group pages into spreads
interface Spread {
  spreadIndex: number;
  leftPage: PageWithImages;
  rightPage?: PageWithImages;
  layout: SpreadLayout;
}

function groupPagesIntoSpreads(pages: PageWithImages[]): Spread[] {
  const spreads: Spread[] = [];
  for (let i = 0; i < pages.length; i += 2) {
    const leftPage = pages[i];
    const rightPage = pages[i + 1];
    const layout = (leftPage.spreadLayout as SpreadLayout) || "duo";
    
    spreads.push({
      spreadIndex: i / 2,
      leftPage,
      rightPage,
      layout,
    });
  }
  return spreads;
}

export default function BookEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const bookId = id as Id<"books">;
  const router = useRouter();
  const { user } = useUser();

  // State
  const [activeMode, setActiveMode] = useState<EditorMode>("pages");
  const [bookView, setBookView] = useState<BookView>("front");
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  // Text overlay editor state
  const [editingImageId, setEditingImageId] = useState<Id<"images"> | null>(null);
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);

  // Cover design state
  const [coverTitle, setCoverTitle] = useState("");
  const [coverSubtitle, setCoverSubtitle] = useState("");
  const [coverAuthorLine, setCoverAuthorLine] = useState("");
  const [coverTheme, setCoverTheme] = useState<CoverTheme>("purple-magic");
  const [coverDedication, setCoverDedication] = useState("");
  const [coverHeroIndex, setCoverHeroIndex] = useState(0);
  const [customCoverImage, setCustomCoverImage] = useState<string | null>(null);

  // Queries & Mutations
  const book = useQuery(api.books.getBook, { bookId });
  const pages = useQuery(api.pages.getBookPages, { bookId });
  const updateCoverDesign = useMutation(api.books.updateCoverDesign);
  const updateBookTitle = useMutation(api.books.updateBookTitle);
  const addSpread = useMutation(api.books.addSpread);
  const removePage = useMutation(api.books.removePage);
  const updateSpreadLayout = useMutation(api.pages.updateSpreadLayout);

  // Initialize cover design from book
  useEffect(() => {
    if (book) {
      setCoverTitle(book.coverDesign?.title || book.title);
      setCoverSubtitle(book.coverDesign?.subtitle || "");
      setCoverAuthorLine(book.coverDesign?.authorLine || "");
      setCoverTheme(book.coverDesign?.theme || "purple-magic");
      setCoverDedication(book.coverDesign?.dedication || "");
    }
  }, [book]);

  // Sync book view with active mode
  useEffect(() => {
    if (activeMode === "cover") setBookView("front");
    else if (activeMode === "spine") setBookView("spine");
    else if (activeMode === "preview") setBookView("front");
  }, [activeMode]);

  if (!book || !pages) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-purple-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="text-gray-600">Loading your book...</p>
        </div>
      </div>
    );
  }

  // Group pages into spreads
  const spreads = groupPagesIntoSpreads(pages as PageWithImages[]);
  const currentSpread = spreads[currentSpreadIndex];

  // Progress calculations
  const allImages = pages.flatMap((page: PageWithImages) => page.images || []);
  const totalImages = allImages.length;
  const completedImages = allImages.filter((img: ImageWithUrls) => img.generationStatus === "completed").length;
  const generatingImages = allImages.filter((img: ImageWithUrls) => img.generationStatus === "generating").length;
  const isAllComplete = totalImages > 0 && completedImages === totalImages;
  const progressPercent = totalImages > 0 ? (completedImages / totalImages) * 100 : 0;

  // Handle tab change
  const handleTabChange = (index: number | null) => {
    if (index === null) return;
    const modes: EditorMode[] = ["pages", "cover", "spine", "preview"];
    const modeIndex = index > 2 ? index - 1 : index;
    if (modes[modeIndex]) {
      setActiveMode(modes[modeIndex]);
    }
  };

  // Get tab index for current mode
  const getTabIndex = () => {
    const modeIndices: Record<EditorMode, number> = {
      pages: 0,
      cover: 1,
      spine: 2,
      preview: 4,
    };
    return modeIndices[activeMode];
  };

  // Handle cover save
  const handleSaveCover = async () => {
    if (!user) return;
    const selectedImage = coverHeroIndex >= 0 ? completedCartoonImages[coverHeroIndex] : null;
    const heroImageId = selectedImage?.bakedImageId || selectedImage?.cartoonImageId || undefined;

    await updateCoverDesign({
      clerkId: user.id,
      bookId,
      coverDesign: {
        title: coverTitle || book.title,
        subtitle: coverSubtitle || undefined,
        authorLine: coverAuthorLine || undefined,
        heroImageId: heroImageId,
        theme: coverTheme,
        dedication: coverDedication || undefined,
      },
    });
  };

  // Handle title editing
  const handleStartEditingTitle = () => {
    setEditedTitle(book.title);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = async () => {
    if (!user || !editedTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }
    
    if (editedTitle.trim() !== book.title) {
      await updateBookTitle({
        clerkId: user.id,
        bookId,
        title: editedTitle.trim(),
      });
    }
    setIsEditingTitle(false);
  };

  const handleCancelEditingTitle = () => {
    setIsEditingTitle(false);
    setEditedTitle("");
  };

  // Handle add spread
  const handleAddSpread = async () => {
    if (!user) return;
    await addSpread({
      clerkId: user.id,
      bookId,
      spreadLayout: "duo", // Default
    });
    // Navigate to the new spread
    setCurrentSpreadIndex(spreads.length);
  };

  // Handle delete spread
  const handleDeleteSpread = async (spreadIndex: number) => {
    if (!user) return;
    const spread = spreads[spreadIndex];
    if (!spread) return;

    // Delete both pages in the spread
    await removePage({ clerkId: user.id, pageId: spread.leftPage._id });
    if (spread.rightPage) {
      await removePage({ clerkId: user.id, pageId: spread.rightPage._id });
    }

    // Navigate to previous spread if needed
    if (currentSpreadIndex >= spreads.length - 1 && currentSpreadIndex > 0) {
      setCurrentSpreadIndex(currentSpreadIndex - 1);
    }
  };

  // Handle layout change
  const handleLayoutChange = async (layout: SpreadLayout) => {
    if (!user || !currentSpread) return;
    await updateSpreadLayout({
      pageId: currentSpread.leftPage._id,
      spreadLayout: layout,
    });
  };

  // Handle open text editor
  const handleOpenTextEditor = (imageId: Id<"images">, imageUrl: string) => {
    setEditingImageId(imageId);
    setEditingImageUrl(imageUrl);
  };

  // Handle close text editor
  const handleCloseTextEditor = () => {
    setEditingImageId(null);
    setEditingImageUrl(null);
  };

  // Handle custom cover image upload
  const handleCustomCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) return;

    const previewUrl = URL.createObjectURL(file);
    setCustomCoverImage(previewUrl);
    setCoverHeroIndex(-1);
  };

  // Get all completed cartoon images
  const completedCartoonImages = allImages.filter((img: ImageWithUrls) =>
    img.generationStatus === "completed" && img.cartoonUrl
  );

  // Get the selected cover hero image URL
  const selectedCoverHeroImage = coverHeroIndex === -1
    ? customCoverImage
    : completedCartoonImages[coverHeroIndex]?.cartoonUrl || null;

  // Create a mock book with cover design for preview
  const previewBook = {
    ...book,
    coverDesign: {
      title: coverTitle || book.title,
      subtitle: coverSubtitle,
      authorLine: coverAuthorLine,
      theme: coverTheme,
      dedication: coverDedication,
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <Link
            href="/dashboard"
            className="text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1 sm:gap-2 flex-shrink-0"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline font-medium text-sm">Dashboard</span>
          </Link>

          {isEditingTitle ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTitle();
                if (e.key === "Escape") handleCancelEditingTitle();
              }}
              autoFocus
              className="text-sm sm:text-base md:text-lg font-bold text-gray-900 flex-1 text-center bg-purple-50 border-2 border-purple-400 rounded px-2 py-1 outline-none max-w-[120px] sm:max-w-[200px] md:max-w-md"
            />
          ) : (
            <button
              onClick={handleStartEditingTitle}
              className="group text-sm sm:text-base md:text-lg font-bold text-gray-900 truncate max-w-[120px] sm:max-w-[200px] md:max-w-none flex-1 text-center hover:text-purple-600 transition-colors flex items-center justify-center gap-2"
            >
              <span>{book.title}</span>
              <svg className="w-3 h-3 sm:w-4 sm:h-4 opacity-0 group-hover:opacity-50 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Write My Story Button */}
            <WriteMyStoryButton
              bookTitle={book.title}
              allImages={allImages}
              variant="header"
            />

            <Link
              href={`/books/${bookId}/preview`}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-colors flex items-center gap-1 sm:gap-2 shadow-sm"
            >
              <span className="text-sm sm:text-base">📖</span>
              <span className="hidden sm:inline">Full Preview</span>
              <span className="sm:hidden">Preview</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mode Tabs */}
      <div className="relative z-10 flex justify-center py-4 bg-white border-b border-gray-100">
        <ExpandableTabs
          tabs={MODE_TABS}
          selected={getTabIndex()}
          onChange={handleTabChange}
          persistSelection={true}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center px-4 pb-32 overflow-y-auto py-6">
        {/* 3D Book Preview - Show only on Cover, Spine, and Preview tabs */}
        {activeMode !== "pages" && (
          <div className="mb-6 md:mb-8 p-4 md:p-6 bg-gradient-to-br from-purple-100 via-pink-50 to-purple-50 rounded-2xl md:rounded-3xl shadow-sm">
            <MiniBookPreview
              book={previewBook as Doc<"books">}
              pages={pages as PageWithImages[]}
              currentView={bookView}
              onViewChange={setBookView}
              onFullPreview={() => router.push(`/books/${bookId}/preview`)}
              size="medium"
              coverHeroImage={selectedCoverHeroImage}
            />
          </div>
        )}

        {/* Content Panel based on active mode */}
        <div className="w-full max-w-7xl">
          {activeMode === "pages" && (
            <>
              {spreads.length === 0 ? (
                <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="text-6xl mb-4">📖</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Start Your Story</h3>
                    <p className="text-gray-600 mb-6">
                      Click the <span className="font-semibold text-purple-600">+ Add Spread</span> button below to create your first spread!
                    </p>
                    <div className="bg-white rounded-xl p-4 text-left">
                      <p className="text-sm text-gray-600 mb-3 font-medium">✨ How it works:</p>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold">1.</span>
                          <span>Each spread = 2 facing pages in your book</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold">2.</span>
                          <span>Choose a layout template for each spread</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold">3.</span>
                          <span>Upload photos and watch them transform!</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold">4.</span>
                          <span>Most books need 5-10 spreads (10-20 pages)</span>
                        </li>
                      </ul>
                    </div>
                    <button
                      onClick={handleAddSpread}
                      className="mt-6 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold shadow-lg transition-all hover:scale-105"
                    >
                      + Add Your First Spread
                    </button>
                  </div>
                </div>
              ) : currentSpread ? (
                <SpreadEditor
                  leftPage={currentSpread.leftPage}
                  rightPage={currentSpread.rightPage}
                  currentLayout={currentSpread.layout}
                  onLayoutChange={handleLayoutChange}
                  onOpenTextEditor={handleOpenTextEditor}
                />
              ) : null}
            </>
          )}

          {activeMode === "cover" && (
            <CoverPanel
              title={coverTitle}
              subtitle={coverSubtitle}
              authorLine={coverAuthorLine}
              theme={coverTheme}
              onTitleChange={setCoverTitle}
              onSubtitleChange={setCoverSubtitle}
              onAuthorLineChange={setCoverAuthorLine}
              onThemeChange={setCoverTheme}
              onSave={handleSaveCover}
              allImages={completedCartoonImages}
              selectedHeroIndex={coverHeroIndex}
              onHeroIndexChange={setCoverHeroIndex}
              customCoverImage={customCoverImage}
              onCustomCoverUpload={handleCustomCoverUpload}
            />
          )}

          {activeMode === "spine" && (
            <SpinePanel
              title={coverTitle || book.title}
              theme={coverTheme}
              dedication={coverDedication}
              onDedicationChange={setCoverDedication}
              onSave={handleSaveCover}
            />
          )}

          {activeMode === "preview" && (
            <PreviewPanel
              bookId={bookId}
              isAllComplete={isAllComplete}
              completedImages={completedImages}
              totalImages={totalImages}
            />
          )}
        </div>
      </main>

      {/* Spread Navigator - Fixed at bottom (Pages mode only) */}
      {activeMode === "pages" && spreads.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <SpreadNavigator
            spreads={spreads.map((s, i) => ({
              spreadIndex: i,
              leftPageId: s.leftPage._id,
              rightPageId: s.rightPage?._id,
              thumbnailUrl: s.leftPage.images?.[0]?.cartoonUrl || undefined,
            }))}
            currentSpreadIndex={currentSpreadIndex}
            onSpreadChange={setCurrentSpreadIndex}
            onAddSpread={handleAddSpread}
            onDeleteSpread={handleDeleteSpread}
          />
        </div>
      )}

      {/* Progress Footer (non-Pages modes) */}
      {activeMode !== "pages" && (
        <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-4">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              {/* Progress */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                  {generatingImages > 0 ? (
                    <div className="flex items-center gap-1.5 sm:gap-2 text-purple-600">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium truncate">Creating magic...</span>
                    </div>
                  ) : isAllComplete && spreads.length >= 5 ? (
                    <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-600">
                      <span className="text-sm sm:text-base">✨</span>
                      <span className="text-xs sm:text-sm font-semibold">Your book is ready to order!</span>
                    </div>
                  ) : totalImages > 0 ? (
                    <span className="text-gray-600 text-xs sm:text-sm font-medium">{completedImages}/{totalImages} images ready</span>
                  ) : (
                    <span className="text-gray-400 text-xs sm:text-sm truncate">Add spreads to start</span>
                  )}
                </div>
                {totalImages > 0 && (
                  <div className="h-1.5 sm:h-2 bg-gray-100 rounded-full overflow-hidden max-w-[200px] sm:max-w-xs">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isAllComplete ? "bg-emerald-500" : "bg-gradient-to-r from-purple-500 to-pink-500"
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Order Button */}
              <div className="relative group flex-shrink-0">
                <Link href={(isAllComplete && spreads.length >= 5) ? `/books/${bookId}/checkout` : "#"}>
                  <button
                    className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center gap-1 sm:gap-2 ${
                      isAllComplete && spreads.length >= 5
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                    disabled={!isAllComplete || spreads.length < 5}
                  >
                    <span className="text-sm sm:text-base">🛒</span>
                    <span className="hidden sm:inline">Order Book</span>
                    <span className="sm:hidden">Order</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Text Overlay Editor Modal */}
      {editingImageId && editingImageUrl && (
        <TextOverlayEditor
          imageId={editingImageId}
          imageUrl={editingImageUrl}
          onClose={handleCloseTextEditor}
        />
      )}
    </div>
  );
}

// ============ COVER PANEL ============
function CoverPanel({
  title,
  subtitle,
  authorLine,
  theme,
  onTitleChange,
  onSubtitleChange,
  onAuthorLineChange,
  onThemeChange,
  onSave,
  allImages,
  selectedHeroIndex,
  onHeroIndexChange,
  customCoverImage,
  onCustomCoverUpload,
}: {
  title: string;
  subtitle: string;
  authorLine: string;
  theme: CoverTheme;
  onTitleChange: (v: string) => void;
  onSubtitleChange: (v: string) => void;
  onAuthorLineChange: (v: string) => void;
  onThemeChange: (v: CoverTheme) => void;
  onSave: () => void;
  allImages: { cartoonUrl: string | null }[];
  selectedHeroIndex: number;
  onHeroIndexChange: (index: number) => void;
  customCoverImage: string | null;
  onCustomCoverUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-gray-900 font-semibold mb-5 flex items-center gap-2 text-lg">
        <span>🎨</span> Design Your Cover
      </h3>

      <div className="space-y-5">
        {/* Cover Image Selection */}
        <div>
          <label className="text-gray-700 text-sm font-medium mb-2 block">Cover Hero Image</label>

          {allImages.length > 0 ? (
            <div className="mb-4">
              <p className="text-gray-500 text-xs mb-3">Select from your transformed images:</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
                {allImages.map((img, index) => (
                  img.cartoonUrl && (
                    <button
                      key={index}
                      onClick={() => onHeroIndexChange(index)}
                      className={`aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                        selectedHeroIndex === index
                          ? "border-purple-500 ring-4 ring-purple-500/20 shadow-lg"
                          : "border-gray-200 hover:border-purple-300"
                      }`}
                    >
                      <img src={img.cartoonUrl} alt={`Option ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  )
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-4 p-4 rounded-xl bg-gray-50 border border-gray-200 text-center">
              <p className="text-gray-500 text-sm">
                Add photos to your spreads first to select a cover image.
              </p>
            </div>
          )}

          {/* Custom upload */}
          <div className="pt-3 border-t border-gray-100">
            <p className="text-gray-500 text-xs mb-2">Or upload a custom image:</p>
            <label className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-400 hover:bg-purple-50 cursor-pointer transition-all">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onCustomCoverUpload}
                className="hidden"
              />
              <span className="text-sm">📸</span>
              <span className="text-gray-600 text-sm font-medium">Upload Custom Image</span>
            </label>
            {customCoverImage && (
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => onHeroIndexChange(-1)}
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedHeroIndex === -1
                      ? "border-purple-500 ring-2 ring-purple-500/20"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                >
                  <img src={customCoverImage} alt="Uploaded" className="w-full h-full object-cover" />
                </button>
                <span className="text-gray-500 text-xs">Custom upload</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-gray-700 text-sm font-medium mb-1.5 block">Book Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Your Book Title"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="text-gray-700 text-sm font-medium mb-1.5 block">Subtitle (optional)</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => onSubtitleChange(e.target.value)}
            placeholder="e.g., Our Family Adventure 2024"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="text-gray-700 text-sm font-medium mb-1.5 block">Author Line (optional)</label>
          <input
            type="text"
            value={authorLine}
            onChange={(e) => onAuthorLineChange(e.target.value)}
            placeholder="e.g., Created by the Smith Family"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="text-gray-700 text-sm font-medium mb-2 block">Color Theme</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => onThemeChange(t.id)}
                className={`p-3 rounded-xl border-2 transition-all ${
                  theme === t.id
                    ? "border-purple-500 bg-purple-50 shadow-sm"
                    : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                }`}
              >
                <div className={`h-10 rounded-lg bg-gradient-to-br ${t.gradient} mb-2 shadow-inner`} />
                <p className="text-gray-700 text-xs font-medium">{t.name}</p>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onSave}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-sm"
        >
          Save Cover Design
        </button>
      </div>
    </div>
  );
}

// ============ SPINE PANEL ============
function SpinePanel({
  title,
  theme,
  dedication,
  onDedicationChange,
  onSave,
}: {
  title: string;
  theme: CoverTheme;
  dedication: string;
  onDedicationChange: (v: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-gray-900 font-semibold mb-5 flex items-center gap-2 text-lg">
        <span>📚</span> Spine & Back Cover
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Spine Preview */}
        <div className="flex flex-col items-center">
          <p className="text-gray-600 text-sm mb-3 font-medium">Spine Preview (as seen on bookshelf)</p>
          <div className="relative">
            <div
              className={`w-12 h-48 rounded bg-gradient-to-b ${
                THEMES.find(t => t.id === theme)?.gradient || "from-purple-600 to-purple-900"
              } flex items-center justify-center shadow-xl`}
            >
              <div
                className="text-amber-200 font-bold tracking-wider whitespace-nowrap text-xs"
                style={{
                  writingMode: "vertical-rl",
                  textOrientation: "mixed",
                  transform: "rotate(180deg)",
                  maxHeight: "180px",
                  overflow: "hidden",
                  fontFamily: "Georgia, serif",
                }}
              >
                {title}
              </div>
            </div>
            <div className="absolute -bottom-2 left-2 right-2 h-4 bg-black/20 blur-md rounded-full" />
          </div>
          <p className="text-gray-400 text-xs mt-4 text-center">
            This is how your book looks on a shelf!
          </p>
        </div>

        {/* Back Cover Content */}
        <div className="space-y-4">
          <div>
            <label className="text-gray-700 text-sm font-medium mb-1.5 block">Dedication (back cover)</label>
            <textarea
              value={dedication}
              onChange={(e) => onDedicationChange(e.target.value)}
              placeholder="e.g., For Emma and Jake, who make every adventure magical."
              rows={4}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all"
            />
          </div>

          <p className="text-gray-400 text-xs">
            The back cover will show a collage of your transformed images along with your dedication message.
          </p>

          <button
            onClick={onSave}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-sm"
          >
            Save Design
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ PREVIEW PANEL ============
function PreviewPanel({
  bookId,
  isAllComplete,
  completedImages,
  totalImages,
}: {
  bookId: Id<"books">;
  isAllComplete: boolean;
  completedImages: number;
  totalImages: number;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
      <h3 className="text-gray-900 font-semibold mb-5 flex items-center justify-center gap-2 text-lg">
        <span>✨</span> Your Book Preview
      </h3>

      {isAllComplete ? (
        <div className="space-y-4">
          <div className="text-emerald-600 text-lg font-semibold">
            All {totalImages} images are transformed!
          </div>
          <p className="text-gray-600">
            Your book is ready. Use the rotation controls above to see all angles.
          </p>
          <Link href={`/books/${bookId}/preview`}>
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-purple-500/20 transition-all hover:scale-105">
              Open Full Book Preview →
            </button>
          </Link>
        </div>
      ) : totalImages > 0 ? (
        <div className="space-y-4">
          <div className="text-gray-700 font-medium">
            {completedImages} of {totalImages} images ready
          </div>
          <p className="text-gray-500">
            Your images are being transformed into cartoon-style illustrations.
            You can preview while we work!
          </p>
          <Link href={`/books/${bookId}/preview`}>
            <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm">
              Preview Work in Progress
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-gray-500 font-medium">
            No photos uploaded yet
          </div>
          <p className="text-gray-400">
            Go to the Pages tab and add some spreads to get started!
          </p>
        </div>
      )}
    </div>
  );
}
