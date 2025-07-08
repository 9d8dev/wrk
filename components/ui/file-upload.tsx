"use client";

import { Trash2 as RemoveIcon } from "lucide-react";
import NextImage from "next/image";
import {
  createContext,
  type Dispatch,
  forwardRef,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  type DropzoneOptions,
  type DropzoneState,
  type FileRejection,
  useDropzone,
} from "react-dropzone";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
      "useFileUpload must be used within a FileUploader component"
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
    ref
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
      [value, onValueChange]
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
              `File is too large. Max size is ${maxSize / 1024 / 1024}MB`
            );
          } else if (error?.message) {
            toast.error(error.message);
          }
        }
      },
      [reSelectAll, value, maxFiles, maxSize, onValueChange]
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
            prev + 1 > value.length - 1 ? 0 : prev + 1
          );
        };

        const movePrev = () => {
          setActiveIndex((prev) =>
            prev - 1 < 0 ? value.length - 1 : prev - 1
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
      [value, activeIndex, removeFile, orientation, direction, dropzoneState]
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
          onKeyDownCapture={handleKeyDown}
          className={cn(
            "grid w-full overflow-hidden focus:outline-none",
            { "gap-2": value && value.length > 0 },
            className
          )}
          dir={dir}
          {...props}
        >
          {children}
        </div>
      </FileUploaderContext.Provider>
    );
  }
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
    <section className="w-full px-1" aria-label="File upload content holder">
      <div
        {...props}
        ref={ref}
        className={cn(
          "grid gap-2",
          orientation === "horizontal"
            ? "snap-x auto-cols-max grid-flow-col overflow-x-auto pb-2"
            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
          className
        )}
      >
        {children}
      </div>
    </section>
  );
});

FileUploaderContent.displayName = "FileUploaderContent";

/**
 * FileUploaderItem - Individual file item with preview
 */
export const FileUploaderItem = forwardRef<
  HTMLButtonElement,
  { index: number; file?: File } & React.HTMLAttributes<HTMLButtonElement>
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
    <button
      ref={ref}
      type="button"
      className={cn(
        "group relative h-auto w-full cursor-pointer overflow-hidden rounded-md transition-all",
        isSelected
          ? "ring-primary ring-2 ring-offset-1"
          : "hover:ring-primary/50 hover:ring-1",
        className
      )}
      onClick={() => setActiveIndex(index)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setActiveIndex(index);
        }
      }}
      aria-label={`Select file ${index + 1}: ${file?.name || "Unknown file"}`}
      {...props}
    >
      <div className="h-full w-full">
        {previewUrl ? (
          <div className="relative aspect-square w-full snap-center overflow-hidden">
            {isLoading && (
              <div className="bg-muted absolute inset-0 flex items-center justify-center">
                <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"></div>
              </div>
            )}
            {error && (
              <div className="bg-muted text-muted-foreground absolute inset-0 flex items-center justify-center">
                <span>Failed to load</span>
              </div>
            )}
            <NextImage
              src={previewUrl}
              alt={file?.name || "File preview"}
              fill
              className={cn(
                "object-cover transition-opacity duration-200",
                isLoading || error ? "opacity-0" : "opacity-100"
              )}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized
            />
            <div className="absolute right-0 bottom-0 left-0 truncate bg-gradient-to-t from-black/70 to-transparent p-2 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
              {children || file?.name}
            </div>
            {/* Featured badge - could be conditionally shown */}
            {isSelected && (
              <div className="bg-primary text-primary-foreground absolute top-2 left-2 rounded-md px-2 py-1 text-xs shadow-sm">
                Selected
              </div>
            )}
          </div>
        ) : (
          <div className="bg-muted flex h-full min-h-[100px] items-center justify-center p-4">
            {children || file?.name || "Unknown file"}
          </div>
        )}
      </div>

      {/* Remove button */}
      <button
        type="button"
        className={cn(
          "absolute opacity-0 transition-opacity group-hover:opacity-100",
          direction === "rtl" ? "top-1 left-1" : "top-1 right-1",
          "bg-background/80 hover:bg-destructive hover:text-destructive-foreground rounded-full p-1 shadow-sm"
        )}
        onClick={(e) => {
          e.stopPropagation();
          removeFile(index);
        }}
      >
        <span className="sr-only">Remove file {index + 1}</span>
        <RemoveIcon className="h-4 w-4" />
      </button>
    </button>
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
        "relative flex w-full items-center justify-center rounded-lg border transition-all",
        dropzoneState.isDragActive
          ? "border-primary bg-primary/5 border-2"
          : "border-border bg-accent/30 hover:bg-accent/50",
        isLimitReached ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        hasFiles ? "h-auto" : "h-56"
      )}
    >
      {!hasFiles && (
        <div
          className={cn(
            "flex h-full w-full flex-col items-center justify-center rounded-lg p-6 duration-300 ease-in-out",
            dropzoneState.isDragAccept
              ? "text-green-600 dark:text-green-400"
              : dropzoneState.isDragReject || isFileTooBig
                ? "text-destructive"
                : "text-muted-foreground",
            className
          )}
          {...rootProps}
        >
          {children}

          {/* Add subtle helper text */}
          {!dropzoneState.isDragActive && (
            <p className="mt-2 text-xs opacity-70">
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
            <div className="bg-background/90 border-primary absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg border-2 border-dashed backdrop-blur-sm">
              <div className="p-4 text-center">
                {dropzoneState.isDragAccept ? (
                  <>
                    <svg
                      className="text-primary mx-auto mb-2 h-10 w-10"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-labelledby="upload-success-icon"
                    >
                      <title id="upload-success-icon">
                        File upload accepted
                      </title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                      />
                    </svg>
                    <p className="text-primary font-medium">Drop to upload</p>
                    {(dropzoneOptions.maxFiles || 1) > 1 && (
                      <p className="text-muted-foreground mt-1 text-xs">
                        {files?.length || 0} of {dropzoneOptions.maxFiles} files
                        selected
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <svg
                      className="text-destructive mx-auto mb-2 h-10 w-10"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-labelledby="upload-error-icon"
                    >
                      <title id="upload-error-icon">File upload rejected</title>
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
