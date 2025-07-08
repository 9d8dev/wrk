"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import ProfileImageUpload from "./profile-image-upload";
import ProfileUsernameField from "./profile-username-field";
import SocialLinksManager from "./social-links-manager";

import { useProfileForm } from "@/hooks/use-profile-form";

import type { Profile, SocialLink } from "@/types";

type SessionUser = {
  id: string;
  name?: string | null;
  username?: string | null;
  email: string;
  image?: string | null;
};

interface ProfileEditFormProps {
  user: SessionUser;
  profile: Profile | null;
  socialLinks: SocialLink[];
  profileImageUrl?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function ProfileEditForm({
  user,
  profile,
  socialLinks,
  profileImageUrl,
  onCancel,
  onSuccess,
}: ProfileEditFormProps) {
  const {
    form,
    isSubmitting,
    profileImageFile,
    setProfileImageFile,
    usernameAvailability,
    shouldCheckAvailability,
    canSubmit,
    onSubmit,
  } = useProfileForm({ user, profile, socialLinks });

  const handleSubmit = async (values: any) => {
    const success = await onSubmit(values);
    if (success) {
      onSuccess();
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Profile</h1>
          <p className="text-muted-foreground">
            Update your profile information
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="profileImage"
            render={() => (
              <ProfileImageUpload
                currentImageUrl={profileImageUrl}
                userName={user.name}
                profileImageFile={profileImageFile}
                onImageChange={setProfileImageFile}
              />
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

            <ProfileUsernameField
              form={form}
              name="username"
              usernameAvailability={usernameAvailability}
              shouldCheckAvailability={shouldCheckAvailability}
            />
          </div>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Frontend Developer, Designer, Product Manager"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  A short professional title or role description
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

          <SocialLinksManager control={form.control} />

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting || !canSubmit}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>

      <div className="text-muted-foreground mt-6 text-xs">
        Press <kbd className="bg-muted rounded px-1 py-0.5">Esc</kbd> to cancel
      </div>
    </div>
  );
}
