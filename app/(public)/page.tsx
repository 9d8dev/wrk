import { Section, Container } from "@/components/ds";
import { Logo } from "@/components/logo";

import Link from "next/link";
import Image from "next/image";
import Hero from "@/public/home.webp";

const examples = [
  {
    title: "Masonry",
    href: "/masonry",
  },
  {
    title: "Grid",
    href: "/grid",
  },
  {
    title: "Square",
    href: "/square",
  },
  {
    title: "Minimal",
    href: "/minimal",
  },
];

// Force static generation for the homepage
export const dynamic = "force-static";

export default function Home() {
  return (
    <main className="bg-grid h-screen overflow-hidden flex flex-col tracking-tight">
      <Section className="divide-y !py-0">
        <Container className="border-x bg-accent/30">
          <nav>
            <div className="flex justify-between items-center gap-6 text-lg">
              <div className="flex items-center gap-2">
                <Logo width={24} />
              </div>
              <div className="flex justify-between gap-4 uppercase font-semibold">
                <Link
                  className="text-muted-foreground hover:text-foreground"
                  href="/sign-in?tab=login"
                >
                  Login
                </Link>
                <Link
                  className="text-muted-foreground hover:text-foreground"
                  href="/sign-in?tab=signup"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </nav>
        </Container>

        <Container className="bg-grid space-y-6 border-x uppercase font-bold">
          <h1 className="text-6xl md:text-9xl text-balance leading-[0.9]">
            <span className="text-muted-foreground">Wrk.so /</span> Portfolios
            for Creatives
          </h1>
          <h2 className="text-xl md:text-3xl text-balance text-muted-foreground">
            A platform for creatives to showcase their work and capture
            opportunities.
          </h2>
        </Container>

        <Container className="!p-0 border-x bg-border">
          <h3 className="sr-only">Examples</h3>
          <div className="grid gap-[1.5px] sm:grid-cols-2">
            {examples.map((example) => (
              <Link
                className="p-6 bg-background hover:bg-accent/30 transition-colors"
                key={example.href}
                href={example.href}
              >
                [ {example.title}↗ ]
              </Link>
            ))}
          </div>
        </Container>

        <Container className="border-x bg-accent/30">
          <footer>
            <div className="flex justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                Created by <a href="https://wip.ac">WIP</a>
              </p>
              <p className="text-sm text-muted-foreground">
                © 2025 Wrk.so. All rights reserved.
              </p>
            </div>
          </footer>
        </Container>
      </Section>
    </main>
  );
}
