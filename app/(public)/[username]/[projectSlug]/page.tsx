import { getFeaturedImageByProjectId } from "@/lib/data/media";
import { getProjectByUsernameAndSlug } from "@/lib/data/project";
import { notFound } from "next/navigation";

import Image from "next/image";

import { Container, Section } from "@/components/ds";

import type { Project } from "@/db/schema";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ username: string; projectSlug: string }>;
}) {
  const { username, projectSlug } = await params;

  const project = await getProjectByUsernameAndSlug(username, projectSlug);

  if (!project) {
    return notFound();
  }

  const featuredImage = await getFeaturedImageByProjectId(project.id);

  return (
    <Section>
      <Container>
        <div>
          <Image
            src={featuredImage?.url || ""}
            alt={featuredImage?.alt || project.title}
            width={featuredImage?.width || 0}
            height={featuredImage?.height || 0}
          />
        </div>

        <div>
          <ProjectContent content={project.content} />
        </div>
      </Container>
    </Section>
  );
}

function ProjectContent({ content }: { content: Project["content"] }) {
  if (!content) return null;

  if (typeof content === "string") {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }

  try {
    const contentString = JSON.stringify(content, null, 2);
    return <pre className="whitespace-pre-wrap">{contentString}</pre>;
  } catch (error) {
    console.error("Error rendering project content:", error);
    return <div>Content could not be displayed</div>;
  }
}
