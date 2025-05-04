"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { ShortcutButton } from "./shortcut-button";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/lib/actions/profile";
import { Profile, SocialLink } from "@/types";
import { X, Plus, Trash2, ImageIcon } from "lucide-react";
import {
  FileUploader,
  FileInput,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/ui/file-upload";
import Image from "next/image";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  username: z.string().min(1, { message: "Username is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  bio: z.string().optional(),
  location: z.string().optional(),
  socialLinks: z
    .array(
      z.object({
        platform: z.string().min(1, { message: "Platform is required" }),
        url: z.string().url({ message: "Must be a valid URL" }),
      })
    )
    .optional(),
  profileImage: z.any().optional(),
});

type SessionUser = {
  id: string;
  name?: string | null;
  username?: string | null;
  email: string;
  image?: string | null;
};

type ProfileFormProps = {
  user: SessionUser;
  profile: Profile | null;
  socialLinks?: SocialLink[];
  profileImageUrl?: string;
};

export function ProfileForm({
  user,
  profile,
  socialLinks = [],
  profileImageUrl,
}: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File[] | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name || "",
      username: user.username || "",
      email: user.email || "",
      bio: profile?.bio || "",
      location: profile?.location || "",
      socialLinks:
        socialLinks.length > 0
          ? socialLinks.map((link) => ({
              platform: link.platform,
              url: link.url,
            }))
          : [{ platform: "", url: "" }],
      profileImage: undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "socialLinks",
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "e" && !isEditing) {
        setIsEditing(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditing]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);

      // Create FormData for image upload if there's a new profile image
      const formData = new FormData();
      if (profileImageFile && profileImageFile.length > 0) {
        formData.append("file", profileImageFile[0]);
      }

      await updateProfile({
        userId: user.id,
        profileData: {
          bio: values.bio || null,
          location: values.location || null,
        },
        userData: {
          name: values.name,
          username: values.username,
          email: values.email,
        },
        socialLinks:
          values.socialLinks?.filter((link) => link.platform && link.url) || [],
        profileImageFormData:
          profileImageFile && profileImageFile.length > 0 ? formData : null,
      });

      toast.success("Profile updated successfully");
      setIsEditing(false); // Exit edit mode after successful save
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6 fixed top-2 right-4">
          <ShortcutButton
            letter="e"
            label="Edit Profile"
            onClick={() => setIsEditing(true)}
          />
        </div>

        {(profileImageUrl || user.image) && (
          <div className="mb-6">
            <div className="w-24 h-24 rounded-full overflow-hidden">
              <Image
                src={profileImageUrl || user.image || "/placeholder-avatar.png"}
                alt={user.name || "Profile"}
                width={96}
                height={96}
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Name
            </h3>
            <p className="mt-1 text-base">{user.name || "—"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Username
            </h3>
            <p className="mt-1 text-base">{user.username || "—"}</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Email
          </h3>
          <p className="mt-1 text-base">{user.email || "—"}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Bio
          </h3>
          <p className="mt-1 text-base whitespace-pre-wrap">
            {profile?.bio || "—"}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Location
            </h3>
            <p className="mt-1 text-base">{profile?.location || "—"}</p>
          </div>
        </div>

        {socialLinks && socialLinks.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Social Links
            </h3>
            <div className="space-y-2">
              {socialLinks.map((link, index) => (
                <div key={index} className="flex items-center">
                  <span className="font-medium mr-2">{link.platform}:</span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {link.url}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Form {...form}>
      <div className="flex justify-between items-center mb-6 fixed top-2 right-4">
        <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
          <X size={12} />
          Cancel
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="profileImage"
          render={() => (
            <FormItem>
              <FormLabel>Profile Image</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  {(profileImageUrl || user.image) && !profileImageFile && (
                    <div className="w-24 h-24 rounded-full overflow-hidden mb-2">
                      <Image
                        src={
                          profileImageUrl ||
                          user.image ||
                          "/placeholder-avatar.png"
                        }
                        alt={user.name || "Profile"}
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}

                  <FileUploader
                    value={profileImageFile}
                    onValueChange={setProfileImageFile}
                    dropzoneOptions={{
                      maxFiles: 1,
                      maxSize: 1 * 1024 * 1024, // 1MB
                      accept: {
                        "image/*": [".jpg", ".jpeg", ".png", ".webp"],
                      },
                    }}
                  >
                    <FileInput className="h-64 border-dashed flex flex-col items-center justify-center gap-1 text-sm text-muted-foreground">
                      <ImageIcon size={24} className="mb-4" />
                      <p>Drag & drop or click to upload profile image</p>
                      <p className="text-xs">
                        (Max file size: 1MB, Formats: JPG, PNG, WebP)
                      </p>
                    </FileInput>

                    {profileImageFile && profileImageFile.length > 0 && (
                      <FileUploaderContent>
                        {profileImageFile.map((file, i) => (
                          <FileUploaderItem key={i} index={i} file={file}>
                            {file.name}
                          </FileUploaderItem>
                        ))}
                      </FileUploaderContent>
                    )}
                  </FileUploader>
                </div>
              </FormControl>
              <FormDescription>
                Upload a profile picture to personalize your account.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} />
                </FormControl>
                <FormDescription>
                  This is your public display name.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="username" {...field} />
                </FormControl>
                <FormDescription>
                  Your unique username for your portfolio URL.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="your.email@example.com" {...field} />
              </FormControl>
              <FormDescription>
                Your email address is used for account notifications.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a bit about yourself"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Brief description that will appear on your portfolio.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="City, Country" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Social Links */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium">Social Links</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ platform: "", url: "" })}
            >
              <Plus size={16} className="mr-1" />
              Add Link
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-4 items-start mb-4">
              <div className="grid grid-cols-2 gap-4 flex-1">
                <FormField
                  control={form.control}
                  name={`socialLinks.${index}.platform`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="Platform (e.g. Instagram)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`socialLinks.${index}.url`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="https://instagram.com/username"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="mt-1"
              >
                <Trash2 size={16} className="text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
