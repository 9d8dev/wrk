"use client";

import { ShortcutButton } from "@/components/admin/shortcut-button";
import { ProjectForm } from "@/components/admin/project-form";

import { useState, useEffect } from "react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export function CreateProject() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "c" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA" &&
        !document.querySelector('[data-state="open"]')
      ) {
        event.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerTrigger asChild>
        <ShortcutButton
          letter="c"
          label="Create Project"
          size="sm"
          variant="default"
        />
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full overflow-y-auto no-scrollbar">
          <DrawerHeader>
            <DrawerTitle>Create New Project</DrawerTitle>
            <DrawerDescription>
              Fill out the form below to create a new project. Click save when
              you&apos;re done.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 sm:p-6">
            <ProjectForm
              onSuccess={() => {
                setOpen(false);
              }}
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
