"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BookPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    // Redirect to edit page in read-through mode
    router.replace(`/books/${id}/edit?mode=readthrough`);
  }, [id, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-purple-200 rounded-full" />
          <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin" />
        </div>
        <p className="text-gray-600">Loading preview...</p>
      </div>
    </div>
  );
}
