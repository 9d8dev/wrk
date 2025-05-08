"use client";

import { ExternalLink, GripVertical } from "lucide-react";
import { DeleteProject } from "./delete-project";
import { EditProject } from "./edit-project";

import { useState, useEffect } from "react";
import { updateProjectOrder } from "@/lib/actions/project";
import { toast } from "sonner";

import { CSS } from "@dnd-kit/utilities";

import Image from "next/image";

import type { Project, Media } from "@/db/schema";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

export function ProjectList({
  projectsWithImages,
  userId,
  username,
}: {
  username: string;
  projectsWithImages: Array<{ project: Project; featuredImage: Media | null }>;
  userId: string;
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

        const updatedProjects = newItems.map((item, index) => ({
          id: item.project.id,
          displayOrder: index,
        }));

        const result = await updateProjectOrder(updatedProjects, userId);

        if (result && result.error) {
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
    <div suppressHydrationWarning className="space-y-2 max-w-3xl">
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
            {items.map(({ project, featuredImage }) => (
              <SortableProjectCard
                key={project.id}
                id={project.id}
                project={project}
                featuredImage={featuredImage}
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
  username,
  isReordering,
}: {
  id: string;
  project: Project;
  featuredImage: Media | null;
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
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-[auto_1fr] rounded overflow-hidden border relative"
      {...attributes}
    >
      <ProjectImage featuredImage={featuredImage} title={project.title} />
      <div className="bg-accent/40 flex gap-2 justify-between relative">
        <ProjectDetails project={project} username={username} />
        <div
          {...listeners}
          className="cursor-grab active:cursor-grabbing bg-accent flex items-center border-l p-1"
          aria-label="Drag to reorder"
          title="Drag to reorder"
        >
          <GripVertical
            strokeWidth={1}
            className="text-muted-foreground my-auto"
          />
        </div>
      </div>
      <span className="w-4 h-4 text-muted-foreground p-1 text-[10px] bg-muted rounded border aspect-square flex items-center justify-center absolute top-1 left-1 z-1">
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
      <div className="relative w-18 h-18">
        <Image
          src={featuredImage.url}
          alt={title}
          fill
          className="object-cover border-r"
        />
      </div>
    );
  }

  return (
    <div className="w-18 h-18 border-r flex items-center justify-center bg-muted">
      No image
    </div>
  );
};

const ProjectDetails = ({
  project,
  username,
}: {
  project: Project;
  username: string;
}) => {
  const projectUrl = `/${username}/${project.slug}`;

  return (
    <div className="p-2 text-sm h-full flex flex-col justify-between">
      <p className="flex text-normal items-center gap-1">
        <span className="sr-only">Title:</span> {project.title}
      </p>
      <div className="flex items-center gap-4">
        <ViewProject url={projectUrl} />
        <EditProject project={project} />
        <DeleteProject project={project} />
      </div>
    </div>
  );
};

const ViewProject = ({ url }: { url: string }) => {
  return (
    <a
      className="flex items-center gap-1 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-all"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <ExternalLink size={12} className="inline" />
      View
    </a>
  );
};
