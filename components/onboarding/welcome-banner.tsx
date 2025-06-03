"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Lightbulb, Users, Palette, Share2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: <Palette className="h-5 w-5" />,
    title: "Beautiful Portfolios",
    description: "Showcase your work with stunning, customizable templates",
  },
  {
    icon: <Share2 className="h-5 w-5" />,
    title: "Easy Sharing",
    description: "Share your portfolio with a simple, memorable URL",
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "Connect & Network",
    description: "Connect with other designers and get discovered",
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: "Lightning Fast",
    description: "Your portfolio loads instantly, anywhere in the world",
  },
];

export function WelcomeBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-8"
      >
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500 rounded-full">
                  <Lightbulb className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    Welcome to Wrk.so!
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Here&apos;s what you can do with your new portfolio
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="text-blue-500 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-900/50"
                >
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    💡 Pro Tip
                  </Badge>
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    Add 3-5 of your best projects to make a strong first
                    impression
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
