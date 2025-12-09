"use client";

import Link from "next/link";
import { UserMenu } from "./UserMenu";

interface AppHeaderProps {
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
}

export function AppHeader({
  showBackButton = false,
  backHref = "/dashboard",
  backLabel = "Back to Dashboard",
}: AppHeaderProps) {
  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Left side - Logo/Back button */}
          <div className="flex items-center gap-4">
            {showBackButton ? (
              <Link
                href={backHref}
                className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-2"
              >
                <span>←</span>
                <span className="hidden sm:inline">{backLabel}</span>
              </Link>
            ) : (
              <Link href="/dashboard">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  Before Bedtime Adventures
                </h1>
              </Link>
            )}
          </div>

          {/* Right side - User menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
