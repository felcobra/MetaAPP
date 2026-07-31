import type { SecurityItem } from "@/mocks/profile";
import { Card } from "@/components/ui/Card";

export function SecurityCard({ items }: { items: SecurityItem[] }) {
  return (
    <Card>
      <h3 className="text-base font-bold text-slate-900">Segurança</h3>

      <div className="mt-4 flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-slate-800">{item.label}</p>
              <p className="mt-0.5 text-xs text-slate-400">{item.description}</p>
            </div>
            <button
              type="button"
              className="shrink-0 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700"
            >
              {item.actionLabel}
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
