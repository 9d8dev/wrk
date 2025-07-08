import { useEffect, useState } from "react";

interface UsernameAvailabilityState {
	isChecking: boolean;
	isAvailable: boolean | null;
	message: string;
	hasError: boolean;
}

export function useUsernameAvailability(username: string) {
	const [state, setState] = useState<UsernameAvailabilityState>({
		isChecking: false,
		isAvailable: null,
		message: "",
		hasError: false,
	});

	useEffect(() => {
		// Don't check if username is empty or too short
		if (!username || username.length < 3) {
			setState({
				isChecking: false,
				isAvailable: null,
				message: "",
				hasError: false,
			});
			return;
		}

		// Debounce the API call
		const timeoutId = setTimeout(async () => {
			setState((prev) => ({ ...prev, isChecking: true, hasError: false }));

			try {
				const response = await fetch(
					`/api/auth/username-availability?username=${encodeURIComponent(
						username,
					)}`,
				);

				if (!response.ok) {
					throw new Error("Failed to check username availability");
				}

				const data = await response.json();

				setState({
					isChecking: false,
					isAvailable: data.available,
					message: data.message,
					hasError: false,
				});
			} catch (error) {
				console.error("Username availability check failed:", error);
				setState({
					isChecking: false,
					isAvailable: null,
					message: "Unable to check username availability",
					hasError: true,
				});
			}
		}, 500); // 500ms debounce

		return () => clearTimeout(timeoutId);
	}, [username]);

	return state;
}
