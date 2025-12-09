"use client";

import { useRef, useState, DragEvent } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Check if a file is HEIC format
const isHeicFile = (file: File): boolean => {
  const heicTypes = ["image/heic", "image/heif"];
  const heicExtensions = [".heic", ".heif"];

  if (heicTypes.includes(file.type.toLowerCase())) {
    return true;
  }

  const fileName = file.name.toLowerCase();
  return heicExtensions.some(ext => fileName.endsWith(ext));
};

// Strategy 1: Use heic2any library (works in Chrome, Firefox, etc.)
const convertWithHeic2Any = async (file: File): Promise<File | null> => {
  try {
    console.log("📦 Trying heic2any conversion...");
    const heic2anyModule = await import("heic2any");
    const heic2any = heic2anyModule.default;

    const convertedBlob = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.85,
    });

    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    const newFileName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
    const convertedFile = new File([blob], newFileName, { type: "image/jpeg" });
    console.log("✅ heic2any conversion successful");
    return convertedFile;
  } catch (error) {
    console.warn("⚠️ heic2any failed:", error);
    return null;
  }
};

// Strategy 2: Use Canvas API (works if browser natively supports HEIC, like Safari)
const convertWithCanvas = async (file: File): Promise<File | null> => {
  try {
    console.log("📦 Trying Canvas API conversion...");
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");
    ctx.drawImage(bitmap, 0, 0);

    const jpegBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85)
    );

    if (!jpegBlob) throw new Error("Canvas toBlob returned null");

    const newFileName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
    const convertedFile = new File([jpegBlob], newFileName, { type: "image/jpeg" });
    console.log("✅ Canvas conversion successful");
    return convertedFile;
  } catch (error) {
    console.warn("⚠️ Canvas conversion failed:", error);
    return null;
  }
};

// Strategy 3: Use FileReader + Image (another fallback for Safari)
const convertWithFileReader = async (file: File): Promise<File | null> => {
  try {
    console.log("📦 Trying FileReader conversion...");
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const newFileName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
                const convertedFile = new File([blob], newFileName, { type: "image/jpeg" });
                console.log("✅ FileReader conversion successful");
                resolve(convertedFile);
              } else {
                resolve(null);
              }
            },
            "image/jpeg",
            0.85
          );
        };
        img.onerror = () => resolve(null);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.warn("⚠️ FileReader conversion failed:", error);
    return null;
  }
};

// Main conversion function - tries multiple strategies
const convertHeicToJpeg = async (file: File): Promise<File> => {
  console.log("🔄 Converting HEIC to JPEG:", file.name, "size:", file.size, "type:", file.type);

  // Try Strategy 1: heic2any (best for Chrome/Firefox)
  let result = await convertWithHeic2Any(file);
  if (result) return result;

  // Try Strategy 2: Canvas API (works if browser supports HEIC natively)
  result = await convertWithCanvas(file);
  if (result) return result;

  // Try Strategy 3: FileReader + Image
  result = await convertWithFileReader(file);
  if (result) return result;

  // All strategies failed - return original file with warning
  // The original HEIC will be uploaded; may not display in all browsers
  console.warn("⚠️ All conversion strategies failed. Uploading original HEIC file.");
  console.warn("   Note: Image may not display in browsers that don't support HEIC.");
  return file;
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
      // Check if it's an image file - also accept HEIC by extension since iOS may not report correct MIME type
      const isImage = file.type.startsWith("image/") || isHeicFile(file);
      if (!isImage) {
        errors.push(`${file.name}: Not an image file`);
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
      let file = filesToUpload[i];
      setUploadProgress(`Uploading image ${i + 1} of ${filesToUpload.length}...`);

      try {
        // Convert HEIC files to JPEG (browsers can't display HEIC)
        if (isHeicFile(file)) {
          setUploadProgress(`Converting image ${i + 1} to compatible format...`);
          file = await convertHeicToJpeg(file);
        }

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
        accept="image/*"
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
                Max {MAX_FILE_SIZE_MB}MB per image • Works with Photos, iCloud, Files
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
