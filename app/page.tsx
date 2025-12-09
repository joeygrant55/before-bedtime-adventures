"use client";

import { SignInButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            Before Bedtime Adventures
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Turn your vacation memories into magical children's storybooks
          </p>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Upload your family photos, and we'll transform them into a beautifully illustrated
            hardcover book that brings your adventures to life in Disney-style cartoon magic.
          </p>

          <div className="flex gap-4 justify-center mb-16">
            <SignedOut>
              <SignInButton
                mode="modal"
                forceRedirectUrl="/dashboard"
              >
                <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors">
                  Get Started
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors">
                  Go to Dashboard
                </button>
              </Link>
            </SignedIn>
            <button className="bg-white hover:bg-gray-50 text-gray-900 font-semibold px-8 py-4 rounded-lg text-lg border-2 border-gray-300 transition-colors">
              See Examples
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-20">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">📸</div>
              <h3 className="text-xl font-bold mb-2">Upload Your Photos</h3>
              <p className="text-gray-600">
                Select 10-20 photos from your vacation—one for each stop on your journey.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-bold mb-2">AI Cartoon Magic</h3>
              <p className="text-gray-600">
                Watch as AI transforms your photos into beautiful Disney-style illustrations.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-bold mb-2">Print Your Book</h3>
              <p className="text-gray-600">
                Receive a premium hardcover children's book delivered to your door.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
