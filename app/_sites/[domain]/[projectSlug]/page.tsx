import { ArrowUpLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ds";
import { ProfileFooter } from "@/components/profile/profile-footer";
import { ProfileHeader } from "@/components/profile/profile-header";
import { AsyncImage } from "@/components/ui/async-image";
import {
	getAllProjectImages,
	getFeaturedImageByProjectId,
} from "@/lib/data/media";
import { getProjectByUsernameAndSlug } from "@/lib/data/project";
import { getUserByCustomDomain } from "@/lib/data/user";

type Props = {
	params: Promise<{ domain: string; projectSlug: string }>;
};

// Metadata Generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { domain, projectSlug } = await params;

	// Get user by custom domain
	const userResult = await getUserByCustomDomain(domain);

	if (!userResult.success || !userResult.data) {
		return {
			title: "Project | Wrk.so",
			description: "Portfolio project created using Wrk.so.",
		};
	}

	const user = userResult.data;
	const username = user.username;

	const projectResult = await getProjectByUsernameAndSlug(
		username,
		projectSlug,
	);

	if (!projectResult.success || !projectResult.data) {
		return {
			title: "Project | Wrk.so",
			description: "Portfolio project created using Wrk.so.",
		};
	}
	const project = projectResult.data.project;

	const featuredImageResult = await getFeaturedImageByProjectId(project.id);
	const featuredImage = featuredImageResult.success
		? featuredImageResult.data
		: null;

	return {
		title: `${project.title} | ${user.name}`,
		description:
			project.about ||
			`${project.title} by ${user.name}. Portfolio project created using Wrk.so.`,
		openGraph: {
			title: `${project.title} | ${user.name}`,
			description: project.about || `${project.title} by ${user.name}`,
			images: featuredImage ? [featuredImage.url] : [],
		},
	};
}

// Page Component
export default async function CustomDomainProjectPage({ params }: Props) {
	const { domain, projectSlug } = await params;

	// Get user by custom domain (includes Pro subscription validation)
	const userResult = await getUserByCustomDomain(domain);

	if (!userResult.success || !userResult.data) {
		return notFound();
	}

	const user = userResult.data;
	const username = user.username;

	// Get the specific project
	const projectResult = await getProjectByUsernameAndSlug(
		username,
		projectSlug,
	);

	if (!projectResult.success || !projectResult.data) {
		return notFound();
	}

	const project = projectResult.data.project;

	// Get project images
	const featuredImageResult = await getFeaturedImageByProjectId(project.id);
	const allImagesResult = await getAllProjectImages(project.id);

	const featuredImage = featuredImageResult.success
		? featuredImageResult.data
		: null;
	const allImages = allImagesResult.success ? allImagesResult.data : [];

	return (
		<>
			<ProfileHeader username={username} />
			<Section>
				<Container>
					<div className="max-w-4xl mx-auto">
						{/* Back Button */}
						<Link
							href={`/`}
							className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-8 transition-colors"
						>
							<ArrowUpLeft className="w-4 h-4" />
							Back to portfolio
						</Link>

						{/* Project Header */}
						<div className="mb-8">
							<h1 className="text-3xl font-bold mb-4">{project.title}</h1>
							{project.about && (
								<p className="text-gray-600 text-lg leading-relaxed">
									{project.about}
								</p>
							)}
							{project.externalLink && (
								<a
									href={project.externalLink}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-800 transition-colors"
								>
									View Project →
								</a>
							)}
						</div>

						{/* Project Images */}
						<div className="space-y-8">
							{/* Featured Image */}
							{featuredImage && (
								<div className="w-full">
									<AsyncImage
										src={featuredImage.url}
										alt={project.title}
										width={featuredImage.width || 800}
										height={featuredImage.height || 600}
										className="w-full h-auto rounded-lg"
									/>
								</div>
							)}

							{/* Additional Images */}
							{allImages.length > 0 && (
								<div className="grid gap-8">
									{allImages
										.filter((img) => img.id !== featuredImage?.id)
										.map((image) => (
											<div key={image.id} className="w-full">
												<AsyncImage
													src={image.url}
													alt={`${project.title} - ${image.alt || "Project image"}`}
													width={image.width || 800}
													height={image.height || 600}
													className="w-full h-auto rounded-lg"
												/>
											</div>
										))}
								</div>
							)}
						</div>
					</div>
				</Container>
			</Section>
			<ProfileFooter username={username} />
			{/* No branding for Pro users on custom domains */}
		</>
	);
}
