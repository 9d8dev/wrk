"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignInForm from "@/components/auth/sign-in-form";
import SignUpForm from "@/components/auth/sign-up-form";

import Water from "@/public/water.webp";

function SignInPageContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tab === "signup" ? "sign-up" : "sign-in"
  );

  useEffect(() => {
    if (tab === "signup") {
      setActiveTab("sign-up");
    } else if (tab === "login") {
      setActiveTab("sign-in");
    }
  }, [tab]);

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-md p-4 sm:mt-12 sm:p-0"
      >
        <Tabs
          value={activeTab}
          defaultValue="sign-in"
          className="w-full"
          onValueChange={(value) => setActiveTab(value)}
        >
          <TabsList className="bg-muted w-full">
            <TabsTrigger value="sign-in">Login</TabsTrigger>
            <TabsTrigger value="sign-up">Create Account</TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait" initial={false}>
            {activeTab === "sign-in" ? (
              <motion.div
                key="sign-in"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-background mt-2 rounded"
              >
                <TabsContent value="sign-in" forceMount>
                  <SignInForm />
                </TabsContent>
              </motion.div>
            ) : (
              <motion.div
                key="sign-up"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-background mt-2 rounded"
              >
                <TabsContent value="sign-up" forceMount>
                  <SignUpForm />
                </TabsContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Tabs>
      </motion.div>

      <Image
        src={Water}
        alt="Water"
        className="absolute inset-0 -z-10 h-full w-full object-cover"
        placeholder="blur"
      />
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="relative h-screen w-screen overflow-hidden">
          <Image
            src={Water}
            alt="Water"
            className="absolute inset-0 -z-10 h-full w-full object-cover"
            placeholder="blur"
          />
        </main>
      }
    >
      <SignInPageContent />
    </Suspense>
  );
}
