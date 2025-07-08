import { isUsernameAvailable } from "@/lib/data/user";

/**
 * Generate a unique username by checking availability and adding suffixes if needed
 */
export async function generateUniqueUsername(
	baseUsername: string,
	maxAttempts: number = 10,
): Promise<string> {
	// Clean the base username first
	const cleanBase = cleanUsername(baseUsername);

	// Try the original first
	const baseResult = await isUsernameAvailable(cleanBase);
	if (baseResult.success && baseResult.data) {
		return cleanBase;
	}

	// Try variations with numbers
	for (let i = 1; i <= maxAttempts; i++) {
		const variant = `${cleanBase}${i}`;
		const result = await isUsernameAvailable(variant);
		if (result.success && result.data) {
			return variant;
		}
	}

	// Try variations with random suffixes if numbers don't work
	for (let i = 0; i < 3; i++) {
		const randomSuffix = Math.floor(Math.random() * 1000).toString();
		const variant = `${cleanBase}${randomSuffix}`;
		const result = await isUsernameAvailable(variant);
		if (result.success && result.data) {
			return variant;
		}
	}

	// Final fallback: use timestamp
	const timestamp = Date.now().toString().slice(-6);
	return `${cleanBase}${timestamp}`;
}

/**
 * Clean username to match validation rules
 */
export function cleanUsername(username: string): string {
	return username
		.toLowerCase()
		.replace(/[^a-zA-Z0-9_-]/g, "_") // Replace invalid chars with underscore
		.replace(/_{2,}/g, "_") // Replace multiple underscores with single
		.replace(/^_+|_+$/g, "") // Remove leading/trailing underscores
		.slice(0, 20); // Ensure max length
}

/**
 * Generate username from email
 */
export function generateUsernameFromEmail(email: string): string {
	const emailUsername = email.split("@")[0];
	return cleanUsername(emailUsername);
}

/**
 * Generate username from full name
 */
export function generateUsernameFromName(name: string): string {
	return cleanUsername(name.toLowerCase().split(" ").join("_"));
}

/**
 * Generate multiple username suggestions for user to choose from
 */
export async function generateUsernameSuggestions(
	baseUsername: string,
	alternatives?: string[],
): Promise<string[]> {
	const suggestions: string[] = [];
	const cleanBase = cleanUsername(baseUsername);

	// Try the base first
	const baseResult = await isUsernameAvailable(cleanBase);
	if (baseResult.success && baseResult.data) {
		suggestions.push(cleanBase);
	}

	// Try alternatives if provided
	if (alternatives) {
		for (const alt of alternatives) {
			const cleanAlt = cleanUsername(alt);
			const result = await isUsernameAvailable(cleanAlt);
			if (result.success && result.data && !suggestions.includes(cleanAlt)) {
				suggestions.push(cleanAlt);
				if (suggestions.length >= 5) break;
			}
		}
	}

	// Generate numbered variations
	for (let i = 1; i <= 10 && suggestions.length < 5; i++) {
		const variant = `${cleanBase}${i}`;
		const result = await isUsernameAvailable(variant);
		if (result.success && result.data) {
			suggestions.push(variant);
		}
	}

	// Generate creative variations
	const prefixes = ["the", "creative", "pro"];
	const suffixes = ["creative", "pro", "studio", "design"];

	for (const prefix of prefixes) {
		if (suggestions.length >= 5) break;
		const variant = `${prefix}_${cleanBase}`;
		if (variant.length <= 20) {
			const result = await isUsernameAvailable(variant);
			if (result.success && result.data) {
				suggestions.push(variant);
			}
		}
	}

	for (const suffix of suffixes) {
		if (suggestions.length >= 5) break;
		const variant = `${cleanBase}_${suffix}`;
		if (variant.length <= 20) {
			const result = await isUsernameAvailable(variant);
			if (result.success && result.data) {
				suggestions.push(variant);
			}
		}
	}

	return suggestions;
}
