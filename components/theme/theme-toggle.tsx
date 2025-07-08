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
      className="relative flex h-9 w-9 items-center justify-center border"
      variant="outline"
      onClick={toggleTheme}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] transition-opacity duration-200 dark:absolute dark:opacity-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] opacity-0 transition-opacity duration-200 dark:relative dark:opacity-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
