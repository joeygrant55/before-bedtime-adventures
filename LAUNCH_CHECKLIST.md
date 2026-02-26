# BBA Launch Checklist

_Last updated: 2026-02-20_
_Target: Soft launch to Friends & Family_

---

## 🔴 Blockers (Must-Have Before Launch)

- [ ] **Clerk production key** — Still on `pk_test_` (confirmed by `noreply@accounts.dev` email sender). Need to promote Clerk instance to production at dashboard.clerk.com, then update `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` in Vercel.
- [ ] **F&F list** — Names + emails of people to invite for beta.
- [ ] **Lulu test order** — Place one real test order (~$50-60) to validate the full print pipeline end-to-end before inviting others.

## ✅ Recently Cleared

- [x] **Vercel CLI auth** — Joey re-authenticated Feb 23. Deploy cmd: `cd ~/before-bedtime-adventures && vercel --prod --yes`

---

## ✅ Already Done

- [x] Stripe: production key configured (`sk_live_`)
- [x] Lulu API: credentials connected
- [x] Build: clean, no errors
- [x] Security: hardened (headers, auth checks, webhook validation)
- [x] Tests: 153/153 unit tests passing
- [x] Auto-deploy: Vercel ↔ GitHub connected
- [x] Full purchase flow: Stripe → PDF generation → Lulu submission → order tracking
- [x] PDF generation validated (8.5"x8.5" hardcover spec)

---

## 🟡 Nice-to-Have Before Public Launch

- [ ] Custom domain (currently on `before-bedtime-adventures.vercel.app`)
- [ ] Onboarding email copy (welcome + "your book is printing" emails)
- [x] Landing page copy — fixed "+ shipping" lie → "Shipping included (US)" and "Ships worldwide" → "Ships in ~10-14 days (US only)" (Feb 21)
- [ ] Error tracking (Sentry or similar)
- [ ] Analytics baseline (Vercel Analytics is already installed)
- [x] Replaced fake placeholder testimonials with real product trust signals (Feb 26) — safe for F&F launch. Swap in real quotes when collected.

---

## 📋 Launch Steps (once blockers clear)

1. **Joey swaps Clerk keys** in Vercel dashboard
2. **Joey approves Lulu test order** → Claude places it and monitors
3. Test order confirmed → **Claude sends F&F invites** with onboarding message
4. Monitor first real orders through Lulu (Claude checks daily)
5. Collect feedback → iterate

---

## 💰 Pricing (as configured)

- Book price: **$49.99** (includes ground shipping, US only)
- Lulu cost: ~$20-25 (varies by page count)
- Margin: ~$25-30/book at launch

---

## Tech Notes

- **Convex webhook:** `CONVEX_WEBHOOK_TOKEN` set ✅
- **Stripe webhook:** `STRIPE_WEBHOOK_SECRET` set ✅
- **Lulu POD package:** `0850X0850FCPRECW080CW444MXX` (8.5"x8.5" hardcover)
- **Print specs:** 8.75"x8.75" with bleed, 300 DPI, sRGB
