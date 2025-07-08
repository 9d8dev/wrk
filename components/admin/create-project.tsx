"use client";

import { ShortcutButton } from "@/components/admin/shortcut-button";
import { ProjectForm } from "@/components/admin/project-form";

import { useState, useEffect } from "react";

import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";

interface CreateProjectProps {
	initialImages?: File[];
	onClose?: () => void;
	buttonHidden?: boolean;
	initialOpen?: boolean;
}

export function CreateProject({
	initialImages,
	onClose,
	buttonHidden = false,
	initialOpen = false,
}: CreateProjectProps = {}) {
	const [open, setOpen] = useState(initialOpen);

	// If initialOpen changes, update the open state
	useEffect(() => {
		if (initialOpen) {
			setOpen(true);
		}
	}, [initialOpen]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (
				event.key === "c" &&
				document.activeElement?.tagName !== "INPUT" &&
				document.activeElement?.tagName !== "TEXTAREA" &&
				!document.querySelector('[data-state="open"]')
			) {
				event.preventDefault();
				setOpen(true);
			}
		};

		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	return (
		<Drawer open={open} onOpenChange={setOpen} direction="right">
			{!buttonHidden && (
				<DrawerTrigger asChild>
					<ShortcutButton
						letter="c"
						label="Create Project"
						size="sm"
						variant="default"
					/>
				</DrawerTrigger>
			)}
			<DrawerContent className="z-50">
				<div className="mx-auto w-full overflow-y-auto no-scrollbar">
					<DrawerHeader>
						<DrawerTitle>Create New Project</DrawerTitle>
						<DrawerDescription>
							Add images and details for your new project
						</DrawerDescription>
					</DrawerHeader>
					<div className="p-4 sm:p-6">
						<ProjectForm
							initialImages={initialImages}
							onSuccess={() => {
								setOpen(false);
								onClose?.();
							}}
						/>
					</div>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
