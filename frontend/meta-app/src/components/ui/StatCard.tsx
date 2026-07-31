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
    <Card className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div className="flex min-w-0 items-center gap-2">
        {Icon ? (
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600",
              iconClassName,
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
        ) : null}
        <p className="min-w-0 break-words text-sm font-medium text-slate-600">{label}</p>
      </div>
      <p className="min-w-0 break-words text-2xl font-bold leading-tight text-slate-900">{value}</p>
      {helper ? <div className="min-w-0 break-words text-xs text-slate-400">{helper}</div> : null}
    </Card>
  );
}
