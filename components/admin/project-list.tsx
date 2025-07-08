"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExternalLink, GripVertical } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Media, Project } from "@/db/schema";
import { updateProjectOrder } from "@/lib/actions/project";
import { DeleteProject } from "./delete-project";
import { EditProject } from "./edit-project";

export function ProjectList({
  projectsWithImages,
  username,
}: {
  username: string;
  projectsWithImages: Array<{
    project: Project;
    featuredImage: Media | null;
    additionalImages: Media[];
  }>;
}) {
  const [items, setItems] = useState(projectsWithImages);
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    setItems(projectsWithImages);
  }, [projectsWithImages]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId !== overId) {
      setIsReordering(true);

      try {
        const oldIndex = items.findIndex(
          (item) => item.project.id === activeId
        );
        const newIndex = items.findIndex((item) => item.project.id === overId);

        if (oldIndex === -1 || newIndex === -1) {
          console.error("Could not find indices for drag operation", {
            activeId,
            overId,
            oldIndex,
            newIndex,
          });
          return;
        }

        const newItems = arrayMove(items, oldIndex, newIndex);
        setItems(newItems);

        const projectIds = newItems.map((item) => item.project.id);

        const result = await updateProjectOrder(projectIds);

        if (!result.success) {
          throw new Error(result.error);
        }

        toast.success("Project order updated");
      } catch (error) {
        console.error("Error updating project order:", error);
        toast.error("Failed to update project order");

        setItems(projectsWithImages);
      } finally {
        setIsReordering(false);
      }
    }
  };

  return (
    <div suppressHydrationWarning className="max-w-3xl space-y-2">
      {items.length === 0 ? (
        <p>No projects found.</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((item) => item.project.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.map(({ project, featuredImage, additionalImages }) => (
              <SortableProjectCard
                key={project.id}
                id={project.id}
                project={project}
                featuredImage={featuredImage}
                additionalImages={additionalImages}
                username={username}
                isReordering={isReordering}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

const SortableProjectCard = ({
  id,
  project,
  featuredImage,
  additionalImages,
  username,
  isReordering,
}: {
  id: string;
  project: Project;
  featuredImage: Media | null;
  additionalImages: Media[];
  username: string;
  isReordering: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: isReordering,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      suppressHydrationWarning
      ref={setNodeRef}
      style={style}
      className="relative grid grid-cols-[auto_1fr] overflow-hidden rounded border"
      {...attributes}
    >
      <ProjectImage featuredImage={featuredImage} title={project.title} />
      <div className="bg-accent/40 relative flex justify-between gap-2">
        <ProjectDetails
          project={project}
          featuredImage={featuredImage}
          additionalImages={additionalImages}
          username={username}
        />
        <button
          {...listeners}
          className="bg-accent flex cursor-grab items-center border-l p-1 active:cursor-grabbing"
          aria-label="Drag to reorder"
          title="Drag to reorder"
          type="button"
        >
          <GripVertical
            strokeWidth={1}
            className="text-muted-foreground my-auto"
          />
        </button>
      </div>
      <span className="text-muted-foreground bg-muted absolute top-1 left-1 z-1 flex aspect-square h-4 w-4 items-center justify-center rounded border p-1 text-[10px]">
        {project.displayOrder !== null ? project.displayOrder + 1 : ""}
      </span>
    </div>
  );
};

const ProjectImage = ({
  featuredImage,
  title,
}: {
  featuredImage: Media | null;
  title: string;
}) => {
  if (featuredImage) {
    return (
      <div className="relative h-18 w-18">
        <Image
          src={featuredImage.url}
          alt={title}
          fill
          className="border-r object-cover"
        />
      </div>
    );
  }

  return (
    <div className="bg-muted flex h-18 w-18 items-center justify-center border-r">
      No image
    </div>
  );
};

const ProjectDetails = ({
  project,
  featuredImage,
  additionalImages,
  username,
}: {
  project: Project;
  featuredImage: Media | null;
  additionalImages: Media[];
  username: string;
}) => {
  const projectUrl = `/${username}/${project.slug}`;

  return (
    <div className="flex h-full flex-col justify-between p-2 text-sm">
      <p className="text-normal flex items-center gap-1">
        <span className="sr-only">Title:</span> {project.title}
      </p>
      <div className="flex items-center gap-4">
        <ViewProject url={projectUrl} />
        <EditProject
          project={project}
          featuredImage={featuredImage}
          additionalImages={additionalImages}
        />
        <DeleteProject project={project} />
      </div>
    </div>
  );
};

const ViewProject = ({ url }: { url: string }) => {
  return (
    <a
      className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1 text-sm transition-all"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <ExternalLink size={12} className="inline" />
      View
    </a>
  );
};
