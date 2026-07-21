import { X } from "lucide-react";
import type { OrgTeamGroup } from "@/types/orgchart";
import { Avatar } from "@/components/ui/Avatar";
import { CardEyebrow } from "@/components/ui/Card";

interface OrgTeamOverlayProps {
  team: OrgTeamGroup;
  x: number;
  y: number;
  onClose: () => void;
}

export function OrgTeamOverlay({ team, x, y, onClose }: OrgTeamOverlayProps) {
  return (
    <div
      style={{ left: x, top: y + 96, width: 560 }}
      className="pointer-events-auto absolute z-20 -translate-x-1/2 rounded-2xl border border-blue-200 bg-white p-6 shadow-lg"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 text-slate-300 hover:text-slate-500"
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </button>
      <CardEyebrow>{team.areaLabel}</CardEyebrow>
      <h3 className="mt-1 text-2xl font-bold text-slate-900">{team.title}</h3>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {team.members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-3"
          >
            <Avatar initials={member.name.slice(0, 2).toUpperCase()} photoUrl={member.photoUrl} size="sm" />
            <span className="text-sm font-medium text-slate-700">{member.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
