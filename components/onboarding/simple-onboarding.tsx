"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	AlertCircle,
	Briefcase,
	CheckCircle,
	Hash,
	Loader2,
	MapPin,
	Upload,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUsernameAvailability } from "@/hooks/use-username-availability";
import { createProfile } from "@/lib/actions/profile";

const formSchema = z.object({
	username: z
		.string()
		.min(3)
		.max(20)
		.regex(/^[a-zA-Z0-9_-]+$/)
		.optional(),
	title: z.string().min(1, "Professional title is required"),
	bio: z.string().min(10, "Please write at least 10 characters").max(500),
	location: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface User {
	id: string;
	name?: string | null;
	username?: string | null;
	email: string;
	image?: string | null;
}

interface SimpleOnboardingProps {
	user: User;
}

export function SimpleOnboarding({ user }: SimpleOnboardingProps) {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [profileImage, setProfileImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(
		user.image || null,
	);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			username: user.username || "",
			title: "",
			bio: "",
			location: "",
		},
	});

	const currentUsername = form.watch("username") || "";
	const originalUsername = user.username;

	// Check availability only if username has changed from original or if user needs a username
	const shouldCheckAvailability =
		currentUsername !== originalUsername && currentUsername.length >= 3;
	const usernameAvailability = useUsernameAvailability(
		shouldCheckAvailability ? currentUsername : "",
	);

	// Show username field if user doesn't have one, or if they want to change it
	const needsUsername = !user.username;
	const [showUsernameEdit, setShowUsernameEdit] = useState(needsUsername);

	// Helper function to determine if username is actually changing
	const isUsernameChanging = () => {
		const trimmedCurrent = (currentUsername || "").trim();
		const trimmedOriginal = (originalUsername || "").trim();
		return trimmedCurrent !== trimmedOriginal && trimmedCurrent.length >= 3;
	};

	// Helper function to check if form is valid for submission
	const isFormValidForSubmission = () => {
		// If username is being changed, it must be available
		if (isUsernameChanging()) {
			return (
				usernameAvailability.isAvailable === true &&
				!usernameAvailability.isChecking
			);
		}
		return true;
	};

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

	async function onSubmit(values: FormValues) {
		// Validate username availability if it's being changed
		if (isUsernameChanging()) {
			if (usernameAvailability.isAvailable !== true) {
				toast.error("Please choose an available username");
				return;
			}
		}

		try {
			setIsSubmitting(true);

			// Create FormData for image upload if there's a profile image
			const formData = profileImage ? new FormData() : null;
			if (formData && profileImage) {
				formData.append("file", profileImage);
			}

			// Improved logic for determining username to use
			let usernameToUse: string | undefined;

			// Case 1: User needs a username (new user without one)
			if (needsUsername && values.username) {
				usernameToUse = values.username.trim();
			}
			// Case 2: User is editing their existing username
			else if (
				showUsernameEdit &&
				values.username &&
				values.username.trim() !== (originalUsername || "").trim()
			) {
				usernameToUse = values.username.trim();
			}

			const profileResult = await createProfile({
				profileData: {
					title: values.title,
					bio: values.bio,
					location: values.location || null,
				},
				profileImageFormData: formData,
				username: usernameToUse, // Pass username to be handled atomically
			});

			if (!profileResult.success) {
				throw new Error(profileResult.error);
			}

			toast.success("Welcome to Wrk.so! 🎉");
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
		<Card className="w-full max-w-2xl mx-auto">
			<CardContent className="p-8">
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					{/* Profile Image */}
					<div className="flex items-center gap-6">
						<div className="relative">
							<div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center">
								{imagePreview ? (
									<Image
										src={imagePreview}
										alt="Profile"
										width={80}
										height={80}
										className="object-cover w-full h-full"
									/>
								) : (
									<Upload className="w-6 h-6 text-muted-foreground" />
								)}
							</div>
							<label
								htmlFor="profile-image"
								className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:bg-primary/90 transition-colors text-xs"
							>
								<Upload className="w-3 h-3" />
								<input
									id="profile-image"
									type="file"
									accept="image/*"
									onChange={handleImageChange}
									className="hidden"
								/>
							</label>
						</div>
						<div>
							<h3 className="font-medium">Profile Picture</h3>
							<p className="text-sm text-muted-foreground">
								Optional • JPG, PNG (max 5MB)
							</p>
						</div>
					</div>

					{/* Username option for OAuth users */}
					{!needsUsername && !showUsernameEdit && (
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<p className="text-sm text-muted-foreground">
									Your username:{" "}
									<span className="font-medium">@{user.username}</span>
								</p>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => setShowUsernameEdit(true)}
									className="text-xs"
								>
									Change username
								</Button>
							</div>
							<p className="text-xs text-muted-foreground">
								Your portfolio will be available at wrk.so/{user.username}
							</p>
						</div>
					)}

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Username - show if needed or if user wants to edit */}
						{(needsUsername || showUsernameEdit) && (
							<div className="space-y-2 md:col-span-2">
								<div className="flex items-center justify-between">
									<label
										htmlFor="username"
										className="text-sm font-medium flex items-center gap-2"
									>
										<Hash className="h-4 w-4" />
										Username
									</label>
									{!needsUsername && showUsernameEdit && (
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => {
												setShowUsernameEdit(false);
												form.setValue("username", originalUsername || "");
											}}
											className="text-xs"
										>
											Cancel
										</Button>
									)}
								</div>
								<div className="relative">
									<Input
										id="username"
										{...form.register("username")}
										placeholder="username"
										className={
											currentUsername.length >= 3
												? usernameAvailability.isAvailable === true
													? "border-green-500 pr-10"
													: usernameAvailability.isAvailable === false
														? "border-red-500 pr-10"
														: "pr-10"
												: ""
										}
									/>
									{currentUsername.length >= 3 && (
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
								{currentUsername && (
									<p className="text-xs text-muted-foreground">
										wrk.so/{currentUsername}
									</p>
								)}
								{form.formState.errors.username && (
									<p className="text-xs text-red-500">
										{form.formState.errors.username.message}
									</p>
								)}
							</div>
						)}

						{/* Title */}
						<div className="space-y-2">
							<label
								htmlFor="title"
								className="text-sm font-medium flex items-center gap-2"
							>
								<Briefcase className="h-4 w-4" />
								Professional Title
							</label>
							<Input
								id="title"
								{...form.register("title")}
								placeholder="Product Designer"
							/>
							{form.formState.errors.title && (
								<p className="text-xs text-red-500">
									{form.formState.errors.title.message}
								</p>
							)}
						</div>

						{/* Location */}
						<div className="space-y-2">
							<label
								htmlFor="location"
								className="text-sm font-medium flex items-center gap-2"
							>
								<MapPin className="h-4 w-4" />
								Location
							</label>
							<Input
								id="location"
								{...form.register("location")}
								placeholder="San Francisco, CA"
							/>
						</div>
					</div>

					{/* Bio */}
					<div className="space-y-2">
						<label htmlFor="bio" className="text-sm font-medium">
							About You
						</label>
						<Textarea
							id="bio"
							{...form.register("bio")}
							placeholder="Tell us about yourself and what you do..."
							className="min-h-[100px] resize-none"
						/>
						<div className="flex justify-between text-xs text-muted-foreground">
							<span>A brief introduction for your portfolio</span>
							<span>{form.watch("bio")?.length || 0}/500</span>
						</div>
						{form.formState.errors.bio && (
							<p className="text-xs text-red-500">
								{form.formState.errors.bio.message}
							</p>
						)}
					</div>

					{/* Submit */}
					<div className="flex justify-between items-center pt-4 border-t">
						<p className="text-sm text-muted-foreground">
							You can update this anytime
						</p>
						<Button
							type="submit"
							disabled={isSubmitting || !isFormValidForSubmission()}
							size="lg"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Creating...
								</>
							) : (
								"Complete Setup"
							)}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
