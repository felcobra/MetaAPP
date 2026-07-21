"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export interface TabOption {
  id: string;
  label: string;
}

interface TabsProps {
  options: TabOption[];
  defaultValue?: string;
  value?: string;
  onChange?: (id: string) => void;
  className?: string;
  size?: "sm" | "md";
}

export function Tabs({
  options,
  defaultValue,
  value,
  onChange,
  className,
  size = "md",
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? options[0]?.id,
  );
  const activeValue = value ?? internalValue;

  function handleSelect(id: string) {
    setInternalValue(id);
    onChange?.(id);
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-slate-100 p-1",
        className,
      )}
      role="tablist"
    >
      {options.map((option) => {
        const isActive = option.id === activeValue;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => handleSelect(option.id)}
            className={cn(
              "rounded-full font-medium transition-colors",
              size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
              isActive
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
