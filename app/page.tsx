"use client";

import { SignInButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type DemoState = "idle" | "uploading" | "transforming" | "complete";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  // Demo state
  const [demoState, setDemoState] = useState<DemoState>("idle");
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [cartoonImage, setCartoonImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  // Handle file upload
  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB");
      return;
    }

    // Check for supported formats
    if (file.type === "image/heic" || file.type === "image/heif") {
      setError("HEIC/HEIF format not supported. Please use JPEG or PNG.");
      return;
    }

    setError(null);
    setDemoState("uploading");

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setOriginalImage(previewUrl);

    // Convert to base64 for API
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(",")[1];

      setDemoState("transforming");

      try {
        // Call demo transform API
        const response = await fetch("/api/demo/transform", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: file.type,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Transformation failed");
        }

        // Set the cartoon image
        setCartoonImage(`data:image/png;base64,${data.cartoonBase64}`);
        setDemoState("complete");
      } catch (err) {
        console.error("Transform error:", err);
        setError(err instanceof Error ? err.message : "Something went wrong");
        setDemoState("idle");
      }
    };

    reader.readAsDataURL(file);
  }, []);

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  const resetDemo = useCallback(() => {
    setDemoState("idle");
    setOriginalImage(null);
    setCartoonImage(null);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <span className="text-white font-bold text-xl hidden sm:inline">Before Bedtime Adventures</span>
          </div>
          <SignedOut>
            <SignInButton mode="modal" forceRedirectUrl="/dashboard">
              <button className="text-purple-300 hover:text-white font-medium transition-colors">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="text-purple-300 hover:text-white font-medium transition-colors">
              Dashboard
            </Link>
          </SignedIn>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-16">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Turn Vacation Photos Into
            <span className="block bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Magical Storybooks
            </span>
          </h1>
          <p className="text-lg md:text-xl text-purple-200 max-w-2xl mx-auto">
            Upload your family photos and watch AI transform them into Disney-style illustrations.
            Create a premium hardcover book delivered to your door.
          </p>
        </motion.div>

        {/* Interactive Demo Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 md:p-10 border border-white/10 shadow-2xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                See the Magic in Action
              </h2>
              <p className="text-purple-300">
                Try it free — no sign up required
              </p>
            </div>

            <AnimatePresence mode="wait">
              {/* Idle State - Upload Zone */}
              {demoState === "idle" && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                      dragActive
                        ? "border-purple-400 bg-purple-500/20"
                        : "border-white/20 hover:border-purple-400/50 hover:bg-white/5"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleInputChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-5xl mb-4">📸</div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Drop your photo here
                    </h3>
                    <p className="text-purple-300 mb-4">
                      or click to browse
                    </p>
                    <p className="text-purple-400 text-sm">
                      JPEG, PNG up to 10MB
                    </p>
                  </div>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-center mt-4"
                    >
                      {error}
                    </motion.p>
                  )}
                </motion.div>
              )}

              {/* Uploading State */}
              {demoState === "uploading" && (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
                >
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full" />
                    <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin" />
                  </div>
                  <p className="text-white text-lg">Uploading your photo...</p>
                </motion.div>
              )}

              {/* Transforming State */}
              {demoState === "transforming" && originalImage && (
                <motion.div
                  key="transforming"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid md:grid-cols-2 gap-6"
                >
                  {/* Original Image */}
                  <div className="relative rounded-2xl overflow-hidden bg-white/5">
                    <img
                      src={originalImage}
                      alt="Your photo"
                      className="w-full aspect-square object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                      <p className="text-white font-medium">Your Photo</p>
                    </div>
                  </div>

                  {/* Transforming Placeholder */}
                  <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center aspect-square">
                    <div className="text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="text-6xl mb-4"
                      >
                        ✨
                      </motion.div>
                      <p className="text-white font-semibold mb-2">Creating Magic...</p>
                      <p className="text-purple-300 text-sm">This takes about 15-30 seconds</p>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                      <p className="text-purple-300 font-medium">Disney Style</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Complete State - Before/After */}
              {demoState === "complete" && originalImage && cartoonImage && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Original Image */}
                    <div className="relative rounded-2xl overflow-hidden shadow-xl">
                      <img
                        src={originalImage}
                        alt="Your photo"
                        className="w-full aspect-square object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <p className="text-white font-medium">Your Photo</p>
                      </div>
                    </div>

                    {/* Cartoon Image */}
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, type: "spring" }}
                      className="relative rounded-2xl overflow-hidden shadow-xl ring-4 ring-purple-500/50"
                    >
                      <img
                        src={cartoonImage}
                        alt="Disney style transformation"
                        className="w-full aspect-square object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <p className="text-purple-300 font-medium flex items-center gap-2">
                          <span>✨</span> Disney Style
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <SignedOut>
                      <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                        <button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:scale-105">
                          Create Your Book — Get Started Free
                        </button>
                      </SignInButton>
                    </SignedOut>
                    <SignedIn>
                      <Link href="/dashboard">
                        <button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:scale-105">
                          Create Your Book
                        </button>
                      </Link>
                    </SignedIn>
                    <button
                      onClick={resetDemo}
                      className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
                    >
                      Try Another Photo
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-10">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                emoji: "📸",
                title: "Upload Photos",
                description: "Select 10-20 vacation photos—one for each page of your story.",
              },
              {
                emoji: "🎨",
                title: "AI Magic",
                description: "Watch as AI transforms your photos into Disney-style illustrations.",
              },
              {
                emoji: "📚",
                title: "Get Your Book",
                description: "Receive a premium hardcover book delivered to your door.",
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-colors"
              >
                <div className="text-4xl mb-4">{step.emoji}</div>
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-purple-300 text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-white/10 rounded-3xl p-8 md:p-12 max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to Create Magic?
            </h2>
            <p className="text-purple-300 mb-6">
              Turn your vacation memories into a storybook your kids will treasure forever.
            </p>
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-8 py-4 rounded-xl shadow-lg transition-all hover:shadow-xl hover:scale-105">
                  Start Creating — It's Free
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-8 py-4 rounded-xl shadow-lg transition-all hover:shadow-xl hover:scale-105">
                  Go to Dashboard
                </button>
              </Link>
            </SignedIn>
            <p className="text-purple-400 text-sm mt-4">
              Premium hardcover books starting at $44.99
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-16 p-6 text-center text-purple-400 text-sm">
        <p>© 2024 Before Bedtime Adventures. Made with love for families.</p>
      </footer>
    </div>
  );
}
