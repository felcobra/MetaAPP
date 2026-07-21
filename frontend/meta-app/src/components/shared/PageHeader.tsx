import type { ReactNode } from "react";
import { CardEyebrow } from "@/components/ui/Card";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <CardEyebrow>{eyebrow}</CardEyebrow>
        <h1 className="mt-1 text-3xl font-bold text-slate-900 sm:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </div>
  );
}
