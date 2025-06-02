import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";

import { Section, Container, Prose } from "@/components/ds";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

import Image from "next/image";
import Link from "next/link";
import LogoSvg from "@/public/logo.svg";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();

  if (session?.user) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen flex flex-col bg-accent">
      <nav>
        <Section>
          <Container>
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Logo width={24} />
              </div>
              <p className="text-sm text-muted-foreground">Wrk.so</p>
            </div>
          </Container>
        </Section>
      </nav>

      <Section className="flex-1 flex items-center justify-center">
        <Container className="space-y-6 text-center">
          <h1 className="font-medium">Portfolios for Creatives</h1>
          <div className="flex gap-9">
            <Link
              className="text-muted-foreground hover:text-primary"
              href="/sign-in?tab=signup"
            >
              Sign Up -{">"}
            </Link>
            <Link
              className="text-muted-foreground hover:text-primary"
              href="/sign-in?tab=login"
            >
              Login -{">"}
            </Link>
          </div>
        </Container>
      </Section>

      {/* Footer */}
      <footer>
        <Section>
          <Container>
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Logo width={24} />
              </div>
              <p className="text-sm text-muted-foreground">
                © 2024 Wrk.so. All rights reserved.
              </p>
            </div>
          </Container>
        </Section>
      </footer>
    </main>
  );
}
