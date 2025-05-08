"use client";

import { useState, useEffect, useMemo } from "react";
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

import { Loader2, UploadCloud, Trash2 } from "lucide-react";
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
  onSubmit?: (data: ProjectFormValues) => void;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const IMAGE_CONFIG = {
  maxFiles: 5,
  maxSize: 10 * 1024 * 1024, // 10MB
  accept: {
    "image/*": [".png", ".jpg", ".jpeg", ".webp"],
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
  onSubmit,
  onSuccess,
  onCancel,
}: ProjectFormProps) => {
  const isEditing = !!project;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectImages, setProjectImages] = useState<File[]>(initialImages || []);
  const [uploadedMedia, setUploadedMedia] = useState<Media[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [featuredImageId, setFeaturedImageId] = useState<string | null>(null);
  const [existingFeaturedMedia, setExistingFeaturedMedia] =
    useState<Media | null>(null);
  const [existingAdditionalMedia, setExistingAdditionalMedia] = useState<
    Media[]
  >([]);

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

  // Fetch existing media for the project if in edit mode
  useEffect(() => {
    // If initial images were provided, set them as project images
    if (initialImages?.length && !isEditing) {
      setProjectImages(initialImages);
    }
    
    const fetchProjectMedia = async () => {
      if (!project?.id) return;

      try {
        // Fetch featured image
        const featured = await getFeaturedImageByProjectId(project.id);
        if (featured) {
          setExistingFeaturedMedia(featured);
          setFeaturedImageId(featured.id);
        }

        // Fetch all project media using the new function that handles imageIds
        const allMedia = await getAllProjectImages(project.id);

        // Set all media as selected image IDs
        const mediaIds = allMedia.map((media) => media.id);
        setSelectedImageIds(mediaIds);

        console.log("Loaded image IDs for project:", mediaIds);

        // Filter out the featured image for display purposes
        const additional = featured
          ? allMedia.filter((media) => media.id !== featured.id)
          : allMedia;

        setExistingAdditionalMedia(additional);
      } catch (error) {
        console.error("Error fetching project media:", error);
        toast.error("Failed to load project media");
      }
    };

    if (isEditing) {
      fetchProjectMedia();
    }
  }, [project?.id, isEditing, initialImages]);

  // Handle form submission
  const handleFormSubmit = async (values: ProjectFormValues) => {
    try {
      setIsSubmitting(true);

      // Upload all project images first
      const newImageIds: string[] = [...selectedImageIds]; // Start with existing IDs
      const uploadedImageIds: string[] = [];

      // Upload new images if any
      if (projectImages.length > 0) {
        for (const imageFile of projectImages) {
          const formData = new FormData();
          formData.append("file", imageFile);

          // Upload the image
          const result = await uploadImage(formData);
          if (result.success && result.mediaId) {
            newImageIds.push(result.mediaId);
            uploadedImageIds.push(result.mediaId);
          }
        }
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
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-2 max-w-2xl"
      >
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

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Title of your project"
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
          name="about"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">About</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="About this project"
                  className="min-h-[150px] resize-vertical"
                  {...field}
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
              <FormLabel className="sr-only">Slug</FormLabel>
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
              <FormDescription className="sr-only">
                Auto-generated from title, but you can customize it. This will
                be used in the URL: wrk.so/username/{"{slug}"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="externalLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">
                External Link (Optional)
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Link out to project (optional)"
                  {...field}
                />
              </FormControl>
              <FormDescription className="sr-only">
                Add a link to the live project or related resource
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <MediaGrid media={uploadedMedia} title="Additional Media" />

        <div className="flex justify-end space-x-2">
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

  useEffect(() => {
    const urls: { [key: string]: string } = {};
    projectImages.forEach((file, index) => {
      urls[`new-${index}`] = URL.createObjectURL(file);
    });
    setPreviewUrls(urls);

    return () => {
      Object.values(previewUrls).forEach(URL.revokeObjectURL);
    };
  }, [projectImages]);

  useEffect(() => {
    field.onChange(featuredImageId || "");
  }, [featuredImageId, field]);
  const handleSelectAsFeatured = (id: string) => {
    setFeaturedImageId(id);
  };

  const allExistingMedia = [
    ...(existingFeaturedMedia ? [existingFeaturedMedia] : []),
    ...existingAdditionalMedia,
    ...uploadedMedia,
  ];

  return (
    <FormItem>
      <FormLabel className="sr-only">Project Images (Up to 5)</FormLabel>
      <FormControl>
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
            disabled: allExistingMedia.length >= 5,
          }}
        >
          <FileInput>
            <div className="flex flex-col items-center gap-2 p-4 text-muted-foreground">
              <UploadCloud size={32} className="mb-4" />
              <h3 className="text-xl">Project Images</h3>
              <p className="text-sm">
                {allExistingMedia.length >= 5
                  ? "Maximum number of images reached (5)"
                  : `Upload up to ${5 - allExistingMedia.length} more images`}
              </p>
              <p className="text-xs">Click an image to set as featured</p>
            </div>
          </FileInput>
          <FileUploaderContent>
            {/* Preview will be handled separately */}
          </FileUploaderContent>
        </FileUploader>
      </FormControl>

      {/* Display existing media */}
      {allExistingMedia.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Existing Images</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {allExistingMedia.map((media) => (
              <div
                key={media.id}
                className={`relative group cursor-pointer border-2 rounded-md overflow-hidden ${
                  featuredImageId === media.id
                    ? "border-primary"
                    : "border-transparent"
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
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md">
                    Featured
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {projectImages.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">New Images</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {projectImages.map((file, index) => (
              <div
                key={`new-${index}`}
                className="relative group border-2 border-transparent rounded-md overflow-hidden"
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
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newImages = [...projectImages];
                    newImages.splice(index, 1);
                    setProjectImages(newImages);
                  }}
                  size="icon"
                  variant="outline"
                  className="absolute top-2 right-2 bg-background/80"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <FormMessage />
    </FormItem>
  );
};
