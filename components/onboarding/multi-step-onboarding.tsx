"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  User,
  Briefcase,
  Image as ImageIcon,
  Sparkles,
  MapPin,
  Hash,
  Upload,
  Loader2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { createProfile, updateUsername } from "@/lib/actions/profile";
import { useUsernameAvailability } from "@/hooks/use-username-availability";
import Image from "next/image";

const personalInfoSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  title: z.string().min(1, "Professional title is required"),
  location: z.string().optional(),
});

const bioSchema = z.object({
  bio: z.string().min(10, "Please write at least 10 characters").max(500),
});

const imageSchema = z.object({
  profileImage: z.instanceof(File).optional(),
});

type PersonalInfoValues = z.infer<typeof personalInfoSchema>;
type BioValues = z.infer<typeof bioSchema>;
type ImageValues = z.infer<typeof imageSchema>;

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: OnboardingStep[] = [
  {
    id: "personal",
    title: "Personal Info",
    description: "Tell us about yourself",
    icon: <User className="h-5 w-5" />,
  },
  {
    id: "bio",
    title: "Your Story",
    description: "Share what you do",
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    id: "image",
    title: "Profile Picture",
    description: "Add a photo",
    icon: <ImageIcon className="h-5 w-5" />,
  },
  {
    id: "complete",
    title: "All Set!",
    description: "Ready to go",
    icon: <Sparkles className="h-5 w-5" />,
  },
];

interface User {
  id: string;
  name?: string | null;
  username?: string | null;
  email: string;
  image?: string | null;
}

interface MultiStepOnboardingProps {
  user: User;
}

export function MultiStepOnboarding({ user }: MultiStepOnboardingProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    user.image || null
  );

  // Form data storage
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoValues>({
    username: user.username || "",
    title: "",
    location: "",
  });
  const [bioData, setBioData] = useState<BioValues>({
    bio: "",
  });

  const personalForm = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: personalInfo,
  });

  const bioForm = useForm<BioValues>({
    resolver: zodResolver(bioSchema),
    defaultValues: bioData,
  });

  // Username availability checking
  const currentUsername = personalForm.watch("username") || "";
  const usernameAvailability = useUsernameAvailability(currentUsername);

  const needsUsername = !user.username;
  const totalSteps = steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

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

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePersonalInfoSubmit = (data: PersonalInfoValues) => {
    // Additional validation for username availability
    if (needsUsername && data.username) {
      if (usernameAvailability.isAvailable !== true) {
        toast.error("Please choose an available username");
        return;
      }
    }

    setPersonalInfo(data);
    nextStep();
  };

  const handleBioSubmit = (data: BioValues) => {
    setBioData(data);
    nextStep();
  };

  const handleImageSubmit = () => {
    nextStep();
  };

  const handleFinalSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Create FormData for image upload if there's a profile image
      const formData = profileImage ? new FormData() : null;
      if (formData && profileImage) {
        formData.append("file", profileImage);
      }

      // If user needs username, update it first
      if (needsUsername && personalInfo.username) {
        const usernameResult = await updateUsername(personalInfo.username);
        if (!usernameResult.success) {
          throw new Error(usernameResult.error);
        }
      }

      const profileResult = await createProfile({
        profileData: {
          title: personalInfo.title,
          bio: bioData.bio,
          location: personalInfo.location || null,
        },
        profileImageFormData: formData,
      });

      if (!profileResult.success) {
        throw new Error(profileResult.error);
      }

      // Show success message with celebration
      toast.success("🎉 Welcome to Wrk.so! Your portfolio is ready!", {
        description:
          "You can now start adding projects and showcasing your work.",
        duration: 5000,
      });

      // Add a small delay for better UX
      setTimeout(() => {
        router.push("/admin");
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error("Error creating profile:", error);
      toast.error("Failed to create profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            key="personal"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Let's get to know you</h2>
              <p className="text-muted-foreground">
                This information will help others discover and connect with you
              </p>
            </div>

            <form
              onSubmit={personalForm.handleSubmit(handlePersonalInfoSubmit)}
              className="space-y-4"
            >
              {needsUsername && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Choose Your Username
                  </label>
                  <div className="relative">
                    <Input
                      {...personalForm.register("username")}
                      placeholder="username"
                      className={
                        currentUsername.length >= 3
                          ? usernameAvailability.isAvailable === true
                            ? "border-green-500"
                            : usernameAvailability.isAvailable === false
                            ? "border-red-500"
                            : ""
                          : ""
                      }
                    />
                    {currentUsername.length >= 3 && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {usernameAvailability.isChecking ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : usernameAvailability.isAvailable === true ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : usernameAvailability.isAvailable === false ? (
                          <X className="h-4 w-4 text-red-500" />
                        ) : null}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Your portfolio URL: wrk.so/{currentUsername || "username"}
                    </p>
                    {currentUsername.length >= 3 &&
                      usernameAvailability.message && (
                        <p
                          className={`text-xs ${
                            usernameAvailability.isAvailable === true
                              ? "text-green-600"
                              : usernameAvailability.isAvailable === false
                              ? "text-red-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          {usernameAvailability.message}
                        </p>
                      )}
                  </div>
                  {personalForm.formState.errors.username && (
                    <p className="text-xs text-red-500">
                      {personalForm.formState.errors.username.message}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Professional Title
                </label>
                <Input
                  {...personalForm.register("title")}
                  placeholder="e.g. Product Designer, Developer, Photographer"
                />
                {personalForm.formState.errors.title && (
                  <p className="text-xs text-red-500">
                    {personalForm.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location (Optional)
                </label>
                <Input
                  {...personalForm.register("location")}
                  placeholder="e.g. San Francisco, CA"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={
                  needsUsername &&
                  currentUsername.length >= 3 &&
                  usernameAvailability.isAvailable !== true
                }
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            key="bio"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Tell your story</h2>
              <p className="text-muted-foreground">
                Help visitors understand who you are and what you're passionate
                about
              </p>
            </div>

            <form
              onSubmit={bioForm.handleSubmit(handleBioSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium">About You</label>
                <Textarea
                  {...bioForm.register("bio")}
                  placeholder="I'm a passionate designer who loves creating meaningful digital experiences..."
                  className="min-h-[120px] resize-none"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Tell your story in your own words</span>
                  <span>{bioForm.watch("bio")?.length || 0}/500</span>
                </div>
                {bioForm.formState.errors.bio && (
                  <p className="text-xs text-red-500">
                    {bioForm.formState.errors.bio.message}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" className="flex-1" size="lg">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="image"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Add a profile picture</h2>
              <p className="text-muted-foreground">
                A friendly photo helps people connect with you
              </p>
            </div>

            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-muted flex items-center justify-center border-4 border-background shadow-lg">
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
                  className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors shadow-lg"
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

              <div className="text-center space-y-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    document.getElementById("profile-image")?.click()
                  }
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {imagePreview ? "Change Photo" : "Upload Photo"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG or GIF (max 5MB)
                </p>
              </div>

              <div className="flex gap-2 w-full">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleImageSubmit}
                  className="flex-1"
                  size="lg"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="complete"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">You're all set!</h2>
              <p className="text-muted-foreground">
                Your portfolio is ready to showcase your amazing work
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  {imagePreview && (
                    <div className="w-16 h-16 rounded-full overflow-hidden">
                      <Image
                        src={imagePreview}
                        alt="Profile"
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {personalInfo.title}
                    </p>
                    {personalInfo.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {personalInfo.location}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-sm mt-4">{bioData.bio}</p>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Your Portfolio...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Launch My Portfolio
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={isSubmitting}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Edit
              </Button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-8">
      {/* Progress Header */}
      <div className="space-y-4">
        <div className="flex justify-center">
          <Badge variant="secondary" className="px-3 py-1">
            Step {currentStep + 1} of {totalSteps}
          </Badge>
        </div>

        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-1 ${
                  index <= currentStep ? "text-primary" : ""
                }`}
              >
                {step.icon}
                <span className="hidden sm:inline">{step.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-8">
          <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
