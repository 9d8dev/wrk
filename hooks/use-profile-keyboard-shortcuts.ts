import { useEffect } from "react";

interface UseProfileKeyboardShortcutsProps {
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
}

export function useProfileKeyboardShortcuts({
  isEditing,
  onEdit,
  onCancel,
}: UseProfileKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === "e" &&
        !isEditing &&
        e.target === document.body
      ) {
        e.preventDefault();
        onEdit();
      }
      if (e.key === "Escape" && isEditing) {
        e.preventDefault();
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isEditing, onEdit, onCancel]);
}
