import { Section, Container } from "@/components/ds";
import { Logo } from "@/components/logo";

import Link from "next/link";
import Image from "next/image";

import Grid from "@/public/examples/grid.jpg";
import Masonry from "@/public/examples/masonry.jpg";
import Square from "@/public/examples/square.jpg";
import Minimal from "@/public/examples/minimal.jpg";

const examples = [
  {
    title: "Masonry",
    href: "/masonry",
    image: Masonry,
  },
  {
    title: "Grid",
    href: "/grid",
    image: Grid,
  },
  {
    title: "Square",
    href: "/square",
    image: Square,
  },
  {
    title: "Minimal",
    href: "/minimal",
    image: Minimal,
  },
];

export const dynamic = "force-static";

export default function Home() {
  return (
    <main className="flex flex-col tracking-tight">
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
                  className="text-orange-500 hover:text-orange-700"
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
          <div className="grid gap-px sm:grid-cols-2">
            {examples.map((example) => (
              <Link
                className="p-4 bg-background hover:bg-accent transition-colors space-y-4"
                key={example.href}
                href={example.href}
              >
                <Image
                  src={example.image}
                  alt={example.title}
                  placeholder="blur"
                />
                <h4 className="uppercase">{example.title}</h4>
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
