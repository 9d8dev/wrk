"use client";

import type { Media, Project } from "@/db/schema";

import { Edit } from "lucide-react";
import { useState } from "react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ProjectForm } from "@/components/admin/project-form";

interface EditProjectProps {
  project: Project;
  featuredImage?: Media | null;
  additionalImages?: Media[];
  onSuccess?: () => void;
}

export const EditProject = ({
  project,
  featuredImage,
  additionalImages = [],
  onSuccess,
}: EditProjectProps) => {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1 text-sm transition-all"
        >
          <Edit size={12} />
          Edit
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="no-scrollbar mx-auto w-full overflow-y-auto">
          <DrawerHeader>
            <DrawerTitle>Edit Project</DrawerTitle>
            <DrawerDescription>
              Make changes to your project below. Click save when you&apos;re
              done.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 sm:p-6">
            <ProjectForm
              project={project}
              existingFeaturedImage={featuredImage}
              existingAdditionalImages={additionalImages}
              onSuccess={handleSuccess}
              onCancel={() => setOpen(false)}
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
