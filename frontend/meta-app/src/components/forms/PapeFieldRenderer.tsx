"use client";

import { Calendar } from "lucide-react";
import type { PapeField } from "@/types/forms";
import { Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

interface PapeFieldRendererProps {
  field: PapeField;
  order: number;
  value: string;
  onChange: (value: string) => void;
}

export function PapeFieldRenderer({ field, order, value, onChange }: PapeFieldRendererProps) {
  return (
    <div className="flex gap-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg brand-gradient text-sm font-bold text-white">
        {order}
      </span>
      <div className="flex-1">
        <p className="font-semibold text-slate-800">
          {field.label}
          {field.required ? <span className="ml-0.5 text-blue-600">*</span> : null}
        </p>
        {field.helper ? <p className="mt-0.5 text-xs text-slate-400">{field.helper}</p> : null}

        <div className="mt-3">
          {field.type === "date" ? (
            <div className="relative max-w-xs">
              <input
                type="date"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-11 text-sm text-slate-900 outline-none transition-colors focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
              <Calendar className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          ) : null}

          {field.type === "text" ? (
            <input
              type="text"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder={field.placeholder}
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          ) : null}

          {field.type === "textarea" ? (
            <Textarea
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              rows={4}
              className="bg-slate-50 focus:bg-white"
            />
          ) : null}

          {field.type === "radio" ? (
            <div className="flex flex-wrap gap-3">
              {field.options?.map((option) => {
                const isSelected = value === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onChange(option)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-full border-2",
                        isSelected ? "border-blue-600" : "border-slate-300",
                      )}
                    >
                      {isSelected ? <span className="h-2 w-2 rounded-full bg-blue-600" /> : null}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
