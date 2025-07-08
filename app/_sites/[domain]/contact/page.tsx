import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ds";
import { ContactForm } from "@/components/profile/contact-form";
import { ProfileFooter } from "@/components/profile/profile-footer";
import { ProfileHeader } from "@/components/profile/profile-header";
import { getProfileByUsername } from "@/lib/data/profile";
import { getUserByCustomDomain } from "@/lib/data/user";

type Props = {
	params: Promise<{ domain: string }>;
};

// Metadata Generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { domain } = await params;

	// Get user by custom domain
	const userResult = await getUserByCustomDomain(domain);

	if (!userResult.success || !userResult.data) {
		return {
			title: "Contact | Wrk.so",
			description: "Get in touch via Wrk.so.",
		};
	}

	const user = userResult.data;
	const profileResult = await getProfileByUsername(user.username);
	const profile = profileResult.success ? profileResult.data : null;

	return {
		title: `Contact ${user.name} | ${profile?.profile.title || user.name}`,
		description: `Get in touch with ${user.name}. Send a message through their portfolio contact form.`,
	};
}

// Page Component
export default async function CustomDomainContactPage({ params }: Props) {
	const { domain } = await params;

	// Get user by custom domain (includes Pro subscription validation)
	const userResult = await getUserByCustomDomain(domain);

	if (!userResult.success || !userResult.data) {
		return notFound();
	}

	const user = userResult.data;
	const username = user.username;
	const userId = user.id;

	// Get profile for additional context
	const profileResult = await getProfileByUsername(username);
	const profile = profileResult.success ? profileResult.data : null;

	return (
		<>
			<ProfileHeader username={username} />
			<Section>
				<Container>
					<div className="max-w-2xl mx-auto">
						<div className="text-center mb-12">
							<h1 className="text-3xl font-bold mb-4">Get in Touch</h1>
							<p className="text-gray-600 text-lg">
								{profile?.profile.bio
									? `Have a project in mind? I'd love to hear from you.`
									: `Send me a message and I'll get back to you soon.`}
							</p>
						</div>

						<ContactForm userId={userId} portfolioOwner={username} />
					</div>
				</Container>
			</Section>
			<ProfileFooter username={username} />
			{/* No branding for Pro users on custom domains */}
		</>
	);
}
