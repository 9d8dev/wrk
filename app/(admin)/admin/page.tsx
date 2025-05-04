import { getFeaturedImageByProjectId } from "@/lib/data/media";
import { getAllProjects } from "@/lib/data/project";
import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";

import { CreateProject } from "@/components/admin/create-project";
import { AdminHeader } from "@/components/admin/admin-header";
import { ProjectList } from "@/components/admin/project-list";
import { ClientOnly } from "@/components/client-only";
import { Suspense } from "react";

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
        <Suspense fallback={<div>Loading...</div>}>
          <CreateProject />
        </Suspense>
      </AdminHeader>
      <section className="space-y-6 p-4 max-w-5xl mx-auto">
        <ClientOnly>
          <ProjectList
            projectsWithImages={projectsWithImages}
            userId={session.user.id}
            username={session.user.username!}
          />
        </ClientOnly>
      </section>
    </>
  );
}
