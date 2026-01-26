"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

interface AppHeaderProps {
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
}

export function AppHeader({
  showBackButton = false,
  backHref = "/dashboard",
  backLabel = "Back",
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {showBackButton ? (
              <Link
                href={backHref}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">{backLabel}</span>
              </Link>
            ) : (
              <Link href="/dashboard" className="flex items-center gap-2">
                <span className="text-2xl">📚</span>
                <span className="font-semibold text-gray-900 hidden sm:inline">Before Bedtime Adventures</span>
              </Link>
            )}
          </div>

          {/* Right side */}
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
