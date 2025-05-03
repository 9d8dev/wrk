import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";

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
    <main className="space-y-12 p-6">
      <div className="flex items-center gap-8">
        <Image src={LogoSvg} alt="Wrk.so" width={32} height={42} />
        <Logo />
      </div>

      {session ? (
        <Button asChild>
          <Link href="/admin">Admin</Link>
        </Button>
      ) : (
        <Button asChild>
          <Link href="/sign-in">Sign In</Link>
        </Button>
      )}
    </main>
  );
}
