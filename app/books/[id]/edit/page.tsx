"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { AppHeader } from "@/components/AppHeader";
import { ImageUpload } from "@/components/ImageUpload";
import Link from "next/link";

type ImageWithUrls = Doc<"images"> & {
  originalUrl: string | null;
  cartoonUrl: string | null;
};

type PageWithImages = Doc<"pages"> & {
  images: ImageWithUrls[];
};

export default function BookEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const bookId = id as Id<"books">;

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  const book = useQuery(api.books.getBook, { bookId });
  const pages = useQuery(api.pages.getBookPages, { bookId });
  const updatePageText = useMutation(api.pages.updatePageText);
  const updateBookTitle = useMutation(api.books.updateBookTitle);
  const deleteImage = useMutation(api.images.deleteImage);

  if (!book || !pages) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const currentPage = pages[currentPageIndex] as PageWithImages | undefined;

  const handleTextChange = async (field: "title" | "storyText", value: string) => {
    if (!currentPage) return;

    await updatePageText({
      pageId: currentPage._id,
      [field]: value,
    });
  };

  const handleTitleEdit = () => {
    setEditedTitle(book?.title || "");
    setIsEditingTitle(true);
  };

  const handleTitleSave = async () => {
    if (editedTitle.trim()) {
      await updateBookTitle({
        bookId,
        title: editedTitle.trim(),
      });
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setIsEditingTitle(false);
    setEditedTitle("");
  };

  const handleDeleteImage = async (imageId: Id<"images">) => {
    if (confirm("Are you sure you want to delete this image?")) {
      await deleteImage({ imageId });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader showBackButton backHref="/dashboard" backLabel="Back to Dashboard" />

      <main className="container mx-auto px-4 py-8">
        {/* Book Header */}
        <div className="mb-8">
          {isEditingTitle ? (
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSave();
                  if (e.key === "Escape") handleTitleCancel();
                }}
                autoFocus
                className="text-3xl font-bold text-gray-900 border-2 border-purple-500 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleTitleSave}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold"
              >
                ✓
              </button>
              <button
                onClick={handleTitleCancel}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-semibold"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{book.title}</h1>
              <button
                onClick={handleTitleEdit}
                className="text-gray-400 hover:text-purple-600 transition-colors"
                title="Edit title"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
            </div>
          )}
          <p className="text-gray-600 mt-2">
            Page {currentPageIndex + 1} of {pages.length}
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Page Navigator Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-24">
              <h2 className="font-semibold text-gray-900 mb-4">Pages</h2>
              <div className="space-y-2">
                {pages.map((page: PageWithImages, index: number) => (
                  <button
                    key={page._id}
                    onClick={() => setCurrentPageIndex(index)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      index === currentPageIndex
                        ? "bg-purple-100 text-purple-900 font-semibold"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Page {index + 1}</span>
                      {page.images && page.images.length > 0 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          {page.images.length} 📸
                        </span>
                      )}
                    </div>
                    {page.title && (
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {page.title}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t">
                <Link href={`/books/${bookId}/preview`}>
                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-3 rounded-lg transition-colors">
                    📖 Preview Book
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Main Editor */}
          <div className="lg:col-span-3 space-y-6">
            {currentPage && (
              <>
                {/* Page Title */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Page Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={currentPage.title || ""}
                    onChange={(e) => handleTextChange("title", e.target.value)}
                    placeholder={`Day ${currentPageIndex + 1} at...`}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Photo Upload */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📸 Upload Photos (1-3)
                  </h3>
                  <ImageUpload
                    pageId={currentPage._id}
                    currentImageCount={currentPage.images?.length || 0}
                    maxImages={3}
                  />

                  {/* Display uploaded images */}
                  {currentPage.images && currentPage.images.length > 0 && (
                    <div className="mt-6 space-y-6">
                      {currentPage.images.map((image: ImageWithUrls) => (
                        <div
                          key={image._id}
                          className="relative bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl p-6 shadow-lg border border-purple-200 group hover:shadow-xl transition-all duration-300"
                        >
                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteImage(image._id)}
                            className="absolute top-4 right-4 z-20 bg-red-500 hover:bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                            title="Delete image"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>

                          {/* Status Badge */}
                          <div className="absolute top-4 left-4 z-10">
                            {image.generationStatus === "pending" && (
                              <div className="bg-yellow-100 border-2 border-yellow-300 text-yellow-800 px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 shadow-md">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                Queued for magic...
                              </div>
                            )}
                            {image.generationStatus === "generating" && (
                              <div className="bg-blue-100 border-2 border-blue-300 text-blue-800 px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 shadow-md">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                                Creating Disney magic...
                              </div>
                            )}
                            {image.generationStatus === "completed" && (
                              <div className="bg-green-100 border-2 border-green-300 text-green-800 px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 shadow-md">
                                <span className="text-lg">✨</span>
                                Transformed!
                              </div>
                            )}
                            {image.generationStatus === "failed" && (
                              <div className="bg-red-100 border-2 border-red-300 text-red-800 px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 shadow-md">
                                ❌ Transformation failed
                              </div>
                            )}
                          </div>

                          {/* Before & After Comparison */}
                          <div className="grid md:grid-cols-2 gap-6 mt-12">
                            {/* Original Image */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                  <span className="text-2xl">📸</span>
                                  Your Photo
                                </h4>
                              </div>
                              <div className="relative aspect-square bg-white rounded-xl overflow-hidden shadow-md border-2 border-gray-200 group/img hover:shadow-lg transition-shadow">
                                {image.originalUrl ? (
                                  <img
                                    src={image.originalUrl}
                                    alt="Original photo"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="%23f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="Arial" font-size="16">Error loading</text></svg>';
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    Loading...
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Cartoon Image */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-purple-900 text-lg flex items-center gap-2">
                                  <span className="text-2xl">🎨</span>
                                  Disney Style
                                </h4>
                              </div>
                              <div className="relative aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl overflow-hidden shadow-md border-2 border-purple-300 group/img hover:shadow-lg transition-shadow">
                                {image.generationStatus === "completed" && image.cartoonUrl ? (
                                  <img
                                    src={image.cartoonUrl}
                                    alt="Disney cartoon version"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="%23fae8ff"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23a855f7" font-family="Arial" font-size="16">Error loading</text></svg>';
                                    }}
                                  />
                                ) : image.generationStatus === "generating" ? (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <div className="text-center space-y-4">
                                      <div className="relative w-16 h-16 mx-auto">
                                        <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
                                      </div>
                                      <div className="text-purple-700 font-semibold">
                                        Creating magic...
                                      </div>
                                      <div className="text-sm text-purple-600">
                                        This takes about 10-30 seconds
                                      </div>
                                    </div>
                                  </div>
                                ) : image.generationStatus === "failed" ? (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <div className="text-center space-y-2 p-6">
                                      <div className="text-4xl">😔</div>
                                      <div className="font-semibold text-red-700">
                                        Transformation failed
                                      </div>
                                      <div className="text-sm text-red-600">
                                        Try deleting and re-uploading
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <div className="text-center space-y-2 text-purple-600">
                                      <div className="text-4xl">⏳</div>
                                      <div className="font-semibold">Waiting to start...</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Story Text */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📝 Your Story
                  </h3>
                  <textarea
                    value={currentPage.storyText || ""}
                    onChange={(e) => handleTextChange("storyText", e.target.value)}
                    placeholder="Write what happened on this day..."
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-500">
                      {currentPage.storyText?.length || 0} characters
                    </div>
                    <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                      ✨ AI Suggest Story
                    </button>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center pt-4">
                  <button
                    onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
                    disabled={currentPageIndex === 0}
                    className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Previous Page
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + 1))
                    }
                    disabled={currentPageIndex === pages.length - 1}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next Page →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
