import "./globals.css";

import { Inter as FontSans, Geist_Mono as FontMono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import type { Metadata } from "next";

const fontSans = FontSans({
  variable: "--font-font-sans",
  subsets: ["latin"],
});

const fontMono = FontMono({
  variable: "--font-font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wrk.so",
  description: "A place for creatives to share their work.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
