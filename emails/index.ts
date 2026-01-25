// Email Templates
export { default as OrderConfirmationEmail, getOrderConfirmationPlainText } from "./OrderConfirmation";
export { default as BookShippedEmail, getBookShippedPlainText } from "./BookShipped";
export { default as BookDeliveredEmail, getBookDeliveredPlainText } from "./BookDelivered";
export { default as WelcomeEmail, getWelcomePlainText } from "./Welcome";

// Shared Components
export * from "./components";

// Email Types
export type {
  OrderConfirmationEmailProps,
  BookShippedEmailProps,
  BookDeliveredEmailProps,
  WelcomeEmailProps,
} from "./types";
