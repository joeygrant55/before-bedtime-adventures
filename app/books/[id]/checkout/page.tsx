"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

type ImageWithUrls = Doc<"images"> & {
  originalUrl: string | null;
  cartoonUrl: string | null;
};

type PageWithImages = Doc<"pages"> & {
  images: ImageWithUrls[];
};

interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

const BOOK_PRICE = 4499; // $44.99 in cents

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const bookId = id as Id<"books">;
  const router = useRouter();

  const book = useQuery(api.books.getBook, { bookId });
  const pages = useQuery(api.pages.getBookPages, { bookId });
  const createOrder = useMutation(api.orders.createOrder);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<ShippingAddress>({
    name: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
  });

  // Loading state
  if (!book || !pages) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full" />
            <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="text-purple-300">Loading checkout...</p>
        </div>
      </div>
    );
  }

  // Get preview image (first completed cartoon)
  const previewImage = pages
    .flatMap((p: PageWithImages) => p.images)
    .find((img) => img?.cartoonUrl)?.cartoonUrl;

  const handleInputChange = (field: keyof ShippingAddress, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!address.name.trim()) {
      setError("Please enter your full name");
      return false;
    }
    if (!address.street.trim()) {
      setError("Please enter your street address");
      return false;
    }
    if (!address.city.trim()) {
      setError("Please enter your city");
      return false;
    }
    if (!address.state.trim()) {
      setError("Please enter your state");
      return false;
    }
    if (!address.zipCode.trim()) {
      setError("Please enter your ZIP code");
      return false;
    }
    return true;
  };

  const handleCheckout = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Create order in database
      const orderId = await createOrder({
        bookId,
        shippingAddress: address,
        price: BOOK_PRICE,
      });

      // Create Stripe checkout session
      const response = await fetch("/api/stripe/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          orderId,
          bookTitle: book.title,
          price: BOOK_PRICE,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Ambient effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href={`/books/${bookId}/preview`}
            className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Preview
          </Link>
          <div className="flex items-center gap-2 text-green-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-sm font-medium">Secure Checkout</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>

              {/* Book Preview */}
              <div className="flex gap-4 mb-6">
                <div className="w-24 h-32 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg shadow-lg overflow-hidden flex-shrink-0">
                  {previewImage ? (
                    <img src={previewImage} alt="Book preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-purple-300 text-3xl">
                      📚
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg">{book.title}</h3>
                  <p className="text-purple-300 text-sm mt-1">Hardcover Children's Book</p>
                  <p className="text-purple-400 text-sm">{pages.length} pages</p>
                  <p className="text-purple-400 text-sm">8.5" × 8.5" Premium</p>
                </div>
              </div>

              {/* What's Included */}
              <div className="border-t border-white/10 pt-6 mb-6">
                <h4 className="text-white font-medium mb-3">What's Included</h4>
                <ul className="space-y-2">
                  {[
                    "Premium hardcover binding",
                    "Disney-style AI illustrations",
                    "Your personalized story",
                    "Archival quality paper",
                    "Free standard shipping",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-purple-200 text-sm">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-white/10 pt-6 space-y-3">
                <div className="flex justify-between text-purple-300">
                  <span>Hardcover Book</span>
                  <span>${(BOOK_PRICE / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-purple-300">
                  <span>Shipping</span>
                  <span className="text-green-400">FREE</span>
                </div>
                <div className="flex justify-between text-white text-xl font-bold pt-3 border-t border-white/10">
                  <span>Total</span>
                  <span>${(BOOK_PRICE / 100).toFixed(2)}</span>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📦</span>
                  <div>
                    <p className="text-amber-200 font-medium">Estimated Delivery</p>
                    <p className="text-amber-300/80 text-sm">
                      7-14 business days after payment
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-6 flex items-center justify-center gap-6 text-purple-400 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>Powered by Stripe</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Shipping Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-6">Shipping Address</h2>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-purple-200 text-sm font-medium mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={address.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="John Smith"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Street Address */}
                <div>
                  <label className="block text-purple-200 text-sm font-medium mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={address.street}
                    onChange={(e) => handleInputChange("street", e.target.value)}
                    placeholder="123 Main Street, Apt 4B"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* City & State */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-purple-200 text-sm font-medium mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="New York"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-200 text-sm font-medium mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={address.state}
                      onChange={(e) => handleInputChange("state", e.target.value)}
                      placeholder="NY"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* ZIP & Country */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-purple-200 text-sm font-medium mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={address.zipCode}
                      onChange={(e) => handleInputChange("zipCode", e.target.value)}
                      placeholder="10001"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-200 text-sm font-medium mb-2">
                      Country
                    </label>
                    <select
                      value={address.country}
                      onChange={(e) => handleInputChange("country", e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                    </select>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:shadow-amber-500/40 hover:scale-[1.02] disabled:scale-100 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Pay ${(BOOK_PRICE / 100).toFixed(2)} — Secure Checkout
                    </>
                  )}
                </button>

                {/* Additional Info */}
                <p className="text-center text-purple-400/60 text-xs mt-4">
                  By completing this purchase, you agree to our Terms of Service.
                  <br />
                  Your payment info is handled securely by Stripe.
                </p>
              </div>
            </div>

            {/* Money Back Guarantee */}
            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <p className="text-green-200 font-medium">100% Satisfaction Guarantee</p>
                  <p className="text-green-300/80 text-sm">
                    Not happy with your book? Contact us for a full refund.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
