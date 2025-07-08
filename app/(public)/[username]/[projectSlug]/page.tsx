import { Container, Section } from "@/components/ds";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileFooter } from "@/components/profile/profile-footer";
import { AsyncImage } from "@/components/ui/async-image";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import { getProfileByUsername } from "@/lib/data/profile";
import { getUserByUsername } from "@/lib/data/user";
import { isNotNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { user } from "@/db/schema";
import { db } from "@/db/drizzle";

import {
	getProjectByUsernameAndSlug,
	getProjectsByUsername,
} from "@/lib/data/project";
import {
	getFeaturedImageByProjectId,
	getAllProjectImages,
} from "@/lib/data/media";
import Link from "next/link";

import type { Project, Media } from "@/db/schema";
import type { Metadata } from "next";

type Props = {
	params: Promise<{ username: string; projectSlug: string }>;
};

// SSG
export async function generateStaticParams() {
	try {
		// Get all users with usernames
		const users = await db
			.select({ username: user.username })
			.from(user)
			.where(isNotNull(user.username));

		// For each user, get their projects
		const params = [];
		for (const u of users) {
			if (!u.username) continue;

			const projectsResult = await getProjectsByUsername(u.username);
			if (projectsResult.success && projectsResult.data.items.length > 0) {
				for (const project of projectsResult.data.items) {
					params.push({
						username: u.username,
						projectSlug: project.slug,
					});
				}
			}
		}

		return params;
	} catch (error) {
		console.error("Error generating static params for project pages:", error);
		// Return empty array on error to fallback to on-demand generation
		return [];
	}
}

// Metadata Generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { username, projectSlug } = await params;
	const profileResult = await getProfileByUsername(username);
	const userResult = await getUserByUsername(username);
	const projectResult = await getProjectByUsernameAndSlug(
		username,
		projectSlug,
	);

	if (
		!userResult.success ||
		!userResult.data ||
		!projectResult.success ||
		!projectResult.data
	) {
		return {
			title: "Project | Wrk.so",
			description: "Portfolio project created using Wrk.so.",
		};
	}

	const user = userResult.data;
	const profile = profileResult.success ? profileResult.data : null;
	const project = projectResult.data.project;

	const featuredImageResult = await getFeaturedImageByProjectId(project.id);
	const allImagesResult = await getAllProjectImages(project.id);

	const featuredImage = featuredImageResult.success
		? featuredImageResult.data
		: null;
	const allImages = allImagesResult.success ? allImagesResult.data : [];
	const ogImage = featuredImage || (allImages.length > 0 ? allImages[0] : null);

	return {
		title: `${project.title} by ${user.name} | ${
			profile?.profile.title || "Wrk.so"
		}`,
		description:
			(project.about && project.about.length > 160
				? project.about.substring(0, 157) + "..."
				: project.about) ||
			`${project.title} created by ${user.name}. Portfolio created using Wrk.so.`,
		openGraph: ogImage
			? {
					images: [
						{
							url: ogImage.url,
							width: ogImage.width || 1200,
							height: ogImage.height || 630,
							alt: ogImage.alt || project.title || "Project image",
						},
					],
				}
			: undefined,
		twitter: ogImage
			? {
					card: "summary_large_image",
					images: [
						{
							url: ogImage.url,
							alt: ogImage.alt || project.title || "Project image",
						},
					],
				}
			: undefined,
	};
}

// Page
export default async function ProjectPage({ params }: Props) {
	const { username, projectSlug } = await params;
	const projectResult = await getProjectByUsernameAndSlug(
		username,
		projectSlug,
	);

	if (!projectResult.success || !projectResult.data) {
		return notFound();
	}

	const project = projectResult.data.project;
	const featuredImageResult = await getFeaturedImageByProjectId(project.id);
	const allImagesResult = await getAllProjectImages(project.id);

	const featuredImage = featuredImageResult.success
		? featuredImageResult.data
		: null;
	const allImages = allImagesResult.success ? allImagesResult.data : [];

	const mainImage =
		featuredImage || (allImages.length > 0 ? allImages[0] : null);

	const additionalImages = featuredImage
		? allImages.filter((img) => img.id !== featuredImage.id)
		: allImages.slice(1);

	return (
		<>
			<ProfileHeader username={username} />
			<Section>
				<FeaturedImage
					project={project}
					mainImage={mainImage}
					username={username}
				/>
				<ProjectDescription project={project} />
				<ProjectImages project={project} additionalImages={additionalImages} />
			</Section>
			<ProfileFooter username={username} />
		</>
	);
}

const ProjectDescription = ({ project }: { project: Project }) => {
	return (
		<Container>
			<div className="space-y-6 max-w-3xl mx-auto">
				<h1>{project.title}</h1>

				{project.about && (
					<div className="text-muted-foreground space-y-3">
						{project.about.split("\n\n").map((paragraph, index) => (
							<p key={index}>{paragraph}</p>
						))}
					</div>
				)}

				{project.externalLink && (
					<a
						href={project.externalLink}
						target="_blank"
						rel="noopener noreferrer"
						className="text-muted-foreground hover:text-foreground transition-color mt-4 flex items-center gap-1"
					>
						Visit Project <ArrowUpRight size={16} />
					</a>
				)}
			</div>
		</Container>
	);
};

const FeaturedImage = ({
	project,
	mainImage,
	username,
}: {
	project: Project;
	mainImage: Media | null;
	username: string;
}) => {
	return (
		<Container className="relative">
			<div className="space-y-4 max-w-3xl mx-auto">
				{mainImage && (
					<AsyncImage
						src={mainImage.url}
						alt={mainImage.alt || project.title}
						placeholder="shimmer"
						width={mainImage.width}
						height={mainImage.height}
					/>
				)}
			</div>
			<Link
				className="text-sm flex items-center gap-1 absolute top-6 left-6 text-muted-foreground hover:text-foreground transition-colors"
				href={`/${username}`}
			>
				<ArrowLeft size={12} />
				Back to Projects
			</Link>
		</Container>
	);
};

const ProjectImages = ({
	project,
	additionalImages,
}: {
	project: Project;
	additionalImages: Media[];
}) => {
	return (
		<Container>
			<div className="space-y-4 max-w-3xl mx-auto">
				{additionalImages.map((image) => (
					<AsyncImage
						key={image.id}
						src={image.url}
						alt={image.alt || `${project.title} image`}
						placeholder="shimmer"
						width={image.width}
						height={image.height}
					/>
				))}
			</div>
		</Container>
	);
};
