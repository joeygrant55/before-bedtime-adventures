"use client";

import { use, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { ImageUpload } from "@/components/ImageUpload";
import { MiniBookPreview } from "@/components/BookPreview/MiniBookPreview";
import { ExpandableTabs } from "@/components/ui/expandable-tabs";
import { TextOverlayEditor } from "@/components/TextOverlayEditor";
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

export default function BookEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const bookId = id as Id<"books">;
  const router = useRouter();

  // State
  const [activeMode, setActiveMode] = useState<EditorMode>("pages");
  const [bookView, setBookView] = useState<BookView>("front");
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

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
  const deleteImage = useMutation(api.images.deleteImage);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full" />
            <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="text-purple-300">Loading your book...</p>
        </div>
      </div>
    );
  }

  const currentPage = pages[currentPageIndex] as PageWithImages | undefined;

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
    // Account for separator at index 3
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
      preview: 4, // After separator
    };
    return modeIndices[activeMode];
  };

  // Handle cover save
  const handleSaveCover = async () => {
    await updateCoverDesign({
      bookId,
      coverDesign: {
        title: coverTitle || book.title,
        subtitle: coverSubtitle || undefined,
        authorLine: coverAuthorLine || undefined,
        theme: coverTheme,
        dedication: coverDedication || undefined,
      },
    });
  };

  // Handle delete image
  const handleDeleteImage = async (imageId: Id<"images">) => {
    if (confirm("Delete this image?")) {
      await deleteImage({ imageId });
    }
  };

  // Handle custom cover image upload
  const handleCustomCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) return;
    if (file.type === "image/heic" || file.type === "image/heif") return;

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="relative z-20 bg-slate-900/80 backdrop-blur-sm border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-purple-300 hover:text-white transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <h1 className="text-lg font-bold text-white truncate max-w-[200px] sm:max-w-none">
            {book.title}
          </h1>

          <Link
            href={`/books/${bookId}/preview`}
            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
          >
            <span>📖</span>
            <span className="hidden sm:inline">Full Preview</span>
          </Link>
        </div>
      </header>

      {/* Mode Tabs */}
      <div className="relative z-10 flex justify-center py-4">
        <ExpandableTabs
          tabs={MODE_TABS}
          selected={getTabIndex()}
          onChange={handleTabChange}
          persistSelection={true}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center px-4 pb-24 overflow-y-auto">
        {/* 3D Book Preview - Always Visible */}
        <div className="mb-6">
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

        {/* Content Panel based on active mode */}
        <div className="w-full max-w-4xl">
          {activeMode === "pages" && (
            <PagesPanel
              pages={pages as PageWithImages[]}
              currentPageIndex={currentPageIndex}
              onPageChange={setCurrentPageIndex}
              currentPage={currentPage}
              onDeleteImage={handleDeleteImage}
            />
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

      {/* Progress Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-t border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Progress */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                {generatingImages > 0 ? (
                  <div className="flex items-center gap-2 text-purple-400">
                    <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Creating magic...</span>
                  </div>
                ) : isAllComplete ? (
                  <div className="flex items-center gap-2 text-green-400">
                    <span>✨</span>
                    <span className="text-sm font-medium">Book ready!</span>
                  </div>
                ) : totalImages > 0 ? (
                  <span className="text-purple-300 text-sm">{completedImages}/{totalImages} images</span>
                ) : (
                  <span className="text-purple-400/60 text-sm">Upload photos to start</span>
                )}
              </div>
              {totalImages > 0 && (
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden max-w-xs">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isAllComplete ? "bg-green-500" : "bg-gradient-to-r from-purple-500 to-pink-500"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}
            </div>

            {/* Order Button */}
            <Link href={`/books/${bookId}/checkout`}>
              <button
                className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                  isAllComplete
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/30 animate-pulse"
                    : "bg-purple-600/50 text-purple-200 cursor-not-allowed"
                }`}
                disabled={!isAllComplete}
              >
                <span>🛒</span>
                <span>Order Book</span>
              </button>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============ PAGES PANEL ============
function PagesPanel({
  pages,
  currentPageIndex,
  onPageChange,
  currentPage,
  onDeleteImage,
}: {
  pages: PageWithImages[];
  currentPageIndex: number;
  onPageChange: (index: number) => void;
  currentPage?: PageWithImages;
  onDeleteImage: (imageId: Id<"images">) => void;
}) {
  // State for text overlay editor
  const [editingImageId, setEditingImageId] = useState<Id<"images"> | null>(null);
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);

  // Open text overlay editor for an image
  const handleOpenOverlayEditor = (image: ImageWithUrls) => {
    if (image.cartoonUrl) {
      setEditingImageId(image._id);
      setEditingImageUrl(image.cartoonUrl);
    }
  };

  // Close text overlay editor
  const handleCloseOverlayEditor = () => {
    setEditingImageId(null);
    setEditingImageUrl(null);
  };

  return (
    <div className="space-y-4">
      {/* Page Navigator Strip */}
      <div className="bg-slate-800/50 rounded-2xl p-4 border border-purple-500/20">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => onPageChange(Math.max(0, currentPageIndex - 1))}
            disabled={currentPageIndex === 0}
            className="p-2 rounded-lg bg-slate-700/50 text-purple-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            {pages.map((page, i) => (
              <button
                key={page._id}
                onClick={() => onPageChange(i)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                  i === currentPageIndex
                    ? "bg-purple-600 text-white shadow-lg"
                    : page.images?.length
                      ? "bg-slate-700 text-purple-300 hover:bg-slate-600"
                      : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => onPageChange(Math.min(pages.length - 1, currentPageIndex + 1))}
            disabled={currentPageIndex === pages.length - 1}
            className="p-2 rounded-lg bg-slate-700/50 text-purple-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="text-center text-purple-300 text-sm">
          Page {currentPageIndex + 1} of {pages.length}
        </div>
      </div>

      {/* Page Editor */}
      {currentPage && (
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-purple-500/20">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <span>📸</span> Page {currentPageIndex + 1} Photo
          </h3>

          {currentPage.images && currentPage.images.length > 0 ? (
            <div className="space-y-4">
              {currentPage.images.map((image) => (
                <div key={image._id} className="relative group">
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    {image.generationStatus === "generating" && (
                      <div className="bg-blue-500/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <div className="w-2 h-2 border border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processing</span>
                      </div>
                    )}
                    {image.generationStatus === "completed" && (
                      <div className="bg-green-500/90 text-white text-xs px-2 py-1 rounded-full">
                        ✨ Ready
                      </div>
                    )}
                    {image.generationStatus === "failed" && (
                      <div className="bg-red-500/90 text-white text-xs px-2 py-1 rounded-full">
                        ❌ Failed
                      </div>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => onDeleteImage(image._id)}
                    className="absolute top-3 right-3 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Image Preview - Before/After side by side */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Original */}
                    <div className="space-y-2">
                      <p className="text-purple-400 text-xs text-center">Original</p>
                      <div className="aspect-square rounded-xl overflow-hidden bg-slate-700">
                        {image.originalUrl && (
                          <img
                            src={image.originalUrl}
                            alt="Original"
                            className="w-full h-full object-cover object-center"
                          />
                        )}
                      </div>
                    </div>

                    {/* Transformed / Baked */}
                    <div className="space-y-2">
                      <p className="text-purple-400 text-xs text-center">
                        {image.bakedUrl ? "Final" : image.cartoonUrl ? "Cartoon" : "Processing..."}
                        {image.bakingStatus === "baking" && " (Baking text...)"}
                      </p>
                      <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-purple-900/50 to-pink-900/50 relative group/cartoon">
                        {/* Show baked image if available, otherwise cartoon */}
                        {(image.bakedUrl || image.cartoonUrl) ? (
                          <>
                            <img
                              src={image.bakedUrl || image.cartoonUrl || ""}
                              alt={image.bakedUrl ? "Final with text" : "Transformed"}
                              className="w-full h-full object-cover object-center"
                            />
                            {/* Baking overlay */}
                            {image.bakingStatus === "baking" && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <div className="text-center text-white">
                                  <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                  <div className="text-sm">Baking text...</div>
                                </div>
                              </div>
                            )}
                            {/* Add/Edit Text Button - shown on hover for completed images */}
                            {image.bakingStatus !== "baking" && (
                              <button
                                onClick={() => handleOpenOverlayEditor(image)}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover/cartoon:opacity-100 transition-opacity flex items-center justify-center"
                              >
                                <div className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg">
                                  <span>📝</span>
                                  <span>{image.bakedUrl ? "Edit Text" : "Add Text"}</span>
                                </div>
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-purple-400">
                            <div className="text-center">
                              <div className="text-3xl mb-2">🎨</div>
                              <div className="text-sm">Creating magic...</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {currentPage.images.length < 3 && (
                <div className="pt-2">
                  <ImageUpload
                    pageId={currentPage._id}
                    currentImageCount={currentPage.images.length}
                    maxImages={3}
                  />
                </div>
              )}
            </div>
          ) : (
            <ImageUpload
              pageId={currentPage._id}
              currentImageCount={0}
              maxImages={3}
            />
          )}
        </div>
      )}

      {/* Text Overlay Editor Modal */}
      {editingImageId && editingImageUrl && (
        <TextOverlayEditor
          imageId={editingImageId}
          imageUrl={editingImageUrl}
          onClose={handleCloseOverlayEditor}
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
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-purple-500/20">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <span>🎨</span> Design Your Cover
      </h3>

      <div className="space-y-4">
        {/* Cover Image Selection */}
        <div>
          <label className="text-purple-300 text-sm mb-2 block">Cover Hero Image</label>

          {/* Book images - primary option */}
          {allImages.length > 0 ? (
            <div className="mb-4">
              <p className="text-purple-400 text-xs mb-3">Select from your transformed images:</p>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                {allImages.map((img, index) => (
                  img.cartoonUrl && (
                    <button
                      key={index}
                      onClick={() => onHeroIndexChange(index)}
                      className={`aspect-square rounded-xl overflow-hidden border-3 transition-all hover:scale-105 ${
                        selectedHeroIndex === index
                          ? "border-purple-500 ring-4 ring-purple-500/50 shadow-lg shadow-purple-500/30"
                          : "border-slate-600 hover:border-purple-500/50"
                      }`}
                    >
                      <img src={img.cartoonUrl} alt={`Option ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  )
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-4 p-4 rounded-xl bg-slate-700/30 border border-purple-500/20 text-center">
              <p className="text-purple-400/60 text-sm">
                Add photos to your book pages first to select a cover image.
              </p>
            </div>
          )}

          {/* Custom upload - secondary option */}
          <div className="pt-3 border-t border-purple-500/20">
            <p className="text-purple-400 text-xs mb-2">Or upload a custom image:</p>
            <label className="flex items-center justify-center gap-2 p-2 rounded-lg border border-dashed border-purple-500/30 hover:border-purple-500 hover:bg-purple-500/10 cursor-pointer transition-all">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onCustomCoverUpload}
                className="hidden"
              />
              <span className="text-sm">📸</span>
              <span className="text-purple-300 text-xs">Upload Custom Image</span>
            </label>
            {customCoverImage && (
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => onHeroIndexChange(-1)}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedHeroIndex === -1
                      ? "border-purple-500 ring-2 ring-purple-500/50"
                      : "border-slate-600 hover:border-purple-500/50"
                  }`}
                >
                  <img src={customCoverImage} alt="Uploaded" className="w-full h-full object-cover" />
                </button>
                <span className="text-purple-400 text-xs">Custom upload</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-purple-300 text-sm mb-1 block">Book Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Your Book Title"
            className="w-full bg-slate-700/50 border border-purple-500/20 rounded-lg px-4 py-3 text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="text-purple-300 text-sm mb-1 block">Subtitle (optional)</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => onSubtitleChange(e.target.value)}
            placeholder="e.g., Our Family Adventure 2024"
            className="w-full bg-slate-700/50 border border-purple-500/20 rounded-lg px-4 py-3 text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="text-purple-300 text-sm mb-1 block">Author Line (optional)</label>
          <input
            type="text"
            value={authorLine}
            onChange={(e) => onAuthorLineChange(e.target.value)}
            placeholder="e.g., Created by the Smith Family"
            className="w-full bg-slate-700/50 border border-purple-500/20 rounded-lg px-4 py-3 text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="text-purple-300 text-sm mb-2 block">Color Theme</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => onThemeChange(t.id)}
                className={`p-3 rounded-xl border-2 transition-all ${
                  theme === t.id
                    ? "border-white shadow-lg scale-105"
                    : "border-transparent hover:border-purple-500/50"
                }`}
              >
                <div className={`h-8 rounded-lg bg-gradient-to-br ${t.gradient} mb-2`} />
                <p className="text-white text-xs font-medium">{t.name}</p>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onSave}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl transition-colors"
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
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-purple-500/20">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <span>📚</span> Spine & Back Cover
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Spine Preview */}
        <div className="flex flex-col items-center">
          <p className="text-purple-300 text-sm mb-3">Spine Preview (as seen on bookshelf)</p>
          <div className="relative">
            {/* Mini spine visualization */}
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
            {/* Shadow */}
            <div className="absolute -bottom-2 left-2 right-2 h-4 bg-black/30 blur-md rounded-full" />
          </div>
          <p className="text-purple-400/60 text-xs mt-4 text-center">
            This is how your book looks on a shelf!
          </p>
        </div>

        {/* Back Cover Content */}
        <div className="space-y-4">
          <div>
            <label className="text-purple-300 text-sm mb-1 block">Dedication (back cover)</label>
            <textarea
              value={dedication}
              onChange={(e) => onDedicationChange(e.target.value)}
              placeholder="e.g., For Emma and Jake, who make every adventure magical."
              rows={4}
              className="w-full bg-slate-700/50 border border-purple-500/20 rounded-lg px-4 py-3 text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          <p className="text-purple-400/60 text-xs">
            The back cover will show a collage of your transformed images along with your dedication message.
          </p>

          <button
            onClick={onSave}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl transition-colors"
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
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-purple-500/20 text-center">
      <h3 className="text-white font-semibold mb-4 flex items-center justify-center gap-2">
        <span>✨</span> Your Book Preview
      </h3>

      {isAllComplete ? (
        <div className="space-y-4">
          <div className="text-green-400 text-lg font-medium">
            All {totalImages} images are transformed!
          </div>
          <p className="text-purple-300">
            Your book is ready. Use the rotation controls above to see all angles.
          </p>
          <Link href={`/books/${bookId}/preview`}>
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-purple-500/30 transition-all hover:scale-105">
              Open Full Book Preview →
            </button>
          </Link>
        </div>
      ) : totalImages > 0 ? (
        <div className="space-y-4">
          <div className="text-purple-300">
            {completedImages} of {totalImages} images ready
          </div>
          <p className="text-purple-400/70">
            Your images are being transformed into Disney-style illustrations.
            You can preview while we work!
          </p>
          <Link href={`/books/${bookId}/preview`}>
            <button className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
              Preview Work in Progress
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-purple-400/70">
            No photos uploaded yet
          </div>
          <p className="text-purple-400/50">
            Go to the Pages tab and upload some photos to get started!
          </p>
        </div>
      )}
    </div>
  );
}
