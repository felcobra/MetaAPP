import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  wrapperClassName?: string;
}

export function Input({ icon, className, wrapperClassName, ...props }: InputProps) {
  if (icon) {
    return (
      <div className={cn("relative", wrapperClassName)}>
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        <input
          className={cn(
            "h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100",
            className,
          )}
          {...props}
        />
      </div>
    );
  }

  return (
    <input
      className={cn(
        "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100",
        className,
      )}
      {...props}
    />
  );
}

export function Label({
  children,
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-2 block text-sm font-semibold text-slate-800", className)}
      {...props}
    >
      {children}
    </label>
  );
}
