# Analytics Documentation

## Overview

Before Bedtime Adventures uses **Vercel Analytics** for privacy-friendly, GDPR-compliant analytics tracking. The system tracks user behavior through the conversion funnel without using cookies.

## GDPR Compliance

- ✅ **No cookies by default** - Vercel Analytics uses privacy-friendly hashing
- ✅ **No personal data collection** - Only anonymous event data
- ✅ **IP anonymization** - User IPs are not stored
- ✅ **No cookie consent banner required** for basic analytics

## Conversion Funnel

The main conversion funnel tracks users from visit to purchase:

```
Visit → Signup → Book Created → Checkout Started → Purchase Complete
```

Each step is automatically tracked via the `trackFunnelStep()` function.

### Funnel Events

| Step | Trigger | Location |
|------|---------|----------|
| `visit` | Landing page load | `AnalyticsProvider.tsx` |
| `signup` | User reaches dashboard | `dashboard/page.tsx` |
| `book_created` | New book created | `books/new/page.tsx` |
| `checkout_started` | Checkout page load | `[id]/checkout/page.tsx` |
| `purchase_complete` | Stripe success callback | `checkout/success/page.tsx` |

## Events Tracked

### User Events

| Event | Description | Properties |
|-------|-------------|------------|
| `user_signup` | New user created | `userId`, `isFirstTime` |
| `user_login` | User signs in | `userId` |
| `user_logout` | User signs out | `userId` |

### Book Events

| Event | Description | Properties |
|-------|-------------|------------|
| `book_created` | New book created | `bookId`, `pageCount`, `title` |
| `book_deleted` | Book deleted | `bookId` |
| `book_title_changed` | Title updated | `bookId`, `title` |

### Image Events

| Event | Description | Properties |
|-------|-------------|------------|
| `image_uploaded` | Photo uploaded | `bookId`, `pageId` |
| `image_transform_started` | AI transformation begins | `bookId`, `pageId` |
| `image_transform_completed` | AI transformation done | `bookId`, `pageId` |
| `image_transform_failed` | Transformation error | `bookId`, `pageId`, `error` |
| `text_overlay_added` | Text overlay created | `bookId`, `imageId` |

### Checkout Events

| Event | Description | Properties |
|-------|-------------|------------|
| `preview_viewed` | Book preview opened | `bookId`, `pageCount` |
| `checkout_started` | Checkout page loaded | `bookId`, `price` |
| `checkout_address_entered` | Address form submitted | `bookId` |
| `checkout_completed` | Payment successful | `bookId`, `orderId`, `price` |
| `checkout_abandoned` | User left checkout | `bookId`, `step` |

### Order Events

| Event | Description | Properties |
|-------|-------------|------------|
| `order_created` | Order record created | `orderId`, `bookId`, `price` |
| `order_status_viewed` | User checks order status | `orderId`, `status` |
| `order_shipped` | Order shipped | `orderId` |
| `order_delivered` | Order delivered | `orderId` |

## User Properties

When users are identified, the following properties are tracked:

| Property | Type | Description |
|----------|------|-------------|
| `userId` | string | Clerk user ID |
| `totalBooks` | number | Books created |
| `totalSpent` | number | Revenue in cents |
| `isFirstBook` | boolean | First-time creator |
| `signupDate` | string | ISO date of signup |

## Implementation Files

```
lib/analytics.ts          # Core analytics utility
components/AnalyticsProvider.tsx  # Provider component
```

## Usage Examples

### Track a custom event

```typescript
import { trackEvent } from '@/lib/analytics';

trackEvent('book_created', {
  bookId: 'abc123',
  pageCount: 15,
  title: 'Our Vacation'
});
```

### Use convenience functions

```typescript
import { trackBookCreated, trackCheckoutStarted } from '@/lib/analytics';

// Track book creation
trackBookCreated(bookId, pageCount, title);

// Track checkout
trackCheckoutStarted(bookId, price);
```

### Track funnel progress

```typescript
import { trackFunnelStep } from '@/lib/analytics';

trackFunnelStep('book_created', { bookId: 'abc123' });
```

## Viewing Analytics

### Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Select the `before-bedtime-adventures` project
3. Click "Analytics" in the sidebar
4. View page views, custom events, and Web Vitals

### Custom Events in Vercel

Custom events appear under:
- Analytics → Events tab
- Filter by event name (e.g., `book_created`)
- See conversion rates over time

## Key Metrics to Monitor

### Acquisition
- Daily/weekly unique visitors
- Traffic sources
- Landing page performance

### Activation
- Signup rate (Visit → Signup)
- First book created rate (Signup → Book Created)
- Time to first book

### Engagement
- Average pages per book
- Images uploaded per book
- Return visit rate

### Conversion
- Checkout start rate (Book Created → Checkout)
- Checkout completion rate (Checkout → Purchase)
- Average order value

### Retention
- Return customer rate
- Second book creation rate
- Order status check frequency

## Drop-off Analysis

Monitor these key drop-off points:

1. **Landing → Signup**: Is the value prop clear?
2. **Signup → First Book**: Is onboarding smooth?
3. **Book Created → Checkout**: Are users completing books?
4. **Checkout → Purchase**: Is checkout friction too high?

## Performance Monitoring

Vercel Speed Insights tracks:
- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay)
- **CLS** (Cumulative Layout Shift)
- **TTFB** (Time to First Byte)
- **INP** (Interaction to Next Paint)

## Future Enhancements

- [ ] A/B testing integration
- [ ] Cohort analysis
- [ ] Revenue tracking in dashboard
- [ ] Email engagement tracking
- [ ] Customer lifetime value calculation
