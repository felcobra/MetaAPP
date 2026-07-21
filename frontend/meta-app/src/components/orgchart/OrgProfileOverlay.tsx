import { Mail, Phone, X } from "lucide-react";
import type { OrgPerson } from "@/types/orgchart";
import { Avatar } from "@/components/ui/Avatar";

interface OrgProfileOverlayProps {
  person: OrgPerson;
  x: number;
  y: number;
  onClose: () => void;
}

export function OrgProfileOverlay({ person, x, y, onClose }: OrgProfileOverlayProps) {
  return (
    <div
      style={{ left: x, top: y + 96, width: 260 }}
      className="pointer-events-auto absolute z-20 -translate-x-1/2 rounded-2xl border border-blue-200 bg-white p-6 text-center shadow-lg"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 text-slate-300 hover:text-slate-500"
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </button>
      <Avatar initials={person.name.slice(0, 2).toUpperCase()} photoUrl={person.photoUrl} size="lg" className="mx-auto" />
      <p className="mt-4 text-lg font-bold text-slate-900">{person.name}</p>
      <p className="text-sm text-slate-500">{person.role}</p>

      <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-left">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <Mail className="h-3.5 w-3.5" /> E-mail
        </p>
        <p className="text-sm text-slate-600">{person.email ?? "—"}</p>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <Phone className="h-3.5 w-3.5" /> Telefone
        </p>
        <p className="text-sm text-slate-600">{person.phone ?? "—"}</p>
      </div>
    </div>
  );
}
