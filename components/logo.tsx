import LogoLightMode from "@/public/logo.svg";
import LogoDarkMode from "@/public/logo-white.svg";
import Image from "next/image";
import Link from "next/link";

export const Logo = ({
  href = "/",
  width = 72,
  className,
}: {
  href?: string;
  width?: number;
  className?: string;
}) => {
  return (
    <Link href={href} className={className}>
      <Image
        width={width}
        src={LogoLightMode}
        alt="Logo"
        className="block dark:hidden"
      />
      <Image
        width={width}
        src={LogoDarkMode}
        alt="Logo"
        className="hidden dark:block"
      />
    </Link>
  );
};
