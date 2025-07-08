"use client";

import type { Media, Project } from "@/db/schema";

import {
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Loader2,
  Plus,
  Star,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { toast } from "sonner";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FileInput, FileUploader } from "@/components/ui/file-upload";
import { UploadProgress } from "@/components/ui/upload-progress";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import { createProject, editProject } from "@/lib/actions/project";
import { deleteMediaWithCleanup } from "@/lib/actions/media";
import { uploadMultipleImages } from "@/lib/utils/upload";
import { cn } from "@/lib/utils";

import { GenerateDescription } from "../ai/generate-description";

// Constants
const IMAGE_CONFIG = {
  maxFiles: 5,
  maxSize: 15 * 1024 * 1024, // 15MB
  accept: {
    "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
  },
};

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const MAX_IMAGES = 5;

// Types
const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  slug: z.string().min(1, { message: "Slug is required" }),
  externalLink: z.string().optional(),
  about: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof formSchema>;

interface ProjectFormProps {
  project?: Project;
  initialImages?: File[];
  existingFeaturedImage?: Media | null;
  existingAdditionalImages?: Media[];
  onSubmit?: (data: ProjectFormValues) => void;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface ProjectImage {
  id: string;
  type: "existing" | "new";
  media?: Media;
  file?: File;
  previewUrl?: string;
  isFeatured: boolean;
}

interface UploadProgressState {
  phase: "compressing" | "uploading" | "complete" | "error";
  current: number;
  total: number;
  percent: number;
  currentFile?: string;
  error?: string;
}

// Utility functions
const generateSlugFromTitle = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

// Custom hooks
function useProjectImages(
  existingFeaturedImage?: Media | null,
  existingAdditionalImages: Media[] = [],
  initialImages: File[] = []
) {
  const [images, setImages] = useState<ProjectImage[]>([]);

  const stableExistingAdditionalImages = useMemo(
    () => existingAdditionalImages,
    [existingAdditionalImages]
  );
  const stableInitialImages = useMemo(() => initialImages, [initialImages]);

  // Initialize images on mount
  useEffect(() => {
    const imageList: ProjectImage[] = [];

    // Add existing featured image
    if (existingFeaturedImage) {
      imageList.push({
        id: existingFeaturedImage.id,
        type: "existing",
        media: existingFeaturedImage,
        isFeatured: true,
      });
    }

    // Add existing additional images
    stableExistingAdditionalImages.forEach((media) => {
      imageList.push({
        id: media.id,
        type: "existing",
        media,
        isFeatured: false,
      });
    });

    // Add initial images (for new projects)
    stableInitialImages.forEach((file, index) => {
      const id = `new-${Date.now()}-${index}`;
      imageList.push({
        id,
        type: "new",
        file,
        previewUrl: URL.createObjectURL(file),
        isFeatured: imageList.length === 0, // First image is featured if no existing featured
      });
    });

    setImages(imageList);
  }, [
    existingFeaturedImage,
    stableExistingAdditionalImages,
    stableInitialImages,
  ]);

  // Cleanup preview URLs when images change
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.previewUrl && img.type === "new") {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
    };
  }, [images]);

  const addImages = useCallback(
    (files: File[]) => {
      const currentImageCount = images.length;
      const availableSlots = MAX_IMAGES - currentImageCount;
      const filesToAdd = files.slice(0, availableSlots);

      // Validate file sizes
      const oversizedFiles = filesToAdd.filter(
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

      const newImages: ProjectImage[] = filesToAdd.map((file, index) => {
        const id = `new-${Date.now()}-${index}`;
        return {
          id,
          type: "new",
          file,
          previewUrl: URL.createObjectURL(file),
          isFeatured: currentImageCount === 0 && index === 0,
        };
      });

      setImages((prev) => [...prev, ...newImages]);
    },
    [images.length]
  );

  const removeImage = useCallback(async (imageId: string) => {
    setImages((prev) => {
      const removedImage = prev.find((img) => img.id === imageId);

      // Handle existing image deletion
      if (removedImage?.type === "existing" && removedImage.media?.id) {
        deleteMediaWithCleanup(removedImage.media.id)
          .then((result) => {
            if (!result.success) {
              console.error("Failed to delete media:", result.error);
              toast.error(`Failed to delete image: ${result.error}`);
            } else {
              toast.success("Image deleted successfully");
            }
          })
          .catch((error) => {
            console.error("Error deleting media:", error);
            toast.error("Failed to delete image");
          });
      }

      const updatedImages = prev.filter((img) => img.id !== imageId);

      // Clean up preview URL
      if (removedImage?.previewUrl) {
        URL.revokeObjectURL(removedImage.previewUrl);
      }

      // Auto-feature first image if featured was removed
      const hadFeaturedImage = prev.some((img) => img.isFeatured);
      const stillHasFeaturedImage = updatedImages.some((img) => img.isFeatured);

      if (
        hadFeaturedImage &&
        !stillHasFeaturedImage &&
        updatedImages.length > 0
      ) {
        updatedImages[0].isFeatured = true;
      }

      return updatedImages;
    });
  }, []);

  const setFeaturedImage = useCallback((imageId: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isFeatured: img.id === imageId,
      }))
    );
  }, []);

  const resetImages = useCallback(() => {
    setImages([]);
  }, []);

  return {
    images,
    addImages,
    removeImage,
    setFeaturedImage,
    resetImages,
  };
}

function useImageUpload() {
  const [uploadProgress, setUploadProgress] =
    useState<UploadProgressState | null>(null);

  const uploadImages = useCallback(async (images: ProjectImage[]) => {
    const newImages = images.filter((img) => img.type === "new");
    const uploadedImageIds: string[] = [];

    if (newImages.length > 0) {
      setUploadProgress({
        phase: "compressing",
        current: 0,
        total: newImages.length,
        percent: 0,
      });

      const files = newImages
        .map((img) => img.file)
        .filter((file): file is File => file !== undefined);

      const uploadResults = await uploadMultipleImages(
        files,
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
          fileName: files[index].name,
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

      uploadResults.forEach((result) => {
        if (result.success && result.mediaId) {
          uploadedImageIds.push(result.mediaId);
        }
      });

      setTimeout(() => setUploadProgress(null), 1500);
    }

    return uploadedImageIds;
  }, []);

  return {
    uploadProgress,
    uploadImages,
  };
}

function useKeyboardShortcuts(onSave: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        onSave();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onSave, enabled]);
}

// Components
interface ImageCardProps {
  image: ProjectImage;
  onSetFeatured: (id: string) => void;
  onRemove: (id: string) => void;
}

function ImageCard({ image, onSetFeatured, onRemove }: ImageCardProps) {
  const imageSrc =
    image.type === "existing" ? image.media?.url || "" : image.previewUrl || "";
  const imageAlt =
    image.type === "existing"
      ? image.media?.alt || "Project image"
      : "New image";

  return (
    <button
      type="button"
      className={cn(
        "group relative aspect-square w-full cursor-pointer overflow-hidden rounded-lg border-2 transition-all",
        image.isFeatured
          ? "border-primary ring-primary/20 shadow-lg ring-2"
          : "border-border hover:border-primary/50"
      )}
      onClick={() => onSetFeatured(image.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSetFeatured(image.id);
        }
      }}
      aria-label={`${image.isFeatured ? "Featured" : "Set as featured"} image`}
    >
      <Image src={imageSrc} alt={imageAlt} fill className="object-cover" />

      {image.isFeatured && (
        <div className="bg-primary text-primary-foreground absolute top-2 left-2 flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium">
          <Star className="h-3 w-3 fill-current" />
          Featured
        </div>
      )}

      {image.type === "new" && (
        <div className="absolute top-2 right-2 rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white">
          New
        </div>
      )}

      <Button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(image.id);
        }}
        size="icon"
        variant="destructive"
        className="absolute right-2 bottom-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
    </button>
  );
}

interface EmptyImageStateProps {
  onAddImages: (files: File[]) => void;
}

function EmptyImageState({ onAddImages }: EmptyImageStateProps) {
  return (
    <FileUploader
      value={[]}
      onValueChange={(files) => files && onAddImages(files)}
      dropzoneOptions={IMAGE_CONFIG}
    >
      <FileInput>
        <div className="border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50 group cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-all">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-muted group-hover:bg-primary/10 rounded-full p-4 transition-colors">
              <ImageIcon className="text-muted-foreground group-hover:text-primary h-12 w-12 transition-colors" />
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground group-hover:text-foreground text-lg font-medium transition-colors">
                No images added yet
              </p>
              <p className="text-muted-foreground text-sm">
                Click here or drag and drop images to get started
              </p>
              <p className="text-muted-foreground text-xs">
                Supports PNG, JPG, WEBP, and GIF files up to 15MB
              </p>
            </div>
          </div>
        </div>
      </FileInput>
    </FileUploader>
  );
}

interface ImageGridProps {
  images: ProjectImage[];
  onSetFeatured: (id: string) => void;
  onRemove: (id: string) => void;
  onAddImages: (files: File[]) => void;
}

function ImageGrid({
  images,
  onSetFeatured,
  onRemove,
  onAddImages,
}: ImageGridProps) {
  const totalImages = images.length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {images.map((image) => (
          <ImageCard
            key={image.id}
            image={image}
            onSetFeatured={onSetFeatured}
            onRemove={onRemove}
          />
        ))}

        {totalImages < MAX_IMAGES && (
          <FileUploader
            value={[]}
            onValueChange={(files) => files && onAddImages(files)}
            dropzoneOptions={{
              ...IMAGE_CONFIG,
              maxFiles: MAX_IMAGES - totalImages,
            }}
          >
            <FileInput>
              <Plus />
            </FileInput>
          </FileUploader>
        )}
      </div>

      <p className="text-muted-foreground text-sm">
        Click on any image to set it as the featured image for your project.
      </p>
    </div>
  );
}

interface ImageUploadSectionProps {
  images: ProjectImage[];
  onSetFeatured: (id: string) => void;
  onRemove: (id: string) => void;
  onAddImages: (files: File[]) => void;
}

function ImageUploadSection({
  images,
  onSetFeatured,
  onRemove,
  onAddImages,
}: ImageUploadSectionProps) {
  const totalImages = images.length;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <ImageIcon className="h-5 w-5" />
          Project Images
        </h3>
        <p className="text-muted-foreground text-sm">
          Upload up to 5 images for your project. Click on an image to set it as
          featured.
        </p>
      </div>

      <div className="space-y-4">
        <Badge variant="outline" className="text-sm">
          {totalImages}/{MAX_IMAGES} images
        </Badge>

        {totalImages === 0 ? (
          <EmptyImageState onAddImages={onAddImages} />
        ) : (
          <ImageGrid
            images={images}
            onSetFeatured={onSetFeatured}
            onRemove={onRemove}
            onAddImages={onAddImages}
          />
        )}
      </div>
    </div>
  );
}

interface ProjectDetailsFormProps {
  form: any;
  isEditing: boolean;
  images: ProjectImage[];
}

function ProjectDetailsForm({
  form,
  isEditing,
  images,
}: ProjectDetailsFormProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Project Details</h3>
        <p className="text-muted-foreground text-sm">
          Basic information about your project.
        </p>
      </div>

      <div className="grid gap-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Project Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter project title"
                  className="text-base"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    if (!isEditing && e.target.value) {
                      const currentSlug = form.getValues("slug");
                      if (
                        !currentSlug ||
                        currentSlug === generateSlugFromTitle(field.value)
                      ) {
                        form.setValue(
                          "slug",
                          generateSlugFromTitle(e.target.value)
                        );
                      }
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">URL Slug</FormLabel>
              <FormControl>
                <Input
                  placeholder="project-slug"
                  className="font-mono text-base"
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value
                      .toLowerCase()
                      .replace(/[^\w\s-]/g, "")
                      .replace(/\s+/g, "-")
                      .replace(/-+/g, "-");
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormDescription>
                This will be used in the URL: wrk.so/username/
                {field.value || "slug"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="about"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">About</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your project..."
                  className="resize-vertical min-h-[120px] text-base"
                  {...field}
                />
              </FormControl>

              {(() => {
                const featuredImage = images.find((img) => img.isFeatured);
                if (!featuredImage) return null;

                return (
                  <GenerateDescription
                    imageUrl={
                      featuredImage.type === "existing"
                        ? featuredImage.media?.url
                        : undefined
                    }
                    file={
                      featuredImage.type === "new"
                        ? featuredImage.file
                        : undefined
                    }
                    field={field}
                  />
                );
              })()}

              <FormDescription>
                Tell visitors about this project, the technology used, or the
                story behind it.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

interface AdvancedOptionsSectionProps {
  form: any;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
}

function AdvancedOptionsSection({
  form,
  showAdvanced,
  onToggleAdvanced,
}: AdvancedOptionsSectionProps) {
  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="ghost"
        onClick={onToggleAdvanced}
        className="flex h-auto items-center gap-2 p-0 text-base font-medium hover:bg-transparent"
      >
        {showAdvanced ? (
          <ChevronUp className="h-5 w-5" />
        ) : (
          <ChevronDown className="h-5 w-5" />
        )}
        Advanced Options
      </Button>

      {showAdvanced && (
        <div className="space-y-6 border-t pt-4">
          <FormField
            control={form.control}
            name="externalLink"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">External Link</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://example.com"
                    type="url"
                    className="text-base"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Add a link to the live project, GitHub repository, or related
                  resource.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
}

interface FormActionsProps {
  isEditing: boolean;
  isSubmitting: boolean;
  onCancel?: () => void;
}

function FormActions({ isEditing, isSubmitting, onCancel }: FormActionsProps) {
  return (
    <div className="flex items-center justify-between border-t pt-6">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <kbd className="bg-muted rounded px-2 py-1 font-mono text-xs">
          {typeof window !== "undefined" &&
          /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent)
            ? "⌘"
            : "Ctrl"}
          +S
        </kbd>
        <span>to save</span>
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Update Project" : "Create Project"}
        </Button>
      </div>
    </div>
  );
}

// Main component
export const ProjectForm = ({
  project,
  initialImages = [],
  existingFeaturedImage,
  existingAdditionalImages = [],
  onSubmit,
  onSuccess,
  onCancel,
}: ProjectFormProps) => {
  const isEditing = !!project;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: project?.title || "",
      slug: project?.slug || "",
      externalLink: project?.externalLink || "",
      about: project?.about || "",
    },
  });

  const { images, addImages, removeImage, setFeaturedImage, resetImages } =
    useProjectImages(
      existingFeaturedImage,
      existingAdditionalImages,
      initialImages
    );

  const { uploadProgress, uploadImages } = useImageUpload();

  // Handle form submission
  const handleFormSubmit = useCallback(
    async (values: ProjectFormValues) => {
      try {
        setIsSubmitting(true);

        // Collect existing image IDs
        const existingImageIds = images
          .filter((img) => img.type === "existing")
          .map((img) => img.media?.id);

        // Upload new images
        const uploadedImageIds = await uploadImages(images);

        // Combine all image IDs
        const allImageIds = [...existingImageIds, ...uploadedImageIds].filter(
          (id): id is string => id !== undefined
        );

        // Determine featured image ID
        let featuredImageId: string | undefined;
        const featuredImage = images.find((img) => img.isFeatured);

        if (featuredImage) {
          if (featuredImage.type === "existing") {
            featuredImageId = featuredImage.media?.id;
          } else {
            const newImages = images.filter((img) => img.type === "new");
            const newImageIndex = newImages.findIndex(
              (img) => img.id === featuredImage.id
            );
            featuredImageId = uploadedImageIds[newImageIndex];
          }
        } else if (allImageIds.length > 0) {
          featuredImageId = allImageIds[0];
        }

        // Prepare project data
        const projectData = {
          title: values.title,
          slug: values.slug,
          about: values.about?.trim() || undefined,
          externalLink: values.externalLink?.trim() || undefined,
          featuredImageId: featuredImageId,
          imageIds: allImageIds.length > 0 ? allImageIds : undefined,
        };

        // Submit the data
        if (onSubmit) {
          onSubmit(values);
        } else {
          let result: { success: boolean; error?: string } | undefined;
          if (isEditing && project?.id) {
            result = await editProject(project.id, {
              ...projectData,
              displayOrder: project.displayOrder,
            });
          } else {
            result = await createProject(projectData);
          }

          if (result.success) {
            toast.success(
              isEditing
                ? "Project updated successfully"
                : "Project created successfully"
            );
            if (onSuccess) {
              onSuccess();
            }
          } else {
            throw new Error(result.error);
          }
        }

        // Reset form
        form.reset();
        resetImages();
      } catch (error) {
        console.error("Error submitting form:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "An error occurred. Please try again."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      images,
      project,
      isEditing,
      onSubmit,
      onSuccess,
      form,
      uploadImages,
      resetImages,
    ]
  );

  // Setup keyboard shortcuts
  useKeyboardShortcuts(
    () => form.handleSubmit(handleFormSubmit)(),
    !isSubmitting
  );

  return (
    <div className="mx-auto max-w-3xl">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="space-y-8"
        >
          <ImageUploadSection
            images={images}
            onSetFeatured={setFeaturedImage}
            onRemove={removeImage}
            onAddImages={addImages}
          />

          <ProjectDetailsForm
            form={form}
            isEditing={isEditing}
            images={images}
          />

          <AdvancedOptionsSection
            form={form}
            showAdvanced={showAdvanced}
            onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
          />

          <FormActions
            isEditing={isEditing}
            isSubmitting={isSubmitting}
            onCancel={onCancel}
          />
        </form>
      </Form>

      <UploadProgress
        open={uploadProgress !== null}
        progress={uploadProgress}
      />
    </div>
  );
};
