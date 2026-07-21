import { cn } from "@/lib/cn";

interface ProgressBarProps {
  value: number;
  className?: string;
  trackClassName?: string;
  barClassName?: string;
  gradient?: boolean;
}

export function ProgressBar({
  value,
  className,
  trackClassName,
  barClassName,
  gradient = true,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-slate-200",
        trackClassName,
        className,
      )}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500",
          gradient ? "brand-gradient" : "bg-blue-600",
          barClassName,
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
