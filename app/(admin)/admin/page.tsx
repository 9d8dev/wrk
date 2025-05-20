import { getFeaturedImageByProjectId } from "@/lib/data/media";
import { getAllProjects } from "@/lib/data/project";
import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";

import { AdminHeader } from "@/components/admin/admin-header";
import { ProjectList } from "@/components/admin/project-list";
import { DropZone } from "@/components/admin/drop-zone";
import { CreateProject } from "@/components/admin/create-project";
import { PageWrapper } from "@/components/admin/page-wrapper";

export default async function AdminPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/sign-in");
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
        <DropZone />
        <ProjectList
          projectsWithImages={projectsWithImages}
          userId={session.user.id}
          username={session.user.username!}
        />
      </PageWrapper>
    </>
  );
}
