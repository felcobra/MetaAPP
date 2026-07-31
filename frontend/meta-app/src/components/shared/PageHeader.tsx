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
      <div className="min-w-0">
        <CardEyebrow>{eyebrow}</CardEyebrow>
        <h1 className="mt-4 break-words text-3xl font-extrabold leading-tight text-slate-950 sm:text-4xl">{title}</h1>
        {description ? <p className="mt-3 max-w-4xl break-words text-base text-slate-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </div>
  );
}
