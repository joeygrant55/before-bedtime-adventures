# Before Bedtime Adventures - Purchase Flow

This document describes the complete purchase flow implementation for ordering printed hardcover books.

## 🎯 Overview

The purchase flow allows users to buy their personalized storybooks as 8.5" × 8.5" hardcover books printed by Lulu (print-on-demand).

**Price:** $49.99 per book (includes free US shipping)

## 🔄 Flow Diagram

```
User finishes book → Preview → Checkout → Stripe Payment → Webhook → PDF Generation → Lulu Submission → Order Tracking
```

## 📁 File Structure

### Frontend (Next.js App Router)

```
app/
├── books/[id]/
│   ├── preview/page.tsx     # Book flipbook preview
│   └── checkout/page.tsx    # Shipping form + Stripe redirect
├── orders/[id]/page.tsx     # Order tracking page
├── checkout/
│   └── success/page.tsx     # Post-payment success page
└── api/
    ├── stripe/
    │   ├── create-session/route.ts  # Creates Stripe Checkout session
    │   └── webhook/route.ts         # Handles payment events, triggers processing
    └── orders/
        └── process/route.ts         # Manual order processing (testing/retries)

components/
├── BookPreview/
│   ├── BookPreview.tsx      # Full flipbook preview component
│   └── MiniBookPreview.tsx  # Thumbnail preview
├── dashboard/
│   └── OrdersSection.tsx    # Shows user orders on dashboard
└── OrderStatus.tsx          # Status badges and timeline
```

### Backend (Convex)

```
convex/
├── schema.ts           # Database schema (includes printOrders table)
├── orders.ts           # Order CRUD operations
├── generatePdf.ts      # PDF generation with pdf-lib
├── lulu.ts             # Lulu Print API integration
├── books.ts            # Book mutations (including print status)
└── crons.ts            # Hourly Lulu status polling
```

## 🔧 Implementation Details

### 1. Book Preview (`/books/[id]/preview`)

- Interactive flipbook view of the user's book
- Shows cover, interior pages, and back cover
- "Order This Book — $49.99" CTA button

### 2. Checkout (`/books/[id]/checkout`)

- Collects shipping address (US only for MVP)
- Creates order record in Convex with `pending_payment` status
- Redirects to Stripe Checkout

### 3. Stripe Payment

- Uses Stripe Checkout for PCI compliance
- Session metadata includes `bookId` and `orderId`
- Success redirects to `/orders/[id]?success=true`

### 4. Webhook Processing (`/api/stripe/webhook`)

On `checkout.session.completed`:
1. Updates order status to `payment_received`
2. Triggers `processOrder` action asynchronously
3. Returns 200 immediately (async processing)

### 5. Order Processing (`convex/generatePdf.ts`)

The `processOrder` action:
1. Updates status to `generating_pdfs`
2. Generates interior PDF (8.75" × 8.75" with bleed)
3. Generates cover PDF (full wrap-around)
4. Updates order with PDF URLs
5. Submits to Lulu via API
6. Updates status to `submitted`

### 6. Lulu Integration (`convex/lulu.ts`)

- OAuth2 authentication with client credentials
- Creates print jobs with shipping address
- POD Package: `0850X0850FCPRECW080CW444MXX` (8.5"×8.5" hardcover)
- Status polling via cron job (hourly)

### 7. Order Tracking (`/orders/[id]`)

- Shows current status with visual progress bar
- Displays tracking number when shipped
- Confetti animation on successful payment

### 8. Dashboard Orders (`OrdersSection`)

- Shows all user orders
- Status badges with progress indicators
- Quick links to order details

## 🔑 Environment Variables Required

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Lulu Print API
LULU_CLIENT_KEY=your-client-key
LULU_CLIENT_SECRET=your-client-secret
LULU_USE_SANDBOX=true  # Set to "false" for production
```

**Note:** The Lulu environment variables also need to be set in Convex:
```bash
npx convex env set LULU_CLIENT_KEY "your-key"
npx convex env set LULU_CLIENT_SECRET "your-secret"
npx convex env set LULU_USE_SANDBOX "true"
```

## 🧪 Testing

### Local Stripe Webhook Testing

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
3. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### Manual Order Processing

For testing without Stripe:
```bash
curl -X POST http://localhost:3000/api/orders/process \
  -H "Content-Type: application/json" \
  -d '{"orderId": "your-order-id"}'
```

### Lulu Sandbox

Set `LULU_USE_SANDBOX=true` to use Lulu's sandbox environment for testing without real print jobs.

## 📊 Order Statuses

| Status | Description |
|--------|-------------|
| `pending_payment` | Awaiting Stripe payment |
| `payment_received` | Payment confirmed, processing started |
| `generating_pdfs` | Creating print-ready PDFs |
| `submitting_to_lulu` | Uploading to Lulu API |
| `submitted` | Print job created |
| `in_production` | Lulu is printing the book |
| `shipped` | Book is in transit |
| `delivered` | Book has been delivered |
| `failed` | Error occurred |

## 📐 Print Specifications

- **Trim Size:** 8.5" × 8.5" (square format)
- **Interior:** 8.75" × 8.75" (includes 0.125" bleed)
- **Resolution:** 300 DPI
- **Binding:** Hardcover casewrap
- **Paper:** Premium 80# coated white
- **Color:** Full color throughout
- **Minimum Pages:** 24

## 🚀 Production Checklist

Before going live:

1. [ ] Set `LULU_USE_SANDBOX=false`
2. [ ] Update Stripe to live keys (`sk_live_...`)
3. [ ] Configure production webhook in Stripe dashboard
4. [ ] Set up error monitoring (Sentry, etc.)
5. [ ] Test complete flow with real payment
6. [ ] Order a test book to verify print quality
