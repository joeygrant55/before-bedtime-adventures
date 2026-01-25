"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";
import { render } from "@react-email/components";

// Email templates - imported as functions to generate HTML
import OrderConfirmationEmail, {
  getOrderConfirmationPlainText,
} from "../emails/OrderConfirmation";
import BookShippedEmail, {
  getBookShippedPlainText,
} from "../emails/BookShipped";
import BookDeliveredEmail, {
  getBookDeliveredPlainText,
} from "../emails/BookDelivered";
import WelcomeEmail, { getWelcomePlainText } from "../emails/Welcome";

// Base URL for the site
const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://beforebedtimeadventures.com";

// Initialize Resend client
function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is not set");
  }
  return new Resend(apiKey);
}

// From address - must be verified in Resend
const FROM_EMAIL = "Before Bedtime Adventures <hello@beforebedtimeadventures.com>";

// ============================================
// SEND ORDER CONFIRMATION EMAIL
// ============================================
export const sendOrderConfirmation = action({
  args: {
    to: v.string(),
    customerName: v.string(),
    bookTitle: v.string(),
    orderId: v.string(),
    priceInCents: v.number(),
    shippingAddress: v.object({
      name: v.string(),
      street1: v.string(),
      street2: v.optional(v.string()),
      city: v.string(),
      stateCode: v.string(),
      postalCode: v.string(),
    }),
    orderDate: v.optional(v.string()),
    estimatedDelivery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const resend = getResendClient();

    // Format price
    const price = `$${(args.priceInCents / 100).toFixed(2)}`;

    // Format date
    const orderDate =
      args.orderDate ||
      new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

    // Estimate delivery (7-12 business days from now)
    const estimatedDelivery =
      args.estimatedDelivery || getEstimatedDeliveryRange();

    const orderUrl = `${BASE_URL}/orders/${args.orderId}`;

    const props = {
      customerName: args.customerName,
      bookTitle: args.bookTitle,
      orderId: args.orderId,
      price,
      shippingAddress: args.shippingAddress,
      orderDate,
      estimatedDelivery,
      orderUrl,
    };

    // Render HTML and plain text
    const html = await render(OrderConfirmationEmail(props));
    const text = getOrderConfirmationPlainText(props);

    try {
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: args.to,
        subject: `Order Confirmed! Your magical storybook "${args.bookTitle}" is being created ✨`,
        html,
        text,
      });

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error("Failed to send order confirmation email:", error);
      return { success: false, error: String(error) };
    }
  },
});

// ============================================
// SEND BOOK SHIPPED EMAIL
// ============================================
export const sendBookShipped = action({
  args: {
    to: v.string(),
    customerName: v.string(),
    bookTitle: v.string(),
    orderId: v.string(),
    trackingNumber: v.string(),
    trackingUrl: v.string(),
    carrier: v.optional(v.string()),
    estimatedDelivery: v.optional(v.string()),
    shippingCity: v.string(),
    shippingState: v.string(),
    shippingName: v.string(),
  },
  handler: async (ctx, args) => {
    const resend = getResendClient();

    const orderUrl = `${BASE_URL}/orders/${args.orderId}`;
    const estimatedDelivery =
      args.estimatedDelivery || getShippingEstimateRange();

    const props = {
      customerName: args.customerName,
      bookTitle: args.bookTitle,
      orderId: args.orderId,
      trackingNumber: args.trackingNumber,
      trackingUrl: args.trackingUrl,
      carrier: args.carrier || "USPS",
      estimatedDelivery,
      shippingAddress: {
        name: args.shippingName,
        city: args.shippingCity,
        stateCode: args.shippingState,
      },
      orderUrl,
    };

    const html = await render(BookShippedEmail(props));
    const text = getBookShippedPlainText(props);

    try {
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: args.to,
        subject: `🚚 Your magical storybook "${args.bookTitle}" is on its way!`,
        html,
        text,
      });

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error("Failed to send book shipped email:", error);
      return { success: false, error: String(error) };
    }
  },
});

// ============================================
// SEND BOOK DELIVERED EMAIL
// ============================================
export const sendBookDelivered = action({
  args: {
    to: v.string(),
    customerName: v.string(),
    bookTitle: v.string(),
    orderId: v.string(),
  },
  handler: async (ctx, args) => {
    const resend = getResendClient();

    const props = {
      customerName: args.customerName,
      bookTitle: args.bookTitle,
      orderId: args.orderId,
      reviewUrl: `${BASE_URL}/review?order=${args.orderId}`,
      shareUrl: `${BASE_URL}/share`,
      createNewBookUrl: `${BASE_URL}/books/new`,
      dashboardUrl: `${BASE_URL}/dashboard`,
    };

    const html = await render(BookDeliveredEmail(props));
    const text = getBookDeliveredPlainText(props);

    try {
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: args.to,
        subject: `🎉 Your magical storybook "${args.bookTitle}" has arrived!`,
        html,
        text,
      });

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error("Failed to send book delivered email:", error);
      return { success: false, error: String(error) };
    }
  },
});

// ============================================
// SEND WELCOME EMAIL
// ============================================
export const sendWelcome = action({
  args: {
    to: v.string(),
    customerName: v.string(),
  },
  handler: async (ctx, args) => {
    const resend = getResendClient();

    const props = {
      customerName: args.customerName,
      createBookUrl: `${BASE_URL}/books/new`,
      dashboardUrl: `${BASE_URL}/dashboard`,
      faqUrl: `${BASE_URL}/faq`,
    };

    const html = await render(WelcomeEmail(props));
    const text = getWelcomePlainText(props);

    try {
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: args.to,
        subject: `Welcome to Before Bedtime Adventures! ✨ Let's create magic together`,
        html,
        text,
      });

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error("Failed to send welcome email:", error);
      return { success: false, error: String(error) };
    }
  },
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function getEstimatedDeliveryRange(): string {
  const start = new Date();
  start.setDate(start.getDate() + 7);
  const end = new Date();
  end.setDate(end.getDate() + 12);

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return `${formatDate(start)} - ${formatDate(end)}, ${end.getFullYear()}`;
}

function getShippingEstimateRange(): string {
  const start = new Date();
  start.setDate(start.getDate() + 3);
  const end = new Date();
  end.setDate(end.getDate() + 5);

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return `${formatDate(start)} - ${formatDate(end)}, ${end.getFullYear()}`;
}
