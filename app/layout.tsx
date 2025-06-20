import "./globals.css";
import "lenis/dist/lenis.css";

import { Geist as FontSans, Geist_Mono as FontMono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { PostHogWrapper, PostHogPageView } from "@/components/analytics";
import { Suspense } from "react";

import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme/theme-provider";

const fontSans = FontSans({
  variable: "--font-font-sans",
  subsets: ["latin"],
});

const fontMono = FontMono({
  variable: "--font-font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wrk.so / Portfolios for Creatives",
  description: "A place for creatives to share their work.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PostHogWrapper>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${fontSans.variable} ${fontMono.variable} font-sans font-light leading-tight antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Suspense fallback={null}>
              <PostHogPageView />
            </Suspense>
            {children}
            <Analytics />
          </ThemeProvider>
        </body>
      </html>
    </PostHogWrapper>
  );
}
