import { type ButtonHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md";

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "brand-gradient text-white shadow-sm shadow-blue-600/20 hover:brightness-105 active:brightness-95",
  secondary:
    "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:bg-slate-100",
  outline:
    "bg-transparent text-slate-700 border border-slate-300 hover:bg-slate-50",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
};

const baseClasses =
  "inline-flex items-center justify-center rounded-xl font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

interface ButtonProps
  extends BaseProps,
    ButtonHTMLAttributes<HTMLButtonElement> {
  href?: undefined;
}

interface LinkButtonProps extends BaseProps {
  href: string;
  children?: ReactNode;
  className?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "right",
  fullWidth,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {icon && iconPosition === "left" ? icon : null}
      {children}
      {icon && iconPosition === "right" ? icon : null}
    </button>
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "right",
  fullWidth,
  className,
  children,
  href,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {icon && iconPosition === "left" ? icon : null}
      {children}
      {icon && iconPosition === "right" ? icon : null}
    </Link>
  );
}
