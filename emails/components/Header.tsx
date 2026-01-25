import {
  Img,
  Section,
  Text,
} from "@react-email/components";

export function Header() {
  return (
    <Section style={headerStyle}>
      <Text style={logoText}>✨ Before Bedtime Adventures ✨</Text>
      <Text style={tagline}>Magical Stories From Your Family Memories</Text>
    </Section>
  );
}

const headerStyle = {
  backgroundColor: "#6B46C1",
  padding: "32px 24px",
  textAlign: "center" as const,
  borderRadius: "8px 8px 0 0",
};

const logoText = {
  color: "#FFFFFF",
  fontSize: "24px",
  fontWeight: "bold" as const,
  margin: "0 0 8px 0",
  fontFamily: "'Georgia', serif",
};

const tagline = {
  color: "#E9D8FD",
  fontSize: "14px",
  margin: "0",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};
