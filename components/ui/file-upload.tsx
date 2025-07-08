"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
	Dispatch,
	SetStateAction,
	createContext,
	forwardRef,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import {
	useDropzone,
	DropzoneState,
	FileRejection,
	DropzoneOptions,
} from "react-dropzone";
import NextImage from "next/image";
import { toast } from "sonner";
import { Trash2 as RemoveIcon } from "lucide-react";

// Types
type DirectionOptions = "rtl" | "ltr" | undefined;

type FileUploaderContextType = {
	dropzoneState: DropzoneState;
	isLimitReached: boolean;
	isFileTooBig: boolean;
	removeFile: (index: number) => void;
	activeIndex: number;
	setActiveIndex: Dispatch<SetStateAction<number>>;
	orientation: "horizontal" | "vertical";
	direction: DirectionOptions;
	files: File[] | null;
	dropzoneOptions: DropzoneOptions;
};

// Context
const FileUploaderContext = createContext<FileUploaderContextType | null>(null);

export const useFileUpload = () => {
	const context = useContext(FileUploaderContext);
	if (!context) {
		throw new Error(
			"useFileUpload must be used within a FileUploader component",
		);
	}
	return context;
};

// Default dropzone options
const DEFAULT_ACCEPT = {
	"image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
};
const DEFAULT_MAX_FILES = 1;
const DEFAULT_MAX_SIZE = 4 * 1024 * 1024; // 4MB
const DEFAULT_MULTIPLE = true;

// Main Components
type FileUploaderProps = {
	value: File[] | null;
	reSelect?: boolean;
	onValueChange: (value: File[] | null) => void;
	dropzoneOptions: DropzoneOptions;
	orientation?: "horizontal" | "vertical";
};

/**
 * FileUploader - Main component for handling file uploads
 */
export const FileUploader = forwardRef<
	HTMLDivElement,
	FileUploaderProps & React.HTMLAttributes<HTMLDivElement>
>(
	(
		{
			className,
			dropzoneOptions,
			value,
			onValueChange,
			reSelect,
			orientation = "vertical",
			children,
			dir,
			...props
		},
		ref,
	) => {
		// State
		const [isFileTooBig, setIsFileTooBig] = useState(false);
		const [isLimitReached, setIsLimitReached] = useState(false);
		const [activeIndex, setActiveIndex] = useState(-1);

		// Extract options with defaults
		const {
			accept = DEFAULT_ACCEPT,
			maxFiles = DEFAULT_MAX_FILES,
			maxSize = DEFAULT_MAX_SIZE,
			multiple = DEFAULT_MULTIPLE,
			disabled = false,
		} = dropzoneOptions;

		const reSelectAll = maxFiles === 1 ? true : reSelect;
		const direction: DirectionOptions = dir === "rtl" ? "rtl" : "ltr";

		// Handlers
		const removeFile = useCallback(
			(index: number) => {
				if (!value) return;
				const newFiles = value.filter((_, i) => i !== index);
				onValueChange(newFiles.length > 0 ? newFiles : null);
			},
			[value, onValueChange],
		);

		const onDrop = useCallback(
			(acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
				if (!acceptedFiles.length) return;

				// Handle file selection
				const newValues = reSelectAll
					? [...acceptedFiles].slice(0, maxFiles)
					: [...(value || []), ...acceptedFiles].slice(0, maxFiles);

				onValueChange(newValues);

				// Handle rejected files
				if (rejectedFiles.length > 0) {
					const error = rejectedFiles[0].errors[0];

					if (error?.code === "file-too-large") {
						toast.error(
							`File is too large. Max size is ${maxSize / 1024 / 1024}MB`,
						);
					} else if (error?.message) {
						toast.error(error.message);
					}
				}
			},
			[reSelectAll, value, maxFiles, maxSize, onValueChange],
		);

		// Setup dropzone
		const dropzoneState = useDropzone({
			accept,
			maxFiles,
			maxSize,
			multiple,
			disabled: disabled || isLimitReached,
			onDrop,
			onDropRejected: () => setIsFileTooBig(true),
			onDropAccepted: () => setIsFileTooBig(false),
		});

		const handleKeyDown = useCallback(
			(e: React.KeyboardEvent<HTMLDivElement>) => {
				if (!value || value.length === 0) return;

				e.preventDefault();
				e.stopPropagation();

				// Navigation logic
				const moveNext = () => {
					setActiveIndex((prev) =>
						prev + 1 > value.length - 1 ? 0 : prev + 1,
					);
				};

				const movePrev = () => {
					setActiveIndex((prev) =>
						prev - 1 < 0 ? value.length - 1 : prev - 1,
					);
				};

				// Determine direction keys based on orientation and text direction
				const prevKey =
					orientation === "horizontal"
						? direction === "ltr"
							? "ArrowLeft"
							: "ArrowRight"
						: "ArrowUp";

				const nextKey =
					orientation === "horizontal"
						? direction === "ltr"
							? "ArrowRight"
							: "ArrowLeft"
						: "ArrowDown";

				// Handle key actions
				switch (e.key) {
					case nextKey:
						moveNext();
						break;
					case prevKey:
						movePrev();
						break;
					case "Enter":
					case " ":
						if (activeIndex === -1) {
							dropzoneState.inputRef.current?.click();
						}
						break;
					case "Delete":
					case "Backspace":
						if (activeIndex !== -1) {
							removeFile(activeIndex);
							if (value.length <= 1) {
								setActiveIndex(-1);
								return;
							}
							movePrev();
						}
						break;
					case "Escape":
						setActiveIndex(-1);
						break;
				}
			},
			[value, activeIndex, removeFile, orientation, direction, dropzoneState],
		);

		// Update limit reached state when value changes
		useEffect(() => {
			setIsLimitReached(!!value && value.length >= maxFiles);
		}, [value, maxFiles]);

		return (
			<FileUploaderContext.Provider
				value={{
					dropzoneState,
					isLimitReached,
					isFileTooBig,
					removeFile,
					activeIndex,
					setActiveIndex,
					orientation,
					direction,
					files: value,
					dropzoneOptions,
				}}
			>
				<div
					ref={ref}
					tabIndex={0}
					onKeyDownCapture={handleKeyDown}
					className={cn(
						"grid w-full focus:outline-none overflow-hidden",
						{ "gap-2": value && value.length > 0 },
						className,
					)}
					dir={dir}
					{...props}
				>
					{children}
				</div>
			</FileUploaderContext.Provider>
		);
	},
);

FileUploader.displayName = "FileUploader";

/**
 * FileUploaderContent - Container for file items
 */
export const FileUploaderContent = forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => {
	const { orientation } = useFileUpload();

	return (
		<div className="w-full px-1" aria-description="content file holder">
			<div
				{...props}
				ref={ref}
				className={cn(
					"grid gap-2",
					orientation === "horizontal"
						? "grid-flow-col auto-cols-max overflow-x-auto pb-2 snap-x"
						: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
					className,
				)}
			>
				{children}
			</div>
		</div>
	);
});

FileUploaderContent.displayName = "FileUploaderContent";

/**
 * FileUploaderItem - Individual file item with preview
 */
export const FileUploaderItem = forwardRef<
	HTMLDivElement,
	{ index: number; file?: File } & React.HTMLAttributes<HTMLDivElement>
>(({ className, index, children, file, ...props }, ref) => {
	const { removeFile, activeIndex, direction, setActiveIndex } =
		useFileUpload();
	const isSelected = index === activeIndex;
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(false);

	// Generate preview for image files
	useEffect(() => {
		if (!file || !file.type.startsWith("image/")) return;

		setIsLoading(true);
		setError(false);

		const objectUrl = URL.createObjectURL(file);
		setPreviewUrl(objectUrl);

		// Simulate image loading
		const img = new Image();
		img.onload = () => setIsLoading(false);
		img.onerror = () => {
			setError(true);
			setIsLoading(false);
		};
		img.src = objectUrl;

		return () => URL.revokeObjectURL(objectUrl);
	}, [file]);

	return (
		<div
			ref={ref}
			className={cn(
				"h-auto rounded-md overflow-hidden cursor-pointer relative group transition-all",
				isSelected
					? "ring-2 ring-primary ring-offset-1"
					: "hover:ring-1 hover:ring-primary/50",
				className,
			)}
			onClick={() => setActiveIndex(index)}
			{...props}
		>
			<div className="w-full h-full">
				{previewUrl ? (
					<div className="relative w-full aspect-square overflow-hidden snap-center">
						{isLoading && (
							<div className="absolute inset-0 flex items-center justify-center bg-muted">
								<div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
							</div>
						)}
						{error && (
							<div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
								<span>Failed to load</span>
							</div>
						)}
						<NextImage
							src={previewUrl}
							alt={file?.name || "File preview"}
							fill
							className={cn(
								"object-cover transition-opacity duration-200",
								isLoading || error ? "opacity-0" : "opacity-100",
							)}
							sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
							unoptimized
						/>
						<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-xs text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
							{children || file?.name}
						</div>
						{/* Featured badge - could be conditionally shown */}
						{isSelected && (
							<div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md shadow-sm">
								Selected
							</div>
						)}
					</div>
				) : (
					<div className="flex items-center justify-center p-4 bg-muted h-full min-h-[100px]">
						{children || file?.name || "Unknown file"}
					</div>
				)}
			</div>

			{/* Remove button */}
			<button
				type="button"
				className={cn(
					"absolute opacity-0 group-hover:opacity-100 transition-opacity",
					direction === "rtl" ? "top-1 left-1" : "top-1 right-1",
					"bg-background/80 rounded-full p-1 shadow-sm hover:bg-destructive hover:text-destructive-foreground",
				)}
				onClick={(e) => {
					e.stopPropagation();
					removeFile(index);
				}}
			>
				<span className="sr-only">Remove file {index + 1}</span>
				<RemoveIcon className="w-4 h-4" />
			</button>
		</div>
	);
});

FileUploaderItem.displayName = "FileUploaderItem";

/**
 * FileInput - Dropzone area for file input
 */
export const FileInput = forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
	const {
		dropzoneState,
		isFileTooBig,
		isLimitReached,
		files,
		dropzoneOptions,
	} = useFileUpload();
	const hasFiles = files && files.length > 0;

	// Don't get root props if limit reached
	const rootProps = isLimitReached ? {} : dropzoneState.getRootProps();

	return (
		<div
			ref={ref}
			{...props}
			className={cn(
				"relative w-full border rounded-lg transition-all flex items-center justify-center",
				dropzoneState.isDragActive
					? "border-primary border-2 bg-primary/5"
					: "border-border bg-accent/30 hover:bg-accent/50",
				isLimitReached ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
				hasFiles ? "h-auto" : "h-56",
			)}
		>
			{!hasFiles && (
				<div
					className={cn(
						"w-full h-full rounded-lg duration-300 ease-in-out flex flex-col items-center justify-center p-6",
						dropzoneState.isDragAccept
							? "text-green-600 dark:text-green-400"
							: dropzoneState.isDragReject || isFileTooBig
								? "text-destructive"
								: "text-muted-foreground",
						className,
					)}
					{...rootProps}
				>
					{children}

					{/* Add subtle helper text */}
					{!dropzoneState.isDragActive && (
						<p className="text-xs mt-2 opacity-70">
							{isLimitReached
								? `Maximum ${dropzoneOptions.maxFiles || 1} file${
										(dropzoneOptions.maxFiles || 1) > 1 ? "s" : ""
									} reached`
								: `Click or drag to upload${
										(dropzoneOptions.maxFiles || 1) > 1
											? ` (${files?.length || 0}/${
													dropzoneOptions.maxFiles || 1
												})`
											: ""
									}`}
						</p>
					)}

					{/* Active drag overlay */}
					{dropzoneState.isDragActive && (
						<div className="absolute inset-0 rounded-lg flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm border-2 border-dashed border-primary z-10">
							<div className="text-center p-4">
								{dropzoneState.isDragAccept ? (
									<>
										<svg
											className="w-10 h-10 text-primary mx-auto mb-2"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
											/>
										</svg>
										<p className="text-primary font-medium">Drop to upload</p>
										{(dropzoneOptions.maxFiles || 1) > 1 && (
											<p className="text-xs mt-1 text-muted-foreground">
												{files?.length || 0} of {dropzoneOptions.maxFiles} files
												selected
											</p>
										)}
									</>
								) : (
									<>
										<svg
											className="w-10 h-10 text-destructive mx-auto mb-2"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
										<p className="text-destructive font-medium">
											{isLimitReached
												? "File limit reached"
												: "File type not supported"}
										</p>
									</>
								)}
							</div>
						</div>
					)}
				</div>
			)}

			<Input
				ref={dropzoneState.inputRef}
				disabled={isLimitReached}
				{...dropzoneState.getInputProps()}
				className={isLimitReached ? "cursor-not-allowed" : ""}
			/>
		</div>
	);
});

FileInput.displayName = "FileInput";
