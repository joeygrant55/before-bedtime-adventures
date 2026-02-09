"use client";

import { use, useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { US_STATES } from "@/lib/printSpecs";
import { useToast } from "@/components/ui/Toast";
import { trackCheckoutStarted, trackCheckoutAddressEntered, trackOrderCreated } from "@/lib/analytics";
import { FullPageSkeleton, CheckoutFormSkeleton, InlineSpinner } from "@/components/ui/Skeleton";
import { ErrorBoundary, ApiError, FieldError } from "@/components/ui/ErrorBoundary";
import { BookNotFoundEmpty } from "@/components/ui/EmptyStates";

type ImageWithUrls = Doc<"images"> & {
  originalUrl: string | null;
  cartoonUrl: string | null;
};

type PageWithImages = Doc<"pages"> & {
  images: ImageWithUrls[];
};

interface ShippingAddress {
  name: string;
  street1: string;
  street2: string;
  city: string;
  stateCode: string;
  postalCode: string;
  phoneNumber: string;
}

interface FormErrors {
  name?: string;
  street1?: string;
  city?: string;
  stateCode?: string;
  postalCode?: string;
  phoneNumber?: string;
  email?: string;
}

const BOOK_PRICE = 4999; // $49.99 in cents

// US state options for dropdown
const STATE_OPTIONS = Object.entries(US_STATES).map(([code, name]) => ({
  code,
  name,
}));

function CheckoutContent({ bookId }: { bookId: Id<"books"> }) {
  const router = useRouter();
  const { user } = useUser();
  const { success, error: showError } = useToast();

  const book = useQuery(api.books.getBook, { bookId });
  const pages = useQuery(api.pages.getBookPages, { bookId });
  const createOrder = useMutation(api.orders.createOrder);

  const [isProcessing, setIsProcessing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [address, setAddress] = useState<ShippingAddress>({
    name: "",
    street1: "",
    street2: "",
    city: "",
    stateCode: "",
    postalCode: "",
    phoneNumber: "",
  });

  // Get user email for order
  const userEmail = user?.primaryEmailAddress?.emailAddress || "";

  // Pre-fill name from user profile
  useEffect(() => {
    if (user?.fullName && !address.name) {
      setAddress(prev => ({ ...prev, name: user.fullName || "" }));
    }
  }, [user?.fullName, address.name]);

  // Track checkout started when page loads
  useEffect(() => {
    if (book) {
      trackCheckoutStarted(bookId, BOOK_PRICE);
    }
  }, [book, bookId]);

  // Validate a single field
  const validateField = useCallback((field: keyof ShippingAddress, value: string): string | undefined => {
    switch (field) {
      case "name":
        if (!value.trim()) return "Full name is required";
        if (value.trim().length < 2) return "Name must be at least 2 characters";
        break;
      case "street1":
        if (!value.trim()) return "Street address is required";
        break;
      case "city":
        if (!value.trim()) return "City is required";
        break;
      case "stateCode":
        if (!value) return "Please select a state";
        break;
      case "postalCode":
        if (!value.trim()) return "ZIP code is required";
        if (!/^\d{5}(-\d{4})?$/.test(value.trim())) return "Enter a valid ZIP code (e.g., 10001)";
        break;
      case "phoneNumber":
        const digits = value.replace(/\D/g, "");
        if (!value.trim()) return "Phone number is required for shipping";
        if (digits.length < 10) return "Enter a valid 10-digit phone number";
        break;
    }
    return undefined;
  }, []);

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {};
    
    (Object.keys(address) as (keyof ShippingAddress)[]).forEach(field => {
      if (field === "street2") return; // Optional
      const error = validateField(field, address[field]);
      if (error) errors[field] = error;
    });

    if (!userEmail) {
      errors.email = "Please sign in to complete your order";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [address, userEmail, validateField]);

  const handleInputChange = (field: keyof ShippingAddress, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    setSubmitError(null);
    
    // Validate on change if already touched
    if (touched[field]) {
      const error = validateField(field, value);
      setFormErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field: keyof ShippingAddress) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, address[field]);
    setFormErrors(prev => ({ ...prev, [field]: error }));
  };

  const formatPhoneNumber = (value: string): string => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    handleInputChange("phoneNumber", formatted);
  };

  const handleReviewAddress = () => {
    // Mark all fields as touched
    setTouched({
      name: true,
      street1: true,
      city: true,
      stateCode: true,
      postalCode: true,
      phoneNumber: true,
    });

    if (!validateForm()) {
      showError("Please fix the errors in the form");
      return;
    }

    // Show confirmation screen
    setShowConfirmation(true);
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    setSubmitError(null);

    try {
      // Track checkout address entered
      trackCheckoutAddressEntered(bookId);

      // Create order in database with new schema
      if (!user) {
        throw new Error("You must be signed in to place an order");
      }

      const orderId = await createOrder({
        clerkId: user.id,
        bookId,
        shippingAddress: {
          name: address.name.trim(),
          street1: address.street1.trim(),
          street2: address.street2.trim() || undefined,
          city: address.city.trim(),
          stateCode: address.stateCode,
          postalCode: address.postalCode.trim(),
          phoneNumber: address.phoneNumber.replace(/\D/g, ""), // Send digits only
        },
        contactEmail: userEmail,
        price: BOOK_PRICE,
      });

      // Track order creation
      trackOrderCreated(orderId, bookId, BOOK_PRICE);

      // Create Stripe checkout session
      const response = await fetch("/api/stripe/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          orderId,
          bookTitle: book?.title || "Storybook",
          price: BOOK_PRICE,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      success("Redirecting to secure payment...");
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setSubmitError(message);
      showError(message);
      setIsProcessing(false);
    }
  };

  // Loading state
  if (!book || !pages) {
    return <FullPageSkeleton message="Loading checkout..." />;
  }

  // Book not found
  if (book === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <BookNotFoundEmpty />
      </div>
    );
  }

  // Get preview image (first completed cartoon)
  const previewImage = pages
    .flatMap((p: PageWithImages) => p.images)
    .find((img) => img?.cartoonUrl)?.cartoonUrl;

  // Calculate printed page count
  const stopCount = book.pageCount;
  const storyPages = stopCount * 2;
  const frontMatter = stopCount <= 9 ? 4 : 2;
  const backMatter = stopCount <= 9 ? 4 : 2;
  const printedPageCount = Math.max(24, frontMatter + storyPages + backMatter);

  const hasErrors = Object.keys(formErrors).some(key => formErrors[key as keyof FormErrors]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Ambient effects */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href={`/books/${bookId}/edit`}
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Edit</span>
          </Link>
          <div className="flex items-center gap-2 text-green-400" aria-label="Secure checkout">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
            <div className="bg-white shadow-sm rounded-2xl p-6 md:p-8 border border-gray-200">
              <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>

              {/* Book Preview */}
              <div className="flex gap-4 mb-6">
                <div className="w-24 h-32 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg shadow-lg overflow-hidden flex-shrink-0">
                  {previewImage ? (
                    <img 
                      src={previewImage} 
                      alt={`Preview of ${book.title}`} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-3xl" aria-hidden="true">
                      📚
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg">{book.title}</h3>
                  <p className="text-gray-500 text-sm mt-1">Premium Hardcover</p>
                  <p className="text-gray-400 text-sm">{printedPageCount} pages, full color</p>
                  <p className="text-gray-400 text-sm">8.5" × 8.5" Square</p>
                </div>
              </div>

              {/* What's Included */}
              <div className="border-t border-gray-200 pt-6 mb-6">
                <h4 className="text-white font-medium mb-3">What's Included</h4>
                <ul className="space-y-2" aria-label="Order includes">
                  {[
                    "Premium hardcover binding",
                    "Disney-style AI illustrations",
                    "Your personalized story",
                    "Archival quality paper",
                    "Free shipping (US)",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-600 text-sm">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-gray-200 pt-6 space-y-3">
                <div className="flex justify-between text-gray-500">
                  <span>Hardcover Book</span>
                  <span>${(BOOK_PRICE / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Shipping (Ground)</span>
                  <span className="text-green-400">FREE</span>
                </div>
                <div className="flex justify-between text-white text-xl font-bold pt-3 border-t border-gray-200">
                  <span>Total</span>
                  <span>${(BOOK_PRICE / 100).toFixed(2)}</span>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden="true">📦</span>
                  <div>
                    <p className="text-amber-200 font-medium">Estimated Delivery</p>
                    <p className="text-amber-300/80 text-sm">
                      10-14 business days (3-5 days production + 7-9 days shipping)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-6 flex items-center justify-center gap-6 text-gray-400 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>Powered by Stripe</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Shipping Form or Confirmation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {!showConfirmation ? (
              <form 
                onSubmit={(e) => { e.preventDefault(); handleReviewAddress(); }}
                className="bg-white shadow-sm rounded-2xl p-6 md:p-8 border border-gray-200"
                noValidate
              >
                <h2 className="text-xl font-bold text-white mb-2">Shipping Address</h2>
                <p className="text-gray-500/60 text-sm mb-6">US addresses only</p>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="name" className="block text-gray-600 text-sm font-medium mb-2">
                    Full Name <span className="text-red-400" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={address.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    onBlur={() => handleBlur("name")}
                    placeholder="John Smith"
                    autoComplete="name"
                    aria-required="true"
                    aria-invalid={!!formErrors.name}
                    aria-describedby={formErrors.name ? "name-error" : undefined}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                      formErrors.name ? "border-red-500/50" : "border-gray-200"
                    }`}
                  />
                  <FieldError error={formErrors.name} id="name-error" />
                </div>

                {/* Street Address */}
                <div>
                  <label htmlFor="street1" className="block text-gray-600 text-sm font-medium mb-2">
                    Street Address <span className="text-red-400" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="street1"
                    type="text"
                    value={address.street1}
                    onChange={(e) => handleInputChange("street1", e.target.value)}
                    onBlur={() => handleBlur("street1")}
                    placeholder="123 Main Street"
                    autoComplete="address-line1"
                    aria-required="true"
                    aria-invalid={!!formErrors.street1}
                    aria-describedby={formErrors.street1 ? "street1-error" : undefined}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                      formErrors.street1 ? "border-red-500/50" : "border-gray-200"
                    }`}
                  />
                  <FieldError error={formErrors.street1} id="street1-error" />
                </div>

                {/* Apartment/Suite */}
                <div>
                  <label htmlFor="street2" className="block text-gray-600 text-sm font-medium mb-2">
                    Apartment, Suite, etc. <span className="text-gray-400/60">(optional)</span>
                  </label>
                  <input
                    id="street2"
                    type="text"
                    value={address.street2}
                    onChange={(e) => handleInputChange("street2", e.target.value)}
                    placeholder="Apt 4B"
                    autoComplete="address-line2"
                    className="w-full px-4 py-3 bg-white/5 border border-gray-200 rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* City & State */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-gray-600 text-sm font-medium mb-2">
                      City <span className="text-red-400" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="city"
                      type="text"
                      value={address.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      onBlur={() => handleBlur("city")}
                      placeholder="New York"
                      autoComplete="address-level2"
                      aria-required="true"
                      aria-invalid={!!formErrors.city}
                      aria-describedby={formErrors.city ? "city-error" : undefined}
                      className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                        formErrors.city ? "border-red-500/50" : "border-gray-200"
                      }`}
                    />
                    <FieldError error={formErrors.city} id="city-error" />
                  </div>
                  <div>
                    <label htmlFor="stateCode" className="block text-gray-600 text-sm font-medium mb-2">
                      State <span className="text-red-400" aria-hidden="true">*</span>
                    </label>
                    <select
                      id="stateCode"
                      value={address.stateCode}
                      onChange={(e) => handleInputChange("stateCode", e.target.value)}
                      onBlur={() => handleBlur("stateCode")}
                      autoComplete="address-level1"
                      aria-required="true"
                      aria-invalid={!!formErrors.stateCode}
                      aria-describedby={formErrors.stateCode ? "state-error" : undefined}
                      className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                        formErrors.stateCode ? "border-red-500/50" : "border-gray-200"
                      }`}
                    >
                      <option value="">Select state</option>
                      {STATE_OPTIONS.map((state) => (
                        <option key={state.code} value={state.code}>
                          {state.code} - {state.name}
                        </option>
                      ))}
                    </select>
                    <FieldError error={formErrors.stateCode} id="state-error" />
                  </div>
                </div>

                {/* ZIP Code */}
                <div>
                  <label htmlFor="postalCode" className="block text-gray-600 text-sm font-medium mb-2">
                    ZIP Code <span className="text-red-400" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="postalCode"
                    type="text"
                    inputMode="numeric"
                    value={address.postalCode}
                    onChange={(e) => handleInputChange("postalCode", e.target.value)}
                    onBlur={() => handleBlur("postalCode")}
                    placeholder="10001"
                    maxLength={10}
                    autoComplete="postal-code"
                    aria-required="true"
                    aria-invalid={!!formErrors.postalCode}
                    aria-describedby={formErrors.postalCode ? "zip-error" : undefined}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                      formErrors.postalCode ? "border-red-500/50" : "border-gray-200"
                    }`}
                  />
                  <FieldError error={formErrors.postalCode} id="zip-error" />
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phoneNumber" className="block text-gray-600 text-sm font-medium mb-2">
                    Phone Number <span className="text-red-400" aria-hidden="true">*</span>
                    <span className="text-gray-400/60 font-normal ml-2">(for delivery updates)</span>
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    inputMode="tel"
                    value={address.phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={() => handleBlur("phoneNumber")}
                    placeholder="(555) 123-4567"
                    autoComplete="tel"
                    aria-required="true"
                    aria-invalid={!!formErrors.phoneNumber}
                    aria-describedby={formErrors.phoneNumber ? "phone-error" : undefined}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                      formErrors.phoneNumber ? "border-red-500/50" : "border-gray-200"
                    }`}
                  />
                  <FieldError error={formErrors.phoneNumber} id="phone-error" />
                </div>

                {/* Contact Email (read-only) */}
                <div>
                  <label htmlFor="email" className="block text-gray-600 text-sm font-medium mb-2">
                    Contact Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={userEmail}
                    disabled
                    aria-describedby="email-hint"
                    className="w-full px-4 py-3 bg-white/5 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                  />
                  <p id="email-hint" className="text-gray-400/60 text-xs mt-1">Order updates will be sent to this email</p>
                  <FieldError error={formErrors.email} />
                </div>

                {/* Submit Error */}
                <AnimatePresence>
                  {submitError && (
                    <ApiError 
                      error={submitError} 
                      onRetry={() => {
                        setSubmitError(null);
                        handleCheckout();
                      }} 
                    />
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  aria-busy={isProcessing}
                  className="w-full mt-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Review Order</span>
                </button>

                {/* Additional Info */}
                <p className="text-center text-gray-400/60 text-xs mt-4">
                  You'll be able to review your address before paying
                </p>
              </div>
            </form>
            ) : (
              /* Confirmation View */
              <div className="bg-white shadow-sm rounded-2xl p-6 md:p-8 border border-gray-200">
                <h2 className="text-xl font-bold text-white mb-2">Review Your Order</h2>
                <p className="text-gray-500/60 text-sm mb-6">Please confirm your shipping address</p>

                {/* Address Summary */}
                <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-gray-700 font-semibold mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Shipping To
                      </h3>
                      <div className="space-y-1 text-gray-700">
                        <p className="font-medium">{address.name}</p>
                        <p>{address.street1}</p>
                        {address.street2 && <p>{address.street2}</p>}
                        <p>{address.city}, {address.stateCode} {address.postalCode}</p>
                        <p className="text-gray-500 text-sm mt-2">{address.phoneNumber}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowConfirmation(false)}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-start gap-2 text-gray-600 text-sm">
                      <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-700">Contact Email</p>
                        <p>{userEmail}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Error */}
                <AnimatePresence>
                  {submitError && (
                    <ApiError 
                      error={submitError} 
                      onRetry={() => {
                        setSubmitError(null);
                        handleCheckout();
                      }} 
                    />
                  )}
                </AnimatePresence>

                {/* Payment Button */}
                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  aria-busy={isProcessing}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:shadow-amber-500/40 hover:scale-[1.02] disabled:scale-100 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                  {isProcessing ? (
                    <>
                      <InlineSpinner className="text-white" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Confirm & Pay ${(BOOK_PRICE / 100).toFixed(2)}</span>
                    </>
                  )}
                </button>

                {/* Additional Info */}
                <p className="text-center text-gray-400/60 text-xs mt-4">
                  By completing this purchase, you agree to our Terms of Service.
                  <br />
                  Your payment info is handled securely by Stripe.
                </p>
              </div>
            )}

            {/* Trust Badges */}
            <div className="mt-6 space-y-3">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden="true">✨</span>
                  <div>
                    <p className="text-green-200 font-medium">100% Satisfaction Guarantee</p>
                    <p className="text-green-300/80 text-sm">
                      Not happy with your book? Contact us for a full refund.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center gap-1.5 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-xs text-gray-400 text-center">Secure Checkout</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  <span className="text-xs text-gray-400 text-center">Premium Quality</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="text-xs text-gray-400 text-center">Lulu Printed</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const bookId = id as Id<"books">;

  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">😵</div>
            <h2 className="text-xl font-bold text-white mb-2">Checkout Error</h2>
            <p className="text-gray-500 mb-6">Something went wrong with the checkout process.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors"
              >
                Try Again
              </button>
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      }
    >
      <CheckoutContent bookId={bookId} />
    </ErrorBoundary>
  );
}
