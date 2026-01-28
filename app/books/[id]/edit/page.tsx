"use client";

import { use, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
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
  const { user } = useUser();

  // State
  const [activeMode, setActiveMode] = useState<EditorMode>("pages");
  const [bookView, setBookView] = useState<BookView>("front");
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

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
    if (!user) return;
    // Get the selected hero image's storage ID
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

  // Handle delete image
  const handleDeleteImage = async (imageId: Id<"images">) => {
    if (!user) return;
    if (confirm("Delete this image?")) {
      await deleteImage({ clerkId: user.id, imageId });
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

          <Link
            href={`/books/${bookId}/preview`}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-colors flex items-center gap-1 sm:gap-2 shadow-sm flex-shrink-0"
          >
            <span className="text-sm sm:text-base">📖</span>
            <span className="hidden sm:inline">Full Preview</span>
            <span className="sm:hidden">Preview</span>
          </Link>
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
      <main className="flex-1 flex flex-col items-center px-4 pb-28 md:pb-24 overflow-y-auto py-6">
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
                ) : isAllComplete && pages.length > 0 ? (
                  <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-600">
                    <span className="text-sm sm:text-base">✨</span>
                    <span className="text-xs sm:text-sm font-semibold">Your book is ready to preview!</span>
                  </div>
                ) : totalImages > 0 ? (
                  <span className="text-gray-600 text-xs sm:text-sm font-medium">{pages.length} {pages.length === 1 ? 'page' : 'pages'} • {completedImages}/{totalImages} images ready</span>
                ) : pages.length > 0 ? (
                  <span className="text-gray-600 text-xs sm:text-sm font-medium">{pages.length} {pages.length === 1 ? 'page' : 'pages'} created</span>
                ) : (
                  <span className="text-gray-400 text-xs sm:text-sm truncate">Add pages to start</span>
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
              <Link href={(isAllComplete && pages.length >= 5) ? `/books/${bookId}/checkout` : "#"}>
                <button
                  className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center gap-1 sm:gap-2 ${
                    isAllComplete && pages.length >= 5
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                  disabled={!isAllComplete || pages.length < 5}
                >
                  <span className="text-sm sm:text-base">🛒</span>
                  <span className="hidden sm:inline">Order Book</span>
                  <span className="sm:hidden">Order</span>
                </button>
              </Link>
              {/* Tooltip for disabled state - hidden on mobile */}
              {(!isAllComplete || pages.length < 5) && (
                <div className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                  {pages.length < 5 
                    ? `Need at least 5 pages (you have ${pages.length})`
                    : "Complete all images to order"}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
                </div>
              )}
            </div>
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
  const { user } = useUser();
  
  // State for text overlay editor
  const [editingImageId, setEditingImageId] = useState<Id<"images"> | null>(null);
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);
  
  // Mutations
  const addPage = useMutation(api.books.addPage);
  const removePage = useMutation(api.books.removePage);
  const reorderPages = useMutation(api.books.reorderPages);

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

  // Add a new page
  const handleAddPage = async () => {
    if (!user || !currentPage) return;
    await addPage({
      clerkId: user.id,
      bookId: currentPage.bookId,
    });
    // Switch to the new page
    onPageChange(pages.length);
  };

  // Delete the current page
  const handleDeletePage = async () => {
    if (!user || !currentPage) return;
    if (!confirm("Delete this page and all its photos? This cannot be undone.")) return;
    
    await removePage({
      clerkId: user.id,
      pageId: currentPage._id,
    });
    
    // Switch to previous page if we deleted the last one
    if (currentPageIndex >= pages.length - 1 && currentPageIndex > 0) {
      onPageChange(currentPageIndex - 1);
    }
  };

  // Move page up (earlier in the book)
  const handleMovePageUp = async () => {
    if (!user || !currentPage || currentPageIndex === 0) return;
    
    const newOrdering = [...pages];
    [newOrdering[currentPageIndex - 1], newOrdering[currentPageIndex]] = 
      [newOrdering[currentPageIndex], newOrdering[currentPageIndex - 1]];
    
    await reorderPages({
      clerkId: user.id,
      bookId: currentPage.bookId,
      pageOrdering: newOrdering.map(p => p._id),
    });
    
    onPageChange(currentPageIndex - 1);
  };

  // Move page down (later in the book)
  const handleMovePageDown = async () => {
    if (!user || !currentPage || currentPageIndex === pages.length - 1) return;
    
    const newOrdering = [...pages];
    [newOrdering[currentPageIndex], newOrdering[currentPageIndex + 1]] = 
      [newOrdering[currentPageIndex + 1], newOrdering[currentPageIndex]];
    
    await reorderPages({
      clerkId: user.id,
      bookId: currentPage.bookId,
      pageOrdering: newOrdering.map(p => p._id),
    });
    
    onPageChange(currentPageIndex + 1);
  };

  return (
    <div className="space-y-4">
      {/* Page Navigator Strip */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3 gap-2">
          <button
            onClick={() => onPageChange(Math.max(0, currentPageIndex - 1))}
            disabled={currentPageIndex === 0 || pages.length === 0}
            className="p-1.5 sm:p-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide flex-1">
            {pages.map((page, i) => {
              // Calculate page completion status
              const pageImages = page.images || [];
              const hasImages = pageImages.length > 0;
              const completedCount = pageImages.filter(img => img.generationStatus === "completed").length;
              const generatingCount = pageImages.filter(img => img.generationStatus === "generating").length;
              const allComplete = hasImages && completedCount === pageImages.length;
              const hasProcessing = generatingCount > 0;
              
              return (
                <button
                  key={page._id}
                  onClick={() => onPageChange(i)}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-semibold transition-all flex-shrink-0 relative ${
                    i === currentPageIndex
                      ? "bg-purple-600 text-white shadow-md"
                      : hasImages
                        ? "bg-purple-50 text-purple-700 hover:bg-purple-100"
                        : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  {i + 1}
                  {/* Status indicator dot */}
                  <div className="absolute -bottom-0.5 sm:-bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {hasImages && (
                      <div
                        className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${
                          allComplete
                            ? "bg-emerald-500"
                            : hasProcessing
                              ? "bg-yellow-500 animate-pulse"
                              : "bg-gray-400"
                        }`}
                      />
                    )}
                  </div>
                </button>
              );
            })}

            {/* Add Page Button */}
            <button
              onClick={handleAddPage}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-semibold transition-all flex-shrink-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-sm hover:shadow-md flex items-center justify-center"
              title="Add new page"
            >
              +
            </button>
          </div>

          <button
            onClick={() => onPageChange(Math.min(pages.length - 1, currentPageIndex + 1))}
            disabled={currentPageIndex === pages.length - 1 || pages.length === 0}
            className="p-1.5 sm:p-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-center text-gray-500 text-xs sm:text-sm font-medium flex-1">
            {pages.length === 0 ? (
              <span>No pages yet • <span className="text-purple-600">Click + to start</span></span>
            ) : (
              <span>Page {currentPageIndex + 1} of {pages.length} • {pages.length < 10 && "💡 Most books have 10-20 pages"}</span>
            )}
          </div>
        </div>
      </div>

      {/* Page Controls - Show when a page is selected */}
      {currentPage && (
        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleMovePageUp}
                disabled={currentPageIndex === 0}
                className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-medium flex items-center gap-1"
                title="Move page earlier"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Earlier</span>
              </button>
              
              <button
                onClick={handleMovePageDown}
                disabled={currentPageIndex === pages.length - 1}
                className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-medium flex items-center gap-1"
                title="Move page later"
              >
                <span className="hidden sm:inline">Later</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <button
              onClick={handleDeletePage}
              className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all text-sm font-medium flex items-center gap-1"
              title="Delete this page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="hidden sm:inline">Delete Page</span>
            </button>
          </div>
        </div>
      )}


      {/* Page Editor */}
      {pages.length === 0 ? (
        <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">📖</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Start Your Story</h3>
            <p className="text-gray-600 mb-6">
              Click the <span className="font-semibold text-purple-600">+</span> button above to add your first page!
            </p>
            <div className="bg-white rounded-xl p-4 text-left">
              <p className="text-sm text-gray-600 mb-3 font-medium">✨ How it works:</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">1.</span>
                  <span>Add pages as you go — no need to fill them all at once</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">2.</span>
                  <span>Upload photos to each page (up to 3 per page)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">3.</span>
                  <span>Reorder pages with the arrow buttons</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">4.</span>
                  <span>Most storybooks have 10-20 pages</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : currentPage ? (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-gray-900 font-semibold mb-4 flex items-center gap-2">
            <span>📸</span> Page {currentPageIndex + 1}
          </h3>

          {currentPage.images && currentPage.images.length > 0 ? (
            <div className="space-y-4">
              {currentPage.images.map((image) => (
                <div key={image._id} className="relative group">
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    {image.generationStatus === "generating" && (
                      <div className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                        <div className="w-2 h-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="font-medium">Processing</span>
                      </div>
                    )}
                    {image.generationStatus === "completed" && (
                      <div className="bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-full shadow-sm font-medium">
                        ✨ Ready
                      </div>
                    )}
                    {image.generationStatus === "failed" && (
                      <div className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-full shadow-sm font-medium">
                        ❌ Failed
                      </div>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => onDeleteImage(image._id)}
                    className="absolute top-3 right-3 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Image Preview - Before/After stacked on mobile, side by side on desktop */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Original */}
                    <div className="space-y-2">
                      <p className="text-gray-500 text-xs font-medium text-center">Original</p>
                      <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-sm">
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
                    <div className="space-y-2 relative group/photo">
                      <p className="text-gray-500 text-xs font-medium text-center">
                        {image.bakedUrl ? "Final" : image.cartoonUrl ? "Cartoon" : "Processing..."}
                        {image.bakingStatus === "baking" && " (Baking text...)"}
                      </p>
                      <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 relative shadow-sm">
                        {/* Show baked image if available, otherwise cartoon */}
                        {(image.bakedUrl || image.cartoonUrl) ? (
                          <>
                            <img
                              src={image.bakedUrl || image.cartoonUrl || ""}
                              alt={image.bakedUrl ? "Final with text" : "Transformed"}
                              className="w-full h-full object-cover object-center"
                            />
                            
                            {/* Add Text Button - Per Photo, Bottom Right Corner */}
                            {image.generationStatus === "completed" && image.bakingStatus !== "baking" && (
                              <button
                                onClick={() => handleOpenOverlayEditor(image)}
                                className="absolute bottom-2 right-2 bg-gray-900/90 hover:bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 opacity-0 group-hover/photo:opacity-100 transition-all shadow-lg hover:scale-105"
                                title="Add text to this photo"
                              >
                                <span>✏️</span>
                                <span>Add Text</span>
                              </button>
                            )}

                            {/* Baking overlay */}
                            {image.bakingStatus === "baking" && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <div className="text-center text-white">
                                  <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                  <div className="text-sm font-medium">Baking text...</div>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-purple-500">
                            <div className="text-center">
                              <div className="text-3xl mb-2">🎨</div>
                              <div className="text-sm font-medium">Creating magic...</div>
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
      ) : null}

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
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-gray-900 font-semibold mb-5 flex items-center gap-2 text-lg">
        <span>🎨</span> Design Your Cover
      </h3>

      <div className="space-y-5">
        {/* Cover Image Selection */}
        <div>
          <label className="text-gray-700 text-sm font-medium mb-2 block">Cover Hero Image</label>

          {/* Book images - primary option */}
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
                Add photos to your book pages first to select a cover image.
              </p>
            </div>
          )}

          {/* Custom upload - secondary option */}
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
            Your images are being transformed into Disney-style illustrations.
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
            Go to the Pages tab and upload some photos to get started!
          </p>
        </div>
      )}
    </div>
  );
}
