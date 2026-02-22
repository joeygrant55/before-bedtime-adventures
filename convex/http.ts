import { httpRouter } from "convex/server";

const http = httpRouter();

// HTTP routes are handled via Convex actions (transformImage, generatePdf, etc.)
// Stripe webhooks are handled by the Next.js API route at /api/stripe/webhook

export default http;
