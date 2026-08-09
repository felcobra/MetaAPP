import Image from "next/image";
import { cn } from "@/lib/cn";
import type { AgendaPerson } from "@/types/agenda";

interface PersonAvatarProps {
  person: AgendaPerson;
  /** tamanho e tipografia, ex.: "h-14 w-14 text-base" */
  className?: string;
}

export function PersonAvatar({ person, className }: PersonAvatarProps) {
  return (
    <span
      className={cn(
        "relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br text-sm font-bold text-white",
        person.toneClass,
        className,
      )}
      title={person.name}
    >
      {person.photoUrl ? (
        <Image src={person.photoUrl} alt={person.name} fill className="object-cover" sizes="112px" />
      ) : (
        person.initials
      )}
    </span>
  );
}
