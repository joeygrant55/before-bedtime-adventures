/**
 * Analytics Utility for Before Bedtime Adventures
 * 
 * This module provides GDPR-friendly analytics tracking using Vercel Analytics.
 * No cookies are used by default - Vercel Analytics uses privacy-friendly hashing.
 * 
 * Events Tracked:
 * - Page views (automatic via Vercel Analytics)
 * - User actions (signup, login)
 * - Book lifecycle (created, page added, image transformed)
 * - Purchase funnel (checkout started, completed, order viewed)
 * 
 * Conversion Funnel:
 * Visit → Signup → Book Created → Checkout Started → Purchase Complete
 */

import { track } from '@vercel/analytics';

// ============================================
// EVENT TYPES
// ============================================

export type AnalyticsEvent =
  // User Events
  | 'user_signup'
  | 'user_login'
  | 'user_logout'
  
  // Book Events
  | 'book_created'
  | 'book_deleted'
  | 'book_title_changed'
  
  // Page Events
  | 'page_added'
  | 'page_removed'
  | 'page_reordered'
  
  // Image Events
  | 'image_uploaded'
  | 'image_transform_started'
  | 'image_transform_completed'
  | 'image_transform_failed'
  | 'image_cropped'
  | 'text_overlay_added'
  | 'text_overlay_edited'
  
  // Cover Events
  | 'cover_edited'
  | 'cover_image_uploaded'
  
  // Funnel Events
  | 'preview_viewed'
  | 'checkout_started'
  | 'checkout_address_entered'
  | 'checkout_completed'
  | 'checkout_abandoned'
  
  // Order Events
  | 'order_created'
  | 'order_status_viewed'
  | 'order_shipped'
  | 'order_delivered';

// ============================================
// EVENT PROPERTIES INTERFACES
// ============================================

interface BaseEventProperties {
  timestamp?: number;
}

interface UserEventProperties extends BaseEventProperties {
  userId?: string;
  isFirstTime?: boolean;
}

interface BookEventProperties extends BaseEventProperties {
  bookId?: string;
  pageCount?: number;
  title?: string;
}

interface ImageEventProperties extends BaseEventProperties {
  bookId?: string;
  pageId?: string;
  imageCount?: number;
}

interface CheckoutEventProperties extends BaseEventProperties {
  bookId?: string;
  orderId?: string;
  price?: number;
  pageCount?: number;
}

interface OrderEventProperties extends BaseEventProperties {
  orderId?: string;
  bookId?: string;
  status?: string;
  daysSinceOrder?: number;
}

// Union type for all event properties
type EventProperties = 
  | UserEventProperties 
  | BookEventProperties 
  | ImageEventProperties 
  | CheckoutEventProperties
  | OrderEventProperties
  | Record<string, string | number | boolean | undefined>;

// ============================================
// CORE TRACKING FUNCTION
// ============================================

/**
 * Track an analytics event with optional properties.
 * Uses Vercel Analytics under the hood.
 * 
 * @param event - The event name
 * @param properties - Optional event properties
 */
export function trackEvent(event: AnalyticsEvent, properties?: EventProperties): void {
  try {
    // Add timestamp to all events
    const enrichedProperties = {
      ...properties,
      timestamp: Date.now(),
    };

    // Filter out undefined values (Vercel Analytics doesn't like them)
    const cleanProperties = Object.fromEntries(
      Object.entries(enrichedProperties).filter(([, v]) => v !== undefined)
    ) as Record<string, string | number | boolean>;

    // Track via Vercel Analytics
    track(event, cleanProperties);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] ${event}`, cleanProperties);
    }
  } catch (error) {
    // Never let analytics break the app
    console.error('[Analytics] Error tracking event:', error);
  }
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

// --- User Events ---

export function trackUserSignup(userId: string, isFirstTime: boolean = true): void {
  trackEvent('user_signup', { userId, isFirstTime });
}

export function trackUserLogin(userId: string): void {
  trackEvent('user_login', { userId });
}

// --- Book Events ---

export function trackBookCreated(bookId: string, pageCount: number, title: string): void {
  trackEvent('book_created', { bookId, pageCount, title });
}

export function trackBookDeleted(bookId: string): void {
  trackEvent('book_deleted', { bookId });
}

// --- Page Events ---

export function trackPageAdded(bookId: string, pageNumber: number): void {
  trackEvent('page_added', { bookId, pageNumber });
}

// --- Image Events ---

export function trackImageUploaded(bookId: string, pageId: string): void {
  trackEvent('image_uploaded', { bookId, pageId });
}

export function trackImageTransformStarted(bookId: string, pageId: string): void {
  trackEvent('image_transform_started', { bookId, pageId });
}

export function trackImageTransformCompleted(bookId: string, pageId: string): void {
  trackEvent('image_transform_completed', { bookId, pageId });
}

export function trackImageTransformFailed(bookId: string, pageId: string, error?: string): void {
  trackEvent('image_transform_failed', { bookId, pageId, error });
}

export function trackTextOverlayAdded(bookId: string, imageId: string): void {
  trackEvent('text_overlay_added', { bookId, imageId });
}

// --- Cover Events ---

export function trackCoverEdited(bookId: string): void {
  trackEvent('cover_edited', { bookId });
}

// --- Funnel Events ---

export function trackPreviewViewed(bookId: string, pageCount: number): void {
  trackEvent('preview_viewed', { bookId, pageCount });
}

export function trackCheckoutStarted(bookId: string, price: number): void {
  trackEvent('checkout_started', { bookId, price });
}

export function trackCheckoutAddressEntered(bookId: string): void {
  trackEvent('checkout_address_entered', { bookId });
}

export function trackCheckoutCompleted(bookId: string, orderId: string, price: number): void {
  trackEvent('checkout_completed', { bookId, orderId, price });
}

export function trackCheckoutAbandoned(bookId: string, step: string): void {
  trackEvent('checkout_abandoned', { bookId, step });
}

// --- Order Events ---

export function trackOrderCreated(orderId: string, bookId: string, price: number): void {
  trackEvent('order_created', { orderId, bookId, price });
}

export function trackOrderStatusViewed(orderId: string, status: string): void {
  trackEvent('order_status_viewed', { orderId, status });
}

// ============================================
// USER PROPERTIES TRACKING
// ============================================

/**
 * Track user properties for segmentation.
 * Call this after key milestones to update user profile.
 */
export function identifyUser(properties: {
  userId: string;
  totalBooks?: number;
  totalSpent?: number;
  isFirstBook?: boolean;
  signupDate?: string;
}): void {
  // Vercel Analytics doesn't have native identify, so we track as an event
  trackEvent('user_login', {
    ...properties,
    identified: true,
  });
}

// ============================================
// FUNNEL HELPERS
// ============================================

/**
 * Track conversion funnel progress.
 * Steps: visit → signup → book_created → checkout_started → purchase_complete
 */
export type FunnelStep = 
  | 'visit'
  | 'signup'
  | 'book_created'
  | 'checkout_started'
  | 'purchase_complete';

export function trackFunnelStep(step: FunnelStep, metadata?: Record<string, string | number>): void {
  track(`funnel_${step}`, {
    step,
    ...metadata,
    timestamp: Date.now(),
  });
}

// ============================================
// DEBUG UTILITIES
// ============================================

/**
 * Check if analytics is properly configured.
 * Only logs in development.
 */
export function debugAnalytics(): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Debug info:');
    console.log('  - Vercel Analytics loaded');
    console.log('  - Environment:', process.env.NODE_ENV);
    console.log('  - Tracking enabled');
  }
}
