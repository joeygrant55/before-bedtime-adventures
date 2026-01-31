import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Before Bedtime Adventures",
  description: "Turn your vacation photos into magical children's storybooks",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Before Bedtime Adventures",
    description: "Turn your vacation photos into magical children's storybooks",
    images: ["/og-image.png"],
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
