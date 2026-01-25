// Email Template Props Types

export interface OrderConfirmationEmailProps {
  customerName: string;
  bookTitle: string;
  orderId: string;
  price: string;
  shippingAddress: {
    name: string;
    street1: string;
    street2?: string;
    city: string;
    stateCode: string;
    postalCode: string;
  };
  orderDate: string;
  estimatedDelivery: string;
  orderUrl: string;
}

export interface BookShippedEmailProps {
  customerName: string;
  bookTitle: string;
  orderId: string;
  trackingNumber: string;
  trackingUrl: string;
  carrier: string;
  estimatedDelivery: string;
  shippingAddress: {
    name: string;
    city: string;
    stateCode: string;
  };
  orderUrl: string;
}

export interface BookDeliveredEmailProps {
  customerName: string;
  bookTitle: string;
  orderId: string;
  reviewUrl: string;
  shareUrl: string;
  createNewBookUrl: string;
  dashboardUrl: string;
}

export interface WelcomeEmailProps {
  customerName: string;
  createBookUrl: string;
  dashboardUrl: string;
  faqUrl: string;
}

// Union type for all email data
export type EmailData =
  | { type: "order-confirmation"; props: OrderConfirmationEmailProps }
  | { type: "book-shipped"; props: BookShippedEmailProps }
  | { type: "book-delivered"; props: BookDeliveredEmailProps }
  | { type: "welcome"; props: WelcomeEmailProps };
