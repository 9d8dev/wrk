"use client";

import { motion } from "motion/react";

interface PasswordStrength {
  score: number;
  strength: string;
  color: string;
  feedback: string[];
}

interface PasswordStrengthIndicatorProps {
  passwordStrength: PasswordStrength;
}

export default function PasswordStrengthIndicator({
  passwordStrength,
}: PasswordStrengthIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span
            className={`capitalize ${
              passwordStrength.color === "green"
                ? "text-green-600"
                : passwordStrength.color === "blue"
                  ? "text-blue-600"
                  : passwordStrength.color === "yellow"
                    ? "text-yellow-600"
                    : passwordStrength.color === "orange"
                      ? "text-orange-600"
                      : "text-red-600"
            }`}
          >
            {passwordStrength.strength.replace("-", " ")}
          </span>
        </div>
        <div className="flex space-x-1">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={`strength-segment-${i + 1}`}
              className={`h-2 flex-1 rounded-full ${
                i < passwordStrength.score
                  ? passwordStrength.color === "green"
                    ? "bg-green-500"
                    : passwordStrength.color === "blue"
                      ? "bg-blue-500"
                      : passwordStrength.color === "yellow"
                        ? "bg-yellow-500"
                        : passwordStrength.color === "orange"
                          ? "bg-orange-500"
                          : "bg-red-500"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Feedback */}
      {passwordStrength.feedback.length > 0 && (
        <div className="text-muted-foreground text-xs">
          <p className="mb-1">To strengthen your password:</p>
          <ul className="list-inside list-disc space-y-0.5">
            {passwordStrength.feedback.slice(0, 3).map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
