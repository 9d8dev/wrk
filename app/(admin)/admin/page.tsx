import { QuickCreateProject } from "@/components/admin/quick-create-project";
import { CreateProject } from "@/components/admin/create-project";
import { AdminHeader } from "@/components/admin/admin-header";
import { ProjectList } from "@/components/admin/project-list";
import { PageWrapper } from "@/components/admin/page-wrapper";
import { FolderOpen } from "lucide-react";

import { getProfileByUserId } from "@/lib/data/profile";
import { getAllProjects } from "@/lib/data/project";
import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import {
  getFeaturedImageByProjectId,
  getAllProjectImages,
} from "@/lib/data/media";

export const dynamic = "force-dynamic";

async function getAdminData(userId: string) {
  try {
    // Check profile completion
    const profileResult = await getProfileByUserId(userId);
    if (!profileResult.success || !profileResult.data) {
      return { needsOnboarding: true };
    }

    // Get projects
    const projectsResult = await getAllProjects(userId);
    if (!projectsResult.success) {
      console.error("Error fetching projects:", projectsResult.error);
      return { projects: [] };
    }

    // Get images for each project
    const projectsWithImages = await Promise.all(
      projectsResult.data.items.map(async (project) => {
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
          console.error(
            `Failed to load images for project ${project.id}:`,
            error,
          );
          return {
            project,
            featuredImage: null,
            additionalImages: [],
          };
        }
      }),
    );

    return { projects: projectsWithImages };
  } catch (error) {
    console.error("Error fetching admin data:", error);
    return { projects: [] };
  }
}

export default async function AdminPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  if (!session.user.username) {
    redirect("/onboarding");
  }

  const data = await getAdminData(session.user.id);

  if (data.needsOnboarding) {
    redirect("/onboarding");
  }

  const projects = data.projects || [];

  return (
    <>
      <AdminHeader pageTitle="Projects">
        <CreateProject />
      </AdminHeader>

      <PageWrapper>
        {projects.length === 0 ? (
          <EmptyProjectsState />
        ) : (
          <div className="space-y-8 max-w-3xl mx-auto">
            <QuickCreateProject />
            <ProjectList
              projectsWithImages={projects}
              username={session.user.username}
            />
          </div>
        )}
      </PageWrapper>
    </>
  );
}

function EmptyProjectsState() {
  return (
    <div className="text-center py-16">
      <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
      <h2 className="text-2xl font-semibold mb-4">No projects yet</h2>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        Get started by creating your first project. You can drag and drop images
        or use the create button above.
      </p>
      <div className="space-y-6">
        <QuickCreateProject />
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">Quick tips:</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center text-xs">
            <span>
              Press <kbd className="px-1.5 py-0.5 bg-muted rounded">C</kbd> to
              create project
            </span>
            <span>Drag images anywhere to start</span>
            <span>Auto-generates title from filename</span>
          </div>
        </div>
      </div>
    </div>
  );
}
