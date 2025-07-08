"use client";

import {
	AlertCircle,
	CheckCircle,
	Hash,
	Loader2,
	Lock,
	Mail,
	UserCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { Container } from "@/components/ds";
import { GitHubIcon } from "@/components/icons/github";
import { GoogleIcon } from "@/components/icons/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePasswordStrength } from "@/hooks/use-password-strength";
import { useUsernameAvailability } from "@/hooks/use-username-availability";
import { handlePostSignup } from "@/lib/actions/auth";
import { authClient } from "@/lib/auth-client";
import Water from "@/public/water.webp";

function SignInPageContent() {
	const searchParams = useSearchParams();
	const tab = searchParams.get("tab");
	const [activeTab, setActiveTab] = useState(
		tab === "signup" ? "sign-up" : "sign-in",
	);

	useEffect(() => {
		if (tab === "signup") {
			setActiveTab("sign-up");
		} else if (tab === "login") {
			setActiveTab("sign-in");
		}
	}, [tab]);

	return (
		<main className="h-screen w-screen relative overflow-hidden">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="w-full max-w-md mx-auto sm:mt-12 p-4 sm:p-0"
			>
				<Tabs
					value={activeTab}
					defaultValue="sign-in"
					className="w-full"
					onValueChange={(value) => setActiveTab(value)}
				>
					<TabsList className="w-full bg-muted">
						<TabsTrigger value="sign-in">Login</TabsTrigger>
						<TabsTrigger value="sign-up">Create Account</TabsTrigger>
					</TabsList>

					<AnimatePresence mode="wait" initial={false}>
						{activeTab === "sign-in" ? (
							<motion.div
								key="sign-in"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.3 }}
								className="bg-background rounded mt-2"
							>
								<TabsContent value="sign-in" forceMount>
									<SignInForm />
								</TabsContent>
							</motion.div>
						) : (
							<motion.div
								key="sign-up"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.3 }}
								className="bg-background rounded mt-2"
							>
								<TabsContent value="sign-up" forceMount>
									<SignUpForm />
								</TabsContent>
							</motion.div>
						)}
					</AnimatePresence>
				</Tabs>
			</motion.div>

			<Image
				src={Water}
				alt="Water"
				className="absolute inset-0 object-cover h-full w-full -z-10"
				placeholder="blur"
			/>
		</main>
	);
}

export default function SignInPage() {
	return (
		<Suspense
			fallback={
				<main className="h-screen w-screen relative overflow-hidden">
					<Image
						src={Water}
						alt="Water"
						className="absolute inset-0 object-cover h-full w-full -z-10"
						placeholder="blur"
					/>
				</main>
			}
		>
			<SignInPageContent />
		</Suspense>
	);
}

const SignInForm = () => {
	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();

	return (
		<Container className="space-y-4">
			<motion.h3
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3, delay: 0.1 }}
				className="text-xl font-semibold"
			>
				Login to your account
			</motion.h3>

			<motion.p
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3, delay: 0.2 }}
				className="text-sm text-muted-foreground"
			>
				Welcome back! Sign in to your account.
			</motion.p>

			<motion.form
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3, delay: 0.3 }}
				className="grid gap-2"
				onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
					e.preventDefault();
					setIsLoading(true);
					setError("");
					const formData = new FormData(e.currentTarget);
					const identifier = formData.get("identifier") as string;
					const password = formData.get("password") as string;

					try {
						// Check if identifier is email or username
						const isEmail = identifier.includes("@");

						if (isEmail) {
							const { error } = await authClient.signIn.email({
								email: identifier,
								password: password,
							});

							if (error) {
								throw new Error(error.message || "Failed to sign in");
							}
						} else {
							const { error } = await authClient.signIn.username({
								username: identifier,
								password: password,
							});

							if (error) {
								throw new Error(error.message || "Failed to sign in");
							}
						}

						// Successful login - redirect to admin
						router.push("/admin");
					} catch (error: unknown) {
						console.error("Sign in error:", error);
						const errorMessage =
							error instanceof Error
								? error.message
								: "Failed to sign in. Please check your credentials.";
						setError(errorMessage);
						toast.error(errorMessage);
					} finally {
						setIsLoading(false);
					}
				}}
			>
				<Input
					placeholder="Email or Username"
					type="text"
					name="identifier"
					value={identifier}
					icon={<Mail size={16} />}
					autoComplete="username email"
					onChange={(e) => setIdentifier(e.target.value)}
				/>
				<Input
					placeholder="Password"
					type="password"
					name="password"
					value={password}
					icon={<Lock size={16} />}
					autoComplete="current-password"
					onChange={(e) => setPassword(e.target.value)}
				/>
				{error && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-md"
					>
						{error}
					</motion.div>
				)}
				<Button type="submit" className="mt-2" disabled={isLoading}>
					Sign In
				</Button>
			</motion.form>

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3, delay: 0.35 }}
				className="space-y-2"
			>
				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-background px-2 text-muted-foreground">
							Or continue with
						</span>
					</div>
				</div>

				<Button
					type="button"
					variant="outline"
					className="w-full"
					onClick={async () => {
						try {
							await authClient.signIn.social({
								provider: "google",
								callbackURL: "/onboarding",
							});
						} catch (error) {
							console.error("Google sign in error:", error);
							toast.error("Failed to sign in with Google");
						}
					}}
					disabled={isLoading}
				>
					<GoogleIcon className="mr-2 h-4 w-4" />
					Continue with Google
				</Button>

				<Button
					type="button"
					variant="outline"
					className="w-full"
					onClick={async () => {
						try {
							await authClient.signIn.social({
								provider: "github",
								callbackURL: "/onboarding",
							});
						} catch (error) {
							console.error("GitHub sign in error:", error);
							toast.error("Failed to sign in with GitHub");
						}
					}}
					disabled={isLoading}
				>
					<GitHubIcon className="mr-2 h-4 w-4" />
					Continue with GitHub
				</Button>
			</motion.div>

			<motion.p
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3, delay: 0.4 }}
				className="text-sm text-muted-foreground"
			>
				Forgot your password?{" "}
				<Link href="/reset-password" className="text-primary">
					Reset Password
				</Link>
			</motion.p>
		</Container>
	);
};

const SignUpForm = () => {
	const [name, setName] = useState("");
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [usernameError, setUsernameError] = useState("");
	const router = useRouter();

	// Username availability checking
	const usernameAvailability = useUsernameAvailability(username);

	// Password strength checking
	const passwordStrength = usePasswordStrength(password);

	const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		// Only allow letters, numbers, underscores, and hyphens
		const filteredValue = value.replace(/[^a-zA-Z0-9_-]/g, "");

		setUsername(filteredValue);

		// Show error if invalid characters were removed
		if (value !== filteredValue) {
			setUsernameError(
				"Username can only contain letters, numbers, underscores (_), and hyphens (-)",
			);
		} else {
			setUsernameError("");
		}
	};

	// Determine if form is valid for submission
	const isFormValid =
		username.length >= 3 &&
		email.length > 0 &&
		passwordStrength.score >= 3 && // Require at least "fair" password
		usernameAvailability.isAvailable === true &&
		!usernameError;

	return (
		<Container className="space-y-4">
			<motion.h3
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3, delay: 0.1 }}
				className="text-xl font-semibold"
			>
				Create an account
			</motion.h3>

			<motion.p
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3, delay: 0.2 }}
				className="text-sm text-muted-foreground"
			>
				Sign up for free to get started.
			</motion.p>

			<motion.form
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3, delay: 0.3 }}
				className="grid gap-2"
				onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
					e.preventDefault();
					setIsLoading(true);
					setError("");
					const formData = new FormData(e.currentTarget);
					const name = formData.get("name") as string;
					const username = formData.get("username") as string;
					const email = formData.get("email") as string;
					const password = formData.get("password") as string;

					try {
						const { error } = await authClient.signUp.email({
							name: name,
							username: username,
							email: email,
							password: password,
						});

						if (error) {
							throw new Error(error.message || "Failed to sign up");
						}

						// Send Discord notification
						await handlePostSignup({ name, email, username });

						// Successful signup - redirect to onboarding
						router.push("/onboarding");
					} catch (error: unknown) {
						console.error("Sign up error:", error);
						const errorMessage =
							error instanceof Error
								? error.message
								: "Failed to sign up. Please check your details.";
						setError(errorMessage);
						toast.error(errorMessage);
					} finally {
						setIsLoading(false);
					}
				}}
			>
				<Input
					placeholder="Name"
					type="text"
					name="name"
					icon={<UserCircle size={16} />}
					value={name}
					autoComplete="name"
					onChange={(e) => setName(e.target.value)}
				/>
				<div className="relative">
					<Input
						placeholder="Username"
						type="text"
						name="username"
						icon={<Hash size={16} />}
						value={username}
						autoComplete="username"
						onChange={handleUsernameChange}
						className={
							username.length >= 3
								? usernameAvailability.isAvailable === true
									? "border-green-500 pr-10"
									: usernameAvailability.isAvailable === false
										? "border-red-500 pr-10"
										: "pr-10"
								: ""
						}
					/>

					{/* Username availability indicator */}
					{username.length >= 3 && (
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

				{/* Username feedback messages */}
				{usernameError && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 text-sm p-2 rounded-md"
					>
						{usernameError}
					</motion.div>
				)}

				{/* Username availability feedback */}
				{username.length >= 3 &&
					!usernameError &&
					usernameAvailability.message && (
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							className={`text-sm p-2 rounded-md ${
								usernameAvailability.isAvailable === true
									? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
									: usernameAvailability.isAvailable === false
										? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
										: "bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200"
							}`}
						>
							{usernameAvailability.message}
							{usernameAvailability.isAvailable === true && (
								<span className="block text-xs mt-1 opacity-75">
									Your portfolio will be available at wrk.so/{username}
								</span>
							)}
						</motion.div>
					)}
				<Input
					placeholder="Email"
					type="email"
					name="email"
					icon={<Mail size={16} />}
					value={email}
					autoComplete="email"
					onChange={(e) => setEmail(e.target.value)}
				/>
				<div className="space-y-2">
					<Input
						placeholder="Password"
						type="password"
						name="password"
						icon={<Lock size={16} />}
						value={password}
						autoComplete="new-password"
						onChange={(e) => setPassword(e.target.value)}
					/>

					{/* Password strength indicator */}
					{password && (
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							className="space-y-2"
						>
							{/* Strength bar */}
							<div className="space-y-1">
								<div className="flex justify-between text-xs">
									<span className="text-muted-foreground">
										Password strength
									</span>
									<span
										className={`capitalize ${
											passwordStrength.color === "green"
												? "text-green-600"
												: passwordStrength.color === "blue"
													? "text-blue-600"
													: passwordStrength.color === "yellow"
														? "text-yellow-600"
														: passwordStrength.color === "orange"
															? "text-orange-600"
															: "text-red-600"
										}`}
									>
										{passwordStrength.strength.replace("-", " ")}
									</span>
								</div>
								<div className="flex space-x-1">
									{[...Array(5)].map((_, i) => (
										<div
											key={i}
											className={`h-2 flex-1 rounded-full ${
												i < passwordStrength.score
													? passwordStrength.color === "green"
														? "bg-green-500"
														: passwordStrength.color === "blue"
															? "bg-blue-500"
															: passwordStrength.color === "yellow"
																? "bg-yellow-500"
																: passwordStrength.color === "orange"
																	? "bg-orange-500"
																	: "bg-red-500"
													: "bg-gray-200 dark:bg-gray-700"
											}`}
										/>
									))}
								</div>
							</div>

							{/* Feedback */}
							{passwordStrength.feedback.length > 0 && (
								<div className="text-xs text-muted-foreground">
									<p className="mb-1">To strengthen your password:</p>
									<ul className="list-disc list-inside space-y-0.5">
										{passwordStrength.feedback.slice(0, 3).map((tip, i) => (
											<li key={i}>{tip}</li>
										))}
									</ul>
								</div>
							)}
						</motion.div>
					)}
				</div>
				{error && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-md"
					>
						{error}
					</motion.div>
				)}
				<Button
					type="submit"
					size="lg"
					className="w-full"
					disabled={isLoading || !isFormValid}
				>
					{isLoading ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Creating account...
						</>
					) : (
						"Create account"
					)}
				</Button>
			</motion.form>

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3, delay: 0.35 }}
				className="space-y-2"
			>
				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-background px-2 text-muted-foreground">
							Or continue with
						</span>
					</div>
				</div>

				<Button
					type="button"
					variant="outline"
					className="w-full"
					onClick={async () => {
						try {
							await authClient.signIn.social({
								provider: "google",
								callbackURL: "/onboarding",
							});
						} catch (error) {
							console.error("Google sign up error:", error);
							toast.error("Failed to sign up with Google");
						}
					}}
					disabled={isLoading}
				>
					<GoogleIcon className="mr-2 h-4 w-4" />
					Continue with Google
				</Button>

				<Button
					type="button"
					variant="outline"
					className="w-full"
					onClick={async () => {
						try {
							await authClient.signIn.social({
								provider: "github",
								callbackURL: "/onboarding",
							});
						} catch (error) {
							console.error("GitHub sign up error:", error);
							toast.error("Failed to sign up with GitHub");
						}
					}}
					disabled={isLoading}
				>
					<GitHubIcon className="mr-2 h-4 w-4" />
					Continue with GitHub
				</Button>
			</motion.div>

			<motion.p
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3, delay: 0.4 }}
				className="text-sm text-muted-foreground"
			>
				By signing up, you agree to our{" "}
				<Link href="/terms" className="text-primary">
					Terms of Service
				</Link>{" "}
				and{" "}
				<Link href="/privacy" className="text-primary">
					Privacy Policy
				</Link>
			</motion.p>
		</Container>
	);
};
