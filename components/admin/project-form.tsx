"use client";

import { useState, useEffect, useCallback } from "react";
import { createProject, editProject } from "@/lib/actions/project";
import { uploadImage } from "@/lib/actions/media";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Star,
  X,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  FileUploader,
  FileInput,
  FileUploaderContent,
} from "@/components/ui/file-upload";

import Image from "next/image";
import { cn } from "@/lib/utils";

import type { Media, Project } from "@/db/schema";

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

// Types for managing images
interface ProjectImage {
  id: string;
  type: "existing" | "new";
  media?: Media;
  file?: File;
  previewUrl?: string;
  isFeatured: boolean;
}

const IMAGE_CONFIG = {
  maxFiles: 5,
  maxSize: 15 * 1024 * 1024, // 15MB
  accept: {
    "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
  },
};

const generateSlugFromTitle = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

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
  const [images, setImages] = useState<ProjectImage[]>([]);
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

  // Initialize images on mount
  useEffect(() => {
    const initializeImages = () => {
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
      existingAdditionalImages.forEach((media) => {
        imageList.push({
          id: media.id,
          type: "existing",
          media,
          isFeatured: false,
        });
      });

      // Add initial images (for new projects)
      initialImages.forEach((file, index) => {
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
    };

    initializeImages();
  }, [
    project?.id,
    existingFeaturedImage?.id,
    existingAdditionalImages?.length,
    initialImages.length,
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

  // Handle adding new images
  const handleAddImages = useCallback(
    (files: File[]) => {
      const currentImageCount = images.length;
      const availableSlots = 5 - currentImageCount;
      const filesToAdd = files.slice(0, availableSlots);

      const newImages: ProjectImage[] = filesToAdd.map((file, index) => {
        const id = `new-${Date.now()}-${index}`;
        return {
          id,
          type: "new",
          file,
          previewUrl: URL.createObjectURL(file),
          isFeatured: currentImageCount === 0 && index === 0, // First image featured if no images exist
        };
      });

      setImages((prev) => [...prev, ...newImages]);
    },
    [images.length],
  );

  // Handle removing an image
  const handleRemoveImage = useCallback((imageId: string) => {
    setImages((prev) => {
      const updatedImages = prev.filter((img) => img.id !== imageId);

      // Clean up preview URL if it exists
      const removedImage = prev.find((img) => img.id === imageId);
      if (removedImage?.previewUrl) {
        URL.revokeObjectURL(removedImage.previewUrl);
      }

      // If we removed the featured image, make the first remaining image featured
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

  // Handle setting featured image
  const handleSetFeatured = useCallback((imageId: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isFeatured: img.id === imageId,
      })),
    );
  }, []);

  // Handle form submission
  const handleFormSubmit = useCallback(
    async (values: ProjectFormValues) => {
      try {
        setIsSubmitting(true);

        // Collect existing image IDs
        const existingImageIds = images
          .filter((img) => img.type === "existing")
          .map((img) => img.media!.id);

        // Upload new images
        const newImages = images.filter((img) => img.type === "new");
        const uploadedImageIds: string[] = [];

        if (newImages.length > 0) {
          const uploadPromises = newImages.map(async (img) => {
            const formData = new FormData();
            formData.append("file", img.file!);
            return uploadImage(formData);
          });

          const uploadResults = await Promise.all(uploadPromises);

          uploadResults.forEach((result) => {
            if (result.success && result.mediaId) {
              uploadedImageIds.push(result.mediaId);
            }
          });
        }

        // Combine all image IDs
        const allImageIds = [...existingImageIds, ...uploadedImageIds];

        // Determine featured image ID
        let featuredImageId: string | undefined;
        const featuredImage = images.find((img) => img.isFeatured);

        if (featuredImage) {
          if (featuredImage.type === "existing") {
            featuredImageId = featuredImage.media!.id;
          } else {
            // Find the corresponding uploaded ID
            const newImageIndex = newImages.findIndex(
              (img) => img.id === featuredImage.id,
            );
            featuredImageId = uploadedImageIds[newImageIndex];
          }
        } else if (allImageIds.length > 0) {
          // Default to first image if none explicitly featured
          featuredImageId = allImageIds[0];
        }

        // Prepare project data - convert empty strings to undefined for optional fields
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
          let result;
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
                : "Project created successfully",
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
        setImages([]);
      } catch (error) {
        console.error("Error submitting form:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "An error occurred. Please try again.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [images, project, isEditing, onSubmit, onSuccess, form],
  );

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        if (!isSubmitting) {
          form.handleSubmit(handleFormSubmit)();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [form, handleFormSubmit, isSubmitting]);

  const totalImages = images.length;

  return (
    <div className="max-w-3xl mx-auto">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="space-y-8"
        >
          {/* Image Upload Section */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Project Images
              </h3>
              <p className="text-sm text-muted-foreground">
                Upload up to 5 images for your project. Click on an image to set
                it as featured.
              </p>
            </div>

            <div className="space-y-4">
              <Badge variant="outline" className="text-sm">
                {totalImages}/5 images
              </Badge>

              {totalImages === 0 ? (
                <FileUploader
                  value={[]}
                  onValueChange={(files) => files && handleAddImages(files)}
                  dropzoneOptions={IMAGE_CONFIG}
                >
                  <FileInput>
                    <div className="border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 rounded-lg p-12 text-center cursor-pointer transition-all hover:bg-muted/50 group">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-muted rounded-full group-hover:bg-primary/10 transition-colors">
                          <ImageIcon className="w-12 h-12 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-lg font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                            No images added yet
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Click here or drag and drop images to get started
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Supports PNG, JPG, WEBP, and GIF files up to 15MB
                          </p>
                        </div>
                      </div>
                    </div>
                  </FileInput>
                </FileUploader>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {images.map((image) => (
                      <ImageCard
                        key={image.id}
                        image={image}
                        onSetFeatured={handleSetFeatured}
                        onRemove={handleRemoveImage}
                      />
                    ))}

                    {totalImages < 5 && (
                      <FileUploader
                        value={[]}
                        onValueChange={(files) =>
                          files && handleAddImages(files)
                        }
                        dropzoneOptions={{
                          ...IMAGE_CONFIG,
                          maxFiles: 5 - totalImages,
                        }}
                      >
                        <FileInput>
                          <Plus />
                        </FileInput>
                      </FileUploader>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Click on any image to set it as the featured image for your
                    project.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Project Details Section */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Project Details</h3>
              <p className="text-sm text-muted-foreground">
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
                                generateSlugFromTitle(e.target.value),
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
                        className="text-base font-mono"
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
                        className="min-h-[120px] resize-vertical text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Tell visitors about this project, the technology used, or
                      the story behind it.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Advanced Options Section */}
          <div className="space-y-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 p-0 h-auto text-base font-medium hover:bg-transparent"
            >
              {showAdvanced ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
              Advanced Options
            </Button>

            {showAdvanced && (
              <div className="space-y-6 pt-4 border-t">
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
                        Add a link to the live project, GitHub repository, or
                        related resource.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          {/* Actions Section */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
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
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[140px]"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Update Project" : "Create Project"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

// Image card component
interface ImageCardProps {
  image: ProjectImage;
  onSetFeatured: (id: string) => void;
  onRemove: (id: string) => void;
}

const ImageCard = ({ image, onSetFeatured, onRemove }: ImageCardProps) => {
  const imageSrc =
    image.type === "existing" ? image.media!.url : image.previewUrl!;
  const imageAlt =
    image.type === "existing"
      ? image.media!.alt || "Project image"
      : "New image";

  return (
    <div
      className={cn(
        "relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all aspect-square",
        image.isFeatured
          ? "border-primary ring-2 ring-primary/20 shadow-lg"
          : "border-border hover:border-primary/50",
      )}
      onClick={() => onSetFeatured(image.id)}
    >
      <Image src={imageSrc} alt={imageAlt} fill className="object-cover" />

      {image.isFeatured && (
        <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1">
          <Star className="w-3 h-3 fill-current" />
          Featured
        </div>
      )}

      {image.type === "new" && (
        <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-md font-medium">
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
        className="absolute bottom-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
    </div>
  );
};
