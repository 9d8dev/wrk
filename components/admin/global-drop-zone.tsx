"use client";

import { useState, useEffect } from "react";
import { CreateProject } from "./create-project";
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
      {/* Visual overlay that appears when dragging files */}
      {isDragging && (
        <div className="absolute inset-0 z-10 bg-primary/10 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-background border-2 border-dashed border-primary rounded-lg p-8 shadow-lg">
            <div className="text-center">
              <svg
                className="w-16 h-16 text-primary mx-auto mb-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
              <h3 className="text-xl font-medium text-primary mb-2">
                Drop images to create a new project
              </h3>
              <p className="text-muted-foreground">
                Your images will be uploaded and a new project form will open
              </p>
            </div>
          </div>
        </div>
      )}

      <CreateProject
        buttonHidden
        initialImages={droppedFiles}
        initialOpen={shouldOpenDrawer}
        onClose={() => setShouldOpenDrawer(false)}
      />
    </>
  );
}
