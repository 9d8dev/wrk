import Link from "next/link";

import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => {
  return (
    <Link
      href="/"
      className={cn("tracking-tighter font-bold text-2xl", className)}
    >
      WRK.SO
    </Link>
  );
};
