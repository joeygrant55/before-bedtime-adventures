"use client";

import Link from "next/link";
import Image from "next/image";
import { UserButton, useUser } from "@clerk/nextjs";
import { ExpandableTabs } from "@/components/ui/expandable-tabs";

type FilterType = "all" | "in_progress" | "ready";

const FILTER_TABS = [
  { title: "All Books", icon: "📚" },
  { title: "In Progress", icon: "🎨" },
  { type: "separator" as const },
  { title: "Ready to Order", icon: "✨" },
];

interface DashboardHeaderProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export function DashboardHeader({ activeFilter, onFilterChange }: DashboardHeaderProps) {
  const { user } = useUser();

  const filterToIndex = (filter: FilterType): number => {
    switch (filter) {
      case "all": return 0;
      case "in_progress": return 1;
      case "ready": return 3; // After separator
    }
  };

  const indexToFilter = (index: number | null): FilterType => {
    switch (index) {
      case 0: return "all";
      case 1: return "in_progress";
      case 3: return "ready";
      default: return "all";
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-purple-500/20">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/dashboard" className="group shrink-0">
            <Image
              src="/logo.png"
              alt="Before Bedtime Adventures"
              width={540}
              height={408}
              className="h-[108px] w-auto group-hover:opacity-80 transition-opacity"
              priority
            />
          </Link>

          {/* Filter Tabs - centered on larger screens */}
          <div className="hidden md:block">
            <ExpandableTabs
              tabs={FILTER_TABS}
              selected={filterToIndex(activeFilter)}
              onChange={(index) => onFilterChange(indexToFilter(index))}
              persistSelection={true}
              activeColor="text-purple-400"
            />
          </div>

          {/* Mobile filter dropdown */}
          <div className="md:hidden">
            <select
              value={activeFilter}
              onChange={(e) => onFilterChange(e.target.value as FilterType)}
              className="bg-slate-800/50 border border-purple-500/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <option value="all">📚 All</option>
              <option value="in_progress">🎨 In Progress</option>
              <option value="ready">✨ Ready</option>
            </select>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-purple-300 hidden lg:block">
                {user.firstName || user.emailAddresses[0]?.emailAddress}
              </span>
            )}
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 ring-2 ring-purple-500/30",
                },
              }}
            >
              <UserButton.MenuItems>
                <UserButton.Link
                  label="Dashboard"
                  labelIcon={<span>📚</span>}
                  href="/dashboard"
                />
                <UserButton.Link
                  label="Settings"
                  labelIcon={<span>⚙️</span>}
                  href="/settings"
                />
                <UserButton.Action label="manageAccount" />
                <UserButton.Action label="signOut" />
              </UserButton.MenuItems>
            </UserButton>
          </div>
        </div>
      </div>
    </header>
  );
}
