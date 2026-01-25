"use client";

import { useRef, useState, DragEvent, useCallback } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useToast } from "@/components/ui/Toast";
import { motion, AnimatePresence } from "framer-motion";
import { trackImageUploaded, trackImageTransformStarted, trackImageTransformFailed } from "@/lib/analytics";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Supported image formats (HEIC excluded due to browser compatibility issues)
const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/jpg"];
const SUPPORTED_EXTENSIONS = [".jpg", ".jpeg", ".png"];

const isSupportedImageFile = (file: File): boolean => {
  // Check MIME type
  if (SUPPORTED_TYPES.includes(file.type.toLowerCase())) {
    return true;
  }
  // Also check extension as fallback
  const fileName = file.name.toLowerCase();
  return SUPPORTED_EXTENSIONS.some(ext => fileName.endsWith(ext));
};

interface ImageUploadProps {
  pageId: Id<"pages">;
  currentImageCount: number;
  maxImages?: number;
  onUploadComplete?: () => void;
}

export function ImageUpload({
  pageId,
  currentImageCount,
  maxImages = 3,
  onUploadComplete,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { success, error: showError, info } = useToast();

  const generateUploadUrl = useMutation(api.images.generateUploadUrl);
  const createImage = useMutation(api.images.createImage);
  const transformToDisney = useAction(api.transformImage.transformToDisney);

  const canUploadMore = currentImageCount < maxImages;
  const remainingSlots = maxImages - currentImageCount;

  const validateAndFilterFiles = useCallback((files: File[]): { valid: File[]; errors: string[] } => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      // Only accept JPEG and PNG (HEIC excluded due to browser compatibility issues)
      if (!isSupportedImageFile(file)) {
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
          errors.push(`"${file.name}": HEIC format not supported. Please convert to JPEG or PNG first.`);
        } else {
          errors.push(`"${file.name}": Only JPEG and PNG images are supported.`);
        }
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`"${file.name}": File exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
        continue;
      }
      validFiles.push(file);
    }

    return { valid: validFiles, errors };
  }, []);

  const uploadFiles = async (files: File[]) => {
    const { valid: validFiles, errors } = validateAndFilterFiles(files);
    const filesToUpload = validFiles.slice(0, remainingSlots);

    // Show errors for invalid files
    if (errors.length > 0) {
      errors.forEach(err => showError(err));
    }

    if (filesToUpload.length === 0) {
      if (errors.length === 0) {
        info("No files to upload");
      }
      return;
    }

    // Warn if some files were skipped due to slot limits
    if (validFiles.length > remainingSlots) {
      info(`Only uploading ${remainingSlots} of ${validFiles.length} files (max ${maxImages} per stop)`);
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: filesToUpload.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      setUploadProgress({ current: i + 1, total: filesToUpload.length });

      try {
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

        // Create image record in database
        const imageId = await createImage({
          pageId,
          originalImageId: storageId,
          order: currentImageCount + i,
        });

        // Track image uploaded
        trackImageUploaded(pageId, imageId);

        // Trigger Disney transformation in the background
        trackImageTransformStarted(pageId, imageId);
        transformToDisney({ imageId }).catch((error) => {
          console.error("Failed to transform image:", error);
          trackImageTransformFailed(pageId, imageId, error?.message || "Unknown error");
          showError(`Transformation failed for ${file.name}. You can retry later.`, {
            action: {
              label: "Retry",
              onClick: () => transformToDisney({ imageId }),
            },
          });
        });

        successCount++;
      } catch (error) {
        console.error("Error uploading image:", error);
        showError(`Failed to upload "${file.name}". Please try again.`);
        failCount++;
      }
    }

    setIsUploading(false);
    setUploadProgress(null);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Show success message
    if (successCount > 0) {
      success(
        successCount === 1
          ? "Photo uploaded! Magic transformation starting..."
          : `${successCount} photos uploaded! Magic transformation starting...`
      );
    }

    onUploadComplete?.();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadFiles(Array.from(files));
  };

  const handleDragOver = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (canUploadMore && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!canUploadMore || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await uploadFiles(files);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={!canUploadMore || isUploading}
        aria-label="Upload photos"
      />

      {canUploadMore ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onKeyDown={handleKeyDown}
          disabled={isUploading}
          className={`w-full border-2 border-dashed rounded-xl p-8 transition-all disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
            isDragging
              ? "border-purple-500 bg-purple-500/10"
              : isUploading
                ? "border-purple-500/30 bg-purple-500/5"
                : "border-purple-500/30 hover:border-purple-500 hover:bg-purple-500/5"
          }`}
          aria-label={`Upload photos. ${remainingSlots} slot${remainingSlots !== 1 ? "s" : ""} remaining.`}
          aria-busy={isUploading}
        >
          <AnimatePresence mode="wait">
            {isUploading ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <motion.div
                  className="w-12 h-12 mx-auto mb-3 border-3 border-purple-500 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <div className="text-lg font-medium text-purple-300 mb-1">
                  Uploading{uploadProgress ? ` ${uploadProgress.current}/${uploadProgress.total}` : "..."}
                </div>
                <div className="text-sm text-purple-400/70">Please wait...</div>
                
                {/* Progress bar */}
                {uploadProgress && (
                  <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden max-w-xs mx-auto">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
              </motion.div>
            ) : isDragging ? (
              <motion.div
                key="dragging"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center"
              >
                <div className="text-4xl mb-3">📥</div>
                <div className="text-lg font-medium text-purple-300 mb-1">
                  Drop photos here
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="text-4xl mb-3">📸</div>
                <div className="text-lg font-medium text-purple-300 mb-1">
                  Click to upload photos
                </div>
                <div className="text-sm text-purple-400/70">
                  Or drag and drop • {remainingSlots} photo
                  {remainingSlots !== 1 ? "s" : ""} remaining
                </div>
                <div className="text-xs text-purple-500/60 mt-2">
                  JPEG & PNG only • Max {MAX_FILE_SIZE_MB}MB per image
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      ) : (
        <div 
          className="border-2 border-green-500/30 rounded-xl p-6 bg-green-500/5 text-center"
          role="status"
        >
          <div className="text-green-400 flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Maximum of {maxImages} photos reached</span>
          </div>
        </div>
      )}
    </div>
  );
}
