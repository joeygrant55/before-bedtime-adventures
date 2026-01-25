import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Row,
  Column,
} from "@react-email/components";
import { Header, Footer, Button } from "./components";

interface OrderConfirmationEmailProps {
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

export default function OrderConfirmationEmail({
  customerName = "Sarah",
  bookTitle = "Our Disney Adventure",
  orderId = "BBA-123456",
  price = "$49.99",
  shippingAddress = {
    name: "Sarah Johnson",
    street1: "123 Main Street",
    street2: "Apt 4B",
    city: "Orlando",
    stateCode: "FL",
    postalCode: "32801",
  },
  orderDate = "January 25, 2025",
  estimatedDelivery = "February 5-10, 2025",
  orderUrl = "https://beforebedtimeadventures.com/orders/123",
}: OrderConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Your magical storybook "{bookTitle}" is being created! ✨
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Header />

          <Section style={content}>
            <Text style={greeting}>Hi {customerName}! 👋</Text>

            <Text style={paragraph}>
              <strong>Thank you for your order!</strong> We're absolutely thrilled
              that you've chosen to turn your precious family memories into a
              magical storybook adventure. 💜
            </Text>

            <Section style={orderBox}>
              <Text style={orderTitle}>📚 Order Confirmed</Text>
              <Text style={orderDetail}>
                <strong>Order #:</strong> {orderId}
              </Text>
              <Text style={orderDetail}>
                <strong>Book Title:</strong> {bookTitle}
              </Text>
              <Text style={orderDetail}>
                <strong>Order Date:</strong> {orderDate}
              </Text>
              <Hr style={orderDivider} />
              <Row>
                <Column>
                  <Text style={priceLabel}>Total</Text>
                </Column>
                <Column align="right">
                  <Text style={priceValue}>{price}</Text>
                </Column>
              </Row>
            </Section>

            <Section style={addressBox}>
              <Text style={addressTitle}>📦 Shipping To</Text>
              <Text style={addressText}>{shippingAddress.name}</Text>
              <Text style={addressText}>{shippingAddress.street1}</Text>
              {shippingAddress.street2 && (
                <Text style={addressText}>{shippingAddress.street2}</Text>
              )}
              <Text style={addressText}>
                {shippingAddress.city}, {shippingAddress.stateCode}{" "}
                {shippingAddress.postalCode}
              </Text>
            </Section>

            <Section style={timelineBox}>
              <Text style={timelineTitle}>⏰ What Happens Next?</Text>
              <Text style={timelineStep}>
                <strong>1. Creating Your Book</strong> (1-2 business days)
                <br />
                Our team transforms your photos into beautiful Disney/Pixar-style
                illustrations and assembles your personalized storybook.
              </Text>
              <Text style={timelineStep}>
                <strong>2. Printing & Binding</strong> (3-5 business days)
                <br />
                Your hardcover book is professionally printed on premium paper
                and hand-bound with care.
              </Text>
              <Text style={timelineStep}>
                <strong>3. On Its Way!</strong>
                <br />
                We'll send you a tracking number as soon as your book ships.
              </Text>
              <Text style={estimatedDeliveryText}>
                📅 <strong>Estimated Delivery:</strong> {estimatedDelivery}
              </Text>
            </Section>

            <Section style={ctaSection}>
              <Button href={orderUrl}>View Order Status</Button>
            </Section>

            <Text style={closingText}>
              We can't wait for you to hold your magical storybook in your hands!
              If you have any questions, just reply to this email—we're always
              happy to help.
            </Text>

            <Text style={signature}>
              With love and fairy dust,
              <br />
              <strong>The Before Bedtime Adventures Team</strong> ✨
            </Text>
          </Section>

          <Footer />
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#F3E8FF",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  padding: "20px 0",
};

const container = {
  backgroundColor: "#FFFFFF",
  margin: "0 auto",
  maxWidth: "600px",
  borderRadius: "8px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
};

const content = {
  padding: "32px 24px",
};

const greeting = {
  fontSize: "20px",
  lineHeight: "28px",
  margin: "0 0 16px 0",
  color: "#1F2937",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 24px 0",
  color: "#374151",
};

const orderBox = {
  backgroundColor: "#FAF5FF",
  border: "2px solid #E9D5FF",
  borderRadius: "8px",
  padding: "20px",
  margin: "0 0 24px 0",
};

const orderTitle = {
  fontSize: "18px",
  fontWeight: "bold" as const,
  color: "#6B46C1",
  margin: "0 0 12px 0",
};

const orderDetail = {
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 4px 0",
  color: "#4B5563",
};

const orderDivider = {
  borderColor: "#E9D5FF",
  margin: "16px 0",
};

const priceLabel = {
  fontSize: "16px",
  fontWeight: "bold" as const,
  color: "#374151",
  margin: "0",
};

const priceValue = {
  fontSize: "20px",
  fontWeight: "bold" as const,
  color: "#6B46C1",
  margin: "0",
};

const addressBox = {
  backgroundColor: "#F9FAFB",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "0 0 24px 0",
};

const addressTitle = {
  fontSize: "16px",
  fontWeight: "bold" as const,
  color: "#374151",
  margin: "0 0 8px 0",
};

const addressText = {
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
  color: "#4B5563",
};

const timelineBox = {
  backgroundColor: "#ECFDF5",
  border: "1px solid #A7F3D0",
  borderRadius: "8px",
  padding: "20px",
  margin: "0 0 24px 0",
};

const timelineTitle = {
  fontSize: "16px",
  fontWeight: "bold" as const,
  color: "#065F46",
  margin: "0 0 16px 0",
};

const timelineStep = {
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 12px 0",
  color: "#047857",
};

const estimatedDeliveryText = {
  fontSize: "14px",
  lineHeight: "22px",
  margin: "12px 0 0 0",
  color: "#065F46",
  padding: "12px",
  backgroundColor: "#D1FAE5",
  borderRadius: "4px",
};

const ctaSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const closingText = {
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px 0",
  color: "#374151",
};

const signature = {
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0",
  color: "#6B46C1",
};

// Plain text version export
export function getOrderConfirmationPlainText(props: OrderConfirmationEmailProps): string {
  return `
Before Bedtime Adventures
Magical Stories From Your Family Memories

---

Hi ${props.customerName}! 👋

THANK YOU FOR YOUR ORDER!

We're absolutely thrilled that you've chosen to turn your precious family memories into a magical storybook adventure.

📚 ORDER CONFIRMED
Order #: ${props.orderId}
Book Title: ${props.bookTitle}
Order Date: ${props.orderDate}
Total: ${props.price}

📦 SHIPPING TO
${props.shippingAddress.name}
${props.shippingAddress.street1}
${props.shippingAddress.street2 ? props.shippingAddress.street2 + "\n" : ""}${props.shippingAddress.city}, ${props.shippingAddress.stateCode} ${props.shippingAddress.postalCode}

⏰ WHAT HAPPENS NEXT?

1. Creating Your Book (1-2 business days)
Our team transforms your photos into beautiful Disney/Pixar-style illustrations and assembles your personalized storybook.

2. Printing & Binding (3-5 business days)
Your hardcover book is professionally printed on premium paper and hand-bound with care.

3. On Its Way!
We'll send you a tracking number as soon as your book ships.

📅 Estimated Delivery: ${props.estimatedDelivery}

View your order status: ${props.orderUrl}

---

We can't wait for you to hold your magical storybook in your hands! If you have any questions, just reply to this email—we're always happy to help.

With love and fairy dust,
The Before Bedtime Adventures Team ✨

---

Need help? Visit https://beforebedtimeadventures.com/support
© ${new Date().getFullYear()} Before Bedtime Adventures. All rights reserved.
`.trim();
}
