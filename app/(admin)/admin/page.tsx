import { QuickCreateProject } from "@/components/admin/quick-create-project";
import { CreateProject } from "@/components/admin/create-project";
import { AdminHeader } from "@/components/admin/admin-header";
import { ProjectList } from "@/components/admin/project-list";
import { PageWrapper } from "@/components/admin/page-wrapper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

import { getProfileByUserId } from "@/lib/data/profile";
import { getAllProjects } from "@/lib/data/project";
import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import {
  getFeaturedImageByProjectId,
  getAllProjectImages,
} from "@/lib/data/media";

function ErrorDisplay({ error }: { error: string }) {
  return (
    <PageWrapper>
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error loading projects</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    </PageWrapper>
  );
}

export default async function AdminPage() {
  try {
    const session = await getSession();

    if (!session?.user) {
      redirect("/sign-in");
    }

    // Check if user has username (required for OAuth users)
    if (!session.user.username) {
      redirect("/onboarding");
    }

    // Check if user has completed profile
    const profileResult = await getProfileByUserId(session.user.id);
    if (!profileResult.success || !profileResult.data) {
      redirect("/onboarding");
    }

    const projectsResult = await getAllProjects(session.user.id);
    if (!projectsResult.success) {
      return (
        <>
          <AdminHeader pageTitle="Projects">
            <CreateProject />
          </AdminHeader>
          <ErrorDisplay error={projectsResult.error} />
        </>
      );
    }

    const projectsWithImages = await Promise.all(
      projectsResult.data.items.map(async (project) => {
        try {
          const [featuredImageResult, allImagesResult] = await Promise.all([
            getFeaturedImageByProjectId(project.id),
            getAllProjectImages(project.id),
          ]);

          const featuredImage = featuredImageResult.success ? featuredImageResult.data : null;
          const allImages = allImagesResult.success ? allImagesResult.data : [];

          // Filter out the featured image from additional images
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
          // Return project without images on error
          return {
            project,
            featuredImage: null,
            additionalImages: [],
          };
        }
      })
    );

    return (
      <>
        <AdminHeader pageTitle="Projects">
          <CreateProject />
        </AdminHeader>

        <PageWrapper>
          <div className="space-y-6">
            <QuickCreateProject />
            <ProjectList
              projectsWithImages={projectsWithImages}
              username={session.user.username}
            />
          </div>
        </PageWrapper>
      </>
    );
  } catch (error) {
    // Re-throw redirect errors
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }

    console.error("Failed to load admin page:", error);
    
    return (
      <>
        <AdminHeader pageTitle="Projects" />
        <ErrorDisplay error="Failed to load projects. Please try refreshing the page." />
      </>
    );
  }
}
