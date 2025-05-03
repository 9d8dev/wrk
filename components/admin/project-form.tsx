"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createProject, editProject } from "@/lib/actions/project";
import { uploadImage } from "@/lib/actions/media";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, ControllerRenderProps } from "react-hook-form";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { z } from "zod";
import {
  getFeaturedImageByProjectId,
  getMediaByProjectId,
} from "@/lib/data/media";

import { Loader2, UploadCloud, Trash2 } from "lucide-react";
import { TiptapEditor } from "@/components/admin/tiptap-editor";
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
  content: z.string().optional(),
  featuredImageId: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof formSchema>;

interface ProjectFormProps {
  project?: Project;
  onSubmit?: (data: ProjectFormValues) => void;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const FEATURED_IMAGE_CONFIG = {
  maxFiles: 1,
  maxSize: 10 * 1024 * 1024, // 10MB
  accept: {
    "image/*": [".png", ".jpg", ".jpeg", ".webp"],
  },
};

const generateSlugFromTitle = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-"); // Replace multiple hyphens with a single one
};

export const ProjectForm = ({
  project,
  onSubmit,
  onSuccess,
  onCancel,
}: ProjectFormProps) => {
  const isEditing = !!project;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<Media[]>([]);
  const [existingFeaturedMedia, setExistingFeaturedMedia] =
    useState<Media | null>(null);
  const [existingAdditionalMedia, setExistingAdditionalMedia] = useState<
    Media[]
  >([]);
  const [featuredImageRemoved, setFeaturedImageRemoved] = useState(false);

  // Initialize form with default values
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: useMemo(
      () => ({
        title: project?.title || "",
        slug: project?.slug || "",
        externalLink: project?.externalLink || "",
        content: project?.content ? String(project.content) : "",
        featuredImageId: project?.featuredImageId || "",
      }),
      [project]
    ),
  });

  // Fetch existing media for the project if in edit mode
  useEffect(() => {
    const fetchProjectMedia = async () => {
      if (!project?.id) return;

      try {
        // Fetch featured image
        const featured = await getFeaturedImageByProjectId(project.id);
        if (featured) {
          setExistingFeaturedMedia(featured);
        }

        // Fetch all project media
        const allMedia = await getMediaByProjectId(project.id);
        // Filter out the featured image
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
  }, [project?.id, isEditing]);

  // Handle media added from the editor
  const handleMediaAdded = useCallback((media: Media) => {
    setUploadedMedia((prev) => [...prev, media]);
  }, []);

  // Handle form submission
  const handleFormSubmit = async (values: ProjectFormValues) => {
    try {
      setIsSubmitting(true);

      // Handle image upload if needed
      let newFeaturedImageId = values.featuredImageId || null;

      if (featuredImage instanceof File) {
        const formData = new FormData();
        formData.append("file", featuredImage);

        // Upload the image
        const result = await uploadImage(formData);
        if (result.success && result.mediaId) {
          newFeaturedImageId = result.mediaId;
        }
      } else if (featuredImageRemoved) {
        newFeaturedImageId = null;
      }

      // Prepare the data with all required fields
      const projectData = {
        ...values,
        id: project?.id || nanoid(),
        featuredImageId: newFeaturedImageId,
        externalLink: values.externalLink || null,
        content: values.content || null,
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
            content: projectData.content,
            featuredImageId: newFeaturedImageId,
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
      setFeaturedImage(null);
      setFeaturedImageRemoved(false);

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

                    // Only auto-generate slug for new projects and if we have a title
                    if (!isEditing && e.target.value) {
                      // Get current slug value
                      const currentSlug = form.getValues("slug");

                      // Only update if slug is empty or was previously auto-generated
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
          name="featuredImageId"
          render={({ field }) => (
            <FeaturedImageField
              field={field}
              existingMedia={existingFeaturedMedia}
              removed={featuredImageRemoved}
              setRemoved={setFeaturedImageRemoved}
              setImage={setFeaturedImage}
            />
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Content</FormLabel>
              <FormControl>
                <TiptapEditor
                  content={field.value || ""}
                  onChange={field.onChange}
                  projectId={project?.id}
                  onMediaAdded={handleMediaAdded}
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
                <div className="relative">
                  <Input
                    placeholder="project-slug"
                    {...field}
                    onChange={(e) => {
                      // Convert to kebab-case
                      const value = e.target.value
                        .toLowerCase()
                        .replace(/[^\w\s-]/g, "")
                        .replace(/\s+/g, "-")
                        .replace(/-+/g, "-");
                      field.onChange(value);
                    }}
                    className="pl-4"
                  />
                  <div className="absolute left-2 p-1.5 border-r aspect-square top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    <span className="text-sm">/</span>
                  </div>
                </div>
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
        <MediaGrid media={existingAdditionalMedia} title="Existing Media" />

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

interface FeaturedImageFieldProps {
  field: ControllerRenderProps<ProjectFormValues, "featuredImageId">;
  existingMedia: Media | null;
  removed: boolean;
  setRemoved: (value: boolean) => void;
  setImage: (file: File | null) => void;
}

const FeaturedImageField = ({
  field,
  existingMedia,
  removed,
  setRemoved,
  setImage,
}: FeaturedImageFieldProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <FormItem>
      <FormLabel className="sr-only">Featured Image</FormLabel>
      {existingMedia && !removed && (
        <div className="mb-2 relative group w-full h-56 overflow-hidden">
          <Image
            src={existingMedia.url}
            alt={existingMedia.alt || "Featured image"}
            fill
            className="w-full h-full rounded border object-cover"
          />
          <Button
            type="button"
            onClick={() => {
              setRemoved(true);
              field.onChange("");
            }}
            size="icon"
            variant="outline"
            className="absolute top-2 right-2"
          >
            <span className="sr-only">Remove featured image</span>
            <Trash2 size={16} />
          </Button>
        </div>
      )}

      {previewUrl && (!existingMedia || removed) && (
        <div className="mb-2 relative group w-full h-56 overflow-hidden">
          <Image
            src={previewUrl}
            alt="Featured image preview"
            fill
            className="w-full h-full rounded border object-cover"
          />
          <Button
            type="button"
            onClick={() => {
              setPreviewUrl(null);
              setImage(null);
              setRemoved(true);
              field.onChange("");
            }}
            size="icon"
            variant="outline"
            className="absolute top-2 right-2"
          >
            <span className="sr-only">Remove featured image</span>
            <Trash2 size={16} />
          </Button>
        </div>
      )}

      <FormControl>
        <FileUploader
          value={null}
          onValueChange={(files: File[] | null) => {
            const file = files?.[0] || null;
            if (file instanceof File) {
              const objectUrl = URL.createObjectURL(file);
              setPreviewUrl(objectUrl);

              setImage(file);
              setRemoved(false);
            } else {
              setPreviewUrl(null);
              setImage(null);
              if (!existingMedia || removed) {
                field.onChange("");
              }
            }
          }}
          dropzoneOptions={{
            ...FEATURED_IMAGE_CONFIG,
            disabled: false,
          }}
        >
          {(!existingMedia || removed) && !previewUrl && (
            <FileInput>
              <div className="flex flex-col items-center gap-2 p-4 text-muted-foreground">
                <UploadCloud size={32} className="mb-4" />
                <h3 className="text-xl">Project Featured Image</h3>
                <p className="text-sm">Drag & drop or click to upload</p>
              </div>
            </FileInput>
          )}
          <FileUploaderContent>
            {/* File preview will be shown here when selected */}
          </FileUploaderContent>
        </FileUploader>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};
