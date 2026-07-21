import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({
  children,
  className,
  padding = "md",
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white",
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardEyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-xs font-semibold uppercase tracking-wide text-blue-600",
        className,
      )}
    >
      {children}
    </p>
  );
}
