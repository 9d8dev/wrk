"use client";

import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { FieldValues, Path, PathValue, UseFormReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface UsernameAvailability {
  isChecking: boolean;
  isAvailable: boolean | null;
  message: string;
}

interface ProfileUsernameFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  usernameAvailability: UsernameAvailability;
  shouldCheckAvailability: boolean;
}

export default function ProfileUsernameField<T extends FieldValues>({
  form,
  name,
  usernameAvailability,
  shouldCheckAvailability,
}: ProfileUsernameFieldProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Username</FormLabel>
          <FormControl>
            <div className="relative">
              <Input placeholder="username" {...field} />
              {shouldCheckAvailability && (
                <div className="absolute top-1/2 right-3 -translate-y-1/2 transform">
                  {usernameAvailability.isChecking ? (
                    <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                  ) : usernameAvailability.isAvailable === true ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : usernameAvailability.isAvailable === false ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : null}
                </div>
              )}
            </div>
          </FormControl>
          {shouldCheckAvailability && usernameAvailability.message && (
            <p
              className={`text-xs ${
                usernameAvailability.isAvailable === true
                  ? "text-green-600"
                  : usernameAvailability.isAvailable === false
                    ? "text-red-600"
                    : "text-gray-600"
              }`}
            >
              {usernameAvailability.message}
            </p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
