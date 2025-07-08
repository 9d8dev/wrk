import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import * as z from "zod";

import { useUsernameAvailability } from "@/hooks/use-username-availability";

import { updateProfile } from "@/lib/actions/profile";

import type { Profile, SocialLink } from "@/types";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  username: z.string().min(1, { message: "Username is required" }),
  title: z.string().optional(),
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

interface UseProfileFormProps {
  user: SessionUser;
  profile: Profile | null;
  socialLinks: SocialLink[];
}

export function useProfileForm({
  user,
  profile,
  socialLinks,
}: UseProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File[] | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name || "",
      username: user.username || "",
      title: profile?.title || "",
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

  // Watch username for availability checking
  const currentUsername = form.watch("username");
  const originalUsername = user.username || "";

  // Only check availability if username has changed from original
  const shouldCheckAvailability =
    currentUsername !== originalUsername && currentUsername.length >= 3;
  const usernameAvailability = useUsernameAvailability(
    shouldCheckAvailability ? currentUsername : ""
  );

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
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
      const usernameChanged = values.username !== originalUsername;

      const formData = new FormData();
      if (profileImageFile && profileImageFile.length > 0) {
        formData.append("file", profileImageFile[0]);
      }

      const result = await updateProfile({
        profileData: {
          title: values.title || null,
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
        setProfileImageFile(null);

        // If username changed, refresh the page to update session data
        if (usernameChanged) {
          setTimeout(() => {
            router.refresh();
          }, 500); // Small delay to ensure toast is visible
        }

        return true; // Indicate success
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = shouldCheckAvailability
    ? usernameAvailability.isAvailable === true
    : true;

  return {
    form,
    isSubmitting,
    profileImageFile,
    setProfileImageFile,
    usernameAvailability,
    shouldCheckAvailability,
    canSubmit,
    onSubmit,
  };
}
