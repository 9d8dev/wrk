import { LenisProvider } from "@/components/providers/lenis-provider";

export default function PublicLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <LenisProvider>{children}</LenisProvider>;
}
