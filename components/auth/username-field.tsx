"use client";

import { AlertCircle, CheckCircle, Hash, Loader2 } from "lucide-react";
import { motion } from "motion/react";

import { Input } from "@/components/ui/input";

interface UsernameAvailability {
  isChecking: boolean;
  isAvailable: boolean | null;
  message: string;
}

interface UsernameFieldProps {
  username: string;
  usernameError: string;
  usernameAvailability: UsernameAvailability;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function UsernameField({
  username,
  usernameError,
  usernameAvailability,
  onChange,
}: UsernameFieldProps) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          placeholder="Username"
          type="text"
          name="username"
          icon={<Hash size={16} />}
          value={username}
          autoComplete="username"
          onChange={onChange}
          className={
            username.length >= 3
              ? usernameAvailability.isAvailable === true
                ? "border-green-500 pr-10"
                : usernameAvailability.isAvailable === false
                  ? "border-red-500 pr-10"
                  : "pr-10"
              : ""
          }
        />

        {/* Username availability indicator */}
        {username.length >= 3 && (
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

      {/* Username feedback messages */}
      {usernameError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-md border border-yellow-200 bg-yellow-50 p-2 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-200"
        >
          {usernameError}
        </motion.div>
      )}

      {/* Username availability feedback */}
      {username.length >= 3 &&
        !usernameError &&
        usernameAvailability.message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-md p-2 text-sm ${
              usernameAvailability.isAvailable === true
                ? "border border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/20 dark:text-green-200"
                : usernameAvailability.isAvailable === false
                  ? "border border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/20 dark:text-red-200"
                  : "border border-gray-200 bg-gray-50 text-gray-800 dark:border-gray-800 dark:bg-gray-950/20 dark:text-gray-200"
            }`}
          >
            {usernameAvailability.message}
            {usernameAvailability.isAvailable === true && (
              <span className="mt-1 block text-xs opacity-75">
                Your portfolio will be available at wrk.so/{username}
              </span>
            )}
          </motion.div>
        )}
    </div>
  );
}
