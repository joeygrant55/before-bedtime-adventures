# 📧 Before Bedtime Adventures - Email Templates

This folder contains all transactional email templates built with [React Email](https://react.email/).

## Overview

We use:
- **React Email** for building responsive, beautiful email templates
- **Resend** for sending emails reliably

## Templates

| Template | Trigger | Description |
|----------|---------|-------------|
| `Welcome.tsx` | User signup | Welcome message, how it works, create first book CTA |
| `OrderConfirmation.tsx` | After payment | Thank you, order details, shipping address, timeline |
| `BookShipped.tsx` | Book ships | Tracking info, estimated delivery, tips while waiting |
| `BookDelivered.tsx` | Book delivered | Feedback request, share CTA, create another book CTA |

## Development

### Preview emails locally
```bash
npm run email:dev
```
Opens a browser at http://localhost:3001 with live preview of all templates.

### Export to HTML
```bash
npm run email:export
```
Exports all templates to `out/emails/` as static HTML files.

## Usage in Convex

Import and call the email actions from `convex/emails.ts`:

```typescript
// In a Convex mutation or action
import { api } from "./_generated/api";

// Send welcome email
await ctx.runAction(api.emails.sendWelcome, {
  to: "user@example.com",
  customerName: "Sarah",
});

// Send order confirmation
await ctx.runAction(api.emails.sendOrderConfirmation, {
  to: "user@example.com",
  customerName: "Sarah",
  bookTitle: "Our Disney Adventure",
  orderId: "BBA-123456",
  priceInCents: 4999,
  shippingAddress: {
    name: "Sarah Johnson",
    street1: "123 Main St",
    city: "Orlando",
    stateCode: "FL",
    postalCode: "32801",
  },
});

// Send book shipped notification
await ctx.runAction(api.emails.sendBookShipped, {
  to: "user@example.com",
  customerName: "Sarah",
  bookTitle: "Our Disney Adventure",
  orderId: "BBA-123456",
  trackingNumber: "1Z999AA10123456784",
  trackingUrl: "https://www.ups.com/track?tracknum=...",
  shippingCity: "Orlando",
  shippingState: "FL",
  shippingName: "Sarah Johnson",
});

// Send book delivered notification
await ctx.runAction(api.emails.sendBookDelivered, {
  to: "user@example.com",
  customerName: "Sarah",
  bookTitle: "Our Disney Adventure",
  orderId: "BBA-123456",
});
```

## Environment Setup

### Required Environment Variables

Add to `.env.local` and Convex:

```bash
# In Convex dashboard or via CLI
npx convex env set RESEND_API_KEY "re_..."
npx convex env set NEXT_PUBLIC_SITE_URL "https://beforebedtimeadventures.com"
```

### Resend Setup

1. Create account at [resend.com](https://resend.com)
2. Add and verify your domain
3. Create an API key
4. Add DNS records for email sending:
   - SPF record
   - DKIM record
   - Optional: DMARC record

## Design System

### Colors
- **Primary Purple**: `#6B46C1` (brand color)
- **Light Purple Background**: `#F3E8FF`
- **Success Green**: `#065F46` / `#ECFDF5`
- **Info Blue**: `#1E40AF` / `#EFF6FF`
- **Warning Yellow**: `#92400E` / `#FEF3C7`

### Typography
- Headers: Georgia, serif (storybook feel)
- Body: Helvetica Neue, Helvetica, Arial, sans-serif

### Tone
- Warm and friendly
- Use emojis sparingly but meaningfully
- Personal ("Hi Sarah!") not corporate ("Dear Customer")
- Excited about the magic we're creating together

## File Structure

```
emails/
├── components/         # Shared components
│   ├── Header.tsx     # Email header with logo
│   ├── Footer.tsx     # Footer with links
│   ├── Button.tsx     # CTA buttons
│   └── index.ts       # Barrel export
├── OrderConfirmation.tsx
├── BookShipped.tsx
├── BookDelivered.tsx
├── Welcome.tsx
├── types.ts           # TypeScript interfaces
├── index.ts           # Barrel export
└── README.md          # This file
```

## Plain Text Versions

Each template exports a `get[TemplateName]PlainText()` function that generates a plain text version. These are automatically included when sending emails for maximum deliverability.

## Testing

To test emails without sending:
1. Use `npm run email:dev` for visual preview
2. In development, check the Convex logs for email content
3. Use Resend's test mode (API key starting with `re_test_`)

## Mobile Responsiveness

All templates are built mobile-first using:
- Max-width container (600px)
- Responsive padding
- Large tap targets for buttons (min 44px)
- Readable font sizes (14-16px body, 20-28px headers)
