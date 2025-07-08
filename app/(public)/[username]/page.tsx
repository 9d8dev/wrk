import { isNotNull } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ds";
import {
	MasonryGrid,
	MinimalGrid,
	SquareGrid,
	StandardGrid,
} from "@/components/profile/grids";
import { ProfileFooter } from "@/components/profile/profile-footer";
import { ProfileHeader } from "@/components/profile/profile-header";
import { db } from "@/db/drizzle";
import { user } from "@/db/schema";
import { getThemeByUsername } from "@/lib/actions/theme";
import {
	getAllProjectImages,
	getFeaturedImageByProjectId,
} from "@/lib/data/media";
import { getProfileByUsername } from "@/lib/data/profile";
import { getProjectsByUsername } from "@/lib/data/project";
import { usernameSchema } from "@/lib/data/schemas";
import { getUserByUsername } from "@/lib/data/user";

type Props = {
	params: Promise<{ username: string }>;
};

// Configure ISR with different strategies based on content type
export const revalidate = 180; // 3 minutes - more reasonable for UGC platforms

export async function generateStaticParams() {
	try {
		const users = await db
			.select({ username: user.username })
			.from(user)
			.where(isNotNull(user.username));

		// Return params for each username, filtering out invalid usernames
		return users
			.filter((u) => {
				if (!u.username) return false;
				// Validate username before adding to static params
				const usernameValidation = usernameSchema.safeParse(u.username);
				if (!usernameValidation.success) {
					console.warn(
						`Skipping invalid username "${u.username}" during static generation`,
					);
					return false;
				}
				return true;
			})
			.map((u) => ({
				username: u.username,
			}));
	} catch (error) {
		console.error("Error generating static params for username pages:", error);

		return [];
	}
}

// Metadata Generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { username } = await params;
	const profileResult = await getProfileByUsername(username);
	const userResult = await getUserByUsername(username);

	if (!userResult.success || !userResult.data) {
		return {
			title: "Portfolio | Wrk.so",
			description: "Portfolio created using Wrk.so.",
		};
	}

	const user = userResult.data;
	const profile = profileResult.success ? profileResult.data : null;

	return {
		title: `${user.name} | ${profile?.profile.title || "Wrk.so"}`,
		description:
			profile?.profile.bio ||
			`Collection of works created by ${user.name}. Portfolio created using Wrk.so.`,
	};
}

// Page
export default async function PortfolioPage({ params }: Props) {
	const { username } = await params;

	const projectsResult = await getProjectsByUsername(username);

	if (!projectsResult.success || projectsResult.data.items.length === 0) {
		return notFound();
	}

	const userTheme = await getThemeByUsername(username);
	const gridType = userTheme?.gridType || "masonry";

	const projects = await Promise.all(
		projectsResult.data.items.map(async (project) => {
			const featuredImageResult = await getFeaturedImageByProjectId(project.id);
			const allImagesResult = await getAllProjectImages(project.id);

			const featuredImage = featuredImageResult.success
				? featuredImageResult.data
				: null;
			const allImages = allImagesResult.success ? allImagesResult.data : [];

			return { project, featuredImage, allImages };
		}),
	);

	// Render the appropriate grid based on theme selection
	const renderGrid = () => {
		switch (gridType) {
			case "masonry":
				return <MasonryGrid projects={projects} username={username} />;
			case "grid":
				return <StandardGrid projects={projects} username={username} />;
			case "minimal":
				return <MinimalGrid projects={projects} username={username} />;
			case "square":
				return <SquareGrid projects={projects} username={username} />;
			default:
				return <MasonryGrid projects={projects} username={username} />;
		}
	};

	return (
		<>
			<ProfileHeader username={username} />
			<Section>
				<Container>{renderGrid()}</Container>
			</Section>
			<ProfileFooter username={username} />
		</>
	);
}
