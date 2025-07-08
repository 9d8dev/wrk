"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Edit, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { gridTypes, type Theme } from "@/db/schema";
import { updateTheme } from "@/lib/actions/theme";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  gridType: z.enum(gridTypes),
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
    id: "masonry",
    label: "Masonry Layout",
    description: "Dynamic masonry layout with varying heights",
    gridType: "masonry" as const,
  },
  {
    id: "grid",
    label: "Grid Layout",
    description: "Clean grid layout for your projects",
    gridType: "grid" as const,
  },
  {
    id: "minimal",
    label: "Minimal Layout",
    description: "Simple list layout with minimal styling",
    gridType: "minimal" as const,
  },
  {
    id: "square",
    label: "Square Layout",
    description: "Uniform square grid layout",
    gridType: "square" as const,
  },
];

// Placeholder SVG component - you can replace these with your custom SVGs
function ThemePreviewSVG({ themeId }: { themeId: string }) {
  return (
    <div className="bg-muted flex h-24 w-full items-center justify-center rounded-md border">
      <svg
        width="80"
        height="60"
        viewBox="0 0 80 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-muted-foreground"
        aria-labelledby={`theme-preview-${themeId}`}
      >
        <title id={`theme-preview-${themeId}`}>{themeId} layout preview</title>
        {themeId === "grid" && (
          <div>
            <rect
              x="5"
              y="8"
              width="70"
              height="8"
              fill="currentColor"
              opacity="0.3"
            />
          </div>
        )}
        {themeId === "minimal" && (
          <div>
            <rect
              x="5"
              y="5"
              width="70"
              height="70"
              fill="currentColor"
              opacity="0.3"
            />
          </div>
        )}
        {themeId === "masonry" && (
          <div>
            <rect
              x="5"
              y="5"
              width="70"
              height="70"
              fill="currentColor"
              opacity="0.3"
            />
          </div>
        )}
        {themeId === "square" && (
          <div>
            <rect
              x="5"
              y="5"
              width="20"
              height="20"
              fill="currentColor"
              opacity="0.3"
            />
          </div>
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
    },
  });

  const currentValues = form.watch();
  const currentThemeId = currentValues.gridType;

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
  }

  if (!isEditing) {
    const currentOption =
      themeOptions.find(
        (option) => option.gridType === (theme?.gridType || "grid")
      ) || themeOptions[0];

    return (
      <div className="max-w-4xl">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Theme Settings</h1>
            <p className="text-muted-foreground">
              Customize your portfolio appearance
            </p>
          </div>
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>

        <div className="space-y-8">
          <div className="rounded-lg border p-6">
            <div className="flex items-start gap-6">
              <div className="w-48 flex-shrink-0">
                <ThemePreviewSVG themeId={currentOption.id} />
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-xl font-semibold">
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
                </div>
              </div>
            </div>
          </div>

          <div className="text-muted-foreground text-xs">
            Press <kbd className="bg-muted rounded px-1 py-0.5">E</kbd> to edit
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Choose Theme</h1>
          <p className="text-muted-foreground">
            Select a theme for your portfolio
          </p>
        </div>
        <Button variant="outline" onClick={() => setIsEditing(false)}>
          <X className="mr-2 h-4 w-4" />
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
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {themeOptions.map((option) => {
                      const isSelected = currentThemeId === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => selectTheme(option)}
                          className={cn(
                            "hover:border-primary/50 relative rounded-lg border-2 p-4 text-left transition-all",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted/50"
                          )}
                        >
                          {isSelected && (
                            <div className="absolute top-3 right-3">
                              <div className="bg-primary flex h-6 w-6 items-center justify-center rounded-full">
                                <Check className="text-primary-foreground h-4 w-4" />
                              </div>
                            </div>
                          )}

                          <div className="mb-4">
                            <ThemePreviewSVG themeId={option.id} />
                          </div>

                          <div>
                            <h3 className="mb-1 font-semibold">
                              {option.label}
                            </h3>
                            <p className="text-muted-foreground mb-3 text-sm">
                              {option.description}
                            </p>
                            <div className="flex gap-3 text-xs">
                              <span className="bg-muted rounded-md px-2 py-1">
                                {option.gridType}
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

      <div className="text-muted-foreground mt-6 text-xs">
        Press <kbd className="bg-muted rounded px-1 py-0.5">Esc</kbd> to cancel
      </div>
    </div>
  );
}
