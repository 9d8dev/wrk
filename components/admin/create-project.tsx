"use client";

import { useCallback, useEffect, useState } from "react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ShortcutButton } from "@/components/admin/shortcut-button";
import { ProjectForm } from "@/components/admin/project-form";

// Types
interface CreateProjectProps {
  initialImages?: File[];
  onClose?: () => void;
  buttonHidden?: boolean;
  initialOpen?: boolean;
}

// Custom hooks
function useKeyboardShortcut(
  key: string,
  callback: () => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if:
      // - The pressed key matches
      // - Focus is not in an input or textarea
      // - No modals/drawers are currently open
      const isInputFocused =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA";

      const isModalOpen = document.querySelector('[data-state="open"]');

      if (event.key === key && !isInputFocused && !isModalOpen) {
        event.preventDefault();
        callback();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [key, callback, enabled]);
}

function useDrawerState(initialOpen: boolean = false) {
  const [open, setOpen] = useState(initialOpen);

  // Sync with external initialOpen prop changes
  useEffect(() => {
    if (initialOpen) {
      setOpen(true);
    }
  }, [initialOpen]);

  const openDrawer = useCallback(() => setOpen(true), []);
  const closeDrawer = useCallback(() => setOpen(false), []);

  return {
    open,
    setOpen,
    openDrawer,
    closeDrawer,
  };
}

// Components
interface DrawerTriggerButtonProps {
  onOpen: () => void;
}

function DrawerTriggerButton({ onOpen }: DrawerTriggerButtonProps) {
  return (
    <DrawerTrigger asChild>
      <ShortcutButton
        letter="c"
        label="Create Project"
        size="sm"
        variant="default"
        onClick={onOpen}
      />
    </DrawerTrigger>
  );
}

interface DrawerContentWrapperProps {
  initialImages?: File[];
  onSuccess: () => void;
}

function DrawerContentWrapper({
  initialImages,
  onSuccess,
}: DrawerContentWrapperProps) {
  return (
    <DrawerContent className="z-50">
      <div className="no-scrollbar mx-auto w-full overflow-y-auto">
        <DrawerHeader>
          <DrawerTitle>Create New Project</DrawerTitle>
          <DrawerDescription>
            Add images and details for your new project
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4 sm:p-6">
          <ProjectForm initialImages={initialImages} onSuccess={onSuccess} />
        </div>
      </div>
    </DrawerContent>
  );
}

// Main component
export function CreateProject({
  initialImages,
  onClose,
  buttonHidden = false,
  initialOpen = false,
}: CreateProjectProps = {}) {
  const { open, setOpen, openDrawer, closeDrawer } =
    useDrawerState(initialOpen);

  // Handle successful project creation
  const handleSuccess = useCallback(() => {
    closeDrawer();
    onClose?.();
  }, [closeDrawer, onClose]);

  // Setup keyboard shortcut (C key to open)
  useKeyboardShortcut("c", openDrawer, !open);

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      {!buttonHidden && <DrawerTriggerButton onOpen={openDrawer} />}
      <DrawerContentWrapper
        initialImages={initialImages}
        onSuccess={handleSuccess}
      />
    </Drawer>
  );
}
