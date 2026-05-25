// Root layout — wraps every page in the app router. Loads the two Geist
// font families as CSS variables (consumed in globals.css), declares the
// site-wide SEO metadata, and renders the basic <html>/<body> shell.
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Eventra — run unforgettable IT events",
    template: "%s · Eventra",
  },
  description:
    "Eventra is the all-in-one platform to plan, launch and grow tech conferences, meetups and summits — registration, fast check-in, attendee networking, email campaigns and real-time analytics.",
  applicationName: "Eventra",
  keywords: [
    "event platform",
    "IT events",
    "conference software",
    "event registration",
    "check-in app",
    "attendee networking",
  ],
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Eventra",
    title: "Eventra — run unforgettable IT events",
    description:
      "Plan, launch and grow tech conferences, meetups and summits — registration, check-in, networking and analytics in one platform.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eventra — run unforgettable IT events",
    description:
      "Plan, launch and grow tech conferences, meetups and summits — all in one platform.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#060608" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-dvh bg-background text-foreground font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
