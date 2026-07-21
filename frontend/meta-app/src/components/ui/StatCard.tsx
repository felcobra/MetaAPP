import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "./Card";
import { cn } from "@/lib/cn";

interface StatCardProps {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  icon?: LucideIcon;
  iconClassName?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  iconClassName,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        {helper ? <div className="mt-1 text-sm text-slate-500">{helper}</div> : null}
      </div>
      {Icon ? (
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600",
            iconClassName,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
    </Card>
  );
}
