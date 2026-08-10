import type { OrgPerson } from "@/types/orgchart";
import { Avatar } from "@/components/ui/Avatar";

/** Mirrors the person panel's language: circular photo, name, role, centred.
 * Clickable — abre o perfil individual dessa pessoa dentro do mesmo painel. */
export function OrgMemberCard({ member, onSelect }: { member: OrgPerson; onSelect?: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex min-w-0 flex-col items-center gap-2 rounded-xl bg-slate-50 p-3 text-center transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
    >
      <Avatar
        initials={member.name.slice(0, 2).toUpperCase()}
        photoUrl={member.photoUrl}
        size="md"
        className="h-12 w-12"
      />
      <div className="min-w-0 w-full">
        <p className="truncate text-sm font-semibold text-slate-700">{member.name}</p>
        <p className="truncate text-xs text-slate-500">{member.role}</p>
      </div>
    </button>
  );
}
