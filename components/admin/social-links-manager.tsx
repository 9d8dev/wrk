"use client";

import { Plus, Trash2 } from "lucide-react";
import { Control, useFieldArray } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface SocialLinksManagerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
}

export default function SocialLinksManager({ control }: SocialLinksManagerProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "socialLinks",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <FormLabel>Social Links</FormLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ platform: "", url: "" })}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add Link
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No social links added yet
        </p>
      )}

      {fields.map((field, index) => (
        <div key={field.id} className="flex items-start gap-3">
          <div className="grid flex-1 grid-cols-2 gap-3">
            <FormField
              control={control}
              name={`socialLinks.${index}.platform`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Platform" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`socialLinks.${index}.url`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => remove(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
