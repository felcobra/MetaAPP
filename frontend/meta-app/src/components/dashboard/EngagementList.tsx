import type { EngagementItem } from "@/types/dashboard";

export function EngagementList({ items }: { items: EngagementItem[] }) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.area} className="flex items-center gap-3">
          <span className="w-8 shrink-0 text-sm font-semibold text-slate-600">{item.area}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${item.score}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-sm font-semibold text-slate-800">
            {item.score}
          </span>
        </li>
      ))}
    </ul>
  );
}
