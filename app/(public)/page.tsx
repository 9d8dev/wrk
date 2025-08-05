import type { StaticImageData } from "next/image";

// import { YouTubeEmbed } from "@next/third-parties/google";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Container, Section } from "@/components/ds";
import { Logo } from "@/components/logo";

import Masonry from "@/public/examples/masonry.jpg";
import Minimal from "@/public/examples/minimal.jpg";
import Square from "@/public/examples/square.jpg";
import Grid from "@/public/examples/grid.jpg";
import Bg from "@/public/home.webp";

const examplePortfolios: {
  title: string;
  href: string;
  image: StaticImageData;
}[] = [
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

export default function Home() {
  return (
    <main className="flex flex-col tracking-tight">
      <Section className="divide-y !py-0">
        <Container className="bg-accent/30 border-x">
          <nav>
            <div className="flex items-center justify-between gap-6 text-lg">
              <div className="flex items-center gap-2">
                <Logo width={24} />
              </div>
              <div className="flex justify-between gap-4 font-bold uppercase">
                <Link
                  className="text-muted-foreground hover:text-foreground"
                  href="/sign-in?tab=login"
                >
                  Login
                </Link>
                <Link
                  className="flex items-center gap-1 text-orange-500 hover:text-orange-700"
                  href="/sign-in?tab=signup"
                >
                  Create Account{" "}
                  <span className="rounded bg-orange-500 px-1 py-0.5 text-xs text-white">
                    FREE
                  </span>
                </Link>
              </div>
            </div>
          </nav>
        </Container>

        <Container className="bg-grid space-y-6 border-x font-bold uppercase">
          <h1 className="text-5xl leading-[0.9] text-balance sm:text-6xl md:text-9xl">
            <span className="text-muted-foreground">Wrk.so /</span> Portfolios
            for Creatives
          </h1>
          <h2 className="text-muted-foreground text-xl text-balance md:text-3xl">
            A platform for creatives to showcase their work and capture
            opportunities.
          </h2>
        </Container>

        <Container className="bg-border border-x !p-0">
          <h3 className="sr-only">Examples</h3>
          <div className="grid gap-px sm:grid-cols-2">
            {examplePortfolios.map((example) => (
              <Link
                className="bg-background hover:bg-accent space-y-4 p-4 transition-colors"
                key={example.href}
                href={example.href}
              >
                <Image
                  src={example.image}
                  alt={example.title}
                  placeholder="blur"
                />
                <div className="flex items-center justify-between gap-2 uppercase">
                  <h4 className="font-semibold">{example.title}</h4>
                  <p className="text-muted-foreground flex items-center gap-1">
                    View Demo <ArrowUpRight size={14} />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Container>

        <Container className="border-x !p-0">
          <div className="grid md:grid-cols-2">
            <div className="border-r p-6">
              <h3 className="mb-4 text-2xl font-bold uppercase">
                A Creative-first Portfolio site so you can show your work.
              </h3>
              <div className="space-y-6 text-lg">
                <div>
                  <h4 className="mb-1 font-bold uppercase">For Creatives</h4>
                  <ul className="space-y-1">
                    <li>- Four unique grid layouts</li>
                    <li>- Drag & drop project reordering</li>
                    <li>- High-resolution image optimization</li>
                    <li>- Custom username URLs</li>
                    <li>- Mobile-responsive design</li>
                  </ul>
                </div>

                <div>
                  <h4 className="mb-1 font-bold uppercase">Smart Features</h4>
                  <ul className="space-y-1">
                    <li>- AI-powered description generation</li>
                    <li>- Advanced analytics & insights</li>
                    <li>- Contact forms & lead management</li>
                    <li>- SEO optimization built-in</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex h-full flex-col">
              <div className="bg-accent border-b p-6">
                <h3 className="text-3xl font-bold uppercase">
                  It&apos;s <span className="text-orange-500">free</span> to
                  create an account. You don&apos;t need an invite. You just
                  need to{" "}
                  <span className="text-orange-500">
                    <Link href="/sign-in?tab=signup">share your work!</Link>
                  </span>
                </h3>
              </div>

              <div className="h-full p-6">
                <h4 className="mb-6 text-xl font-bold uppercase">
                  Paid Features (Optional)
                </h4>
                <div className="space-y-4 text-lg">
                  <div className="rounded border p-4">
                    <h5 className="mb-2 font-bold">Custom Domains</h5>
                    <p className="text-muted-foreground text-base">
                      Connect your own domain with automatic SSL.
                    </p>
                  </div>

                  <div className="rounded border p-4">
                    <h5 className="mb-2 font-bold">Support the Community</h5>
                    <p className="text-muted-foreground text-base">
                      Help us grow and support the community.
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-end gap-2">
                    <p className="text-muted-foreground text-sm uppercase">
                      That will cost
                    </p>
                    <p className="text-2xl font-bold">$12/month</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>

        {/* TODO: add in after video is made */}
        {/* <Container className="grid border-x !p-0 md:grid-cols-[auto_1fr]">
          <div className="bg-accent/50 space-y-3 p-6 md:max-w-lg">
            <h3 className="text-4xl font-bold text-balance uppercase">
              Watch a demo of the platform in action.
            </h3>
            <p className="text-muted-foreground text-2xl font-semibold">
              Always be ready when someone asks you to show your work.
            </p>
          </div>
          <div className="border-l p-6">
            <YouTubeEmbed videoid="ogfYd705cRs" params="controls=0" />
          </div>
        </Container> */}

        <Container className="border-x !p-0">
          <div className="bg-border grid gap-px md:grid-cols-3">
            <div className="bg-background flex flex-col items-start space-y-3 p-8">
              <div className="text-4xl font-bold text-orange-500">1</div>
              <h4 className="text-xl font-bold uppercase">Create Account</h4>
              <p className="text-muted-foreground">
                Sign up with GitHub, Google, or email. No invite needed,
                completely free to start.
              </p>
            </div>

            <div className="bg-background flex-col items-start space-y-3 p-8">
              <div className="text-4xl font-bold text-orange-500">2</div>
              <h4 className="text-xl font-bold uppercase">Upload Your Work</h4>
              <p className="text-muted-foreground">
                Drag and drop your images, choose a layout, and let our AI help
                write descriptions.
              </p>
            </div>

            <div className="bg-background flex-col items-start space-y-3 p-8">
              <div className="text-4xl font-bold text-orange-500">3</div>
              <h4 className="text-xl font-bold uppercase">Share & Connect</h4>
              <p className="text-muted-foreground">
                Get your custom URL and start sharing your portfoliso with the
                world.
              </p>
            </div>
          </div>
        </Container>

        <Container className="relative flex flex-col items-end gap-32 border-x">
          <h3 className="text-4xl font-bold uppercase">
            Create your portfolio in minutes
          </h3>
          <div className="flex gap-4 text-xl font-bold uppercase">
            <Link
              className="text-muted-foreground hover:text-foreground"
              href="/sign-in?tab=login"
            >
              Login
            </Link>
            <Link
              className="flex items-center gap-1 text-orange-500 hover:text-orange-700"
              href="/sign-in?tab=signup"
            >
              Create Account{" "}
              <span className="rounded bg-orange-500 px-1 py-0.5 text-xs text-white">
                FREE
              </span>
            </Link>
          </div>
          <Image
            src={Bg}
            alt="Wrk.so"
            fill
            className="-z-10 object-cover dark:invert"
          />
        </Container>

        <Container className="bg-accent/30 border-x">
          <footer>
            <div className="flex items-center justify-between gap-4">
              <div className="text-muted-foreground space-y-1">
                <p className="text-sm uppercase">
                  Created by <a href="https://9d8.dev">9d8</a>
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <Link href="/privacy">Privacy Policy</Link>
                  <Link href="/terms">Terms of Service</Link>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <p className="text-muted-foreground text-sm">
                  © 2025 Wrk.so. All rights reserved.
                </p>
                <ThemeToggle />
              </div>
            </div>
          </footer>
        </Container>
      </Section>
    </main>
  );
}
