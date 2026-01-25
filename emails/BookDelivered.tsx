import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Link,
  Row,
  Column,
} from "@react-email/components";
import { Header, Footer, Button } from "./components";

interface BookDeliveredEmailProps {
  customerName: string;
  bookTitle: string;
  orderId: string;
  reviewUrl: string;
  shareUrl: string;
  createNewBookUrl: string;
  dashboardUrl: string;
}

export default function BookDeliveredEmail({
  customerName = "Sarah",
  bookTitle = "Our Disney Adventure",
  orderId = "BBA-123456",
  reviewUrl = "https://beforebedtimeadventures.com/review?order=123",
  shareUrl = "https://beforebedtimeadventures.com/share",
  createNewBookUrl = "https://beforebedtimeadventures.com/books/new",
  dashboardUrl = "https://beforebedtimeadventures.com/dashboard",
}: BookDeliveredEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        🎉 Your magical storybook "{bookTitle}" has arrived! We hope you love it!
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Header />

          <Section style={content}>
            <Section style={celebrationBanner}>
              <Text style={bannerEmoji}>🎉📚✨</Text>
              <Text style={bannerText}>Your Book Has Arrived!</Text>
              <Text style={bannerSubtext}>Time for magical bedtime stories!</Text>
            </Section>

            <Text style={greeting}>Hi {customerName}! 👋</Text>

            <Text style={paragraph}>
              <strong>Your magical storybook is here!</strong> We hope the
              moment you opened the package felt as special as the memories
              inside. Can you believe those are your family adventures
              transformed into a real, beautiful book? 💜
            </Text>

            <Text style={paragraph}>
              We poured our hearts into creating this for you, and we truly hope
              it brings countless cozy bedtime moments, excited giggles, and
              treasured memories for years to come.
            </Text>

            <Section style={reviewBox}>
              <Text style={reviewTitle}>⭐ We'd Love Your Feedback!</Text>
              <Text style={reviewText}>
                Did the book meet your expectations? We'd be incredibly grateful
                if you could take a moment to share your experience. Your review
                helps other families discover the magic of personalized
                storybooks!
              </Text>
              <Section style={reviewCta}>
                <Button href={reviewUrl}>Leave a Review</Button>
              </Section>
            </Section>

            <Section style={shareBox}>
              <Text style={shareTitle}>💝 Share the Magic</Text>
              <Text style={shareText}>
                Know another family who would love to turn their memories into a
                storybook? Spread the joy!
              </Text>
              <Row>
                <Column align="center">
                  <Button href={shareUrl} variant="secondary">
                    Share With Friends
                  </Button>
                </Column>
              </Row>
            </Section>

            <Section style={createAnotherBox}>
              <Text style={createTitle}>🌟 Ready for Another Adventure?</Text>
              <Text style={createText}>
                Every family trip, holiday, or special moment can become a
                magical storybook. Start your next adventure today!
              </Text>
              <Section style={createCta}>
                <Button href={createNewBookUrl}>Create Another Book</Button>
              </Section>
            </Section>

            <Section style={ideasBox}>
              <Text style={ideasTitle}>💡 Ideas for Your Next Book</Text>
              <Text style={ideaItem}>
                🏖️ <strong>Summer vacation memories</strong> — beach days, road
                trips, camping adventures
              </Text>
              <Text style={ideaItem}>
                🎄 <strong>Holiday celebrations</strong> — Christmas morning,
                Halloween costumes, birthday parties
              </Text>
              <Text style={ideaItem}>
                👶 <strong>Baby's first year</strong> — monthly milestones and
                precious moments
              </Text>
              <Text style={ideaItem}>
                🐕 <strong>Pet adventures</strong> — your furry friend as the star!
              </Text>
              <Text style={ideaItem}>
                👨‍👩‍👧‍👦 <strong>Grandparent visits</strong> — special memories
                with family near and far
              </Text>
            </Section>

            <Text style={closingText}>
              Thank you for letting us be part of your family's story. If you
              ever have questions or just want to share how bedtime went, we'd
              love to hear from you!
            </Text>

            <Text style={signature}>
              Sweet dreams and happy reading,
              <br />
              <strong>The Before Bedtime Adventures Team</strong> ✨
            </Text>

            <Section style={orderInfoBox}>
              <Text style={orderInfoText}>
                Order #{orderId} •{" "}
                <Link href={dashboardUrl} style={orderLink}>
                  View My Books
                </Link>
              </Text>
            </Section>
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
  background: "linear-gradient(135deg, #6B46C1 0%, #9F7AEA 100%)",
  borderRadius: "8px",
  padding: "32px 24px",
  margin: "0 0 24px 0",
  textAlign: "center" as const,
};

const bannerEmoji = {
  fontSize: "48px",
  margin: "0 0 12px 0",
};

const bannerText = {
  fontSize: "28px",
  fontWeight: "bold" as const,
  color: "#FFFFFF",
  margin: "0 0 8px 0",
};

const bannerSubtext = {
  fontSize: "16px",
  color: "#E9D8FD",
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
  margin: "0 0 20px 0",
  color: "#374151",
};

const reviewBox = {
  backgroundColor: "#FEF9C3",
  border: "2px solid #FCD34D",
  borderRadius: "8px",
  padding: "24px",
  margin: "0 0 24px 0",
  textAlign: "center" as const,
};

const reviewTitle = {
  fontSize: "20px",
  fontWeight: "bold" as const,
  color: "#854D0E",
  margin: "0 0 12px 0",
};

const reviewText = {
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 20px 0",
  color: "#713F12",
};

const reviewCta = {
  textAlign: "center" as const,
};

const shareBox = {
  backgroundColor: "#FDF2F8",
  border: "1px solid #FBCFE8",
  borderRadius: "8px",
  padding: "24px",
  margin: "0 0 24px 0",
  textAlign: "center" as const,
};

const shareTitle = {
  fontSize: "18px",
  fontWeight: "bold" as const,
  color: "#9D174D",
  margin: "0 0 8px 0",
};

const shareText = {
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 16px 0",
  color: "#BE185D",
};

const createAnotherBox = {
  backgroundColor: "#FAF5FF",
  border: "2px solid #E9D5FF",
  borderRadius: "8px",
  padding: "24px",
  margin: "0 0 24px 0",
  textAlign: "center" as const,
};

const createTitle = {
  fontSize: "20px",
  fontWeight: "bold" as const,
  color: "#6B46C1",
  margin: "0 0 8px 0",
};

const createText = {
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 20px 0",
  color: "#7C3AED",
};

const createCta = {
  textAlign: "center" as const,
};

const ideasBox = {
  backgroundColor: "#F0FDFA",
  border: "1px solid #99F6E4",
  borderRadius: "8px",
  padding: "20px",
  margin: "0 0 24px 0",
};

const ideasTitle = {
  fontSize: "16px",
  fontWeight: "bold" as const,
  color: "#115E59",
  margin: "0 0 16px 0",
};

const ideaItem = {
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 10px 0",
  color: "#0F766E",
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
  margin: "0 0 24px 0",
  color: "#6B46C1",
};

const orderInfoBox = {
  textAlign: "center" as const,
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

// Plain text version export
export function getBookDeliveredPlainText(props: BookDeliveredEmailProps): string {
  return `
Before Bedtime Adventures
Magical Stories From Your Family Memories

---

🎉📚✨ YOUR BOOK HAS ARRIVED!
Time for magical bedtime stories!

Hi ${props.customerName}! 👋

YOUR MAGICAL STORYBOOK IS HERE!

We hope the moment you opened the package felt as special as the memories inside. Can you believe those are your family adventures transformed into a real, beautiful book? 💜

We poured our hearts into creating this for you, and we truly hope it brings countless cozy bedtime moments, excited giggles, and treasured memories for years to come.

---

⭐ WE'D LOVE YOUR FEEDBACK!

Did the book meet your expectations? We'd be incredibly grateful if you could take a moment to share your experience. Your review helps other families discover the magic of personalized storybooks!

Leave a Review: ${props.reviewUrl}

---

💝 SHARE THE MAGIC

Know another family who would love to turn their memories into a storybook? Spread the joy!

Share With Friends: ${props.shareUrl}

---

🌟 READY FOR ANOTHER ADVENTURE?

Every family trip, holiday, or special moment can become a magical storybook. Start your next adventure today!

Create Another Book: ${props.createNewBookUrl}

💡 IDEAS FOR YOUR NEXT BOOK:

🏖️ Summer vacation memories — beach days, road trips, camping adventures
🎄 Holiday celebrations — Christmas morning, Halloween costumes, birthday parties
👶 Baby's first year — monthly milestones and precious moments
🐕 Pet adventures — your furry friend as the star!
👨‍👩‍👧‍👦 Grandparent visits — special memories with family near and far

---

Thank you for letting us be part of your family's story. If you ever have questions or just want to share how bedtime went, we'd love to hear from you!

Sweet dreams and happy reading,
The Before Bedtime Adventures Team ✨

Order #${props.orderId}
View My Books: ${props.dashboardUrl}

---

Need help? Visit https://beforebedtimeadventures.com/support
© ${new Date().getFullYear()} Before Bedtime Adventures. All rights reserved.
`.trim();
}
