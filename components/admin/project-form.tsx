"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createProject, editProject } from "@/lib/actions/project";
import { uploadImage } from "@/lib/actions/media";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, ControllerRenderProps } from "react-hook-form";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { z } from "zod";

import {
  Loader2,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  X,
  Plus,
  Star,
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
  featuredImageId: z.string().optional(),
  imageIds: z.array(z.string()).optional(),
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

const IMAGE_CONFIG = {
  maxFiles: 5,
  maxSize: 15 * 1024 * 1024, // 15MB (increased for GIFs)
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
  const [projectImages, setProjectImages] = useState<File[]>(
    initialImages || []
  );
  const [uploadedMedia, setUploadedMedia] = useState<Media[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [featuredImageId, setFeaturedImageId] = useState<string | null>(null);
  const [existingFeaturedMedia, setExistingFeaturedMedia] =
    useState<Media | null>(existingFeaturedImage || null);
  const [existingAdditionalMedia, setExistingAdditionalMedia] = useState<
    Media[]
  >(existingAdditionalImages);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Initialize form with default values
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: useMemo(
      () => ({
        title: project?.title || "",
        slug: project?.slug || "",
        externalLink: project?.externalLink || "",
        about: project?.about || "",
        featuredImageId: project?.featuredImageId || "",
        imageIds: project?.imageIds || [],
      }),
      [project]
    ),
  });

  // Initialize existing media data and IDs from props
  useEffect(() => {
    // If initial images were provided, set them as project images
    if (initialImages?.length && !isEditing) {
      setProjectImages(initialImages);
    }

    // Initialize existing media from props (no server action calls!)
    if (isEditing) {
      if (existingFeaturedImage) {
        setExistingFeaturedMedia(existingFeaturedImage);
        setFeaturedImageId(existingFeaturedImage.id);
      }

      if (existingAdditionalImages?.length) {
        // Set all media as selected image IDs
        const mediaIds = existingAdditionalImages.map((media) => media.id);
        setSelectedImageIds(mediaIds);
        setExistingAdditionalMedia(existingAdditionalImages);
      }
    }
  }, [
    project?.id,
    isEditing,
    initialImages,
    existingFeaturedImage,
    existingAdditionalImages,
  ]);

  // Handle form submission
  const handleFormSubmit = useCallback(
    async (values: ProjectFormValues) => {
      try {
        setIsSubmitting(true);

        // Upload all project images first
        const newImageIds: string[] = [...selectedImageIds]; // Start with existing IDs
        const uploadedImageIds: string[] = [];

        // Upload new images if any
        if (projectImages.length > 0) {
          // Upload all images in parallel for better performance
          const uploadPromises = projectImages.map(async (imageFile) => {
            const formData = new FormData();
            formData.append("file", imageFile);
            return uploadImage(formData);
          });

          const uploadResults = await Promise.all(uploadPromises);

          // Process results and collect successful uploads
          uploadResults.forEach((result) => {
            if (result.success && result.mediaId) {
              newImageIds.push(result.mediaId);
              uploadedImageIds.push(result.mediaId);
            }
          });
        }

        console.log("Uploaded image IDs:", uploadedImageIds);
        console.log("All image IDs for project:", newImageIds);

        // Use the selected featured image ID or the first image if none selected
        let newFeaturedImageId = featuredImageId;
        if (!newFeaturedImageId && newImageIds.length > 0) {
          newFeaturedImageId = newImageIds[0];
        }

        // Prepare the data with all required fields
        const projectData = {
          ...values,
          id: project?.id || nanoid(),
          featuredImageId: newFeaturedImageId,
          externalLink: values.externalLink || null,
          about: values.about || null,
          imageIds: newImageIds,
          displayOrder: project?.displayOrder || null,
          createdAt: project?.createdAt || new Date(),
          updatedAt: new Date(),
          userId: project?.userId || "",
        };

        // Submit the data
        if (onSubmit) {
          onSubmit(values);
        } else {
          // Default submission logic
          if (isEditing && project?.id) {
            const result = await editProject(project.id, {
              title: projectData.title,
              externalLink: projectData.externalLink,
              about: projectData.about,
              featuredImageId: newFeaturedImageId,
              imageIds: projectData.imageIds,
              displayOrder: projectData.displayOrder,
            });
            if (result.success) {
              toast.success("Project updated successfully");
            } else {
              throw new Error(result.error);
            }
          } else {
            const result = await createProject(projectData);
            if (result.success) {
              toast.success("Project created successfully");
            } else {
              throw new Error(result.error);
            }
          }
        }

        // Reset form state
        form.reset();
        setUploadedMedia([]);
        setProjectImages([]);
        setSelectedImageIds([]);
        setFeaturedImageId(null);

        if (onSuccess) {
          onSuccess();
        }
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
      projectImages,
      selectedImageIds,
      featuredImageId,
      project,
      isEditing,
      onSubmit,
      onSuccess,
      form,
    ]
  );

  // Add keyboard shortcut for CMD+S / Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for CMD+S (Mac) or Ctrl+S (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault(); // Prevent browser's default save behavior

        // Only submit if form is valid and not already submitting
        if (!isSubmitting) {
          form.handleSubmit(handleFormSubmit)();
        }
      }
    };

    // Add event listener
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [form, handleFormSubmit, isSubmitting]);

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

            <FormField
              control={form.control}
              name="featuredImageId"
              render={({ field }) => (
                <ProjectImagesField
                  field={field}
                  existingFeaturedMedia={existingFeaturedMedia}
                  existingAdditionalMedia={existingAdditionalMedia}
                  projectImages={projectImages}
                  setProjectImages={setProjectImages}
                  featuredImageId={featuredImageId}
                  setFeaturedImageId={setFeaturedImageId}
                  uploadedMedia={uploadedMedia}
                />
              )}
            />
          </div>

          {/* Basic Details Section */}
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
                      <div className="relative">
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
                      </div>
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

          <MediaGrid media={uploadedMedia} title="Additional Media" />

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

const MediaGrid = ({ media, title }: { media: Media[]; title: string }) => {
  if (media.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {media.map((item) => (
          <div
            key={item.id}
            className="relative group h-56 overflow-hidden rounded-lg border"
          >
            <Image
              src={item.url}
              alt={item.alt || "Project media"}
              width={400}
              height={300}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

interface ProjectImagesFieldProps {
  field: ControllerRenderProps<ProjectFormValues, "featuredImageId">;
  existingFeaturedMedia: Media | null;
  existingAdditionalMedia: Media[];
  projectImages: File[];
  setProjectImages: (files: File[]) => void;
  featuredImageId: string | null;
  setFeaturedImageId: (id: string | null) => void;
  uploadedMedia: Media[];
}

const ProjectImagesField = ({
  field,
  existingFeaturedMedia,
  existingAdditionalMedia,
  projectImages,
  setProjectImages,
  featuredImageId,
  setFeaturedImageId,
  uploadedMedia,
}: ProjectImagesFieldProps) => {
  const [previewUrls, setPreviewUrls] = useState<{ [key: string]: string }>({});

  // Memoize preview URLs to prevent unnecessary re-creation
  useEffect(() => {
    const urls: { [key: string]: string } = {};
    projectImages.forEach((file, index) => {
      urls[`new-${index}`] = URL.createObjectURL(file);
    });
    setPreviewUrls(urls);

    return () => {
      Object.values(urls).forEach(URL.revokeObjectURL);
    };
  }, [projectImages]);

  // Only update field when featuredImageId actually changes
  useEffect(() => {
    const currentValue = field.value;
    const newValue = featuredImageId || "";
    if (currentValue !== newValue) {
      field.onChange(newValue);
    }
  }, [featuredImageId, field]);

  const handleSelectAsFeatured = (id: string) => {
    setFeaturedImageId(id);
  };

  const handleSelectNewImageAsFeatured = (index: number) => {
    // Use a special ID format for new images
    const newImageId = `new-${index}`;
    setFeaturedImageId(newImageId);
  };

  // Memoize the combined media array to prevent unnecessary re-calculations
  const allExistingMedia = useMemo(
    () => [
      ...(existingFeaturedMedia ? [existingFeaturedMedia] : []),
      ...existingAdditionalMedia,
      ...uploadedMedia,
    ],
    [existingFeaturedMedia, existingAdditionalMedia, uploadedMedia]
  );

  const totalImages = allExistingMedia.length + projectImages.length;

  return (
    <FormItem>
      <div className="space-y-6">
        {/* Image Count and Status */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-sm">
            {totalImages}/5 images
          </Badge>
          {totalImages > 0 &&
            !featuredImageId &&
            allExistingMedia.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <Star className="w-4 h-4" />
                <span>First image will be featured</span>
              </div>
            )}
        </div>

        {/* Images Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {/* Existing Images */}
          {allExistingMedia.map((media) => (
            <div
              key={media.id}
              className={cn(
                "relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all aspect-square",
                featuredImageId === media.id
                  ? "border-primary ring-2 ring-primary/20 shadow-lg"
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => handleSelectAsFeatured(media.id)}
            >
              <Image
                src={media.url}
                alt={media.alt || "Project image"}
                fill
                className="object-cover"
              />
              {featuredImageId === media.id && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  Featured
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
            </div>
          ))}

          {/* New Images */}
          {projectImages.map((file, index) => {
            const newImageId = `new-${index}`;
            const isNewImageFeatured = featuredImageId === newImageId;

            return (
              <div
                key={newImageId}
                className={cn(
                  "relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all aspect-square",
                  isNewImageFeatured
                    ? "border-primary ring-2 ring-primary/20 shadow-lg bg-primary/5"
                    : "border-dashed border-primary/50 hover:border-primary bg-primary/5"
                )}
                onClick={() => handleSelectNewImageAsFeatured(index)}
              >
                {previewUrls[newImageId] && (
                  <Image
                    src={previewUrls[newImageId]}
                    alt={`New image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                )}
                <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-md font-medium">
                  New
                </div>
                {isNewImageFeatured && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Featured
                  </div>
                )}
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newImages = [...projectImages];
                    newImages.splice(index, 1);
                    setProjectImages(newImages);
                    // If this was the featured image, clear the featured selection
                    if (featuredImageId === newImageId) {
                      setFeaturedImageId(null);
                    }
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
          })}

          {/* Add More Button */}
          {totalImages < 5 && (
            <FileUploader
              value={projectImages}
              onValueChange={(files: File[] | null) => {
                if (files) {
                  const maxNewImages = Math.max(0, 5 - allExistingMedia.length);
                  const filesToAdd = files.slice(0, maxNewImages);
                  setProjectImages(filesToAdd);
                } else {
                  setProjectImages([]);
                }
              }}
              dropzoneOptions={{
                ...IMAGE_CONFIG,
                maxFiles: Math.max(1, 5 - allExistingMedia.length),
              }}
            >
              <FileInput>
                <div className="aspect-square border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-muted/50 group">
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-muted rounded-full group-hover:bg-primary/10 transition-colors">
                      <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">
                      Add Image
                    </span>
                  </div>
                </div>
              </FileInput>
              <FileUploaderContent />
            </FileUploader>
          )}
        </div>

        {/* Helper Text */}
        {totalImages === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-muted-foreground/20 rounded-lg">
            <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">
              No images added yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Add at least one image to showcase your project
            </p>
          </div>
        )}

        {totalImages > 0 && (
          <p className="text-sm text-muted-foreground">
            Click on any image to set it as the featured image for your project.
          </p>
        )}
      </div>

      <FormMessage />
    </FormItem>
  );
};
