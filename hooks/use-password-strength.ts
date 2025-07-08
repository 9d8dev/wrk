import { useMemo } from "react";

interface PasswordStrength {
	score: number; // 0-4
	feedback: string[];
	strength: "very-weak" | "weak" | "fair" | "good" | "strong";
	color: "red" | "orange" | "yellow" | "blue" | "green";
}

export function usePasswordStrength(password: string): PasswordStrength {
	return useMemo(() => {
		if (!password) {
			return {
				score: 0,
				feedback: [],
				strength: "very-weak",
				color: "red",
			};
		}

		let score = 0;
		const feedback: string[] = [];

		// Length check
		if (password.length >= 8) {
			score += 1;
		} else {
			feedback.push("Use at least 8 characters");
		}

		// Lowercase check
		if (/[a-z]/.test(password)) {
			score += 1;
		} else {
			feedback.push("Add lowercase letters");
		}

		// Uppercase check
		if (/[A-Z]/.test(password)) {
			score += 1;
		} else {
			feedback.push("Add uppercase letters");
		}

		// Number check
		if (/[0-9]/.test(password)) {
			score += 1;
		} else {
			feedback.push("Add numbers");
		}

		// Special character check
		if (/[^a-zA-Z0-9]/.test(password)) {
			score += 1;
		} else {
			feedback.push("Add special characters (!@#$%^&*)");
		}

		// Bonus points for longer passwords
		if (password.length >= 12) {
			score += 1;
		}

		// Determine strength level
		let strength: PasswordStrength["strength"];
		let color: PasswordStrength["color"];

		if (score <= 1) {
			strength = "very-weak";
			color = "red";
		} else if (score <= 2) {
			strength = "weak";
			color = "orange";
		} else if (score <= 3) {
			strength = "fair";
			color = "yellow";
		} else if (score <= 4) {
			strength = "good";
			color = "blue";
		} else {
			strength = "strong";
			color = "green";
		}

		return {
			score: Math.min(score, 5),
			feedback,
			strength,
			color,
		};
	}, [password]);
}
