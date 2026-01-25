"use client";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackFunnelStep } from "@/lib/analytics";

/**
 * Analytics Provider Component
 * 
 * Wraps the app with Vercel Analytics and Speed Insights.
 * Also handles automatic page view tracking and funnel detection.
 * 
 * GDPR Compliance:
 * - Vercel Analytics does NOT use cookies by default
 * - Uses privacy-friendly hashing for visitor identification
 * - No personal data is collected without explicit consent
 * - Complies with GDPR, CCPA, and other privacy regulations
 */

// Inner component that uses useSearchParams (must be wrapped in Suspense)
function FunnelTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track funnel progress based on page visits
  useEffect(() => {
    // Auto-detect funnel steps based on URL patterns
    if (pathname === "/") {
      trackFunnelStep("visit");
    } else if (pathname === "/dashboard") {
      // User is logged in and on dashboard - they've signed up
      trackFunnelStep("signup");
    } else if (pathname?.includes("/books/") && pathname?.includes("/edit")) {
      // User is editing a book - they've created one
      trackFunnelStep("book_created");
    } else if (pathname?.includes("/checkout") && !pathname?.includes("/success")) {
      // User is in checkout (but not success page)
      trackFunnelStep("checkout_started");
    } else if (pathname === "/checkout/success") {
      // Purchase complete
      trackFunnelStep("purchase_complete");
    }
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <FunnelTracker />
      </Suspense>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
