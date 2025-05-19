import { Section, Container } from "@/components/ds";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileFooter } from "@/components/profile/profile-footer";

import Image from "next/image";
import Link from "next/link";

import { getProjectsByUsername } from "@/lib/data/project";
import { notFound } from "next/navigation";

import {
  getFeaturedImageByProjectId,
  getAllProjectImages,
} from "@/lib/data/media";
import { getAllUsers } from "@/lib/data/user";

export async function generateStaticParams() {
  const users = await getAllUsers();
  return users.map((user) => ({ username: user.username }));
}

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const allProjects = await getProjectsByUsername(username);

  if (!allProjects) {
    return notFound();
  }

  const projects = await Promise.all(
    allProjects.map(async (project) => {
      const featuredImage = await getFeaturedImageByProjectId(project.id);
      const allImages = await getAllProjectImages(project.id);
      return { project, featuredImage, allImages };
    })
  );

  return (
    <>
      <ProfileHeader username={username} />
      <Section>
        <Container className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.project.id}
              href={`/${username}/${project.project.slug}`}
            >
              <Image
                className="hover:opacity-75 transition-opacity"
                src={project.featuredImage?.url || ""}
                alt={project.project.title}
                width={project.featuredImage?.width || 96}
                height={project.featuredImage?.height || 96}
              />
            </Link>
          ))}
        </Container>
      </Section>
      <ProfileFooter username={username} />
    </>
  );
}
