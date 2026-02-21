# BBA Email Templates

_Draft copy for key transactional emails. To implement: wire into Convex/webhook or use Resend/Postmark._

---

## 1. F&F Invite (soft launch)

**Subject:** You're invited — turn your vacation photos into a storybook ✨

Hey [Name],

I built something I'm really excited about and wanted you to be one of the first to try it.

**Before Bedtime Adventures** turns your family vacation photos into a Disney-style illustrated hardcover storybook, printed and shipped to your door.

Here's how it works:
1. Upload 10-20 of your favorite trip photos
2. AI transforms them into magical illustrated scenes
3. We print and ship a premium 8.5"×8.5" hardcover to you (~10-14 days)

The whole thing takes about 10 minutes and costs $49.99 (US shipping included).

Try it here: **https://before-bedtime-adventures.vercel.app**

I'd love your honest feedback — good or bad. What worked? What was confusing? What would make it better?

Thanks for being an early supporter. 🙏

Joey

---

## 2. Order Confirmed (post-payment)

**Subject:** Your storybook is on its way 🎉

Hi [Name],

We've received your order — thank you!

**What happens next:**
- We're creating your print-ready book (AI transformation + layout) — this takes a few hours
- Once ready, your files are sent to our printer
- Your book is printed and shipped within ~5-7 business days
- Estimated arrival: **~10-14 days from today**

You can track your order anytime here: https://before-bedtime-adventures.vercel.app/orders/[ORDER_ID]

Questions? Reply to this email.

— The Before Bedtime Adventures team

---

## 3. Book Is Printing (status update)

**Subject:** Your storybook is printing now 🖨️

Hi [Name],

Good news — your book has been sent to our printer and is now in production!

**Order summary:**
- 📚 Book: [BOOK_TITLE]
- 📦 Shipping to: [SHIPPING_ADDRESS]
- 🚚 Estimated delivery: [ESTIMATED_DATE]

We'll send you another email when it ships with your tracking number.

Track your order: https://before-bedtime-adventures.vercel.app/orders/[ORDER_ID]

— The Before Bedtime Adventures team

---

## 4. Shipped!

**Subject:** Your storybook is on its way 📦

Hi [Name],

Your book has shipped! 

**Tracking:** [TRACKING_NUMBER]
**Carrier:** [CARRIER]
**Estimated delivery:** [DATE]

Track your package: [TRACKING_URL]

We hope you and your family love it. If you do, sharing a photo on social media (and tagging us @beforebedtimeadventures) would mean the world to us. 🌟

Enjoy!

— The Before Bedtime Adventures team

---

## 5. Feedback Request (7 days post-delivery)

**Subject:** How did we do? (quick question)

Hi [Name],

Your book should have arrived by now — hope you love it!

We're a small team and your feedback genuinely shapes what we build next. One question:

**On a scale of 1-10, how likely are you to recommend Before Bedtime Adventures to a friend?**

[1] [2] [3] [4] [5] [6] [7] [8] [9] [10]

(Or just reply to this email — we read everything.)

Thanks,
Joey

---

_To implement: use Resend (resend.com) or Postmark. Recommend triggering from Convex webhook on status changes._
