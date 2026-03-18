import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LicenseProvider } from "@/components/LicenseContext";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ObsidiTube — YouTube Playlists → Obsidian Cards",
  description:
    "Convert any YouTube playlist into beautifully formatted Obsidian checklist cards, instantly.",
  openGraph: {
    title: "ObsidiTube",
    description: "YouTube Playlists → Obsidian Cards",
    url: "https://obsiditube.vercel.app",
    siteName: "ObsidiTube",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ObsidiTube",
    description: "YouTube Playlists → Obsidian Cards",
    images: ["/api/og"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <LicenseProvider>
          {children}
          <Toaster position="top-center" richColors />
        </LicenseProvider>
      </body>
    </html>
  );
}
