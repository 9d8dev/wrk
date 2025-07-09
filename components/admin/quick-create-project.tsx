"use client";

import { ChevronDown, ChevronUp, Loader2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";

import { GenerateDescription } from "@/components/ai/generate-description";
import { ImproveWriting } from "@/components/ai/improve-writing";
import { UploadProgress } from "@/components/ui/upload-progress";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { uploadMultipleImages } from "@/lib/utils/upload";
import { createProject } from "@/lib/actions/project";
import { cn } from "@/lib/utils";

// Constants
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const MAX_IMAGES = 5;

// Utility functions
const generateSlugFromTitle = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const generateTitleFromFilename = (filename: string): string => {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  const withSpaces = nameWithoutExt.replace(/[-_]/g, " ");
  return withSpaces
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Types
interface ProjectFormData {
  title: string;
  slug: string;
  about: string;
  externalLink: string;
}

interface UploadProgressState {
  phase: "compressing" | "uploading" | "complete" | "error";
  current: number;
  total: number;
  percent: number;
  currentFile?: string;
  error?: string;
}

// Custom hooks
function useProjectForm() {
  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    slug: "",
    about: "",
    externalLink: "",
  });
  const [hasManuallyEditedTitle, setHasManuallyEditedTitle] = useState(false);

  const updateField = useCallback(
    (field: keyof ProjectFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (field === "title") {
        setFormData((prev) => ({
          ...prev,
          slug: generateSlugFromTitle(value),
        }));
        setHasManuallyEditedTitle(true);
      }
    },
    []
  );

  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      slug: "",
      about: "",
      externalLink: "",
    });
    setHasManuallyEditedTitle(false);
  }, []);

  return {
    formData,
    hasManuallyEditedTitle,
    updateField,
    resetForm,
  };
}

function useFileUpload() {
  const [projectImages, setProjectImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [featuredImageIndex, setFeaturedImageIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate preview URLs
  useEffect(() => {
    const urls = projectImages.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [projectImages]);

  const processFiles = useCallback(
    (fileList: FileList) => {
      const files = Array.from(fileList);
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));

      if (imageFiles.length === 0) {
        toast.error("Please select image files only");
        return;
      }

      const oversizedFiles = imageFiles.filter(
        (file) => file.size > MAX_FILE_SIZE
      );
      if (oversizedFiles.length > 0) {
        const fileNames = oversizedFiles
          .map((f) => `${f.name} (${(f.size / 1024 / 1024).toFixed(2)}MB)`)
          .join(", ");
        toast.error(
          `Files exceed ${MAX_FILE_SIZE / 1024 / 1024}MB limit: ${fileNames}`
        );
        return;
      }

      const totalImages = projectImages.length + imageFiles.length;
      if (totalImages > MAX_IMAGES) {
        toast.error(`Maximum ${MAX_IMAGES} images per project`);
        return;
      }

      setProjectImages((prev) => [...prev, ...imageFiles].slice(0, MAX_IMAGES));
    },
    [projectImages]
  );

  const removeImage = useCallback(
    (index: number) => {
      setProjectImages((prev) => prev.filter((_, i) => i !== index));
      if (featuredImageIndex >= index && featuredImageIndex > 0) {
        setFeaturedImageIndex(featuredImageIndex - 1);
      }
    },
    [featuredImageIndex]
  );

  const clearImages = useCallback(() => {
    setProjectImages([]);
    setFeaturedImageIndex(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return {
    projectImages,
    previewUrls,
    featuredImageIndex,
    fileInputRef,
    setFeaturedImageIndex,
    processFiles,
    removeImage,
    clearImages,
  };
}

function useDragAndDrop(processFiles: (files: FileList) => void) {
  const [isDragging, setIsDragging] = useState(false);

  const preventDefaults = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      preventDefaults(e);
      setIsDragging(true);
    },
    [preventDefaults]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      preventDefaults(e);
      if (e.currentTarget === e.target) {
        setIsDragging(false);
      }
    },
    [preventDefaults]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      preventDefaults(e);
      setIsDragging(false);
      if (e.dataTransfer?.files) {
        processFiles(e.dataTransfer.files);
      }
    },
    [preventDefaults, processFiles]
  );

  return {
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    preventDefaults,
  };
}

// Components
interface ImagePreviewGridProps {
  projectImages: File[];
  previewUrls: string[];
  featuredImageIndex: number;
  onSetFeatured: (index: number) => void;
  onRemoveImage: (index: number) => void;
  onAddMore: () => void;
}

function ImagePreviewGrid({
  projectImages,
  previewUrls,
  featuredImageIndex,
  onSetFeatured,
  onRemoveImage,
  onAddMore,
}: ImagePreviewGridProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">
          Images ({projectImages.length}/{MAX_IMAGES})
        </h4>
        <Button
          size="sm"
          variant="outline"
          onClick={onAddMore}
          disabled={projectImages.length >= MAX_IMAGES}
        >
          Add More
        </Button>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {previewUrls.map((url, index) => (
          <div
            key={`preview-${projectImages[index]?.name || index}-${index}`}
            className={cn(
              "group relative cursor-pointer overflow-hidden rounded border-2",
              featuredImageIndex === index
                ? "border-primary"
                : "border-transparent"
            )}
            onClick={() => onSetFeatured(index)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSetFeatured(index);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`Set ${projectImages[index]?.name || `image ${index + 1}`} as featured image`}
          >
            <div className="relative aspect-square">
              <Image
                src={url}
                alt={`Image ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
            {featuredImageIndex === index && (
              <div className="bg-primary text-primary-foreground absolute top-1 left-1 rounded px-1.5 py-0.5 text-xs">
                Featured
              </div>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveImage(index);
              }}
              className="bg-background/80 absolute top-1 right-1 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label={`Remove ${projectImages[index]?.name || `image ${index + 1}`}`}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground text-xs">
        Click an image to set as featured
      </p>
    </div>
  );
}

interface ProjectFormFieldsProps {
  formData: ProjectFormData;
  onUpdateField: (field: keyof ProjectFormData, value: string) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  featuredImage?: File;
}

function ProjectFormFields({
  formData,
  onUpdateField,
  showAdvanced,
  onToggleAdvanced,
  featuredImage,
}: ProjectFormFieldsProps) {
  return (
    <>
      {/* Basic Fields */}
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs">Project Title</p>
        <Input
          placeholder="Project Title"
          value={formData.title}
          onChange={(e) => onUpdateField("title", e.target.value)}
        />
        <p className="text-muted-foreground text-xs">Project Slug</p>
        <Input
          placeholder="project-slug"
          value={formData.slug}
          onChange={(e) => onUpdateField("slug", e.target.value)}
        />
      </div>

      {/* Advanced Fields */}
      <div>
        <button
          type="button"
          onClick={onToggleAdvanced}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
        >
          {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          Advanced options
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-3">
            <div className="space-y-2">
              <Textarea
                placeholder="About this project (optional)"
                value={formData.about}
                onChange={(e) => onUpdateField("about", e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                {featuredImage && (
                  <GenerateDescription
                    file={featuredImage}
                    field={{
                      onChange: (value: string) =>
                        onUpdateField("about", value),
                    }}
                  />
                )}
                <ImproveWriting
                  value={formData.about}
                  field={{
                    onChange: (value: string) => onUpdateField("about", value),
                  }}
                />
              </div>
            </div>
            <Input
              placeholder="External link (optional)"
              value={formData.externalLink}
              onChange={(e) => onUpdateField("externalLink", e.target.value)}
            />
          </div>
        )}
      </div>
    </>
  );
}

interface EmptyStateProps {
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

function EmptyState({ onClick, onKeyDown }: EmptyStateProps) {
  return (
    <div
      className="w-full cursor-pointer p-12 text-center"
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <Upload className="text-muted-foreground mx-auto mb-4 h-10 w-10" />
      <h3 className="mb-2 text-lg font-medium">Quick Create Project</h3>
      <p className="text-muted-foreground text-sm">
        Drag and drop images here or click to browse
      </p>
      <p className="text-muted-foreground mt-2 text-xs">
        Auto-generates title and slug from filename
      </p>
    </div>
  );
}

// Main component
export function QuickCreateProject() {
  const { formData, hasManuallyEditedTitle, updateField, resetForm } =
    useProjectForm();
  const {
    projectImages,
    previewUrls,
    featuredImageIndex,
    fileInputRef,
    setFeaturedImageIndex,
    processFiles,
    removeImage,
    clearImages,
  } = useFileUpload();
  const {
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    preventDefaults,
  } = useDragAndDrop(processFiles);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] =
    useState<UploadProgressState | null>(null);

  // Auto-generate title and slug from first image
  useEffect(() => {
    if (
      projectImages.length > 0 &&
      !formData.title &&
      !hasManuallyEditedTitle
    ) {
      const generatedTitle = generateTitleFromFilename(projectImages[0].name);
      updateField("title", generatedTitle);
    }
  }, [projectImages, formData.title, hasManuallyEditedTitle, updateField]);

  const handleClear = useCallback(() => {
    clearImages();
    resetForm();
    setShowAdvanced(false);
  }, [clearImages, resetForm]);

  const handleSubmit = useCallback(async () => {
    if (!formData.title || !formData.slug || projectImages.length === 0) {
      toast.error("Please add images and fill in required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadProgress({
        phase: "compressing",
        current: 0,
        total: projectImages.length,
        percent: 0,
      });

      const uploadResults = await uploadMultipleImages(
        projectImages,
        (completed, total, currentFile) => {
          const percent = (completed / total) * 100;
          setUploadProgress({
            phase: completed === total ? "complete" : "uploading",
            current: completed,
            total,
            percent,
            currentFile,
          });
        }
      );

      const failedUploads = uploadResults
        .map((result, index) => ({
          ...result,
          fileName: projectImages[index].name,
        }))
        .filter((r) => !r.success);

      if (failedUploads.length > 0) {
        const errorMessages = failedUploads
          .map((f) => `${f.fileName}: ${f.error}`)
          .join("\n");
        setUploadProgress({
          phase: "error",
          current: uploadResults.length,
          total: uploadResults.length,
          percent: 100,
          error: errorMessages,
        });
        throw new Error(`Failed to upload some images:\n${errorMessages}`);
      }

      const uploadedImageIds = uploadResults
        .filter((result) => result.success && result.mediaId)
        .map((result) => result.mediaId!);

      setTimeout(() => setUploadProgress(null), 1500);

      const projectData = {
        title: formData.title,
        externalLink: formData.externalLink || "",
        about: formData.about || undefined,
        featuredImageId: uploadedImageIds[featuredImageIndex] || undefined,
        imageIds: uploadedImageIds,
      };

      const result = await createProject(projectData);
      if (!result.success) {
        throw new Error(result.error || "Failed to create project");
      }

      toast.success("Project created successfully!");
      handleClear();
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, projectImages, featuredImageIndex, handleClear]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key === "s" &&
        projectImages.length > 0
      ) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === "Escape" && projectImages.length > 0) {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [projectImages, handleClear, handleSubmit]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleEmptyStateClick = () => fileInputRef.current?.click();
  const handleEmptyStateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <div
      className={cn(
        "bg-accent/20 relative rounded border border-dashed transition-all",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/20 hover:border-muted-foreground/40",
        projectImages.length > 0 ? "bg-background" : ""
      )}
      onDragEnter={handleDragEnter}
      onDragOver={preventDefaults}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onKeyDown={(e) => {
        // Only trigger if the event target is the container itself (not an input/textarea)
        if (
          (e.key === "Enter" || e.key === " ") &&
          e.target === e.currentTarget
        ) {
          e.preventDefault();
          fileInputRef.current?.click();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label="Image upload area - drag and drop files or press Enter to browse"
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileInputChange}
        accept="image/*"
        multiple
      />

      {projectImages.length === 0 ? (
        <EmptyState
          onClick={handleEmptyStateClick}
          onKeyDown={handleEmptyStateKeyDown}
        />
      ) : (
        <div className="space-y-4 p-6">
          <ImagePreviewGrid
            projectImages={projectImages}
            previewUrls={previewUrls}
            featuredImageIndex={featuredImageIndex}
            onSetFeatured={setFeaturedImageIndex}
            onRemoveImage={removeImage}
            onAddMore={() => fileInputRef.current?.click()}
          />

          <ProjectFormFields
            formData={formData}
            onUpdateField={updateField}
            showAdvanced={showAdvanced}
            onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
            featuredImage={projectImages[featuredImageIndex]}
          />

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-muted-foreground text-xs">
              <kbd className="bg-muted rounded px-1.5 py-0.5 text-xs">⌘S</kbd>{" "}
              to save
              <span className="mx-2">·</span>
              <kbd className="bg-muted rounded px-1.5 py-0.5 text-xs">
                ESC
              </kbd>{" "}
              to clear
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={isSubmitting}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.title || !formData.slug}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Project
              </Button>
            </div>
          </div>
        </div>
      )}

      <UploadProgress
        open={uploadProgress !== null}
        progress={uploadProgress}
      />
    </div>
  );
}
