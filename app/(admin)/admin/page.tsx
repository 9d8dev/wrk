import { QuickCreateProject } from "@/components/admin/quick-create-project";
import { CreateProject } from "@/components/admin/create-project";
import { AdminHeader } from "@/components/admin/admin-header";
import { ProjectList } from "@/components/admin/project-list";
import { PageWrapper } from "@/components/admin/page-wrapper";

export const dynamic = "force-dynamic";

import { getProfileByUserId } from "@/lib/data/profile";
import { getAllProjects } from "@/lib/data/project";
import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import {
  getFeaturedImageByProjectId,
  getAllProjectImages,
} from "@/lib/data/media";

export default async function AdminPage() {
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
    throw new Error(projectsResult.error);
  }

  const projectsWithImages = await Promise.all(
    projectsResult.data.items.map(async (project) => {
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
            username={session.user.username!}
          />
        </div>
      </PageWrapper>
    </>
  );
}
