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
      <span className="p-1 text-xs uppercase border border-accent/20 rounded bg-accent/20 w-5 h-5 flex items-center justify-center -ml-1.5">
        {letter}
      </span>
      {label}
    </Button>
  );
};
