import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";

import { Section, Container } from "@/components/ds";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

import Image from "next/image";
import Link from "next/link";
import LogoSvg from "@/public/logo.svg";

export default async function Home() {
  const session = await getSession();

  if (session?.user) {
    redirect("/admin");
  }

  return (
    <Section>
      <Container className="flex flex-col gap-24 items-center">
        <div className="flex items-center gap-8">
          <Image src={LogoSvg} alt="Wrk.so" width={32} height={42} />
          <Logo />
        </div>

        {session ? (
          <Button asChild>
            <Link href="/admin">Admin</Link>
          </Button>
        ) : (
          <div className="space-x-2">
            <Button asChild>
              <Link href="/sign-in">Create an Account</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/sign-in">Login</Link>
            </Button>
          </div>
        )}
      </Container>
    </Section>
  );
}
