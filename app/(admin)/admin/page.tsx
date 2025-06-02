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
  const userProfile = await getProfileByUserId(session.user.id);
  if (!userProfile) {
    redirect("/onboarding");
  }

  const projects = await getAllProjects(session.user.id);

  const projectsWithImages = await Promise.all(
    projects.map(async (project) => {
      const [featuredImage, allImages] = await Promise.all([
        getFeaturedImageByProjectId(project.id),
        getAllProjectImages(project.id),
      ]);

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
