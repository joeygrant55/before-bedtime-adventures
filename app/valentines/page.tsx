"use client";

import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function ValentinesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Before Bedtime Adventures"
              width={180}
              height={136}
              className="h-10 sm:h-14 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <button className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-medium px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm transition-all">
                  Get Started
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-medium px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm transition-all"
              >
                My Books
              </Link>
            </SignedIn>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="relative px-4 sm:px-6 pt-16 sm:pt-24 pb-16 sm:pb-20 overflow-hidden">
          {/* Subtle floating hearts background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[
              { left: "8%", top: "15%", size: "text-2xl", delay: 0, duration: 6 },
              { left: "85%", top: "10%", size: "text-3xl", delay: 1, duration: 7 },
              { left: "20%", top: "70%", size: "text-xl", delay: 2, duration: 5 },
              { left: "75%", top: "65%", size: "text-2xl", delay: 0.5, duration: 8 },
              { left: "50%", top: "20%", size: "text-lg", delay: 3, duration: 6 },
              { left: "92%", top: "45%", size: "text-xl", delay: 1.5, duration: 7 },
            ].map((heart, i) => (
              <motion.div
                key={i}
                className={`absolute ${heart.size} opacity-[0.08] select-none`}
                style={{ left: heart.left, top: heart.top }}
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: heart.duration,
                  repeat: Infinity,
                  delay: heart.delay,
                  ease: "easeInOut",
                }}
              >
                ❤️
              </motion.div>
            ))}
          </div>

          <div className="max-w-3xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Urgency badge */}
              <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-700 text-sm font-medium px-4 py-2 rounded-full mb-8 border border-rose-100">
                <span>💝</span>
                Order by Feb 12 for Valentine&apos;s delivery
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight px-2">
                The Perfect{" "}
                <span className="bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
                  Valentine&apos;s Gift
                </span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-4 leading-relaxed px-2">
                Turn your favorite family memories into a magical storybook — 
                a keepsake they&apos;ll treasure forever.
              </p>

              <p className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto mb-10 px-2">
                Give the gift of their favorite adventure, turned into a beautifully 
                illustrated Disney-style story.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 mb-6">
                <SignedOut>
                  <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                    <button className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30">
                      💝 Create Your Valentine&apos;s Book
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <button className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30 w-full sm:w-auto">
                      💝 Create Your Valentine&apos;s Book
                    </button>
                  </Link>
                </SignedIn>
              </div>

              <p className="text-gray-400 text-sm">
                Only <span className="font-semibold text-gray-600">$49.99</span> per book · Free to start
              </p>
            </motion.div>
          </div>
        </section>

        {/* Why it's the perfect gift */}
        <section className="px-4 sm:px-6 py-16 sm:py-20 bg-gradient-to-b from-rose-50/50 to-white">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                More than a gift — a memory that lasts
              </h2>
              <p className="text-gray-600 max-w-xl mx-auto">
                While flowers wilt and chocolates disappear, a personalized storybook 
                becomes a family treasure read again and again.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-3 gap-8">
              {[
                {
                  emoji: "📸",
                  title: "Your memories",
                  desc: "Upload your favorite family photos from any adventure — vacations, holidays, everyday moments.",
                },
                {
                  emoji: "✨",
                  title: "Magically illustrated",
                  desc: "AI transforms each photo into a gorgeous Disney-style illustration your kids will love.",
                },
                {
                  emoji: "📖",
                  title: "A story to keep",
                  desc: "A premium 8.5\" hardcover book delivered to your door — the gift that gets read every bedtime.",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-4xl mb-4">{item.emoji}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Emotional testimonial */}
        <section className="px-4 sm:px-6 py-16 sm:py-20">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="text-rose-400 mb-4 text-lg">⭐⭐⭐⭐⭐</div>
              <blockquote className="text-xl sm:text-2xl text-gray-800 font-medium leading-relaxed mb-6 italic">
                &ldquo;My kids flip through their vacation book every single night. 
                The Disney-style illustrations made our ordinary photos magical. 
                This is the only Valentine&apos;s gift I need.&rdquo;
              </blockquote>
              <p className="text-gray-500">
                <span className="font-semibold text-gray-700">Sarah M.</span> · Seattle, WA
              </p>
            </motion.div>
          </div>
        </section>

        {/* Valentine's CTA / Pricing */}
        <section className="px-4 sm:px-6 py-16 sm:py-20 bg-gradient-to-b from-white to-rose-50/30">
          <div className="max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-lg shadow-rose-500/5 border border-rose-100 p-8 text-center"
            >
              <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-600 text-sm font-medium px-3 py-1 rounded-full mb-6">
                <span>💝</span> Valentine&apos;s Special
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Premium Hardcover Storybook
              </h2>
              <p className="text-gray-500 mb-6 text-sm">
                The gift that gets read every bedtime
              </p>

              <div className="mb-8">
                <span className="text-5xl font-bold text-gray-900">$49</span>
                <span className="text-2xl font-bold text-gray-900">.99</span>
                <p className="text-gray-500 text-sm mt-1">+ shipping</p>
              </div>

              <ul className="text-left space-y-3 mb-8">
                {[
                  "Up to 20 AI-illustrated pages",
                  "8.5\" × 8.5\" premium hardcover",
                  "Personalized story from your photos",
                  "Ships in time for Valentine's Day",
                  "100% satisfaction guaranteed",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700 text-sm">
                    <svg
                      className="w-5 h-5 text-rose-500 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <SignedOut>
                <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                  <button className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-rose-500/20">
                    💝 Create Your Valentine&apos;s Book
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard" className="block">
                  <button className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-rose-500/20">
                    💝 Create Your Valentine&apos;s Book
                  </button>
                </Link>
              </SignedIn>

              <p className="text-gray-400 text-xs mt-4">
                Free to start · Pay only when you order
              </p>
            </motion.div>

            {/* Urgency reminder */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mt-8"
            >
              <p className="text-rose-600 font-medium text-sm">
                ⏰ Order by February 12 to guarantee Valentine&apos;s Day delivery
              </p>
            </motion.div>
          </div>
        </section>

        {/* Trust */}
        <section className="px-6 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-gray-600 text-sm">
              Printed & shipped by{" "}
              <a
                href="https://www.lulu.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-rose-600 hover:text-rose-700 font-medium"
              >
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
              <a
                href="mailto:hello@beforebedtimeadventures.com"
                className="hover:text-gray-900 transition-colors"
              >
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
