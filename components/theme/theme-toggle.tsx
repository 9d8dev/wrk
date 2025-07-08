"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();

	const toggleTheme = () => {
		setTheme(theme === "light" ? "dark" : "light");
	};

	return (
		<Button
			type="button"
			className="h-9 w-9 relative flex items-center justify-center border"
			variant="outline"
			onClick={toggleTheme}
		>
			<Sun className="h-[1.2rem] w-[1.2rem] transition-opacity duration-200 dark:opacity-0 dark:absolute" />
			<Moon className="h-[1.2rem] w-[1.2rem] transition-opacity duration-200 opacity-0 absolute dark:opacity-100 dark:relative" />
			<span className="sr-only">Toggle theme</span>
		</Button>
	);
}
