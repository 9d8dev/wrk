import Link from "next/link";

import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => {
  return (
    <Link
      href="/"
      className={cn(
        "block tracking-tighter font-extrabold text-4xl",
        className
      )}
    >
      WRK.SO
    </Link>
  );
};
