import type { Project } from "@/types";

import { redirect } from "next/navigation";

import { QuickCreateProject } from "@/components/admin/quick-create-project";
import { CreateProject } from "@/components/admin/create-project";
import { AdminHeader } from "@/components/admin/admin-header";
import { PageWrapper } from "@/components/admin/page-wrapper";
import { ProjectList } from "@/components/admin/project-list";

import {
  getAllProjectImages,
  getFeaturedImageByProjectId,
} from "@/lib/data/media";
import { getProfileByUserId } from "@/lib/data/profile";
import { getAllProjects } from "@/lib/data/project";
import { getSession } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";

async function checkUserProfile(userId: string) {
  const profileResult = await getProfileByUserId(userId);
  return {
    needsOnboarding: !profileResult.success || !profileResult.data,
    profile: profileResult.success ? profileResult.data : null,
  };
}

async function enrichProjectWithImages(project: Project) {
  try {
    const [featuredImageResult, allImagesResult] = await Promise.all([
      getFeaturedImageByProjectId(project.id),
      getAllProjectImages(project.id),
    ]);

    const featuredImage = featuredImageResult.success
      ? featuredImageResult.data
      : null;
    const allImages = allImagesResult.success ? allImagesResult.data : [];

    const additionalImages = featuredImage
      ? allImages.filter((img) => img.id !== featuredImage.id)
      : allImages;

    return {
      project,
      featuredImage,
      additionalImages,
    };
  } catch (error) {
    console.error(`Failed to load images for project ${project.id}:`, error);
    return {
      project,
      featuredImage: null,
      additionalImages: [],
    };
  }
}

// Main data fetching function - now cleaner and more focused
async function getAdminPageData(userId: string) {
  // Check profile first
  const { needsOnboarding } = await checkUserProfile(userId);
  if (needsOnboarding) {
    return { needsOnboarding: true, projects: [] };
  }

  // Get projects
  const projectsResult = await getAllProjects(userId);
  if (!projectsResult.success) {
    console.error("Error fetching projects:", projectsResult.error);
    return { needsOnboarding: false, projects: [] };
  }

  // Enrich projects with images
  const projectsWithImages = await Promise.all(
    projectsResult.data.items.map(enrichProjectWithImages)
  );

  return { needsOnboarding: false, projects: projectsWithImages };
}

// Component to render when no projects exist
function EmptyProjectsState() {
  return (
    <div className="py-12 text-center">
      <p className="text-muted-foreground">No projects found.</p>
      <p className="text-muted-foreground mt-2 text-sm">
        Create your first project to get started.
      </p>
    </div>
  );
}

export default async function AdminPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  if (!session.user.username) {
    redirect("/onboarding");
  }

  const { needsOnboarding, projects } = await getAdminPageData(session.user.id);

  if (needsOnboarding) {
    redirect("/onboarding");
  }

  return (
    <>
      <AdminHeader pageTitle="Projects">
        <CreateProject />
      </AdminHeader>

      <PageWrapper>
        <div className="mx-auto mt-8 max-w-3xl space-y-8">
          <QuickCreateProject />
          {projects.length > 0 ? (
            <ProjectList
              projectsWithImages={projects}
              username={session.user.username}
            />
          ) : (
            <EmptyProjectsState />
          )}
        </div>
      </PageWrapper>
    </>
  );
}
