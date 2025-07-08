import { Button } from "@/components/ui/button";

export type ShortcutButtonProps = {
  letter: string;
  label: string;
  variant?:
    | "default"
    | "outline"
    | "ghost"
    | "link"
    | "secondary"
    | "destructive";
  size?: "default" | "sm" | "lg" | "icon" | null | undefined;
  className?: string;
  onClick?: () => void;
};

export const ShortcutButton = ({
  letter,
  label,
  variant,
  size = "sm",
  className,
  onClick,
}: ShortcutButtonProps) => {
  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      onClick={onClick}
    >
      <span className="border-accent/20 bg-accent/20 -ml-1.5 flex h-5 w-5 items-center justify-center rounded border p-1 text-xs uppercase">
        {letter}
      </span>
      {label}
    </Button>
  );
};
