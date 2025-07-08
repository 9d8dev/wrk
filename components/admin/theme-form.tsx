"use client";

import type { StaticImageData } from "next/image";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Edit, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import Masonry from "@/public/examples/masonry.jpg";
import Minimal from "@/public/examples/minimal.jpg";
import Square from "@/public/examples/square.jpg";
import Grid from "@/public/examples/grid.jpg";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { updateTheme } from "@/lib/actions/theme";
import { cn } from "@/lib/utils";

import { gridTypes, type Theme } from "@/db/schema";
import Image from "next/image";

// Types
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

type ThemeOption = {
  id: string;
  label: string;
  description: string;
  gridType: (typeof gridTypes)[number];
  image: StaticImageData;
};

// Constants
const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "masonry",
    label: "Masonry Layout",
    description: "Dynamic masonry layout with varying heights",
    gridType: "masonry",
    image: Masonry,
  },
  {
    id: "grid",
    label: "Grid Layout",
    description: "Clean grid layout for your projects",
    gridType: "grid",
    image: Grid,
  },
  {
    id: "minimal",
    label: "Minimal Layout",
    description: "Simple list layout with minimal styling",
    gridType: "minimal",
    image: Minimal,
  },
  {
    id: "square",
    label: "Square Layout",
    description: "Uniform square grid layout",
    gridType: "square",
    image: Square,
  },
];

const formSchema = z.object({
  gridType: z.enum(gridTypes),
});

function ThemeOptionCard({
  option,
  isSelected,
  onSelect,
}: {
  option: ThemeOption;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "hover:border-primary/50 relative rounded border-2 p-4 text-left transition-all",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-muted/50"
      )}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-primary flex h-6 w-6 items-center justify-center rounded-full">
            <Check className="text-primary-foreground h-4 w-4" />
          </div>
        </div>
      )}

      <div className="mb-4">
        <Image
          src={option.image.src}
          alt={option.label}
          width={300}
          height={198.28}
          className="rounded"
        />
      </div>

      <h3 className="mb-1 font-semibold">{option.label}</h3>
      <p className="text-muted-foreground text-sm">{option.description}</p>
    </button>
  );
}

// Read-only theme display component
function ThemeDisplay({
  theme,
  onEdit,
}: {
  theme: Theme | null;
  onEdit: () => void;
}) {
  const currentOption =
    THEME_OPTIONS.find(
      (option) => option.gridType === (theme?.gridType || "grid")
    ) || THEME_OPTIONS[0];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mt-8 space-y-8">
        <div className="bg-accent/30 rounded border p-4">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <Image
                src={currentOption.image.src}
                alt={currentOption.label}
                width={300}
                height={198.28}
                className="rounded"
              />
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

// Theme selection form component
function ThemeSelectionForm({
  user,
  theme,
  onCancel,
  onSuccess,
}: {
  user: SessionUser;
  theme: Theme | null;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gridType: (theme?.gridType as (typeof gridTypes)[number]) || "grid",
    },
  });

  const currentValues = form.watch();
  const currentThemeId = currentValues.gridType;

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
      onSuccess();
    } catch (error) {
      console.error("Error updating theme:", error);
      toast.error("Failed to update theme");
    } finally {
      setIsSubmitting(false);
    }
  }

  function selectTheme(option: ThemeOption) {
    form.setValue("gridType", option.gridType);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-8">
          <FormField
            control={form.control}
            name="gridType"
            render={() => (
              <FormItem>
                <FormLabel className="sr-only">Theme Options</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {THEME_OPTIONS.map((option) => (
                      <ThemeOptionCard
                        key={option.id}
                        option={option}
                        isSelected={currentThemeId === option.gridType}
                        onSelect={() => selectTheme(option)}
                      />
                    ))}
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
            <Button type="button" variant="outline" onClick={onCancel}>
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

// Custom hook for keyboard shortcuts
function useThemeFormKeyboard(
  isEditing: boolean,
  setIsEditing: (editing: boolean) => void
) {
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
  }, [isEditing, setIsEditing]);
}

// Main component
export function ThemeForm({ user, theme }: ThemeFormProps) {
  const [isEditing, setIsEditing] = useState(false);

  useThemeFormKeyboard(isEditing, setIsEditing);

  const handleEditStart = () => setIsEditing(true);
  const handleEditEnd = () => setIsEditing(false);

  if (isEditing) {
    return (
      <ThemeSelectionForm
        user={user}
        theme={theme}
        onCancel={handleEditEnd}
        onSuccess={handleEditEnd}
      />
    );
  }

  return <ThemeDisplay theme={theme} onEdit={handleEditStart} />;
}
