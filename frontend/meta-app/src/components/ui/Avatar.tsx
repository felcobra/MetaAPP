import Image from "next/image";
import { cn } from "@/lib/cn";

interface AvatarProps {
  initials: string;
  photoUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-24 w-24 text-2xl",
};

export function Avatar({ initials, photoUrl, size = "md", className }: AvatarProps) {
  if (photoUrl) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-full ring-2 ring-white",
          sizeClasses[size],
          className,
        )}
      >
        <Image src={photoUrl} alt={initials} fill className="object-cover" sizes="96px" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700",
        sizeClasses[size],
        className,
      )}
    >
      {initials}
    </div>
  );
}
