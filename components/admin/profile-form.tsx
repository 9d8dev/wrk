"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

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
import {
  Edit,
  X,
  Plus,
  Trash2,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  FileUploader,
  FileInput,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/ui/file-upload";
import Image from "next/image";
import { useUsernameAvailability } from "@/hooks/use-username-availability";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  username: z.string().min(1, { message: "Username is required" }),
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
      bio: profile?.bio || "",
      location: profile?.location || "",
      socialLinks:
        socialLinks.length > 0
          ? socialLinks.map((link) => ({
              platform: link.platform,
              url: link.url,
            }))
          : [],
      profileImage: undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "socialLinks",
  });

  // Watch username for availability checking
  const currentUsername = form.watch("username");
  const originalUsername = user.username || "";

  // Only check availability if username has changed from original
  const shouldCheckAvailability =
    currentUsername !== originalUsername && currentUsername.length >= 3;
  const usernameAvailability = useUsernameAvailability(
    shouldCheckAvailability ? currentUsername : ""
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === "e" &&
        !isEditing &&
        e.target === document.body
      ) {
        e.preventDefault();
        setIsEditing(true);
      }
      if (e.key === "Escape" && isEditing) {
        e.preventDefault();
        setIsEditing(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isEditing]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Validate username availability if it has changed
      if (
        shouldCheckAvailability &&
        usernameAvailability.isAvailable !== true
      ) {
        toast.error("Please choose an available username");
        return;
      }

      setIsSubmitting(true);

      const formData = new FormData();
      if (profileImageFile && profileImageFile.length > 0) {
        formData.append("file", profileImageFile[0]);
      }

      const result = await updateProfile({
        profileData: {
          bio: values.bio || null,
          location: values.location || null,
        },
        userData: {
          name: values.name,
          username: values.username,
          email: user.email,
        },
        socialLinks:
          values.socialLinks?.filter((link) => link.platform && link.url) || [],
        profileImageFormData:
          profileImageFile && profileImageFile.length > 0 ? formData : null,
      });

      if (result.success) {
        toast.success("Profile updated successfully");
        setIsEditing(false);
        setProfileImageFile(null);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isEditing) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold">Profile</h1>
            <p className="text-muted-foreground">
              Manage your public profile information
            </p>
          </div>
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>

        <div className="space-y-8">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-muted">
              <Image
                src={profileImageUrl || user.image || "/placeholder-avatar.png"}
                alt={user.name || "Profile"}
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user.name || "—"}</h2>
              <p className="text-muted-foreground">@{user.username || "—"}</p>
            </div>
          </div>

          <div className="grid gap-6">
            <div>
              <h3 className="font-medium mb-2">Contact</h3>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Email</p>
                <p>{user.email}</p>
              </div>
            </div>

            {(profile?.bio || profile?.location) && (
              <div>
                <h3 className="font-medium mb-2">About</h3>
                <div className="space-y-4">
                  {profile?.bio && (
                    <div>
                      <p className="text-sm text-muted-foreground">Bio</p>
                      <p className="whitespace-pre-wrap">{profile.bio}</p>
                    </div>
                  )}
                  {profile?.location && (
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p>{profile.location}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {socialLinks.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Social Links</h3>
                <div className="space-y-2">
                  {socialLinks.map((link, index) => (
                    <div key={index}>
                      <p className="text-sm text-muted-foreground">
                        {link.platform}
                      </p>
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

          <div className="text-xs text-muted-foreground">
            Press <kbd className="px-1 py-0.5 bg-muted rounded">E</kbd> to edit
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold">Edit Profile</h1>
          <p className="text-muted-foreground">
            Update your profile information
          </p>
        </div>
        <Button variant="outline" onClick={() => setIsEditing(false)}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="profileImage"
            render={() => (
              <FormItem>
                <FormLabel>Profile Image</FormLabel>
                <FormControl>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-muted">
                      <Image
                        src={
                          profileImageFile && profileImageFile.length > 0
                            ? URL.createObjectURL(profileImageFile[0])
                            : profileImageUrl ||
                              user.image ||
                              "/placeholder-avatar.png"
                        }
                        alt={user.name || "Profile"}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="flex-1">
                      <FileUploader
                        value={profileImageFile}
                        onValueChange={setProfileImageFile}
                        dropzoneOptions={{
                          maxFiles: 1,
                          maxSize: 1 * 1024 * 1024,
                          accept: {
                            "image/*": [".jpg", ".jpeg", ".png", ".webp"],
                          },
                        }}
                      >
                        <FileInput className="h-20">
                          <div className="flex items-center gap-2 text-sm">
                            <Upload className="w-4 h-4" />
                            <span>Upload new image</span>
                          </div>
                        </FileInput>

                        {profileImageFile && profileImageFile.length > 0 && (
                          <FileUploaderContent className="mt-2">
                            {profileImageFile.map((file, i) => (
                              <FileUploaderItem key={i} index={i} file={file}>
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
                    <div className="relative">
                      <Input placeholder="username" {...field} />
                      {shouldCheckAvailability && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {usernameAvailability.isChecking ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : usernameAvailability.isAvailable === true ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : usernameAvailability.isAvailable === false ? (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          ) : null}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  {shouldCheckAvailability && usernameAvailability.message && (
                    <p
                      className={`text-xs ${
                        usernameAvailability.isAvailable === true
                          ? "text-green-600"
                          : usernameAvailability.isAvailable === false
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {usernameAvailability.message}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us about yourself..."
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FormLabel>Social Links</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ platform: "", url: "" })}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Link
              </Button>
            </div>

            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No social links added yet
              </p>
            )}

            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-3 items-start">
                <div className="grid grid-cols-2 gap-3 flex-1">
                  <FormField
                    control={form.control}
                    name={`socialLinks.${index}.platform`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Platform" {...field} />
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
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                (shouldCheckAvailability &&
                  usernameAvailability.isAvailable !== true)
              }
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>

      <div className="mt-6 text-xs text-muted-foreground">
        Press <kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd> to cancel
      </div>
    </div>
  );
}
