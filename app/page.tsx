"use client";

import { SignInButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type DemoState = "idle" | "uploading" | "transforming" | "complete";

const BOOK_PRICE = "$49.99";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const demoRef = useRef<HTMLDivElement>(null);

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

    if (file.type === "image/heic" || file.type === "image/heif") {
      setError("HEIC/HEIF format not supported. Please use JPEG or PNG.");
      return;
    }

    setError(null);
    setDemoState("uploading");

    const previewUrl = URL.createObjectURL(file);
    setOriginalImage(previewUrl);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(",")[1];

      setDemoState("transforming");

      try {
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

  const scrollToDemo = () => {
    demoRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <span className="font-semibold text-gray-900 hidden sm:inline">Before Bedtime Adventures</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <button className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">
                  Log in
                </button>
              </SignInButton>
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-all">
                  Get Started
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link 
                href="/dashboard" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-all"
              >
                My Books
              </Link>
            </SignedIn>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
                Turn your photos into{" "}
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  magical storybooks
                </span>
              </h1>

              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                Upload vacation photos, watch AI transform them into Disney-style illustrations, 
                and get a premium hardcover book delivered to your door.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <SignedOut>
                  <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                    <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30">
                      Create Your Book
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30">
                      Create Your Book
                    </button>
                  </Link>
                </SignedIn>
                <button
                  onClick={scrollToDemo}
                  className="px-8 py-4 text-gray-700 font-semibold rounded-xl text-lg transition-all border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                >
                  Try it free
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Demo Section */}
        <section ref={demoRef} className="px-6 py-20 bg-gray-50">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                  See the magic in action
                </h2>
                <p className="text-gray-600">
                  Drop any photo to see it transformed — no account needed
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <AnimatePresence mode="wait">
                  {/* Idle State */}
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
                        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                          dragActive
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-purple-400 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleInputChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-900 font-medium mb-1">
                          Drop your photo here
                        </p>
                        <p className="text-gray-500 text-sm">
                          or click to browse • JPEG, PNG up to 10MB
                        </p>
                      </div>
                      {error && (
                        <p className="text-red-500 text-center mt-4 text-sm">
                          {error}
                        </p>
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
                      className="py-16 text-center"
                    >
                      <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-gray-600">Uploading...</p>
                    </motion.div>
                  )}

                  {/* Transforming State */}
                  {demoState === "transforming" && originalImage && (
                    <motion.div
                      key="transforming"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid md:grid-cols-2 gap-4"
                    >
                      <div className="relative rounded-xl overflow-hidden bg-gray-100">
                        <img
                          src={originalImage}
                          alt="Your photo"
                          className="w-full aspect-square object-cover"
                        />
                        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700">
                          Your Photo
                        </div>
                      </div>

                      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center aspect-square">
                        <div className="text-center p-4">
                          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
                          <p className="text-gray-900 font-medium mb-1">Creating magic...</p>
                          <p className="text-gray-500 text-sm">~15-30 seconds</p>
                        </div>
                        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium text-purple-600">
                          Disney Style
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Complete State */}
                  {demoState === "complete" && originalImage && cartoonImage && (
                    <motion.div
                      key="complete"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <div className="relative rounded-xl overflow-hidden">
                          <img
                            src={originalImage}
                            alt="Your photo"
                            className="w-full aspect-square object-cover"
                          />
                          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700">
                            Your Photo
                          </div>
                        </div>

                        <motion.div
                          initial={{ scale: 0.95 }}
                          animate={{ scale: 1 }}
                          className="relative rounded-xl overflow-hidden ring-2 ring-purple-500 ring-offset-2"
                        >
                          <img
                            src={cartoonImage}
                            alt="Disney style transformation"
                            className="w-full aspect-square object-cover"
                          />
                          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium text-purple-600">
                            ✨ Disney Style
                          </div>
                        </motion.div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <SignedOut>
                          <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                            <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6 py-3 rounded-xl transition-all">
                              Create Your Book →
                            </button>
                          </SignInButton>
                        </SignedOut>
                        <SignedIn>
                          <Link href="/dashboard">
                            <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6 py-3 rounded-xl transition-all">
                              Create Your Book →
                            </button>
                          </Link>
                        </SignedIn>
                        <button
                          onClick={resetDemo}
                          className="px-6 py-3 text-gray-600 font-medium rounded-xl transition-colors hover:bg-gray-100"
                        >
                          Try Another
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <section className="px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-16">
              How it works
            </h2>

            <div className="grid md:grid-cols-3 gap-12">
              {[
                {
                  step: "1",
                  icon: (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ),
                  title: "Upload photos",
                  desc: "Select 10-20 of your favorite vacation or family photos."
                },
                {
                  step: "2",
                  icon: (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  ),
                  title: "AI transforms them",
                  desc: "Watch as each photo becomes a Disney-style illustration."
                },
                {
                  step: "3",
                  icon: (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  ),
                  title: "Get your book",
                  desc: "Receive a premium 8.5\" hardcover in 5-7 days."
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-5">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="px-6 py-20 bg-gray-50">
          <div className="max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center"
            >
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 text-sm font-medium px-3 py-1 rounded-full mb-6">
                <span>✨</span> Most Popular
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 mb-2">Premium Hardcover Book</h2>
              <p className="text-gray-500 mb-6">Everything you need</p>
              
              <div className="mb-8">
                <span className="text-5xl font-bold text-gray-900">$49</span>
                <span className="text-2xl font-bold text-gray-900">.99</span>
                <p className="text-gray-500 text-sm mt-1">+ shipping</p>
              </div>

              <ul className="text-left space-y-3 mb-8">
                {[
                  "Up to 20 AI-transformed pages",
                  "8.5\" × 8.5\" premium hardcover",
                  "Ships worldwide in 5-7 days",
                  "100% satisfaction guaranteed"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <SignedOut>
                <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                  <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-4 rounded-xl transition-all">
                    Get Started
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard" className="block">
                  <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-4 rounded-xl transition-all">
                    Get Started
                  </button>
                </Link>
              </SignedIn>
              
              <p className="text-gray-400 text-sm mt-4">
                Free to start • Pay when you order
              </p>
            </motion.div>
          </div>
        </section>

        {/* Trust */}
        <section className="px-6 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-gray-500 mb-3 text-sm uppercase tracking-wide font-medium">
              Trusted printing partner
            </p>
            <p className="text-gray-600">
              Printed & shipped by{" "}
              <a href="https://www.lulu.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700 font-medium">
                Lulu
              </a>
              {" "}— millions of books delivered worldwide
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <span>📚</span>
              <span>© {new Date().getFullYear()} Before Bedtime Adventures</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="mailto:hello@beforebedtimeadventures.com" className="hover:text-gray-900 transition-colors">
                Contact
              </a>
              <Link href="/privacy" className="hover:text-gray-900 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-gray-900 transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
