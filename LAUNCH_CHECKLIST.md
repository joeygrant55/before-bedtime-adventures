# BBA Launch Checklist

_Last updated: 2026-02-20_
_Target: Soft launch to Friends & Family_

---

## 🔴 Blockers (Must-Have Before Launch)

- [x] **Clerk production key** — Confirmed working in production (Feb 20, 2026).
- [ ] **F&F list** — Names + emails of people to invite for beta.
- [ ] **Lulu test order** — Place one real test order (~$50-60) to validate the full print pipeline end-to-end before inviting others.

---

## ✅ Already Done

- [x] Stripe: production key configured (`sk_live_`)
- [x] Lulu API: credentials connected
- [x] Build: clean, no errors
- [x] Security: hardened (headers, auth checks, webhook validation)
- [x] Tests: 152/152 unit tests passing
- [x] Auto-deploy: Vercel ↔ GitHub connected
- [x] Full purchase flow: Stripe → PDF generation → Lulu submission → order tracking
- [x] PDF generation validated (8.5"x8.5" hardcover spec)

---

## 🟡 Nice-to-Have Before Public Launch

- [ ] Custom domain (currently on `before-bedtime-adventures.vercel.app`)
- [ ] Onboarding email copy (welcome + "your book is printing" emails)
- [ ] Landing page copywriting polish
- [ ] Error tracking (Sentry or similar)
- [ ] Analytics baseline (Vercel Analytics is already installed)

---

## 📋 Launch Steps (once blockers clear)

1. **Joey swaps Clerk keys** in Vercel dashboard
2. **Joey approves Lulu test order** → Claude places it and monitors
3. Test order confirmed → **Claude sends F&F invites** with onboarding message
4. Monitor first real orders through Lulu (Claude checks daily)
5. Collect feedback → iterate

---

## 💰 Pricing (as configured)

- Book price: **$44.99** (includes ground shipping, US only)
- Lulu cost: ~$20-25 (varies by page count)
- Margin: ~$20/book at launch

---

## Tech Notes

- **Convex webhook:** `CONVEX_WEBHOOK_TOKEN` set ✅
- **Stripe webhook:** `STRIPE_WEBHOOK_SECRET` set ✅
- **Lulu POD package:** `0850X0850FCPRECW080CW444MXX` (8.5"x8.5" hardcover)
- **Print specs:** 8.75"x8.75" with bleed, 300 DPI, sRGB
