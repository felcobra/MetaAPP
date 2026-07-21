"use client";

import { ChevronDown } from "lucide-react";
import type { OrgDivision } from "@/types/orgchart";

interface OrgDivisionSelectProps {
  divisions: OrgDivision[];
  value: string;
  onChange: (id: string) => void;
}

export function OrgDivisionSelect({ divisions, value, onChange }: OrgDivisionSelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-medium text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:w-56"
      >
        {divisions.map((division) => (
          <option key={division.id} value={division.id}>
            {division.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}
