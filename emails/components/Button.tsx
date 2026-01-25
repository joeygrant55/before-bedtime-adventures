import { Button as ReactEmailButton } from "@react-email/components";

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}

export function Button({ href, children, variant = "primary" }: ButtonProps) {
  const style = variant === "primary" ? primaryButtonStyle : secondaryButtonStyle;

  return (
    <ReactEmailButton href={href} style={style}>
      {children}
    </ReactEmailButton>
  );
}

const primaryButtonStyle = {
  backgroundColor: "#6B46C1",
  borderRadius: "8px",
  color: "#FFFFFF",
  fontSize: "16px",
  fontWeight: "bold" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

const secondaryButtonStyle = {
  backgroundColor: "#FFFFFF",
  borderRadius: "8px",
  border: "2px solid #6B46C1",
  color: "#6B46C1",
  fontSize: "16px",
  fontWeight: "bold" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 30px",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};
