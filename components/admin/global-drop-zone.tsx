"use client";

import { CreateProject } from "./create-project";
import { Upload } from "lucide-react";

import { useState, useEffect } from "react";
import { toast } from "sonner";

export function GlobalDropZone() {
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [shouldOpenDrawer, setShouldOpenDrawer] = useState(false);

  // Handle drag and drop events
  useEffect(() => {
    // Prevent default browser behavior for all drag events
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Handle drag enter events to show visual feedback
    const handleDragEnter = (e: DragEvent) => {
      preventDefaults(e);
      setIsDragging(true);
    };

    // Handle drag leave events to hide visual feedback
    const handleDragLeave = (e: DragEvent) => {
      preventDefaults(e);
      // Only set dragging to false if we're leaving the window
      if (
        e.relatedTarget === null ||
        (e.relatedTarget as Node).nodeName === "HTML"
      ) {
        setIsDragging(false);
      }
    };

    // Handle drop events to process the files
    const handleDrop = (e: DragEvent) => {
      preventDefaults(e);
      setIsDragging(false);

      if (!e.dataTransfer?.files) return;

      const files = Array.from(e.dataTransfer.files);
      console.log("Files dropped:", files);

      // Filter for image files only
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));

      if (imageFiles.length === 0) {
        toast.error("Please drop image files only");
        return;
      }

      // Set the dropped files and trigger the create project drawer
      setDroppedFiles(imageFiles);
      toast.success(
        `${imageFiles.length} image${
          imageFiles.length > 1 ? "s" : ""
        } ready for your new project`
      );
      setShouldOpenDrawer(true);
    };

    // Add event listeners
    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", preventDefaults);
    window.addEventListener("drop", handleDrop);

    // Clean up event listeners
    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", preventDefaults);
      window.removeEventListener("drop", handleDrop);
    };
  }, []);

  return (
    <>
      {isDragging && (
        <div className="fixed inset-0 z-40 bg-gradient-to-br from-transparent via-transparent to-foreground/30 flex items-end justify-end">
          <div className="m-8 bg-background rounded-sm grid grid-cols-[auto_1fr]">
            <div className="p-6 aspect-square border-r h-full flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div className="p-6">
              <h3 className="text-lg">Drop images to create a new project</h3>
              <p className="text-muted-foreground">
                Your images will be uploaded and a new project form will open
              </p>
            </div>
          </div>
        </div>
      )}

      <CreateProject
        initialImages={droppedFiles}
        initialOpen={shouldOpenDrawer}
        onClose={() => setShouldOpenDrawer(false)}
      />
    </>
  );
}
