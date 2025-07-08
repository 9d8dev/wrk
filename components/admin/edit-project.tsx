"use client";

import { Edit } from "lucide-react";
import { useState } from "react";
import { ProjectForm } from "@/components/admin/project-form";

import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";

import type { Media, Project } from "@/db/schema";

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
				<button className="flex items-center gap-1 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-all">
					<Edit size={12} />
					Edit
				</button>
			</DrawerTrigger>
			<DrawerContent>
				<div className="mx-auto w-full overflow-y-auto no-scrollbar">
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
