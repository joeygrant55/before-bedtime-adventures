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
  Link,
} from "@react-email/components";
import { Header, Footer, Button } from "./components";

interface WelcomeEmailProps {
  customerName: string;
  createBookUrl: string;
  dashboardUrl: string;
  faqUrl: string;
}

export default function WelcomeEmail({
  customerName = "Sarah",
  createBookUrl = "https://beforebedtimeadventures.com/books/new",
  dashboardUrl = "https://beforebedtimeadventures.com/dashboard",
  faqUrl = "https://beforebedtimeadventures.com/faq",
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Welcome to Before Bedtime Adventures! ✨ Let's turn your memories into magic
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Header />

          <Section style={content}>
            <Section style={welcomeBanner}>
              <Text style={bannerEmoji}>🌙✨📚</Text>
              <Text style={bannerText}>Welcome to the Family!</Text>
            </Section>

            <Text style={greeting}>Hi {customerName}! 👋</Text>

            <Text style={paragraph}>
              We're <strong>so excited</strong> to have you join Before Bedtime
              Adventures! You've just unlocked the ability to transform your
              precious family memories into magical, Disney/Pixar-style
              storybooks that your kids will treasure forever. 💜
            </Text>

            <Text style={paragraph}>
              Imagine their faces lighting up when they see themselves as the
              heroes of their own adventure story. That's the magic we create
              together!
            </Text>

            <Section style={howItWorksBox}>
              <Text style={howItWorksTitle}>✨ How It Works</Text>

              <Section style={stepSection}>
                <Row>
                  <Column style={stepNumber}>
                    <Text style={stepNumberText}>1</Text>
                  </Column>
                  <Column style={stepContent}>
                    <Text style={stepTitle}>Upload Your Photos</Text>
                    <Text style={stepDesc}>
                      Choose your favorite vacation photos, family moments, or
                      any special memories you want to transform.
                    </Text>
                  </Column>
                </Row>
              </Section>

              <Section style={stepSection}>
                <Row>
                  <Column style={stepNumber}>
                    <Text style={stepNumberText}>2</Text>
                  </Column>
                  <Column style={stepContent}>
                    <Text style={stepTitle}>Watch the Magic Happen</Text>
                    <Text style={stepDesc}>
                      Our AI transforms your photos into beautiful,
                      Disney/Pixar-style cartoon illustrations while keeping
                      your family recognizable!
                    </Text>
                  </Column>
                </Row>
              </Section>

              <Section style={stepSection}>
                <Row>
                  <Column style={stepNumber}>
                    <Text style={stepNumberText}>3</Text>
                  </Column>
                  <Column style={stepContent}>
                    <Text style={stepTitle}>Add Your Story</Text>
                    <Text style={stepDesc}>
                      Write captions and narratives for each page, or let your
                      creativity flow with custom text overlays.
                    </Text>
                  </Column>
                </Row>
              </Section>

              <Section style={stepSection}>
                <Row>
                  <Column style={stepNumber}>
                    <Text style={stepNumberText}>4</Text>
                  </Column>
                  <Column style={stepContent}>
                    <Text style={stepTitle}>Order Your Book</Text>
                    <Text style={stepDesc}>
                      Your beautiful hardcover storybook arrives at your door,
                      ready for bedtime adventures!
                    </Text>
                  </Column>
                </Row>
              </Section>
            </Section>

            <Section style={ctaSection}>
              <Button href={createBookUrl}>Create Your First Book ✨</Button>
            </Section>

            <Section style={featuresBox}>
              <Text style={featuresTitle}>What You Get</Text>
              <Row>
                <Column align="center" style={featureColumn}>
                  <Text style={featureEmoji}>📚</Text>
                  <Text style={featureText}>Premium hardcover book</Text>
                </Column>
                <Column align="center" style={featureColumn}>
                  <Text style={featureEmoji}>🎨</Text>
                  <Text style={featureText}>Disney-style illustrations</Text>
                </Column>
                <Column align="center" style={featureColumn}>
                  <Text style={featureEmoji}>✍️</Text>
                  <Text style={featureText}>Custom story text</Text>
                </Column>
              </Row>
            </Section>

            <Section style={tipsBox}>
              <Text style={tipsTitle}>💡 Tips for a Great Book</Text>
              <Text style={tipItem}>
                📸 <strong>Use clear, well-lit photos</strong> — the AI works
                best with photos where faces are visible
              </Text>
              <Text style={tipItem}>
                👨‍👩‍👧‍👦 <strong>Include your whole crew</strong> — pets too!
                Everyone can be a character
              </Text>
              <Text style={tipItem}>
                🎢 <strong>Tell a story</strong> — organize photos
                chronologically or by adventure theme
              </Text>
              <Text style={tipItem}>
                ✨ <strong>Have fun with it</strong> — add silly captions,
                inside jokes, and special memories
              </Text>
            </Section>

            <Hr style={divider} />

            <Text style={paragraph}>
              Got questions? Check out our{" "}
              <Link href={faqUrl} style={link}>
                FAQ
              </Link>{" "}
              or just reply to this email. We're always happy to help!
            </Text>

            <Text style={closingText}>
              We can't wait to see the magical stories you create. Here's to
              many cozy bedtime adventures ahead!
            </Text>

            <Text style={signature}>
              Sweet dreams,
              <br />
              <strong>The Before Bedtime Adventures Team</strong> ✨
            </Text>
          </Section>

          <Footer includeUnsubscribe />
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

const welcomeBanner = {
  background: "linear-gradient(135deg, #1E1B4B 0%, #6B46C1 50%, #9333EA 100%)",
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

const howItWorksBox = {
  backgroundColor: "#FAF5FF",
  border: "2px solid #E9D5FF",
  borderRadius: "12px",
  padding: "24px",
  margin: "0 0 24px 0",
};

const howItWorksTitle = {
  fontSize: "22px",
  fontWeight: "bold" as const,
  color: "#6B46C1",
  margin: "0 0 20px 0",
  textAlign: "center" as const,
};

const stepSection = {
  marginBottom: "16px",
};

const stepNumber = {
  width: "40px",
  verticalAlign: "top" as const,
};

const stepNumberText = {
  backgroundColor: "#6B46C1",
  color: "#FFFFFF",
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  fontSize: "14px",
  fontWeight: "bold" as const,
  lineHeight: "28px",
  textAlign: "center" as const,
  margin: "0",
};

const stepContent = {
  paddingLeft: "8px",
  verticalAlign: "top" as const,
};

const stepTitle = {
  fontSize: "16px",
  fontWeight: "bold" as const,
  color: "#374151",
  margin: "0 0 4px 0",
};

const stepDesc = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#6B7280",
  margin: "0",
};

const ctaSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const featuresBox = {
  backgroundColor: "#FEF3C7",
  borderRadius: "8px",
  padding: "24px",
  margin: "0 0 24px 0",
  textAlign: "center" as const,
};

const featuresTitle = {
  fontSize: "18px",
  fontWeight: "bold" as const,
  color: "#92400E",
  margin: "0 0 16px 0",
};

const featureColumn = {
  padding: "0 8px",
};

const featureEmoji = {
  fontSize: "32px",
  margin: "0 0 8px 0",
};

const featureText = {
  fontSize: "13px",
  lineHeight: "18px",
  color: "#78350F",
  margin: "0",
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

const divider = {
  borderColor: "#E2E8F0",
  margin: "24px 0",
};

const link = {
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
export function getWelcomePlainText(props: WelcomeEmailProps): string {
  return `
Before Bedtime Adventures
Magical Stories From Your Family Memories

---

🌙✨📚 WELCOME TO THE FAMILY!

Hi ${props.customerName}! 👋

We're SO EXCITED to have you join Before Bedtime Adventures! You've just unlocked the ability to transform your precious family memories into magical, Disney/Pixar-style storybooks that your kids will treasure forever. 💜

Imagine their faces lighting up when they see themselves as the heroes of their own adventure story. That's the magic we create together!

---

✨ HOW IT WORKS

1. UPLOAD YOUR PHOTOS
Choose your favorite vacation photos, family moments, or any special memories you want to transform.

2. WATCH THE MAGIC HAPPEN
Our AI transforms your photos into beautiful, Disney/Pixar-style cartoon illustrations while keeping your family recognizable!

3. ADD YOUR STORY
Write captions and narratives for each page, or let your creativity flow with custom text overlays.

4. ORDER YOUR BOOK
Your beautiful hardcover storybook arrives at your door, ready for bedtime adventures!

---

👉 Create Your First Book: ${props.createBookUrl}

---

WHAT YOU GET:
📚 Premium hardcover book
🎨 Disney-style illustrations
✍️ Custom story text

---

💡 TIPS FOR A GREAT BOOK

📸 Use clear, well-lit photos — the AI works best with photos where faces are visible

👨‍👩‍👧‍👦 Include your whole crew — pets too! Everyone can be a character

🎢 Tell a story — organize photos chronologically or by adventure theme

✨ Have fun with it — add silly captions, inside jokes, and special memories

---

Got questions? Check out our FAQ: ${props.faqUrl}
Or just reply to this email. We're always happy to help!

We can't wait to see the magical stories you create. Here's to many cozy bedtime adventures ahead!

Sweet dreams,
The Before Bedtime Adventures Team ✨

---

Your Dashboard: ${props.dashboardUrl}

Need help? Visit https://beforebedtimeadventures.com/support
© ${new Date().getFullYear()} Before Bedtime Adventures. All rights reserved.
`.trim();
}
