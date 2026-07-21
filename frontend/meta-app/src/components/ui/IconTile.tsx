import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface IconTileProps {
  icon: LucideIcon;
  className?: string;
  iconClassName?: string;
  size?: "sm" | "md";
}

const sizeClasses = {
  sm: { box: "h-9 w-9 rounded-lg", icon: "h-4 w-4" },
  md: { box: "h-12 w-12 rounded-xl", icon: "h-5 w-5" },
};

export function IconTile({ icon: Icon, className, iconClassName, size = "md" }: IconTileProps) {
  const dims = sizeClasses[size];
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center text-white",
        dims.box,
        className,
      )}
    >
      <Icon className={cn(dims.icon, iconClassName)} />
    </div>
  );
}
