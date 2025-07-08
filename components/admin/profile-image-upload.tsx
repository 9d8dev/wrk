"use client";

import { Upload } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

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
  userUsername?: string | null;
  profileImageFile: File[] | null;
  onImageChange: (files: File[] | null) => void;
}

export default function ProfileImageUpload({
  currentImageUrl,
  userName,
  userUsername,
  profileImageFile,
  onImageChange,
}: ProfileImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewImageUrl =
    profileImageFile && profileImageFile.length > 0
      ? URL.createObjectURL(profileImageFile[0])
      : currentImageUrl;

  const hasImage = !!previewImageUrl;
  const userInitial =
    userUsername?.charAt(0).toUpperCase() ||
    userName?.charAt(0).toUpperCase() ||
    "U";

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      onImageChange(fileArray);
    }
  };

  return (
    <FormItem>
      <FormLabel>Profile Image</FormLabel>
      <FormControl>
        <div className="flex items-center justify-center">
          <div className="relative">
            <div
              className="h-20 w-20 cursor-pointer overflow-hidden rounded-full border transition-opacity hover:opacity-80"
              onClick={handleClick}
            >
              {hasImage ? (
                <Image
                  src={previewImageUrl}
                  alt={userName || "Profile"}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="bg-accent flex h-full w-full items-center justify-center">
                  <span className="text-accent-foreground text-2xl">
                    {userInitial}
                  </span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleClick}
              className="bg-primary text-primary-foreground hover:bg-primary/90 absolute -right-1 -bottom-1 rounded-full p-1.5 shadow-md transition-colors"
            >
              <Upload className="h-3 w-3" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </FormControl>
      <FormDescription className="mx-auto mt-2 max-w-xs text-center text-balance">
        Click to upload a new profile image (max 1MB, JPG/PNG/WebP)
      </FormDescription>
      <FormMessage />
    </FormItem>
  );
}
