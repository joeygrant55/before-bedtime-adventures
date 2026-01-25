import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Link,
} from "@react-email/components";
import { Header, Footer, Button } from "./components";

interface BookShippedEmailProps {
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

export default function BookShippedEmail({
  customerName = "Sarah",
  bookTitle = "Our Disney Adventure",
  orderId = "BBA-123456",
  trackingNumber = "1Z999AA10123456784",
  trackingUrl = "https://www.ups.com/track?tracknum=1Z999AA10123456784",
  carrier = "UPS",
  estimatedDelivery = "February 5-7, 2025",
  shippingAddress = {
    name: "Sarah Johnson",
    city: "Orlando",
    stateCode: "FL",
  },
  orderUrl = "https://beforebedtimeadventures.com/orders/123",
}: BookShippedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        🎉 Your magical storybook "{bookTitle}" is on its way!
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Header />

          <Section style={content}>
            <Section style={celebrationBanner}>
              <Text style={bannerEmoji}>🚚📦✨</Text>
              <Text style={bannerText}>Your Book Is On Its Way!</Text>
            </Section>

            <Text style={greeting}>Hi {customerName}! 👋</Text>

            <Text style={paragraph}>
              <strong>Exciting news!</strong> Your magical storybook has been
              carefully packed with love and is now making its journey to you.
              We hope you're as excited as we are! 💜
            </Text>

            <Section style={trackingBox}>
              <Text style={trackingTitle}>📍 Tracking Information</Text>
              <Text style={trackingDetail}>
                <strong>Carrier:</strong> {carrier}
              </Text>
              <Text style={trackingDetail}>
                <strong>Tracking Number:</strong>{" "}
                <Link href={trackingUrl} style={trackingLink}>
                  {trackingNumber}
                </Link>
              </Text>
              <Hr style={trackingDivider} />
              <Text style={deliveryEstimate}>
                📅 <strong>Estimated Delivery:</strong> {estimatedDelivery}
              </Text>
              <Text style={deliveryLocation}>
                📍 Heading to {shippingAddress.city}, {shippingAddress.stateCode}
              </Text>
            </Section>

            <Section style={ctaSection}>
              <Button href={trackingUrl}>Track Your Package</Button>
            </Section>

            <Section style={tipsBox}>
              <Text style={tipsTitle}>💡 Pro Tips While You Wait</Text>
              <Text style={tipItem}>
                🛋️ <strong>Prepare the reading spot</strong> — gather pillows
                and blankets for a cozy story time!
              </Text>
              <Text style={tipItem}>
                📸 <strong>Capture the unboxing</strong> — we'd love to see
                your child's reaction!
              </Text>
              <Text style={tipItem}>
                🌙 <strong>Plan bedtime</strong> — this will make the perfect
                addition to your nighttime routine.
              </Text>
            </Section>

            <Text style={paragraph}>
              Once your book arrives, we'd absolutely love to hear what you
              think! Your feedback helps us create even more magical experiences
              for families.
            </Text>

            <Section style={orderInfoBox}>
              <Text style={orderInfoText}>
                Order #{orderId} •{" "}
                <Link href={orderUrl} style={orderLink}>
                  View Order Details
                </Link>
              </Text>
            </Section>

            <Text style={closingText}>
              If you have any questions about your delivery, just reply to this
              email. We're always here to help!
            </Text>

            <Text style={signature}>
              Can't wait for it to arrive,
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

const celebrationBanner = {
  backgroundColor: "#FEF3C7",
  border: "2px solid #F59E0B",
  borderRadius: "8px",
  padding: "24px",
  margin: "0 0 24px 0",
  textAlign: "center" as const,
};

const bannerEmoji = {
  fontSize: "36px",
  margin: "0 0 8px 0",
};

const bannerText = {
  fontSize: "24px",
  fontWeight: "bold" as const,
  color: "#92400E",
  margin: "0",
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

const trackingBox = {
  backgroundColor: "#EFF6FF",
  border: "2px solid #3B82F6",
  borderRadius: "8px",
  padding: "20px",
  margin: "0 0 24px 0",
};

const trackingTitle = {
  fontSize: "18px",
  fontWeight: "bold" as const,
  color: "#1E40AF",
  margin: "0 0 12px 0",
};

const trackingDetail = {
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 4px 0",
  color: "#1E3A8A",
};

const trackingLink = {
  color: "#2563EB",
  textDecoration: "underline",
};

const trackingDivider = {
  borderColor: "#93C5FD",
  margin: "16px 0",
};

const deliveryEstimate = {
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 4px 0",
  color: "#1E40AF",
};

const deliveryLocation = {
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
  color: "#3B82F6",
};

const ctaSection = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const tipsBox = {
  backgroundColor: "#F0FDF4",
  border: "1px solid #86EFAC",
  borderRadius: "8px",
  padding: "20px",
  margin: "0 0 24px 0",
};

const tipsTitle = {
  fontSize: "16px",
  fontWeight: "bold" as const,
  color: "#166534",
  margin: "0 0 12px 0",
};

const tipItem = {
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 8px 0",
  color: "#15803D",
};

const orderInfoBox = {
  textAlign: "center" as const,
  margin: "24px 0",
  padding: "12px",
  backgroundColor: "#F9FAFB",
  borderRadius: "4px",
};

const orderInfoText = {
  fontSize: "14px",
  color: "#6B7280",
  margin: "0",
};

const orderLink = {
  color: "#6B46C1",
  textDecoration: "underline",
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
export function getBookShippedPlainText(props: BookShippedEmailProps): string {
  return `
Before Bedtime Adventures
Magical Stories From Your Family Memories

---

🚚📦✨ YOUR BOOK IS ON ITS WAY!

Hi ${props.customerName}! 👋

EXCITING NEWS!

Your magical storybook has been carefully packed with love and is now making its journey to you. We hope you're as excited as we are! 💜

📍 TRACKING INFORMATION
Carrier: ${props.carrier}
Tracking Number: ${props.trackingNumber}
Track your package: ${props.trackingUrl}

📅 Estimated Delivery: ${props.estimatedDelivery}
📍 Heading to ${props.shippingAddress.city}, ${props.shippingAddress.stateCode}

💡 PRO TIPS WHILE YOU WAIT

🛋️ Prepare the reading spot — gather pillows and blankets for a cozy story time!

📸 Capture the unboxing — we'd love to see your child's reaction!

🌙 Plan bedtime — this will make the perfect addition to your nighttime routine.

---

Once your book arrives, we'd absolutely love to hear what you think! Your feedback helps us create even more magical experiences for families.

Order #${props.orderId}
View Order Details: ${props.orderUrl}

---

If you have any questions about your delivery, just reply to this email. We're always here to help!

Can't wait for it to arrive,
The Before Bedtime Adventures Team ✨

---

Need help? Visit https://beforebedtimeadventures.com/support
© ${new Date().getFullYear()} Before Bedtime Adventures. All rights reserved.
`.trim();
}
