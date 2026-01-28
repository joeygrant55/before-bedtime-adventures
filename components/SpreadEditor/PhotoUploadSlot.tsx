"use client";

import { useRef, useState, DragEvent } from "react";
import { useMutation, useAction } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useToast } from "@/components/ui/Toast";
import { motion, AnimatePresence } from "framer-motion";
import { trackImageUploaded, trackImageTransformStarted, trackImageTransformFailed } from "@/lib/analytics";

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MIN_DIMENSION = 500;

// Supported image formats
const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const SUPPORTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic"];

interface PhotoUploadSlotProps {
  pageId: Id<"pages">;
  imageIndex: number; // Which slot in the template (0, 1, 2)
  image?: {
    _id: Id<"images">;
    originalImageUrl?: string;
    cartoonImageUrl?: string;
    status: string; // "uploaded" | "transforming" | "completed" | "failed"
    bakedImageUrl?: string;
  };
  onUpload?: (file: File) => void;
  aspectRatio?: string; // "1/1" | "16/9" | "4/3"
  onAddText?: () => void;
  onReplace?: () => void;
  onRemove?: () => void;
}

export function PhotoUploadSlot({
  pageId,
  imageIndex,
  image,
  onUpload: onUploadCallback,
  aspectRatio = "1/1",
  onAddText,
  onReplace: onReplaceCallback,
  onRemove: onRemoveCallback,
}: PhotoUploadSlotProps) {
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { success, error: showError, warning } = useToast();

  const generateUploadUrl = useMutation(api.images.generateUploadUrl);
  const createImage = useMutation(api.images.createImage);
  const deleteImage = useMutation(api.images.deleteImage);
  const transformToDisney = useAction(api.transformImage.transformToDisney);

  // Detect if mobile
  const isMobile = typeof window !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const isSupportedImageFile = (file: File): boolean => {
    if (SUPPORTED_TYPES.includes(file.type.toLowerCase())) {
      return true;
    }
    const fileName = file.name.toLowerCase();
    return SUPPORTED_EXTENSIONS.some(ext => fileName.endsWith(ext));
  };

  const validateFile = async (file: File): Promise<{ valid: boolean; error?: string }> => {
    // Check file type
    if (!isSupportedImageFile(file)) {
      return { valid: false, error: "Only JPEG, PNG, WebP, and HEIC images are supported" };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { valid: false, error: `File exceeds ${MAX_FILE_SIZE_MB}MB limit` };
    }

    // Check image dimensions
    try {
      const dimensions = await getImageDimensions(file);
      if (dimensions.width < MIN_DIMENSION || dimensions.height < MIN_DIMENSION) {
        return {
          valid: true,
          error: `Image is ${dimensions.width}x${dimensions.height}px. For best print quality, use images at least ${MIN_DIMENSION}x${MIN_DIMENSION}px`,
        };
      }
    } catch (error) {
      console.warn("Could not check image dimensions:", error);
    }

    return { valid: true };
  };

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image"));
      };

      img.src = url;
    });
  };

  const uploadFile = async (file: File) => {
    const validation = await validateFile(file);

    if (!validation.valid) {
      showError(validation.error!);
      return;
    }

    // Show warning for small images but continue
    if (validation.error) {
      warning(validation.error);
    }

    // Create preview
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 80));
      }, 150);

      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error(`Upload failed with status ${result.status}`);
      }

      const uploadResponse = await result.json();
      const storageId = uploadResponse.storageId;

      clearInterval(progressInterval);
      setUploadProgress(90);

      // Create image record in database
      const imageId = await createImage({
        pageId,
        originalImageId: storageId,
        order: imageIndex,
      });

      setUploadProgress(100);

      // Track image uploaded
      trackImageUploaded(pageId, imageId);

      // Trigger Disney transformation in the background
      trackImageTransformStarted(pageId, imageId);
      transformToDisney({ imageId }).catch((error) => {
        console.error("Failed to transform image:", error);
        trackImageTransformFailed(pageId, imageId, error?.message || "Unknown error");
        showError("Transformation failed. You can retry later.");
      });

      success("Photo uploaded! 🎨 Transforming into cartoon...");

      // Clean up preview after a delay
      setTimeout(() => {
        URL.revokeObjectURL(preview);
        setPreviewUrl(null);
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);

      onUploadCallback?.(file);
    } catch (error) {
      console.error("Error uploading image:", error);
      showError(`Failed to upload "${file.name}". Please try again.`);

      // Clean up
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      setPreviewUrl(null);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading && !image) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isUploading || image) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const handleReplace = () => {
    if (onReplaceCallback) {
      onReplaceCallback();
    }
    fileInputRef.current?.click();
  };

  const handleRemove = async () => {
    if (!image || !user) return;

    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    try {
      await deleteImage({
        clerkId: user.id,
        imageId: image._id,
      });

      success("Photo removed");
      setShowDeleteConfirm(false);
      onRemoveCallback?.();
    } catch (error) {
      console.error("Failed to remove image:", error);
      showError("Failed to remove photo. Please try again.");
    }
  };

  // Determine current state
  const getState = () => {
    if (!image && !isUploading) return "empty";
    if (isUploading) return "uploading";
    if (image?.status === "pending" || image?.status === "generating") return "transforming";
    if (image?.status === "failed") return "failed";
    if (image?.status === "completed") return "completed";
    return "empty";
  };

  const state = getState();

  // Determine which image URL to show
  const displayImageUrl = image?.bakedImageUrl || image?.cartoonImageUrl || null;

  // === EMPTY STATE ===
  if (state === "empty") {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept={SUPPORTED_TYPES.join(",")}
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Upload photo"
          capture={isMobile ? "environment" : undefined}
        />

        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            block w-full h-full min-h-[200px] rounded-xl border-2 border-dashed cursor-pointer
            transition-all duration-200 group
            ${
              isDragging
                ? "border-purple-500 bg-purple-50 scale-[1.02]"
                : "border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50 hover:scale-[1.01]"
            }
          `}
          style={{ aspectRatio }}
        >
          <div className="flex flex-col items-center justify-center h-full gap-2 p-4">
            <motion.span
              className="text-4xl transition-transform"
              animate={{ scale: isDragging ? 1.2 : 1 }}
            >
              📸
            </motion.span>
            <span className="text-sm font-medium text-gray-500 group-hover:text-purple-600 transition-colors">
              {isDragging ? "Drop photo here" : "Upload Photo"}
            </span>
            <span className="text-xs text-gray-400 text-center max-w-[150px]">
              {isDragging ? "" : isMobile ? "Tap to take or select photo" : "Click to upload or drag & drop"}
            </span>
          </div>
        </label>
      </>
    );
  }

  // === UPLOADING STATE ===
  if (state === "uploading") {
    return (
      <div
        className="w-full h-full min-h-[200px] rounded-xl border-2 border-purple-300 bg-purple-50 overflow-hidden relative"
        style={{ aspectRatio }}
      >
        {/* Preview image (dimmed) */}
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Uploading..."
            className="w-full h-full object-cover opacity-60"
          />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-purple-900/30 backdrop-blur-sm">
          <motion.div
            className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <div className="text-sm font-medium text-purple-900">Uploading...</div>

          {/* Progress bar */}
          <div className="w-3/4 max-w-[200px] h-2 bg-purple-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-purple-600"
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>
    );
  }

  // === TRANSFORMING STATE ===
  if (state === "transforming") {
    return (
      <div
        className="w-full h-full min-h-[200px] rounded-xl overflow-hidden relative"
        style={{ aspectRatio }}
      >
        {/* Original image (blurred/dimmed) */}
        {image?.originalImageUrl && (
          <img
            src={image.originalImageUrl}
            alt="Transforming..."
            className="w-full h-full object-cover filter blur-sm brightness-75"
          />
        )}

        {/* Animated overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-sm">
          {/* Pulsing glow effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Sparkle animation */}
          <motion.span
            className="text-5xl relative z-10"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            ✨
          </motion.span>

          <div className="text-sm font-medium text-white relative z-10 text-center px-4">
            Transforming your photo...
          </div>
          <div className="text-xs text-white/80 relative z-10">This may take a minute</div>
        </div>
      </div>
    );
  }

  // === FAILED STATE ===
  if (state === "failed") {
    return (
      <div
        className="w-full h-full min-h-[200px] rounded-xl border-2 border-red-300 bg-red-50 overflow-hidden relative group cursor-pointer"
        style={{ aspectRatio }}
        onClick={() => {
          if (image) {
            transformToDisney({ imageId: image._id })
              .then(() => success("Retrying transformation..."))
              .catch((error) => showError("Retry failed. Please try again."));
          }
        }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
          <span className="text-4xl">❌</span>
          <div className="text-sm font-medium text-red-600 text-center">Transform failed</div>
          <div className="text-xs text-red-500 text-center">Tap to retry</div>
        </div>
      </div>
    );
  }

  // === COMPLETED STATE ===
  if (state === "completed" && displayImageUrl) {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept={SUPPORTED_TYPES.join(",")}
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Replace photo"
          capture={isMobile ? "environment" : undefined}
        />

        <div
          className="w-full h-full min-h-[200px] rounded-xl overflow-hidden relative group shadow-sm"
          style={{ aspectRatio }}
        >
          {/* Cartoon image */}
          <img
            src={displayImageUrl}
            alt="Cartoon"
            className="w-full h-full object-cover"
          />

          {/* Hover overlay with actions */}
          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 p-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReplace();
              }}
              className="bg-white hover:bg-gray-100 text-gray-900 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all shadow-lg min-h-[44px] min-w-[44px] justify-center"
              aria-label="Replace photo"
            >
              <span>🔄</span>
              <span className="hidden sm:inline">Replace</span>
            </button>

            {onAddText && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddText();
                }}
                className="bg-white hover:bg-gray-100 text-gray-900 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all shadow-lg min-h-[44px] min-w-[44px] justify-center"
                aria-label="Add text overlay"
              >
                <span>✏️</span>
                <span className="hidden sm:inline">Add Text</span>
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className={`${
                showDeleteConfirm
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-white hover:bg-gray-100 text-gray-900"
              } px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all shadow-lg min-h-[44px] min-w-[44px] justify-center`}
              aria-label={showDeleteConfirm ? "Confirm delete" : "Remove photo"}
            >
              <span>🗑️</span>
              <span className="hidden sm:inline">{showDeleteConfirm ? "Confirm?" : "Remove"}</span>
            </button>
          </div>

          {/* Cancel delete confirmation on mouse leave */}
          {showDeleteConfirm && (
            <div
              className="absolute inset-0"
              onMouseLeave={() => setShowDeleteConfirm(false)}
            />
          )}
        </div>
      </>
    );
  }

  return null;
}
