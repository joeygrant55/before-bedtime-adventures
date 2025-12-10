"use client";

import Link from "next/link";
import Image from "next/image";
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
              <Link href="/dashboard" className="shrink-0">
                <Image
                  src="/logo.png"
                  alt="Before Bedtime Adventures"
                  width={540}
                  height={408}
                  className="h-[120px] w-auto"
                  priority
                />
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
