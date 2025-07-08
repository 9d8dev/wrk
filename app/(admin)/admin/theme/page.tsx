import { AdminHeader } from "@/components/admin/admin-header";
import { PageWrapper } from "@/components/admin/page-wrapper";
import { ThemeForm } from "@/components/admin/theme-form";
import { redirect } from "next/navigation";
import { getThemeByUserId } from "@/lib/actions/theme";
import { getSession } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";

async function getThemeData(userId: string) {
	try {
		const theme = await getThemeByUserId(userId);
		return theme;
	} catch (error) {
		console.error("Error fetching theme data:", error);
		return null;
	}
}

export default async function ThemePage() {
	const session = await getSession();

	if (!session?.user) {
		redirect("/sign-in");
	}

	const theme = await getThemeData(session.user.id);

	return (
		<>
			<AdminHeader pageTitle="Theme" />
			<PageWrapper>
				<ThemeForm user={session.user} theme={theme} />
			</PageWrapper>
		</>
	);
}
