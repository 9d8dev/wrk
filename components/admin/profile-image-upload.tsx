"use client";

import { Upload } from "lucide-react";
import Image from "next/image";

import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/ui/file-upload";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface ProfileImageUploadProps {
  currentImageUrl?: string;
  userName?: string | null;
  profileImageFile: File[] | null;
  onImageChange: (files: File[] | null) => void;
}

export default function ProfileImageUpload({
  currentImageUrl,
  userName,
  profileImageFile,
  onImageChange,
}: ProfileImageUploadProps) {
  const previewImageUrl =
    profileImageFile && profileImageFile.length > 0
      ? URL.createObjectURL(profileImageFile[0])
      : currentImageUrl || "/placeholder-avatar.png";

  return (
    <FormItem>
      <FormLabel>Profile Image</FormLabel>
      <FormControl>
        <div className="flex items-center space-x-4">
          <div className="bg-muted h-20 w-20 overflow-hidden rounded-full">
            <Image
              src={previewImageUrl}
              alt={userName || "Profile"}
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <FileUploader
              value={profileImageFile}
              onValueChange={onImageChange}
              dropzoneOptions={{
                maxFiles: 1,
                maxSize: 1 * 1024 * 1024,
                accept: {
                  "image/*": [".jpg", ".jpeg", ".png", ".webp"],
                },
              }}
            >
              <FileInput>
                <div className="flex items-center gap-2 text-sm">
                  <Upload className="h-4 w-4" />
                  <span>Upload new image</span>
                </div>
              </FileInput>

              {profileImageFile && profileImageFile.length > 0 && (
                <FileUploaderContent className="mt-2">
                  {profileImageFile.map((file, i) => (
                    <FileUploaderItem
                      key={`${file.name}-${file.size}`}
                      index={i}
                      file={file}
                    >
                      {file.name}
                    </FileUploaderItem>
                  ))}
                </FileUploaderContent>
              )}
            </FileUploader>
          </div>
        </div>
      </FormControl>
      <FormDescription>
        Upload a profile image (max 1MB, JPG/PNG/WebP)
      </FormDescription>
      <FormMessage />
    </FormItem>
  );
}
