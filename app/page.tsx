"use client";

import { SignInButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type DemoState = "idle" | "uploading" | "transforming" | "complete";

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

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
    document.getElementById("demo-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[150px]" />
      </div>

      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Before Bedtime Adventures"
              width={200}
              height={151}
              className="h-10 w-auto"
            />
          </div>
          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <button className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold text-sm transition-all shadow-lg shadow-amber-500/25 hover:scale-105">
                  Get Started
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <button className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold text-sm transition-all shadow-lg shadow-amber-500/25 hover:scale-105">
                  My Books
                </button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10">
        {/* ============================================= */}
        {/* HERO SECTION */}
        {/* ============================================= */}
        <section className="min-h-screen flex items-center justify-center pt-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Sparkle badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm mb-6"
              >
                <span className="text-lg">✨</span>
                <span>AI-Powered Magic for Your Family Photos</span>
                <span className="text-lg">✨</span>
              </motion.div>

              {/* Main headline */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Turn Your Memories Into
                <span className="block bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  Magical Storybooks
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-purple-200 max-w-2xl mx-auto mb-8">
                Upload your family photos and watch as AI transforms them into enchanting 
                Disney-style illustrations. Create a premium hardcover book your children 
                will treasure forever.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <SignedOut>
                  <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                    <button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:scale-105 text-lg">
                      🎨 Create Your Book
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:scale-105 text-lg">
                      🎨 Create Your Book
                    </button>
                  </Link>
                </SignedIn>
                <button
                  onClick={scrollToDemo}
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all border border-white/20 hover:border-white/40"
                >
                  Try It Free →
                </button>
              </div>

              {/* Hero Image - Book Mockup */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="relative max-w-4xl mx-auto"
              >
                <div className="relative bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl p-8 border border-white/10 backdrop-blur-sm">
                  {/* Floating book mockup representation */}
                  <div className="grid md:grid-cols-2 gap-6 items-center">
                    {/* Before */}
                    <div className="relative">
                      <div className="aspect-square rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 flex items-center justify-center text-6xl">
                          📸
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                          <p className="text-white/80 text-sm">Your family photo</p>
                        </div>
                      </div>
                    </div>
                    {/* Arrow */}
                    <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                      <motion.div
                        animate={{ x: [0, 10, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="bg-amber-500 text-white p-4 rounded-full shadow-lg shadow-amber-500/50"
                      >
                        <span className="text-2xl">✨</span>
                      </motion.div>
                    </div>
                    {/* After */}
                    <div className="relative">
                      <div className="aspect-square rounded-2xl bg-gradient-to-br from-purple-600/40 to-pink-600/40 overflow-hidden shadow-2xl ring-4 ring-purple-500/30">
                        <div className="absolute inset-0 flex items-center justify-center text-6xl">
                          🎨
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                          <p className="text-purple-300 text-sm">Disney-style magic</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ============================================= */}
        {/* HOW IT WORKS SECTION */}
        {/* ============================================= */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                How It Works
              </h2>
              <p className="text-purple-300 text-lg max-w-2xl mx-auto">
                Create your magical storybook in three simple steps
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  emoji: "📸",
                  title: "Upload Your Photos",
                  description: "Select 10-20 of your favorite family photos. Vacation snapshots, birthday moments, or everyday adventures.",
                  color: "from-blue-500 to-cyan-500"
                },
                {
                  step: "2",
                  emoji: "✨",
                  title: "AI Creates Magic",
                  description: "Watch as our AI transforms each photo into a beautiful Disney/Pixar-style cartoon illustration in seconds.",
                  color: "from-purple-500 to-pink-500"
                },
                {
                  step: "3",
                  emoji: "📚",
                  title: "Get Your Book",
                  description: "Order your premium 8.5\" x 8.5\" hardcover book. Ships worldwide in 5-7 business days. Only $49.99!",
                  color: "from-amber-500 to-orange-500"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15, duration: 0.5 }}
                  className="relative"
                >
                  {/* Connector line */}
                  {index < 2 && (
                    <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-white/20 to-transparent" />
                  )}
                  
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 text-center hover:bg-white/10 transition-all group hover:scale-105 h-full">
                    {/* Step number */}
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r ${item.color} text-white font-bold text-lg mb-4 shadow-lg`}>
                      {item.step}
                    </div>
                    
                    {/* Icon */}
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                      {item.emoji}
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                    <p className="text-purple-300">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================= */}
        {/* INTERACTIVE DEMO SECTION */}
        {/* ============================================= */}
        <section id="demo-section" className="py-24 px-4 bg-white/5">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-3xl p-6 md:p-10 border border-white/10 shadow-2xl">
                <div className="text-center mb-8">
                  <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">
                    See the Magic in Action ✨
                  </h2>
                  <p className="text-purple-300 text-lg">
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
                        <div className="text-6xl mb-4">📸</div>
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

                  {/* Complete State */}
                  {demoState === "complete" && originalImage && cartoonImage && (
                    <motion.div
                      key="complete"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="grid md:grid-cols-2 gap-6 mb-8">
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
          </div>
        </section>

        {/* ============================================= */}
        {/* FEATURES SECTION */}
        {/* ============================================= */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Why Families Love Us
              </h2>
              <p className="text-purple-300 text-lg max-w-2xl mx-auto">
                Premium quality meets AI-powered magic
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: "🎨",
                  title: "Disney/Pixar Style",
                  description: "Our AI creates stunning cartoon illustrations inspired by your favorite animated films."
                },
                {
                  icon: "📖",
                  title: "Premium Hardcover",
                  description: "8.5\" × 8.5\" professional-quality hardcover with thick, glossy pages built to last."
                },
                {
                  icon: "🤖",
                  title: "AI Story Suggestions",
                  description: "Get AI-written story text suggestions to accompany each illustration."
                },
                {
                  icon: "🌍",
                  title: "Ships Worldwide",
                  description: "Printed and shipped via Lulu to anywhere in the world in 5-7 business days."
                },
                {
                  icon: "⚡",
                  title: "Quick & Easy",
                  description: "Upload photos, customize, and order in under 15 minutes. No design skills needed."
                },
                {
                  icon: "👨‍👩‍👧‍👦",
                  title: "Family Keepsake",
                  description: "Create a treasure your children will read again and again for years to come."
                },
                {
                  icon: "🔒",
                  title: "Private & Secure",
                  description: "Your photos are processed securely and never shared with third parties."
                },
                {
                  icon: "💝",
                  title: "Perfect Gift",
                  description: "The ultimate personalized gift for birthdays, holidays, or just because."
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group"
                >
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-purple-300 text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================= */}
        {/* TESTIMONIALS SECTION */}
        {/* ============================================= */}
        <section className="py-24 px-4 bg-white/5">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                What Parents Are Saying
              </h2>
              <p className="text-purple-300 text-lg">
                Join thousands of families creating magical memories
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {[
                {
                  quote: "My kids ask to read their adventure book every single night. Seeing themselves as cartoon characters absolutely delighted them!",
                  author: "Sarah M.",
                  location: "California",
                  avatar: "👩"
                },
                {
                  quote: "We gave this to grandma for Christmas and she cried happy tears. The quality is amazing and the illustrations are beautiful.",
                  author: "Michael T.",
                  location: "Texas",
                  avatar: "👨"
                },
                {
                  quote: "I was skeptical about the AI, but the results blew me away. It captured our family perfectly in that Disney style!",
                  author: "Jennifer L.",
                  location: "New York",
                  avatar: "👩‍🦰"
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
                >
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-amber-400">⭐</span>
                    ))}
                  </div>
                  
                  <p className="text-white/90 mb-6 italic">"{testimonial.quote}"</p>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{testimonial.avatar}</span>
                    <div>
                      <p className="text-white font-semibold">{testimonial.author}</p>
                      <p className="text-purple-400 text-sm">{testimonial.location}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Perfect For Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h3 className="text-2xl font-bold text-white mb-8">Perfect For...</h3>
              <div className="flex flex-wrap justify-center gap-4">
                {[
                  { emoji: "🎂", text: "Birthday Gifts" },
                  { emoji: "🎄", text: "Christmas Presents" },
                  { emoji: "🌴", text: "Vacation Memories" },
                  { emoji: "👴", text: "Grandparents" },
                  { emoji: "🏠", text: "Family Reunions" },
                  { emoji: "✈️", text: "Adventure Books" },
                  { emoji: "🐣", text: "Baby's First Year" },
                  { emoji: "🎓", text: "Milestone Moments" }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="px-5 py-3 bg-white/10 rounded-full border border-white/10 flex items-center gap-2 hover:bg-white/20 transition-colors"
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-white font-medium">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============================================= */}
        {/* PRICING SECTION */}
        {/* ============================================= */}
        <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Simple, Magical Pricing
              </h2>
              <p className="text-purple-300 text-lg">
                One book. One price. Unlimited memories.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-amber-500/30 shadow-2xl shadow-amber-500/10 text-center relative overflow-hidden"
            >
              {/* Popular badge */}
              <div className="absolute top-6 right-6 bg-amber-500 text-white text-sm font-bold px-4 py-1 rounded-full">
                MOST POPULAR
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">Premium Hardcover Book</h3>
              <p className="text-amber-200 mb-6">Everything you need for one magical book</p>
              
              {/* Price */}
              <div className="mb-8">
                <span className="text-6xl md:text-7xl font-bold text-white">$49</span>
                <span className="text-3xl text-white">.99</span>
                <p className="text-purple-300 mt-2">+ shipping</p>
              </div>

              {/* What's included */}
              <div className="grid md:grid-cols-2 gap-4 mb-8 text-left max-w-lg mx-auto">
                {[
                  "Up to 20 AI-transformed pages",
                  "Premium 8.5\" × 8.5\" hardcover",
                  "Thick, glossy pages",
                  "AI story text suggestions",
                  "Custom cover design",
                  "Ships worldwide",
                  "5-7 day delivery",
                  "100% satisfaction guaranteed"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-green-400">✓</span>
                    <span className="text-white/90">{item}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <SignedOut>
                <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                  <button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold px-10 py-5 rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:scale-105 text-lg">
                    Start Creating Your Book
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold px-10 py-5 rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:scale-105 text-lg">
                    Start Creating Your Book
                  </button>
                </Link>
              </SignedIn>

              <p className="text-purple-400 text-sm mt-6">
                Free to start • No credit card required until checkout
              </p>
            </motion.div>
          </div>
        </section>

        {/* ============================================= */}
        {/* FINAL CTA SECTION */}
        {/* ============================================= */}
        <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-purple-600/30 to-pink-600/30 backdrop-blur-sm border border-white/10 rounded-3xl p-8 md:p-16 text-center relative overflow-hidden"
            >
              {/* Background sparkles */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-2xl"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      opacity: [0.2, 0.5, 0.2],
                      scale: [0.8, 1, 0.8],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  >
                    ✨
                  </motion.div>
                ))}
              </div>

              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                  Ready to Create Magic?
                </h2>
                <p className="text-purple-200 text-lg mb-8 max-w-xl mx-auto">
                  Turn your favorite memories into a storybook your family will treasure for generations.
                </p>
                
                <SignedOut>
                  <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                    <button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold px-10 py-5 rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:scale-105 text-lg">
                      🎨 Create Your Book Now
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold px-10 py-5 rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:scale-105 text-lg">
                      🎨 Create Your Book Now
                    </button>
                  </Link>
                </SignedIn>
                
                <p className="text-purple-400 text-sm mt-6">
                  Join thousands of families who&apos;ve created their own magical storybooks
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ============================================= */}
      {/* FOOTER */}
      {/* ============================================= */}
      <footer className="relative z-10 border-t border-white/10 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <Image
                src="/logo.png"
                alt="Before Bedtime Adventures"
                width={200}
                height={151}
                className="h-12 w-auto mb-4"
              />
              <p className="text-purple-300 mb-4 max-w-sm">
                Turn your family photos into magical storybooks with AI-powered illustrations. 
                Create memories that last forever.
              </p>
              <p className="text-purple-400 text-sm">
                Made with ❤️ for families everywhere
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <SignedOut>
                    <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                      <button className="text-purple-300 hover:text-white transition-colors text-left">
                        Sign In
                      </button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <Link href="/dashboard" className="text-purple-300 hover:text-white transition-colors">
                      Dashboard
                    </Link>
                  </SignedIn>
                </li>
                <li>
                  <button onClick={scrollToDemo} className="text-purple-300 hover:text-white transition-colors">
                    Try Demo
                  </button>
                </li>
                <li>
                  <Link href="#" className="text-purple-300 hover:text-white transition-colors">
                    How It Works
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-purple-300 hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-purple-300 hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <a href="mailto:hello@beforebedtimeadventures.com" className="text-purple-300 hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-purple-400 text-sm">
              © {new Date().getFullYear()} Before Bedtime Adventures. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-purple-400 text-sm">
              <span>Printed with love by</span>
              <a href="https://www.lulu.com" target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-white transition-colors underline">
                Lulu
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
