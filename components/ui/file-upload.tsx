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
import { toast } from "sonner";
import { Trash2 as RemoveIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

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
        }}
      >
        <div
          ref={ref}
          tabIndex={0}
          onKeyDownCapture={handleKeyDown}
          className={cn(
            "grid w-full focus:outline-none overflow-hidden",
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
    <div className="w-full px-1" aria-description="content file holder">
      <div
        {...props}
        ref={ref}
        className={cn(
          "flex rounded-xl gap-1",
          orientation === "horizontal" ? "flex-row flex-wrap" : "flex-col",
          className
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
  const { removeFile, activeIndex, direction } = useFileUpload();
  const isSelected = index === activeIndex;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Generate preview for image files
  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div
      ref={ref}
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "h-auto min-h-6 p-1 justify-between cursor-pointer relative",
        isSelected ? "bg-muted" : "",
        className
      )}
      {...props}
    >
      <div className="font-medium leading-none tracking-tight flex items-center gap-1.5 h-full w-full">
        {previewUrl ? (
          <div className="relative w-full h-56 overflow-hidden">
            <img
              src={previewUrl}
              alt="File preview"
              className="w-full h-full rounded-md object-cover"
            />
            <div className="mt-1 text-xs truncate max-w-full">{children}</div>
          </div>
        ) : (
          children
        )}
      </div>

      {/* Remove button */}
      <button
        type="button"
        className={cn(
          "absolute",
          direction === "rtl" ? "top-1 left-1" : "top-1 right-1",
          previewUrl ? "bg-background/80 rounded-full p-1" : ""
        )}
        onClick={() => removeFile(index)}
      >
        <span className="sr-only">Remove file {index + 1}</span>
        <RemoveIcon className="w-4 h-4 hover:stroke-destructive duration-200 ease-in-out" />
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
  const { dropzoneState, isFileTooBig, isLimitReached, files } =
    useFileUpload();
  const hasFiles = files && files.length > 0;

  // Don't get root props if limit reached
  const rootProps = isLimitReached ? {} : dropzoneState.getRootProps();

  return (
    <div
      ref={ref}
      {...props}
      className={cn(
        "relative w-full border rounded bg-accent/30 hover:bg-accent/50 transition-all h-56 flex items-center justify-center",
        isLimitReached ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      )}
    >
      {!hasFiles && (
        <div
          className={cn(
            "w-full rounded-lg duration-300 ease-in-out",
            dropzoneState.isDragAccept
              ? "border-green-500"
              : dropzoneState.isDragReject || isFileTooBig
              ? "border-red-500"
              : "border-gray-300",
            className
          )}
          {...rootProps}
        >
          {children}
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
