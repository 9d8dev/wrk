"use client";

import { CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import { useUsernameAvailability } from "@/hooks/use-username-availability";
import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";

interface UsernameSelectionProps {
	initialUsername: string;
	onUsernameSelected: (username: string) => void;
	onSkip?: () => void;
	isLoading?: boolean;
	skipButtonText?: string;
}

export function UsernameSelection({
	initialUsername,
	onUsernameSelected,
	onSkip,
	isLoading = false,
	skipButtonText,
}: UsernameSelectionProps) {
	const [customUsername, setCustomUsername] = useState("");
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [selectedUsername, setSelectedUsername] = useState(initialUsername);
	const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

	const usernameAvailability = useUsernameAvailability(customUsername);

	const loadSuggestions = useCallback(async () => {
		setIsLoadingSuggestions(true);
		try {
			const response = await fetch(
				`/api/auth/username-suggestions?base=${encodeURIComponent(
					initialUsername,
				)}`,
			);

			if (!response.ok) {
				throw new Error("Failed to load suggestions");
			}

			const data = await response.json();
			setSuggestions(data.suggestions || []);
		} catch (error) {
			console.error("Failed to load username suggestions:", error);
			// Fallback to showing just the initial username
			setSuggestions([initialUsername]);
		} finally {
			setIsLoadingSuggestions(false);
		}
	}, [initialUsername]);

	useEffect(() => {
		loadSuggestions();
	}, [loadSuggestions]);

	const handleCustomUsernameChange = (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const value = e.target.value;
		const filteredValue = value.replace(/[^a-zA-Z0-9_-]/g, "");
		setCustomUsername(filteredValue);

		if (filteredValue.length >= 3 && usernameAvailability.isAvailable) {
			setSelectedUsername(filteredValue);
		}
	};

	const handleSuggestionSelect = (username: string) => {
		setSelectedUsername(username);
		setCustomUsername("");
	};

	const handleConfirm = () => {
		onUsernameSelected(selectedUsername);
	};

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader>
				<CardTitle>Choose Your Username</CardTitle>
				<CardDescription>
					Your username will be your portfolio URL: wrk.so/{selectedUsername}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Current Selection */}
				<div className="p-3 bg-muted rounded-lg">
					<div className="flex items-center justify-between">
						<span className="font-medium">Selected: {selectedUsername}</span>
						<CheckCircle className="h-4 w-4 text-green-500" />
					</div>
					<p className="text-xs text-muted-foreground mt-1">
						wrk.so/{selectedUsername}
					</p>
				</div>

				{/* Suggestions */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<h4 className="text-sm font-medium">Suggestions</h4>
						<Button
							variant="ghost"
							size="sm"
							onClick={loadSuggestions}
							disabled={isLoadingSuggestions}
						>
							<RefreshCw
								className={`h-3 w-3 ${
									isLoadingSuggestions ? "animate-spin" : ""
								}`}
							/>
						</Button>
					</div>

					{isLoadingSuggestions ? (
						<div className="flex justify-center py-4">
							<Loader2 className="h-4 w-4 animate-spin" />
						</div>
					) : (
						<div className="grid grid-cols-1 gap-2">
							{suggestions.map((suggestion) => (
								<motion.button
									key={suggestion}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									className={`p-2 text-left rounded border transition-colors ${
										selectedUsername === suggestion
											? "border-primary bg-primary/10"
											: "border-border hover:border-muted-foreground"
									}`}
									onClick={() => handleSuggestionSelect(suggestion)}
								>
									<span className="font-medium">{suggestion}</span>
									<div className="text-xs text-muted-foreground">
										wrk.so/{suggestion}
									</div>
								</motion.button>
							))}
						</div>
					)}
				</div>

				{/* Custom Username */}
				<div className="space-y-2">
					<h4 className="text-sm font-medium">Or create your own</h4>
					<div className="space-y-2">
						<Input
							placeholder="Enter custom username"
							value={customUsername}
							onChange={handleCustomUsernameChange}
							maxLength={20}
						/>

						{customUsername.length >= 3 && (
							<div className="flex items-center gap-2 text-xs">
								{usernameAvailability.isChecking ? (
									<>
										<Loader2 className="h-3 w-3 animate-spin" />
										<span>Checking availability...</span>
									</>
								) : usernameAvailability.isAvailable ? (
									<>
										<CheckCircle className="h-3 w-3 text-green-500" />
										<span className="text-green-600">
											{customUsername} is available!
										</span>
									</>
								) : (
									<>
										<span className="text-red-600">
											{usernameAvailability.message}
										</span>
									</>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Actions */}
				<div className="flex gap-2 pt-4">
					<Button
						onClick={handleConfirm}
						disabled={isLoading}
						className="flex-1"
					>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Saving...
							</>
						) : (
							"Continue"
						)}
					</Button>

					{onSkip && (
						<Button variant="outline" onClick={onSkip} disabled={isLoading}>
							{skipButtonText || "Skip for now"}
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
