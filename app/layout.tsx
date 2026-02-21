import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://before-bedtime-adventures.vercel.app"),
  title: {
    default: "Before Bedtime Adventures",
    template: "%s | Before Bedtime Adventures",
  },
  description:
    "Turn your family vacation photos into Disney-style illustrated hardcover storybooks. Upload photos, AI transforms them into magical illustrations, and we print and ship a premium 8.5\" hardcover to your door.",
  keywords: [
    "children's storybook",
    "personalized photo book",
    "AI illustrated book",
    "vacation photo book",
    "custom kids book",
    "Disney style illustrations",
    "family memory book",
    "hardcover photo book",
  ],
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    url: "https://before-bedtime-adventures.vercel.app",
    title: "Before Bedtime Adventures — Turn Photos Into Storybooks",
    description:
      "Upload your vacation photos. AI transforms them into Disney-style illustrations. We print and ship a premium hardcover book to your door. $49.99, US shipping included.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Before Bedtime Adventures — Turn Photos Into Magical Storybooks",
      },
    ],
    siteName: "Before Bedtime Adventures",
  },
  twitter: {
    card: "summary_large_image",
    title: "Before Bedtime Adventures — Turn Photos Into Storybooks",
    description:
      "Upload vacation photos. AI transforms them into Disney-style illustrations. Premium hardcover shipped to your door. $49.99.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Fredoka:wght@400;700&family=Chewy&family=Poppins:wght@400;600&family=Lora:wght@400;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="antialiased">
          <ConvexClientProvider>
            <AnalyticsProvider>
              <ToastProvider>{children}</ToastProvider>
            </AnalyticsProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
