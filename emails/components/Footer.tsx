import {
  Hr,
  Link,
  Section,
  Text,
} from "@react-email/components";

interface FooterProps {
  includeUnsubscribe?: boolean;
}

export function Footer({ includeUnsubscribe = false }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <Section style={footerStyle}>
      <Hr style={divider} />
      <Text style={footerText}>
        Need help? Reply to this email or visit our{" "}
        <Link href="https://beforebedtimeadventures.com/support" style={link}>
          support center
        </Link>
        .
      </Text>
      <Text style={footerText}>
        <Link href="https://beforebedtimeadventures.com" style={link}>
          Website
        </Link>
        {" • "}
        <Link href="https://beforebedtimeadventures.com/dashboard" style={link}>
          My Books
        </Link>
        {" • "}
        <Link href="https://beforebedtimeadventures.com/faq" style={link}>
          FAQ
        </Link>
      </Text>
      <Text style={copyrightText}>
        © {currentYear} Before Bedtime Adventures. All rights reserved.
      </Text>
      <Text style={addressText}>
        Made with 💜 for families everywhere
      </Text>
      {includeUnsubscribe && (
        <Text style={unsubscribeText}>
          <Link href="{{unsubscribe_url}}" style={unsubscribeLink}>
            Unsubscribe from marketing emails
          </Link>
        </Text>
      )}
    </Section>
  );
}

const footerStyle = {
  padding: "24px",
  backgroundColor: "#F7F7F7",
  borderRadius: "0 0 8px 8px",
};

const divider = {
  borderColor: "#E2E8F0",
  margin: "0 0 24px 0",
};

const footerText = {
  color: "#64748B",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "0 0 12px 0",
  textAlign: "center" as const,
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

const link = {
  color: "#6B46C1",
  textDecoration: "none",
};

const copyrightText = {
  color: "#94A3B8",
  fontSize: "12px",
  lineHeight: "20px",
  margin: "16px 0 4px 0",
  textAlign: "center" as const,
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

const addressText = {
  color: "#94A3B8",
  fontSize: "12px",
  lineHeight: "20px",
  margin: "0",
  textAlign: "center" as const,
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

const unsubscribeText = {
  color: "#94A3B8",
  fontSize: "11px",
  lineHeight: "16px",
  margin: "16px 0 0 0",
  textAlign: "center" as const,
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

const unsubscribeLink = {
  color: "#94A3B8",
  textDecoration: "underline",
};
