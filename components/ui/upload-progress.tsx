"use client";

import { CheckCircle, Loader2, XCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface UploadProgressProps {
  open: boolean;
  progress: {
    phase: "compressing" | "uploading" | "complete" | "error";
    current: number;
    total: number;
    percent: number;
    currentFile?: string;
    error?: string;
  } | null;
}

export function UploadProgress({ open, progress }: UploadProgressProps) {
  if (!progress) return null;

  const getStatusMessage = () => {
    switch (progress.phase) {
      case "compressing":
        return "Compressing image...";
      case "uploading":
        return `Uploading ${progress.currentFile || "image"}...`;
      case "complete":
        return "Upload complete!";
      case "error":
        return progress.error || "Upload failed";
      default:
        return "Processing...";
    }
  };

  const getIcon = () => {
    switch (progress.phase) {
      case "complete":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin" />;
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            <span>Uploading Images</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              {getStatusMessage()}
            </p>
            {progress.total > 1 && (
              <p className="text-muted-foreground text-xs">
                {progress.current} of {progress.total} files
              </p>
            )}
          </div>
          <Progress value={progress.percent} className="h-2" />
          <p className="text-muted-foreground text-center text-xs">
            {Math.round(progress.percent)}%
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
