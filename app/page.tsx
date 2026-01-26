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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <Image
          src="/logo.png"
          alt="Before Bedtime Adventures"
          width={180}
          height={136}
          className="h-12 w-auto"
          priority
        />
        <SignedOut>
          <SignInButton mode="modal" forceRedirectUrl="/dashboard">
            <button className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-all border border-white/20">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <Link href="/dashboard" className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-all border border-white/20">
            My Books
          </Link>
        </SignedIn>
      </nav>

      <main className="relative z-10">
        {/* ============================================= */}
        {/* HERO — Simple & Direct */}
        {/* ============================================= */}
        <section className="px-4 pt-8 pb-16 md:pt-16 md:pb-24">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Turn Family Photos Into{" "}
                <span className="bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  Magical Storybooks
                </span>
              </h1>

              <p className="text-lg md:text-xl text-purple-200 max-w-2xl mx-auto mb-8">
                Upload your vacation photos. Watch AI transform them into Disney-style illustrations. 
                Get a premium hardcover book delivered to your door.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <SignedOut>
                  <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                    <button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:scale-105 text-lg">
                      Create Your Book — {BOOK_PRICE}
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:scale-105 text-lg">
                      Create Your Book — {BOOK_PRICE}
                    </button>
                  </Link>
                </SignedIn>
                <button
                  onClick={scrollToDemo}
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all border border-white/20"
                >
                  Try It Free ↓
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============================================= */}
        {/* DEMO — The Star of the Show */}
        {/* ============================================= */}
        <section ref={demoRef} className="px-4 py-16 bg-white/5">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  See the Magic ✨
                </h2>
                <p className="text-purple-300">
                  Drop any photo to see it transformed — no account needed
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
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
                            ? "border-amber-400 bg-amber-500/10"
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
                        <p className="text-white font-semibold mb-1">
                          Drop your photo here
                        </p>
                        <p className="text-purple-400 text-sm">
                          or click to browse • JPEG, PNG up to 10MB
                        </p>
                      </div>
                      {error && (
                        <p className="text-red-400 text-center mt-4 text-sm">
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
                      <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full" />
                        <div className="absolute inset-0 border-4 border-amber-400 rounded-full border-t-transparent animate-spin" />
                      </div>
                      <p className="text-white">Uploading...</p>
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
                      <div className="relative rounded-xl overflow-hidden bg-black/20">
                        <img
                          src={originalImage}
                          alt="Your photo"
                          className="w-full aspect-square object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                          <p className="text-white text-sm font-medium">Your Photo</p>
                        </div>
                      </div>

                      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center aspect-square">
                        <div className="text-center p-4">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="text-5xl mb-3"
                          >
                            ✨
                          </motion.div>
                          <p className="text-white font-medium mb-1">Creating Magic...</p>
                          <p className="text-purple-300 text-sm">~15-30 seconds</p>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                          <p className="text-purple-300 text-sm font-medium">Disney Style</p>
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
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                            <p className="text-white text-sm font-medium">Your Photo</p>
                          </div>
                        </div>

                        <motion.div
                          initial={{ scale: 0.95 }}
                          animate={{ scale: 1 }}
                          className="relative rounded-xl overflow-hidden ring-2 ring-amber-400/50"
                        >
                          <img
                            src={cartoonImage}
                            alt="Disney style transformation"
                            className="w-full aspect-square object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                            <p className="text-amber-300 text-sm font-medium flex items-center gap-1">
                              ✨ Disney Style
                            </p>
                          </div>
                        </motion.div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <SignedOut>
                          <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                            <button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all hover:scale-105">
                              Create Your Book →
                            </button>
                          </SignInButton>
                        </SignedOut>
                        <SignedIn>
                          <Link href="/dashboard">
                            <button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all hover:scale-105">
                              Create Your Book →
                            </button>
                          </Link>
                        </SignedIn>
                        <button
                          onClick={resetDemo}
                          className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
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

        {/* ============================================= */}
        {/* HOW IT WORKS — 3 Simple Steps */}
        {/* ============================================= */}
        <section className="px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
              How It Works
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  step: "1",
                  emoji: "📸",
                  title: "Upload Photos",
                  desc: "Select 10-20 of your favorite vacation or family photos."
                },
                {
                  step: "2", 
                  emoji: "✨",
                  title: "AI Magic",
                  desc: "Watch as AI transforms each photo into Disney-style illustrations."
                },
                {
                  step: "3",
                  emoji: "📚",
                  title: "Get Your Book",
                  desc: "Receive a premium 8.5\" hardcover book in 5-7 days."
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <div className="text-4xl mb-3">{item.emoji}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-purple-300 text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================= */}
        {/* PRICING — Simple Card */}
        {/* ============================================= */}
        <section className="px-4 py-16 bg-white/5">
          <div className="max-w-lg mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-8 text-center"
            >
              <h2 className="text-2xl font-bold text-white mb-2">Premium Hardcover Book</h2>
              <p className="text-amber-200 mb-6">Everything included</p>
              
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">$49</span>
                <span className="text-2xl text-white">.99</span>
                <p className="text-purple-300 text-sm mt-1">+ shipping</p>
              </div>

              <ul className="text-left text-white/90 space-y-2 mb-8 max-w-xs mx-auto">
                {[
                  "Up to 20 AI-transformed pages",
                  "8.5\" × 8.5\" premium hardcover",
                  "Ships worldwide in 5-7 days",
                  "100% satisfaction guaranteed"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-green-400">✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              <SignedOut>
                <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                  <button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold px-8 py-4 rounded-xl shadow-lg transition-all hover:scale-105">
                    Start Creating
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard" className="block">
                  <button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold px-8 py-4 rounded-xl shadow-lg transition-all hover:scale-105">
                    Start Creating
                  </button>
                </Link>
              </SignedIn>
              
              <p className="text-purple-400 text-xs mt-4">
                Free to start • No credit card until checkout
              </p>
            </motion.div>
          </div>
        </section>

        {/* ============================================= */}
        {/* TRUST — Simple Footer Note */}
        {/* ============================================= */}
        <section className="px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-purple-300 mb-4">
              Trusted printing partner
            </p>
            <div className="flex items-center justify-center gap-2 text-white/60">
              <span className="text-2xl">📚</span>
              <span>Printed & shipped by <a href="https://www.lulu.com" target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-white underline">Lulu</a> — millions of books delivered worldwide</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <Image
                src="/logo.png"
                alt="Before Bedtime Adventures"
                width={120}
                height={90}
                className="h-8 w-auto opacity-70"
              />
              <p className="text-purple-400 text-sm">
                Made with ❤️ for families
              </p>
            </div>
            <div className="flex items-center gap-6 text-sm text-purple-400">
              <a href="mailto:hello@beforebedtimeadventures.com" className="hover:text-white transition-colors">
                Contact
              </a>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
            </div>
          </div>
          <p className="text-center text-purple-500 text-xs mt-6">
            © {new Date().getFullYear()} Before Bedtime Adventures. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
