"use client";

import { useRef, useState, DragEvent } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

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
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  const generateUploadUrl = useMutation(api.images.generateUploadUrl);
  const createImage = useMutation(api.images.createImage);
  const transformToDisney = useAction(api.transformImage.transformToDisney);

  const canUploadMore = currentImageCount < maxImages;

  const validateAndFilterFiles = (files: File[]): File[] => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      // Only accept JPEG and PNG (HEIC excluded due to browser compatibility issues)
      if (!isSupportedImageFile(file)) {
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
          errors.push(`${file.name}: HEIC format not supported. Please convert to JPEG or PNG first.`);
        } else {
          errors.push(`${file.name}: Only JPEG and PNG images are supported.`);
        }
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`${file.name}: Exceeds ${MAX_FILE_SIZE_MB}MB limit`);
        continue;
      }
      validFiles.push(file);
    }

    if (errors.length > 0) {
      alert(`Some files were skipped:\n${errors.join("\n")}`);
    }

    return validFiles;
  };

  const uploadFiles = async (files: File[]) => {
    const remainingSlots = maxImages - currentImageCount;
    const validFiles = validateAndFilterFiles(files);
    const filesToUpload = validFiles.slice(0, remainingSlots);

    if (filesToUpload.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      setUploadProgress(`Uploading image ${i + 1} of ${filesToUpload.length}...`);

      try {
        // Get upload URL from Convex
        const uploadUrl = await generateUploadUrl();

        // Upload file to Convex storage
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        const uploadResponse = await result.json();
        const storageId = uploadResponse.storageId;

        // Create image record in database
        const imageId = await createImage({
          pageId,
          originalImageId: storageId,
          order: currentImageCount + i,
        });

        // Trigger Disney transformation in the background
        transformToDisney({ imageId }).catch((error) => {
          console.error("Failed to transform image:", error);
        });
      } catch (error) {
        console.error("Error uploading image:", error);
        alert(`Failed to upload ${file.name}`);
      }
    }

    setIsUploading(false);
    setUploadProgress("");

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
      />

      {canUploadMore ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          disabled={isUploading}
          className={`w-full border-2 border-dashed rounded-lg p-8 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isDragging
              ? "border-purple-500 bg-purple-100"
              : "border-gray-300 hover:border-purple-500 hover:bg-purple-50"
          }`}
        >
          {isUploading ? (
            <div className="text-center">
              <div className="text-lg font-medium text-gray-700 mb-2">
                {uploadProgress}
              </div>
              <div className="text-sm text-gray-500">Please wait...</div>
            </div>
          ) : isDragging ? (
            <div className="text-center">
              <div className="text-4xl mb-3">📥</div>
              <div className="text-lg font-medium text-purple-700 mb-1">
                Drop photos here
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-4xl mb-3">📸</div>
              <div className="text-lg font-medium text-gray-700 mb-1">
                Click to upload photos
              </div>
              <div className="text-sm text-gray-500">
                Or drag and drop • {maxImages - currentImageCount} photo
                {maxImages - currentImageCount !== 1 ? "s" : ""} remaining
              </div>
              <div className="text-xs text-gray-400 mt-2">
                JPEG & PNG only • Max {MAX_FILE_SIZE_MB}MB per image
              </div>
            </div>
          )}
        </button>
      ) : (
        <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50 text-center">
          <div className="text-gray-600">
            ✓ Maximum of {maxImages} photos reached
          </div>
        </div>
      )}
    </div>
  );
}
