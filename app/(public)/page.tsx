import { Section, Container } from "@/components/ds";
import { Logo } from "@/components/logo";

import Link from "next/link";

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
    <main className="h-screen overflow-hidden flex flex-col tracking-tight">
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

        <Container className="space-y-6 border-x bg-accent/30 uppercase">
          <h1 className="text-3xl font-bold">
            <span className="text-muted-foreground">Wrk.so /</span> Portfolios
            for Creatives
          </h1>
        </Container>

        <Container className="border-x bg-accent/30">
          <h3 className="sr-only">Examples</h3>
          <div className="flex justify-center gap-2">
            {examples.map((example) => (
              <Link key={example.href} href={example.href}>
                [ {example.title}↗ ]
              </Link>
            ))}
          </div>
        </Container>

        <Container className="border-x bg-accent/30">
          <footer>
            <div className="flex justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                Created by <a href="https://wip.is">WIP</a>
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
