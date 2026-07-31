import type { ReactNode } from "react";
import { X } from "lucide-react";
import type { OrgNode as OrgNodeData } from "@/types/orgchart";
import { Avatar } from "@/components/ui/Avatar";
import { CardEyebrow } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { OrgMemberCard } from "./OrgMemberCard";

interface OrgMembersPanelProps {
  node: OrgNodeData;
  onClose: () => void;
}

/**
 * Floats centred over the chart without touching page flow. The backdrop is
 * click-through, so pressing outside reaches the canvas, which clears the
 * selection and closes the panel.
 */
function PanelShell({
  children,
  onClose,
  className,
}: {
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-4">
      <div
        className={cn(
          "pointer-events-auto relative max-h-full overflow-y-auto rounded-2xl border-2 border-blue-400 bg-white shadow-2xl",
          className,
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1 text-slate-300 transition-colors hover:bg-slate-50 hover:text-slate-500"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

function ContactRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm text-slate-600">{value ?? "—"}</p>
    </div>
  );
}

export function OrgMembersPanel({ node, onClose }: OrgMembersPanelProps) {
  const { person, team } = node;

  if (person) {
    return (
      <PanelShell onClose={onClose} className="w-[340px] max-w-full p-7 text-center">
        <Avatar
          initials={person.name.slice(0, 2).toUpperCase()}
          photoUrl={person.photoUrl}
          size="lg"
          className="mx-auto h-28 w-28"
        />
        <p className="mt-5 break-words text-2xl font-bold text-slate-900">{person.name}</p>
        <p className="mt-1 break-words text-base text-slate-500">{person.role}</p>

        <div className="mt-6 space-y-4 border-t border-slate-100 pt-5 text-left">
          <ContactRow label="E-mail" value={person.email} />
          <ContactRow label="Telefone" value={person.phone} />
        </div>
      </PanelShell>
    );
  }

  if (!team) return null;

  return (
    <PanelShell onClose={onClose} className="@container w-[620px] max-w-full p-6">
      <CardEyebrow>{team.areaLabel}</CardEyebrow>
      <h3 className="mt-1.5 pr-8 break-words text-xl font-bold text-slate-900">{team.title}</h3>
      <p className="mt-1 text-sm text-slate-500">{team.members.length} pessoas nesta área</p>

      <div className="mt-5 grid grid-cols-2 gap-3 @[420px]:grid-cols-3 @[560px]:grid-cols-4">
        {team.members.map((member) => (
          <OrgMemberCard key={member.id} member={member} />
        ))}
      </div>
    </PanelShell>
  );
}
