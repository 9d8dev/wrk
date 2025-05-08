import { getFeaturedImageByProjectId } from "@/lib/data/media";
import { getAllProjects } from "@/lib/data/project";
import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";

import { AdminHeader } from "@/components/admin/admin-header";
import { ProjectList } from "@/components/admin/project-list";
import { GlobalDropZone } from "@/components/admin/global-drop-zone";

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
        <GlobalDropZone />
      </AdminHeader>

      <section className="space-y-6 p-4">
        <ProjectList
          projectsWithImages={projectsWithImages}
          userId={session.user.id}
          username={session.user.username!}
        />
      </section>
    </>
  );
}
