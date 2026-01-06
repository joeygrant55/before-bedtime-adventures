# Deployment Checklist - Before Bedtime Adventures

**Last Updated**: 2026-01-04
**Prepared by**: T5 DevOps
**Status**: In Progress

---

## Quick Reference

| Service | Dashboard | Status |
|---------|-----------|--------|
| Vercel | [vercel.com/dashboard](https://vercel.com/dashboard) | [ ] Not connected |
| Convex | [dashboard.convex.dev](https://dashboard.convex.dev) | [x] Dev active |
| Clerk | [dashboard.clerk.com](https://dashboard.clerk.com) | [x] Test keys active |
| Stripe | [dashboard.stripe.com](https://dashboard.stripe.com) | [ ] Needs prod setup |
| Lulu | [developers.lulu.com](https://developers.lulu.com) | [ ] Needs account |

---

## Environment Variables Map

### Next.js (Vercel)

| Variable | Dev Value | Prod Value | Source |
|----------|-----------|------------|--------|
| `NEXT_PUBLIC_CONVEX_URL` | `https://cheery-bison-804.convex.cloud` | `TBD` | Convex Dashboard |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | `pk_live_...` | Clerk Dashboard |
| `CLERK_SECRET_KEY` | `sk_test_...` | `sk_live_...` | Clerk Dashboard |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://beforebedtimeadventures.com` | Domain |

### Convex (Backend)

| Variable | Dev Value | Prod Value | Source |
|----------|-----------|------------|--------|
| `GEMINI_API_KEY` | `AIza...` (active) | Same or new key | Google AI Studio |
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | `whsec_...` | Stripe Webhooks |
| `LULU_CLIENT_KEY` | N/A | `TBD` | Lulu Developer Portal |
| `LULU_CLIENT_SECRET` | N/A | `TBD` | Lulu Developer Portal |
| `LULU_API_URL` | N/A | `https://api.lulu.com` | Lulu Docs |

---

## 1. Vercel Deployment

### Setup Steps
- [ ] Create Vercel account (if needed)
- [ ] Connect GitHub repo: `beforebedadventures/before-bedtime-adventures`
- [ ] Configure build settings:
  - Framework: Next.js
  - Build Command: `npm run build`
  - Output Directory: `.next`
- [ ] Add environment variables (see table above)
- [ ] Configure production branch: `main`
- [ ] Enable preview deployments for PRs
- [ ] Test deployment with current code

### Commands
```bash
# Install Vercel CLI (optional)
npm i -g vercel

# Deploy from CLI
vercel --prod

# Or use GitHub integration for auto-deploy on push
```

### Webhook URLs (after deploy)
- Stripe: `https://[convex-url].convex.site/stripe-webhook`
- Lulu: `https://[convex-url].convex.site/lulu-webhook`

---

## 2. Convex Production

### Current Dev Deployment
- Team: `joeygrant55`
- Project: `before-bedtime-adventures`
- URL: `https://cheery-bison-804.convex.cloud`

### Production Setup
- [ ] Verify production deployment exists (or create)
- [ ] Note production URL: `_________________`
- [ ] Set environment variables in Convex Dashboard:
  ```
  GEMINI_API_KEY=
  STRIPE_SECRET_KEY=
  STRIPE_WEBHOOK_SECRET=
  LULU_CLIENT_KEY=
  LULU_CLIENT_SECRET=
  LULU_API_URL=https://api.lulu.com
  ```
- [ ] Deploy schema and functions:
  ```bash
  npx convex deploy
  ```
- [ ] Verify HTTP routes work:
  - `/stripe-webhook`
  - `/lulu-webhook` (when implemented)

---

## 3. Stripe Production

### Account Setup
- [ ] Create/access Stripe account
- [ ] Complete business verification
- [ ] Enable live mode

### Product Configuration
- [ ] Create product: "Custom Printed Storybook"
- [ ] Set price: $49.99 USD (one-time)
- [ ] Note Price ID: `price_________________`

### API Keys
- [ ] Get live secret key: `sk_live_...`
- [ ] Add to Convex env vars

### Webhooks
- [ ] Create webhook endpoint:
  - URL: `https://[convex-url].convex.site/stripe-webhook`
  - Events: `checkout.session.completed`
- [ ] Get webhook signing secret: `whsec_...`
- [ ] Add to Convex env vars

### Payment Methods
- [ ] Enable Cards
- [ ] Enable Apple Pay (optional)
- [ ] Enable Google Pay (optional)

---

## 4. Lulu Print API

### Account Setup
- [ ] Create account at [developers.lulu.com](https://developers.lulu.com)
- [ ] Complete publisher verification
- [ ] Access API credentials

### API Configuration
- [ ] Get Client Key: `_________________`
- [ ] Get Client Secret: `_________________`
- [ ] Add to Convex env vars

### Book Specification
- **Size**: 8.5" x 8.5" (square)
- **Binding**: Hardcover casewrap
- **Interior**: Full color
- **Paper**: Premium

### pod_package_id Format (27 characters)
Format: `TrimSize + Color + Quality + Bind + Paper + PPI + Finish + Linen + Foil`

For 8.5x8.5 hardcover casewrap, the ID starts with: `0850X0850FC...CW...`

Examples from Lulu docs:
- `0850X1100BWSTDLW060UW444MNG` - 8.5x11 B&W linen wrap
- `0600X0900FCSTDPB080CW444GXX` - 6x9 color paperback

- [ ] Use Lulu Pricing Calculator to get exact `pod_package_id` for:
  - 8.5x8.5 square
  - Full color interior
  - Hardcover casewrap
  - Premium paper
- [ ] Verified `pod_package_id`: `_________________`

### Webhooks
- [ ] Set up webhook for order status:
  - URL: `https://[convex-url].convex.site/lulu-webhook`
  - Topic: `PRINT_JOB_STATUS_CHANGED`

### Test Order
- [ ] Submit test print job
- [ ] Verify status updates work

---

## 5. Clerk Production

### Current Test Instance
- Publishable Key: `pk_test_Y2hhcm1lZC13b2xmLTYxLmNsZXJrLmFjY291bnRzLmRldiQ`

### Production Setup
- [ ] Access Clerk Dashboard
- [ ] Switch to Production instance (or create)
- [ ] Get production keys:
  - Publishable: `pk_live_...`
  - Secret: `sk_live_...`

### Configuration
- [ ] Add allowed redirect URLs:
  - `https://beforebedtimeadventures.com`
  - `https://beforebedtimeadventures.com/sign-in`
  - `https://beforebedtimeadventures.com/sign-up`
- [ ] Configure social logins (optional):
  - [ ] Google
  - [ ] Apple

---

## 6. Domain & DNS

### Domain
- [ ] Confirm domain: `beforebedtimeadventures.com`
- [ ] Verify ownership/access

### DNS Configuration
- [ ] Add CNAME record pointing to Vercel:
  ```
  CNAME  @  cname.vercel-dns.com
  CNAME  www  cname.vercel-dns.com
  ```
- [ ] Or use Vercel nameservers (recommended)

### SSL
- [ ] SSL auto-provisioned by Vercel
- [ ] Verify HTTPS works after DNS propagation

---

## 7. Monitoring (Optional)

### Error Tracking
- [ ] Set up Sentry (or similar)
- [ ] Add `SENTRY_DSN` to env vars
- [ ] Integrate with Next.js

### Analytics
- [ ] Vercel Analytics (built-in)
- [ ] Or Plausible/GA4

### Uptime
- [ ] Set up uptime monitoring
- [ ] Configure alerts

---

## Pre-Launch Checklist

### Code Ready
- [ ] PDF generation working (T2)
- [ ] Stripe checkout working (T3)
- [ ] Lulu API integration working (T3)
- [ ] All tests passing (T4)
- [ ] Build succeeds: `npm run build`

### Infrastructure Ready
- [ ] Vercel connected and deployed
- [ ] Convex production configured
- [ ] Domain pointing to Vercel
- [ ] All env vars set

### Accounts Ready
- [ ] Stripe live mode enabled
- [ ] Lulu account verified
- [ ] Clerk production keys active

---

## Deploy Commands

```bash
# 1. Deploy Convex to production
npx convex deploy

# 2. Deploy to Vercel (if using CLI)
vercel --prod

# Or push to main branch for auto-deploy

# 3. Verify deployment
curl https://beforebedtimeadventures.com
```

---

## Rollback Plan

If issues occur:
1. Vercel: Redeploy previous deployment from dashboard
2. Convex: Schema changes may require manual rollback
3. DNS: Revert CNAME records if needed

---

## Notes

- Keep all secrets in environment variables only
- Never commit `.env.local` or secrets to git
- Test in Vercel preview deploys before production
- Coordinate with T1 for account access if needed
