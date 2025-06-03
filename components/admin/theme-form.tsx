"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { updateTheme } from "@/lib/actions/theme";
import { Theme, gridTypes, modes } from "@/db/schema";
import { Edit, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  gridType: z.enum(gridTypes),
  mode: z.enum(modes),
});

type SessionUser = {
  id: string;
  name?: string | null;
  username?: string | null;
  email: string;
  image?: string | null;
};

type ThemeFormProps = {
  user: SessionUser;
  theme: Theme | null;
};

// Define theme combinations
const themeOptions = [
  {
    id: "grid-light",
    label: "Grid Light",
    description: "Clean grid layout with light theme",
    gridType: "grid" as const,
    mode: "light" as const,
  },
  {
    id: "grid-dark",
    label: "Grid Dark",
    description: "Clean grid layout with dark theme",
    gridType: "grid" as const,
    mode: "dark" as const,
  },
  {
    id: "list-light",
    label: "Minimal Light",
    description: "List layout with light theme",
    gridType: "minimal" as const,
    mode: "light" as const,
  },
  {
    id: "masonry-auto",
    label: "Masonry Auto",
    description: "Dynamic masonry layout with auto theme",
    gridType: "masonry" as const,
    mode: "light" as const,
  },
];

// Placeholder SVG component - you can replace these with your custom SVGs
function ThemePreviewSVG({ themeId }: { themeId: string }) {
  return (
    <div className="w-full h-24 bg-muted rounded-md flex items-center justify-center border">
      <svg
        width="80"
        height="60"
        viewBox="0 0 80 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-muted-foreground"
      >
        {themeId === "grid-light" && (
          <>
            <rect
              x="5"
              y="5"
              width="20"
              height="15"
              fill="currentColor"
              opacity="0.3"
            />
            <rect
              x="30"
              y="5"
              width="20"
              height="15"
              fill="currentColor"
              opacity="0.3"
            />
            <rect
              x="55"
              y="5"
              width="20"
              height="15"
              fill="currentColor"
              opacity="0.3"
            />
            <rect
              x="5"
              y="25"
              width="20"
              height="15"
              fill="currentColor"
              opacity="0.3"
            />
            <rect
              x="30"
              y="25"
              width="20"
              height="15"
              fill="currentColor"
              opacity="0.3"
            />
            <rect
              x="55"
              y="25"
              width="20"
              height="15"
              fill="currentColor"
              opacity="0.3"
            />
          </>
        )}
        {themeId === "grid-dark" && (
          <>
            <rect
              x="5"
              y="5"
              width="20"
              height="15"
              fill="currentColor"
              opacity="0.8"
            />
            <rect
              x="30"
              y="5"
              width="20"
              height="15"
              fill="currentColor"
              opacity="0.8"
            />
            <rect
              x="55"
              y="5"
              width="20"
              height="15"
              fill="currentColor"
              opacity="0.8"
            />
            <rect
              x="5"
              y="25"
              width="20"
              height="15"
              fill="currentColor"
              opacity="0.8"
            />
            <rect
              x="30"
              y="25"
              width="20"
              height="15"
              fill="currentColor"
              opacity="0.8"
            />
            <rect
              x="55"
              y="25"
              width="20"
              height="15"
              fill="currentColor"
              opacity="0.8"
            />
          </>
        )}
        {themeId === "list-light" && (
          <>
            <rect
              x="5"
              y="8"
              width="70"
              height="8"
              fill="currentColor"
              opacity="0.3"
            />
            <rect
              x="5"
              y="20"
              width="70"
              height="8"
              fill="currentColor"
              opacity="0.3"
            />
            <rect
              x="5"
              y="32"
              width="70"
              height="8"
              fill="currentColor"
              opacity="0.3"
            />
            <rect
              x="5"
              y="44"
              width="70"
              height="8"
              fill="currentColor"
              opacity="0.3"
            />
          </>
        )}
        {themeId === "masonry-auto" && (
          <>
            <rect
              x="5"
              y="5"
              width="15"
              height="20"
              fill="currentColor"
              opacity="0.5"
            />
            <rect
              x="25"
              y="5"
              width="15"
              height="12"
              fill="currentColor"
              opacity="0.5"
            />
            <rect
              x="45"
              y="5"
              width="15"
              height="25"
              fill="currentColor"
              opacity="0.5"
            />
            <rect
              x="65"
              y="5"
              width="15"
              height="15"
              fill="currentColor"
              opacity="0.5"
            />
            <rect
              x="5"
              y="30"
              width="15"
              height="15"
              fill="currentColor"
              opacity="0.5"
            />
            <rect
              x="25"
              y="22"
              width="15"
              height="18"
              fill="currentColor"
              opacity="0.5"
            />
            <rect
              x="45"
              y="35"
              width="15"
              height="12"
              fill="currentColor"
              opacity="0.5"
            />
          </>
        )}
      </svg>
    </div>
  );
}

export function ThemeForm({ user, theme }: ThemeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gridType: (theme?.gridType as (typeof gridTypes)[number]) || "grid",
      mode: (theme?.mode as (typeof modes)[number]) || "light",
    },
  });

  const currentValues = form.watch();
  const currentThemeId = `${currentValues.gridType}-${currentValues.mode}`;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === "e" &&
        !isEditing &&
        e.target === document.body
      ) {
        e.preventDefault();
        setIsEditing(true);
      }
      if (e.key === "Escape" && isEditing) {
        e.preventDefault();
        setIsEditing(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isEditing]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);

      await updateTheme({
        userId: user.id,
        themeData: {
          gridType: values.gridType,
          mode: values.mode,
        },
      });

      toast.success("Theme updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating theme:", error);
      toast.error("Failed to update theme");
    } finally {
      setIsSubmitting(false);
    }
  }

  function selectTheme(option: (typeof themeOptions)[0]) {
    form.setValue("gridType", option.gridType);
    form.setValue("mode", option.mode);
  }

  if (!isEditing) {
    const currentOption =
      themeOptions.find(
        (option) =>
          option.gridType === (theme?.gridType || "grid") &&
          option.mode === (theme?.mode || "light"),
      ) || themeOptions[0];

    return (
      <div className="max-w-4xl">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold">Theme Settings</h1>
            <p className="text-muted-foreground">
              Customize your portfolio appearance
            </p>
          </div>
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>

        <div className="space-y-8">
          <div className="p-6 border rounded-lg">
            <div className="flex items-start gap-6">
              <div className="w-48 flex-shrink-0">
                <ThemePreviewSVG themeId={currentOption.id} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">
                  {currentOption.label}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {currentOption.description}
                </p>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="font-medium">Layout:</span>{" "}
                    {currentOption.gridType}
                  </div>
                  <div>
                    <span className="font-medium">Theme:</span>{" "}
                    {currentOption.mode}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Press <kbd className="px-1 py-0.5 bg-muted rounded">E</kbd> to edit
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold">Choose Theme</h1>
          <p className="text-muted-foreground">
            Select a theme for your portfolio
          </p>
        </div>
        <Button variant="outline" onClick={() => setIsEditing(false)}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="gridType"
            render={() => (
              <FormItem>
                <FormLabel className="text-base">Theme Options</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {themeOptions.map((option) => {
                      const isSelected = currentThemeId === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => selectTheme(option)}
                          className={cn(
                            "relative p-4 border-2 rounded-lg text-left transition-all hover:border-primary/50",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted/50",
                          )}
                        >
                          {isSelected && (
                            <div className="absolute top-3 right-3">
                              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-primary-foreground" />
                              </div>
                            </div>
                          )}

                          <div className="mb-4">
                            <ThemePreviewSVG themeId={option.id} />
                          </div>

                          <div>
                            <h3 className="font-semibold mb-1">
                              {option.label}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3">
                              {option.description}
                            </p>
                            <div className="flex gap-3 text-xs">
                              <span className="px-2 py-1 bg-muted rounded-md">
                                {option.gridType}
                              </span>
                              <span className="px-2 py-1 bg-muted rounded-md">
                                {option.mode}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Theme"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>

      <div className="mt-6 text-xs text-muted-foreground">
        Press <kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd> to cancel
      </div>
    </div>
  );
}
