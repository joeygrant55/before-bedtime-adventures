"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import Link from "next/link";

type CoverTheme = "purple-magic" | "ocean-adventure" | "sunset-wonder" | "forest-dreams";

type ImageWithUrls = Doc<"images"> & {
  originalUrl: string | null;
  cartoonUrl: string | null;
};

type PageWithImages = Doc<"pages"> & {
  images: ImageWithUrls[];
};

const THEMES: { id: CoverTheme; name: string; colors: { primary: string; secondary: string; accent: string } }[] = [
  {
    id: "purple-magic",
    name: "Purple Magic",
    colors: { primary: "from-purple-900 to-indigo-900", secondary: "bg-purple-600", accent: "text-purple-300" },
  },
  {
    id: "ocean-adventure",
    name: "Ocean Adventure",
    colors: { primary: "from-blue-900 to-cyan-900", secondary: "bg-blue-600", accent: "text-cyan-300" },
  },
  {
    id: "sunset-wonder",
    name: "Sunset Wonder",
    colors: { primary: "from-orange-900 to-red-900", secondary: "bg-orange-600", accent: "text-amber-300" },
  },
  {
    id: "forest-dreams",
    name: "Forest Dreams",
    colors: { primary: "from-emerald-900 to-teal-900", secondary: "bg-emerald-600", accent: "text-emerald-300" },
  },
];

export default function CoverDesignerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const bookId = id as Id<"books">;
  const router = useRouter();
  const { user } = useUser();

  const book = useQuery(api.books.getBook, { bookId });
  const pages = useQuery(api.pages.getBookPages, { bookId });
  const updateCoverDesign = useMutation(api.books.updateCoverDesign);

  // Form state
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [authorLine, setAuthorLine] = useState("");
  const [theme, setTheme] = useState<CoverTheme>("purple-magic");
  const [dedication, setDedication] = useState("");
  const [selectedHeroIndex, setSelectedHeroIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [customCoverImage, setCustomCoverImage] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Initialize form with existing cover design or book title
  useEffect(() => {
    if (book) {
      if (book.coverDesign) {
        setTitle(book.coverDesign.title);
        setSubtitle(book.coverDesign.subtitle || "");
        setAuthorLine(book.coverDesign.authorLine || "");
        setTheme(book.coverDesign.theme);
        setDedication(book.coverDesign.dedication || "");
      } else {
        setTitle(book.title);
      }
    }
  }, [book]);

  // Loading state
  if (!book || !pages) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full" />
            <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="text-purple-300 text-lg">Loading cover designer...</p>
        </div>
      </div>
    );
  }

  // Get all completed cartoon images for hero selection
  const allImages = pages.flatMap((page: PageWithImages) =>
    (page.images || []).filter((img) => img.generationStatus === "completed" && img.cartoonUrl)
  );

  // Handle cover image upload
  const handleCoverUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image must be under 10MB");
      return;
    }

    // Check for unsupported formats
    if (file.type === "image/heic" || file.type === "image/heif") {
      setUploadError("HEIC/HEIF format not supported. Please use JPEG or PNG.");
      return;
    }

    setUploadError(null);
    setIsUploadingCover(true);

    try {
      // Create preview URL for the custom image
      const previewUrl = URL.createObjectURL(file);
      setCustomCoverImage(previewUrl);
      setSelectedHeroIndex(-1); // -1 indicates custom image is selected
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError("Failed to process image");
    } finally {
      setIsUploadingCover(false);
    }
  }, []);

  // Get the current hero image URL
  const currentHeroImage = selectedHeroIndex === -1
    ? customCoverImage
    : allImages[selectedHeroIndex]?.cartoonUrl;

  const selectedTheme = THEMES.find((t) => t.id === theme) || THEMES[0];

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateCoverDesign({
        clerkId: user.id,
        bookId,
        coverDesign: {
          title: title || book.title,
          subtitle: subtitle || undefined,
          authorLine: authorLine || undefined,
          theme,
          dedication: dedication || undefined,
          // Note: heroImageId would require storing the selected image to storage
          // For now we use the index to select from existing images
        },
      });
      router.push(`/books/${bookId}/edit`);
    } catch (error) {
      console.error("Failed to save cover design:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-purple-500/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={`/books/${bookId}/edit`}
            className="text-purple-300 hover:text-white transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Editor
          </Link>
          <h1 className="text-xl font-bold text-white">Design Your Cover</h1>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Save & Preview
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Live Preview */}
          <div className="order-1 lg:order-2">
            <div className="sticky top-24">
              <h2 className="text-lg font-semibold text-white mb-4">Preview</h2>
              <div className={`aspect-square max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br ${selectedTheme.colors.primary} p-8`}>
                {/* Cover Preview */}
                <div className="h-full flex flex-col items-center justify-center text-center">
                  {/* Hero Image */}
                  {currentHeroImage ? (
                    <div className="w-48 h-48 rounded-xl overflow-hidden mb-6 shadow-lg border-4 border-white/20">
                      <img
                        src={currentHeroImage}
                        alt="Cover hero"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-48 h-48 rounded-xl mb-6 border-4 border-dashed border-white/30 flex items-center justify-center">
                      <p className="text-white/50 text-sm text-center px-4">Upload or select a cover image</p>
                    </div>
                  )}

                  {/* Title */}
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
                    {title || book.title}
                  </h1>

                  {/* Subtitle */}
                  {subtitle && (
                    <p className={`text-lg ${selectedTheme.colors.accent} mb-4`}>{subtitle}</p>
                  )}

                  {/* Author Line */}
                  {authorLine && (
                    <p className="text-white/70 text-sm mt-auto">{authorLine}</p>
                  )}
                </div>
              </div>

              {/* Back Cover Preview */}
              <div className="mt-4">
                <p className="text-purple-400 text-sm mb-2">Back Cover:</p>
                <div className={`aspect-square max-w-md mx-auto rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br ${selectedTheme.colors.primary} p-6`}>
                  <div className="h-full flex flex-col">
                    {/* Image Collage */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {allImages.slice(0, 6).map((img, i) => (
                        <div key={i} className="aspect-square rounded-lg overflow-hidden border border-white/10">
                          {img.cartoonUrl && (
                            <img src={img.cartoonUrl} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Dedication */}
                    {dedication && (
                      <div className="flex-1 flex items-center justify-center">
                        <p className="text-white/90 text-center italic text-sm">&ldquo;{dedication}&rdquo;</p>
                      </div>
                    )}

                    {/* Branding */}
                    <p className="text-white/40 text-xs text-center mt-auto">
                      Made with Before Bedtime Adventures
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Controls */}
          <div className="order-2 lg:order-1 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-purple-300 text-sm font-medium mb-2">Book Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={book.title}
                className="w-full bg-slate-800/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-purple-300 text-sm font-medium mb-2">
                Subtitle <span className="text-purple-500/50">(optional)</span>
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g., Our Family Adventure 2024"
                className="w-full bg-slate-800/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Author Line */}
            <div>
              <label className="block text-purple-300 text-sm font-medium mb-2">
                Author Line <span className="text-purple-500/50">(optional)</span>
              </label>
              <input
                type="text"
                value={authorLine}
                onChange={(e) => setAuthorLine(e.target.value)}
                placeholder="e.g., Created by the Smith Family"
                className="w-full bg-slate-800/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Dedication */}
            <div>
              <label className="block text-purple-300 text-sm font-medium mb-2">
                Dedication <span className="text-purple-500/50">(back cover, optional)</span>
              </label>
              <textarea
                value={dedication}
                onChange={(e) => setDedication(e.target.value)}
                placeholder="e.g., For Emma and Jake, who make every adventure magical."
                rows={3}
                className="w-full bg-slate-800/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Theme Selection */}
            <div>
              <label className="block text-purple-300 text-sm font-medium mb-3">Color Theme</label>
              <div className="grid grid-cols-2 gap-3">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      theme === t.id
                        ? "border-white shadow-lg scale-105"
                        : "border-transparent hover:border-purple-500/50"
                    }`}
                  >
                    <div className={`h-12 rounded-lg bg-gradient-to-br ${t.colors.primary} mb-2`} />
                    <p className="text-white text-sm font-medium">{t.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Hero Image Selection */}
            <div>
              <label className="block text-purple-300 text-sm font-medium mb-3">
                Cover Image
              </label>

              {/* Upload Button */}
              <div className="mb-4">
                <label className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  isUploadingCover
                    ? "border-purple-500 bg-purple-500/20"
                    : "border-purple-500/30 hover:border-purple-500 hover:bg-purple-500/10"
                }`}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleCoverUpload}
                    className="hidden"
                    disabled={isUploadingCover}
                  />
                  {isUploadingCover ? (
                    <>
                      <div className="w-5 h-5 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                      <span className="text-purple-300">Processing...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">📸</span>
                      <span className="text-purple-300">Upload Custom Cover Image</span>
                    </>
                  )}
                </label>
                {uploadError && (
                  <p className="text-red-400 text-sm mt-2">{uploadError}</p>
                )}
              </div>

              {/* Custom uploaded image (if any) */}
              {customCoverImage && (
                <div className="mb-4">
                  <p className="text-purple-400 text-xs mb-2">Uploaded Image:</p>
                  <button
                    onClick={() => setSelectedHeroIndex(-1)}
                    className={`aspect-square w-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedHeroIndex === -1
                        ? "border-purple-500 ring-2 ring-purple-500/50 scale-105"
                        : "border-transparent hover:border-purple-500/50"
                    }`}
                  >
                    <img
                      src={customCoverImage}
                      alt="Uploaded cover"
                      className="w-full h-full object-cover"
                    />
                  </button>
                </div>
              )}

              {/* Existing book images */}
              {allImages.length > 0 && (
                <div>
                  <p className="text-purple-400 text-xs mb-2">Or choose from your book images:</p>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {allImages.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedHeroIndex(index)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          selectedHeroIndex === index
                            ? "border-purple-500 ring-2 ring-purple-500/50 scale-105"
                            : "border-transparent hover:border-purple-500/50"
                        }`}
                      >
                        {img.cartoonUrl && (
                          <img
                            src={img.cartoonUrl}
                            alt={`Option ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state when no images */}
              {allImages.length === 0 && !customCoverImage && (
                <p className="text-purple-400/60 text-sm italic">
                  Upload an image above, or add photos to your book pages first.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
