"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { createProject } from "@/lib/actions/project";
import { uploadImage } from "@/lib/actions/media";
import { Upload, X, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const generateSlugFromTitle = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const generateTitleFromFilename = (filename: string): string => {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  // Replace underscores and hyphens with spaces
  const withSpaces = nameWithoutExt.replace(/[-_]/g, " ");
  // Capitalize first letter of each word
  return withSpaces
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function QuickCreateProject() {
  const [isDragging, setIsDragging] = useState(false);
  const [projectImages, setProjectImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [about, setAbout] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [featuredImageIndex, setFeaturedImageIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate preview URLs
  useEffect(() => {
    const urls = projectImages.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      urls.forEach(URL.revokeObjectURL);
    };
  }, [projectImages]);

  // Auto-generate title and slug from first image
  useEffect(() => {
    if (projectImages.length > 0 && !title) {
      const generatedTitle = generateTitleFromFilename(projectImages[0].name);
      setTitle(generatedTitle);
      setSlug(generateSlugFromTitle(generatedTitle));
    }
  }, [projectImages, title]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save with Cmd/Ctrl + S
      if ((e.metaKey || e.ctrlKey) && e.key === "s" && projectImages.length > 0) {
        e.preventDefault();
        handleSubmit();
      }
      // Clear with Escape
      if (e.key === "Escape" && projectImages.length > 0) {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectImages, title, slug]);

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

  const processFiles = useCallback((fileList: FileList) => {
    const files = Array.from(fileList);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    
    if (imageFiles.length === 0) {
      toast.error("Please select image files only");
      return;
    }

    const totalImages = projectImages.length + imageFiles.length;
    if (totalImages > 5) {
      toast.error("Maximum 5 images per project");
      return;
    }

    setProjectImages((prev) => [...prev, ...imageFiles].slice(0, 5));
  }, [projectImages]);

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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleRemoveImage = (index: number) => {
    setProjectImages((prev) => prev.filter((_, i) => i !== index));
    if (featuredImageIndex >= index && featuredImageIndex > 0) {
      setFeaturedImageIndex(featuredImageIndex - 1);
    }
  };

  const handleClear = () => {
    setProjectImages([]);
    setTitle("");
    setSlug("");
    setAbout("");
    setExternalLink("");
    setShowAdvanced(false);
    setFeaturedImageIndex(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!title || !slug || projectImages.length === 0) {
      toast.error("Please add images and fill in required fields");
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload all images
      const uploadedImageIds: string[] = [];
      
      for (const imageFile of projectImages) {
        const formData = new FormData();
        formData.append("file", imageFile);
        
        const result = await uploadImage(formData);
        if (result.success && result.mediaId) {
          uploadedImageIds.push(result.mediaId);
        }
      }

      // Create project with featured image being the selected one
      const projectData = {
        id: nanoid(),
        title,
        slug,
        externalLink: externalLink || null,
        about: about || null,
        featuredImageId: uploadedImageIds[featuredImageIndex] || null,
        imageIds: uploadedImageIds,
        displayOrder: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "", // Will be set by server action
      };

      await createProject(projectData);
      toast.success("Project created successfully!");
      
      // Clear form
      handleClear();
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg transition-all relative",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/20 hover:border-muted-foreground/40",
        projectImages.length > 0 ? "bg-background" : ""
      )}
      onDragEnter={handleDragEnter}
      onDragOver={preventDefaults}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
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
        <div
          className="p-12 text-center cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Quick Create Project</h3>
          <p className="text-sm text-muted-foreground">
            Drag and drop images here or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Auto-generates title and slug from filename
          </p>
        </div>
      ) : (
        <div className="p-6 space-y-4">
          {/* Image Preview Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                Images ({projectImages.length}/5)
              </h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={projectImages.length >= 5}
              >
                Add More
              </Button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {previewUrls.map((url, index) => (
                <div
                  key={index}
                  className={cn(
                    "relative group cursor-pointer rounded overflow-hidden border-2",
                    featuredImageIndex === index
                      ? "border-primary"
                      : "border-transparent"
                  )}
                  onClick={() => setFeaturedImageIndex(index)}
                >
                  <div className="aspect-square relative">
                    <Image
                      src={url}
                      alt={`Image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {featuredImageIndex === index && (
                    <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                      Featured
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(index);
                    }}
                    className="absolute top-1 right-1 bg-background/80 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Click an image to set as featured
            </p>
          </div>

          {/* Basic Fields */}
          <div className="space-y-3">
            <Input
              placeholder="Project Title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSlug(generateSlugFromTitle(e.target.value));
              }}
            />
            <Input
              placeholder="project-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>

          {/* Advanced Fields */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              Advanced options
            </button>
            
            {showAdvanced && (
              <div className="mt-3 space-y-3">
                <Textarea
                  placeholder="About this project (optional)"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  rows={3}
                />
                <Input
                  placeholder="External link (optional)"
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘S</kbd> to save
              <span className="mx-2">·</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">ESC</kbd> to clear
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
                disabled={isSubmitting || !title || !slug}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Project
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}