"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Upload, MapPin, Globe, ArrowRight } from "lucide-react";

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
import { createProfile } from "@/lib/actions/profile";
import Image from "next/image";

const formSchema = z.object({
  title: z.string().min(1, { message: "Professional title is required" }),
  bio: z.string().min(10, { 
    message: "Please write at least 10 characters about yourself" 
  }).max(500, {
    message: "Bio must be less than 500 characters"
  }),
  location: z.string().optional(),
});

type OnboardingFormValues = z.infer<typeof formSchema>;

interface OnboardingFormProps {
  user: {
    id: string;
    name?: string | null;
    username?: string | null;
    email: string;
    image?: string | null;
  };
}

export function OnboardingForm({ user }: OnboardingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    user.image || null
  );

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      bio: "",
      location: "",
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: OnboardingFormValues) {
    try {
      setIsSubmitting(true);

      // Create FormData for image upload if there's a profile image
      const formData = profileImage ? new FormData() : null;
      if (formData && profileImage) {
        formData.append("file", profileImage);
      }

      await createProfile({
        userId: user.id,
        profileData: {
          title: values.title,
          bio: values.bio || null,
          location: values.location || null,
        },
        profileImageFormData: formData,
      });

      toast.success("Profile created successfully!");
      router.push("/admin");
      router.refresh();
    } catch (error) {
      console.error("Error creating profile:", error);
      toast.error("Failed to create profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-card border rounded-lg p-6 space-y-6">
          {/* Profile Image Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Profile"
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <Upload className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <label
                htmlFor="profile-image"
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-muted-foreground">
              Upload a profile picture (optional)
            </p>
          </div>

          {/* Professional Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Professional Title
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. Product Designer, Photographer, Developer" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  What do you do? This will appear on your profile.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Bio */}
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>About You</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us about yourself, your work, and what you're passionate about..."
                    className="min-h-[120px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  A brief introduction that will help visitors understand who you are.
                  ({field.value?.length || 0}/500)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Location */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location (Optional)
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. San Francisco, CA" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Where are you based?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            You can always update this information later
          </p>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            size="lg"
            className="min-w-[200px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Profile...
              </>
            ) : (
              <>
                Complete Setup
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}