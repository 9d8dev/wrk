import { getFeaturedImageByProjectId } from "@/lib/data/media";
import { getAllProjects } from "@/lib/data/project";
import { getSession } from "@/lib/actions/auth";
import { getProfileByUserId } from "@/lib/data/profile";
import { redirect } from "next/navigation";

import { AdminHeader } from "@/components/admin/admin-header";
import { ProjectList } from "@/components/admin/project-list";
import { QuickCreateProject } from "@/components/admin/quick-create-project";
import { CreateProject } from "@/components/admin/create-project";
import { PageWrapper } from "@/components/admin/page-wrapper";

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
      const featuredImage = await getFeaturedImageByProjectId(project.id);
      return { project, featuredImage };
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
            userId={session.user.id}
            username={session.user.username!}
          />
        </div>
      </PageWrapper>
    </>
  );
}
