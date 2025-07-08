"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Project } from "@/db/schema";
import { deleteProject } from "@/lib/actions/project";

interface DeleteProjectProps {
	project: Project;
	onSuccess?: () => void;
}

export const DeleteProject = ({ project, onSuccess }: DeleteProjectProps) => {
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		try {
			setIsDeleting(true);
			const result = await deleteProject(project.id);
			if (result.success) {
				toast.success("Project deleted successfully");
				if (onSuccess) {
					onSuccess();
				}
			} else {
				throw new Error(result.error);
			}
		} catch (error) {
			console.error("Error deleting project:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to delete project",
			);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<button className="flex items-center gap-1 cursor-pointer text-sm text-muted-foreground hover:text-destructive transition-all">
					<Trash2 size={12} />
					Delete
				</button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action will permanently delete the project{" "}
						<span className="font-semibold">{project.title}</span> and all of
						its associated data. This action cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleDelete}
						disabled={isDeleting}
						className="bg-destructive hover:bg-destructive/90"
					>
						{isDeleting ? "Deleting..." : "Delete Project"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
