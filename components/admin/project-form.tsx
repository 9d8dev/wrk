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
  getFeaturedImageByProjectId,
  getAllProjectImages,
} from "@/lib/data/media";

import {
  Loader2,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
            await editProject(project.id, {
              title: projectData.title,
              slug: projectData.slug,
              externalLink: projectData.externalLink,
              about: projectData.about,
              featuredImageId: newFeaturedImageId,
              imageIds: projectData.imageIds,
              displayOrder: projectData.displayOrder,
            });
            toast.success("Project updated successfully");
          } else {
            await createProject(projectData);
            toast.success("Project created successfully");
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
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-4 max-w-2xl"
      >
        {/* Image Upload Section - Always visible */}
        <div className="space-y-4">
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

        {/* Basic Fields - Always visible */}
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter project title"
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
                <FormLabel>URL Slug</FormLabel>
                <FormControl>
                  <Input
                    placeholder="project-slug"
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
                  This will be used in the URL: wrk.so/username/slug
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
                <FormLabel>About</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe your project..."
                    className="min-h-[100px] resize-vertical"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Advanced Fields Toggle */}
        <div className="border-t pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2"
          >
            {showAdvanced ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            Advanced Options
          </Button>
        </div>

        {/* Advanced Fields - Collapsible */}
        {showAdvanced && (
          <div className="space-y-3 pt-2">
            <FormField
              control={form.control}
              name="externalLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>External Link</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com"
                      type="url"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Add a link to the live project or related resource
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <MediaGrid media={uploadedMedia} title="Additional Media" />

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <div className="flex items-center text-xs text-muted-foreground mr-auto">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">
              {typeof window !== "undefined" &&
              /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent)
                ? "⌘"
                : "Ctrl"}
              +S
            </kbd>{" "}
            to save
          </div>
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update Project" : "Create Project"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

const MediaGrid = ({ media, title }: { media: Media[]; title: string }) => {
  if (media.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {media.map((item) => (
          <div key={item.id} className="relative group h-56 overflow-hidden">
            <Image
              src={item.url}
              alt={item.alt || "Project media"}
              width={400}
              height={300}
              className="w-full h-auto rounded aspect-square object-cover"
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
      <FormLabel className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4" />
        Project Images
        <span className="text-sm font-normal text-muted-foreground">
          ({totalImages}/5)
        </span>
      </FormLabel>

      {/* Combined Grid View */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {/* Existing Images */}
          {allExistingMedia.map((media) => (
            <div
              key={media.id}
              className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                featuredImageId === media.id
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-muted hover:border-muted-foreground/50"
              }`}
              onClick={() => handleSelectAsFeatured(media.id)}
            >
              <div className="aspect-square relative">
                <Image
                  src={media.url}
                  alt={media.alt || "Project image"}
                  fill
                  className="object-cover"
                />
              </div>
              {featuredImageId === media.id && (
                <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                  Featured
                </div>
              )}
            </div>
          ))}

          {/* New Images */}
          {projectImages.map((file, index) => (
            <div
              key={`new-${index}`}
              className="relative group border-2 border-muted hover:border-muted-foreground/50 rounded-lg overflow-hidden transition-all"
            >
              <div className="aspect-square relative">
                {previewUrls[`new-${index}`] && (
                  <Image
                    src={previewUrls[`new-${index}`]}
                    alt={`New image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="absolute top-1 left-1 bg-yellow-500 text-yellow-900 text-xs px-1.5 py-0.5 rounded">
                New
              </div>
              <Button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const newImages = [...projectImages];
                  newImages.splice(index, 1);
                  setProjectImages(newImages);
                }}
                size="icon"
                variant="destructive"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}

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
                <div className="aspect-square border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/50 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-muted/5">
                  <UploadCloud className="h-6 w-6 text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground">
                    Add Image
                  </span>
                </div>
              </FileInput>
              <FileUploaderContent />
            </FileUploader>
          )}
        </div>

        {totalImages === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Add at least one image to your project
          </p>
        )}

        {totalImages > 0 &&
          !featuredImageId &&
          allExistingMedia.length === 0 && (
            <p className="text-sm text-yellow-600 text-center py-2">
              The first image will be set as featured
            </p>
          )}
      </div>

      <FormMessage />
    </FormItem>
  );
};
