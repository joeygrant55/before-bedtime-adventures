"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface PhotoUploadSlotProps {
  pageId: Id<"pages">;
  imageUrl?: string | null;
  imageId?: Id<"images">;
  status?: "uploading" | "transforming" | "complete" | "empty";
  onReplace?: () => void;
  onAddText?: () => void;
}

export function PhotoUploadSlot({
  pageId,
  imageUrl,
  imageId,
  status = "empty",
  onReplace,
  onAddText,
}: PhotoUploadSlotProps) {
  const { user } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadImage = useMutation(api.images.uploadImage);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be under 10MB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        await uploadImage({
          clerkId: user.id,
          pageId,
          imageBase64: base64,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
      setIsUploading(false);
    }
  };

  // Empty state
  if (status === "empty" && !isUploading) {
    return (
      <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-purple-400 bg-gray-50 hover:bg-purple-50 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        <span className="text-4xl group-hover:scale-110 transition-transform">📸</span>
        <span className="text-sm font-medium text-gray-500 group-hover:text-purple-600">
          Upload Photo
        </span>
      </label>
    );
  }

  // Uploading state
  if (isUploading || status === "uploading") {
    return (
      <div className="aspect-square rounded-xl border-2 border-purple-300 bg-purple-50 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-sm font-medium text-purple-600">Uploading...</div>
        <div className="w-3/4 h-2 bg-purple-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-600 transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      </div>
    );
  }

  // Transforming state
  if (status === "transforming") {
    return (
      <div className="aspect-square rounded-xl border-2 border-purple-400 bg-gradient-to-br from-purple-100 to-pink-100 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 animate-pulse" />
        <span className="text-4xl animate-bounce relative z-10">✨</span>
        <div className="text-sm font-medium text-purple-700 relative z-10">Transforming...</div>
      </div>
    );
  }

  // Complete state - show image
  if (status === "complete" && imageUrl) {
    return (
      <div className="aspect-square rounded-xl overflow-hidden relative group shadow-sm">
        <img
          src={imageUrl}
          alt="Cartoon"
          className="w-full h-full object-cover"
        />
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            onClick={onReplace}
            className="bg-white hover:bg-gray-100 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-lg"
          >
            <span>🔄</span>
            <span>Replace</span>
          </button>
          <button
            onClick={onAddText}
            className="bg-white hover:bg-gray-100 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-lg"
          >
            <span>✏️</span>
            <span>Add Text</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
}
