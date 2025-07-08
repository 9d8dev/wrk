import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { PostHogUserIdentifier } from "@/components/analytics/posthog-user-identifier";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { getSession } from "@/lib/actions/auth";
import { hasActiveProSubscription } from "@/lib/actions/polar";
import { polarConfig } from "@/lib/config/polar";
import { getUserById } from "@/lib/data/user";

async function getAdminData() {
	const session = await getSession();

	if (!session?.user) {
		redirect("/sign-in");
	}

	if (!session.user.username) {
		redirect("/onboarding");
	}

	const userResult = await getUserById(session.user.id);
	if (!userResult.success || !userResult.data) {
		redirect("/sign-in");
	}

	const userData = userResult.data;

	let isPro = false;

	try {
		isPro = await hasActiveProSubscription();
	} catch (error) {
		console.error("Failed to check Pro subscription status:", error);
	}

	const productInfo = polarConfig.products[0]
		? {
				slug: polarConfig.products[0].slug,
				name: polarConfig.products[0].name,
				description: polarConfig.products[0].description,
				features: polarConfig.products[0].features,
				price: polarConfig.products[0].price,
			}
		: undefined;

	return {
		userData,
		isPro,
		productInfo,
		userName: session.user.name || "User",
		userEmail: session.user.email || "",
		userUsername: session.user.username || "",
	};
}

function AdminErrorFallback({ error }: { error: Error }) {
	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<div className="max-w-md p-6 border border-destructive/50 rounded-lg bg-destructive/10">
				<h2 className="text-lg font-semibold text-destructive mb-2">
					Something went wrong
				</h2>
				<p className="text-sm text-muted-foreground">
					{error.message ||
						"An unexpected error occurred. Please try refreshing the page."}
				</p>
			</div>
		</div>
	);
}

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	try {
		const { userData, isPro, productInfo, userName, userEmail, userUsername } =
			await getAdminData();

		return (
			<SidebarProvider>
				<PostHogUserIdentifier user={userData} />
				<AdminSidebar
					name={userName}
					username={userUsername}
					email={userEmail}
					isPro={isPro}
					productInfo={productInfo}
				/>
				<main id="admin-page" className="relative w-full">
					{children}
					<SidebarTrigger className="fixed bottom-2 ml-2 left-[sidebar-size] z-50" />
				</main>
			</SidebarProvider>
		);
	} catch (error) {
		console.error("Admin layout error:", error);

		if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
			throw error;
		}

		return <AdminErrorFallback error={error as Error} />;
	}
}
