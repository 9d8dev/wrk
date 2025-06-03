import { Section, Container } from "@/components/ds";
import { Logo } from "@/components/logo";

import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";

import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();

  if (session?.user) {
    redirect("/admin");
  }

  return (
    <main className="h-screen overflow-hidden flex flex-col bg-accent font-mono">
      <nav>
        <Section className="!p-0">
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
          <div className="flex justify-between gap-2">
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
        <Section className="!p-0">
          <Container>
            <div className="flex justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                Created by <a href="https://wip.is">WIP</a>
              </p>
              <p className="text-sm text-muted-foreground">
                © 2025 Wrk.so. All rights reserved.
              </p>
            </div>
          </Container>
        </Section>
      </footer>
    </main>
  );
}
