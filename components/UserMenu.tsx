"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

export function UserMenu() {
  const { user } = useUser();

  if (!user) return null;

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600 hidden md:block">
        {user.firstName || user.emailAddresses[0]?.emailAddress}
      </span>
      <UserButton
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: "w-10 h-10",
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
  );
}
