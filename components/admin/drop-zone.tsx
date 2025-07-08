"use client";

import { Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CreateProject } from "./create-project";

type AcceptedFileTypes = string[];

interface DropZoneProps {
	/** Optional callback when files are dropped or selected */
	onFilesDropped?: (files: File[]) => void;
	/** Additional className to apply to the drop zone */
	className?: string;
	/** Maximum number of files allowed (default: 5) */
	maxFiles?: number;
	/** Array of accepted MIME types (default: common image formats) */
	accept?: AcceptedFileTypes;
	/** Custom content to render inside the drop zone */
	children?: React.ReactNode;
	/** Whether to open the project drawer when files are dropped (default: true) */
	openProjectDrawer?: boolean;
	/** Custom text for the drop zone heading */
	dropzoneText?: string;
	/** Custom text for the drop zone subtext */
	dropzoneSubtext?: string;
}

/**
 * A reusable drop zone component for file uploads
 */
export function DropZone({
	onFilesDropped,
	className,
	maxFiles = 5,
	accept = ["image/jpeg", "image/png", "image/webp"],
	children,
	openProjectDrawer = true,
	dropzoneText = "Drop files here",
	dropzoneSubtext = "or click to browse",
}: DropZoneProps) {
	const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const [shouldOpenDrawer, setShouldOpenDrawer] = useState(false);
	const [dragCounter, setDragCounter] = useState(0);
	const dropZoneRef = useRef<HTMLButtonElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const preventDefaults = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	// Improved drag handling to prevent flashing, especially in Safari
	const handleDragEnter = useCallback(
		(e: React.DragEvent) => {
			preventDefaults(e);

			// Only increment counter for the dropzone itself, not its children
			// This helps prevent flashing in Safari
			if (e.currentTarget === e.target) {
				setDragCounter((prev) => prev + 1);
			}

			// Set a small timeout before showing the drag state
			// This helps prevent flashing in Safari
			requestAnimationFrame(() => {
				setIsDragging(true);
			});
		},
		[preventDefaults],
	);

	const handleDragLeave = useCallback(
		(e: React.DragEvent) => {
			preventDefaults(e);

			// Only decrement counter when leaving the dropzone itself, not its children
			if (e.currentTarget === e.target) {
				setDragCounter((prev) => Math.max(0, prev - 1));

				// Only remove dragging state when counter is 0
				if (dragCounter <= 1) {
					setIsDragging(false);
				}
			}
		},
		[dragCounter, preventDefaults],
	);

	// Reset drag state when component unmounts or when window loses focus or mouse leaves window
	useEffect(() => {
		const handleWindowBlur = () => {
			setIsDragging(false);
			setDragCounter(0);
		};

		// Safari-specific fix: reset state when mouse leaves the window
		const handleMouseLeave = (e: MouseEvent) => {
			// Check if mouse has left the document entirely
			// This is a cross-browser way to detect when the cursor leaves the window
			if (
				e.clientY <= 0 ||
				e.clientX <= 0 ||
				e.clientX >= window.innerWidth ||
				e.clientY >= window.innerHeight
			) {
				setIsDragging(false);
				setDragCounter(0);
			}
		};

		window.addEventListener("blur", handleWindowBlur);
		document.addEventListener("mouseleave", handleMouseLeave);

		return () => {
			window.removeEventListener("blur", handleWindowBlur);
			document.removeEventListener("mouseleave", handleMouseLeave);
		};
	}, []);

	// Ensure drawer opens when files are dropped
	useEffect(() => {
		if (droppedFiles.length > 0 && openProjectDrawer) {
			setShouldOpenDrawer(true);
		}
	}, [droppedFiles, openProjectDrawer]);

	/**
	 * Process files from either drop or file input
	 */
	const processFiles = useCallback(
		(fileList: FileList) => {
			try {
				const files = Array.from(fileList);

				if (files.length === 0) return;

				// Filter for accepted file types
				const acceptedFiles = files.filter((file) =>
					accept.some((type) => file.type.startsWith(type)),
				);

				if (acceptedFiles.length === 0) {
					const acceptedTypes = accept
						.map((type) => type.replace("image/", "."))
						.join(", ");
					toast.error(`Please select only ${acceptedTypes} files`);
					return;
				}

				// Limit the number of files
				const filesToUse = acceptedFiles.slice(0, maxFiles);
				if (acceptedFiles.length > maxFiles) {
					toast.warning(`Only the first ${maxFiles} files will be used`);
				}

				// Reset file input to allow selecting the same file again
				if (fileInputRef.current) {
					fileInputRef.current.value = "";
				}

				// Set the dropped files
				setDroppedFiles(filesToUse);

				// Call the callback if provided
				if (onFilesDropped) {
					onFilesDropped(filesToUse);
				}

				// Show success message
				toast.success(
					`${filesToUse.length} file${filesToUse.length > 1 ? "s" : ""} ready`,
				);

				// Open project drawer if enabled
				if (openProjectDrawer) {
					setShouldOpenDrawer(true);
				}
			} catch (error) {
				console.error("Error processing files:", error);
				toast.error("There was an error processing your files");
			}
		},
		[accept, maxFiles, onFilesDropped, openProjectDrawer],
	);

	/**
	 * Handle drop events to process the files
	 */
	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			preventDefaults(e);

			// Ensure we reset all drag state
			setIsDragging(false);
			setDragCounter(0);

			if (!e.dataTransfer?.files) return;

			// Get the files immediately to avoid Safari issues
			const files = e.dataTransfer.files;

			// Process the files directly without timeout
			// The timeout was causing issues with state updates
			processFiles(files);
		},
		[preventDefaults, processFiles],
	);

	/**
	 * Handle file input change
	 */
	const handleFileInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (!e.target.files || e.target.files.length === 0) return;
			processFiles(e.target.files);
		},
		[processFiles],
	);

	/**
	 * Handle click on the dropzone
	 */
	const handleClick = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	/**
	 * Handle keyboard accessibility
	 */
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				handleClick();
			}
		},
		[handleClick],
	);

	return (
		<>
			<button
				ref={dropZoneRef}
				type="button"
				className={cn(
					"relative border-2 border-dashed rounded-md transition-all cursor-pointer w-full",
					isDragging
						? "border-primary bg-primary/5"
						: "border-muted-foreground/20 hover:border-muted-foreground/50 hover:bg-muted/5",
					className,
				)}
				onDragEnter={handleDragEnter}
				onDragOver={preventDefaults}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				aria-label="File upload drop zone"
			>
				{/* Hidden file input */}
				<input
					ref={fileInputRef}
					type="file"
					className="hidden"
					onChange={handleFileInputChange}
					accept={accept.join(",")}
					multiple={maxFiles > 1}
				/>

				<div
					className={cn(
						"absolute inset-0 bg-primary/5 flex items-center justify-center z-10 transition-opacity duration-200",
						isDragging ? "opacity-100" : "opacity-0 pointer-events-none",
						// Safari-specific fix: use hardware acceleration to prevent flickering
						"transform translateZ(0)",
					)}
					aria-live="polite"
				>
					<div className="text-center">
						<Upload className="w-10 h-10 mx-auto mb-2 text-primary" />
						<h3 className="text-lg font-medium">{dropzoneText}</h3>
					</div>
				</div>

				{children || (
					<div className="p-8 text-center">
						<Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
						<h3 className="text-lg font-medium">{dropzoneText}</h3>
						<p className="text-sm text-muted-foreground mt-1">
							{dropzoneSubtext}
						</p>
					</div>
				)}
			</button>

			{openProjectDrawer && (
				<CreateProject
					buttonHidden
					initialImages={droppedFiles}
					initialOpen={shouldOpenDrawer}
					onClose={() => setShouldOpenDrawer(false)}
				/>
			)}
		</>
	);
}
