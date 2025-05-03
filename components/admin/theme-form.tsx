"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { ShortcutButton } from "./shortcut-button";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateTheme } from "@/lib/actions/theme";
import { Theme, gridTypes, modes } from "@/db/schema";
import { X } from "lucide-react";

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "e" && !isEditing) {
        setIsEditing(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
      setIsEditing(false); // Exit edit mode after successful save
    } catch (error) {
      console.error("Error updating theme:", error);
      toast.error("Failed to update theme");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Render a read-only view when not in edit mode
  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6 fixed top-2 right-4">
          <ShortcutButton
            letter="e"
            label="Edit Theme"
            onClick={() => setIsEditing(true)}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Grid Type
            </h3>
            <p className="mt-1 text-base capitalize">
              {theme?.gridType || "Grid"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Mode
            </h3>
            <p className="mt-1 text-base capitalize">
              {theme?.mode || "Light"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render the editable form when in edit mode
  return (
    <Form {...form}>
      <div className="flex justify-between items-center mb-6 fixed top-2 right-4">
        <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
          <X size={12} />
          Cancel
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="gridType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grid Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a grid type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {gridTypes.map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        className="capitalize"
                      >
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose how your projects are displayed on your portfolio.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Light / Dark Mode</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a mode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {modes.map((mode) => (
                      <SelectItem
                        key={mode}
                        value={mode}
                        className="capitalize"
                      >
                        {mode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Set the appearance mode for your portfolio, default will match
                  the visitor&apos;s system preference.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
