import { Mail, Building2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { ou, type MeuPerfil, type ProfileStat } from "@/types/profile";

export function ProfileHeaderCard({
  perfil,
  stats,
}: {
  perfil: MeuPerfil;
  stats: ProfileStat[];
}) {
  // A célula/coordenação substitui a localização que a versão em mocks mostrava:
  // o banco não guarda cidade de ninguém, mas guarda a área.
  const area = perfil.coordenacao ?? perfil.celula;

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="h-20 bg-gradient-to-r from-sky-400 to-blue-600" />
      <div className="flex flex-col items-center px-6 pb-6 text-center">
        <Avatar
          initials={perfil.iniciais}
          size="lg"
          className="-mt-10 bg-gradient-to-r from-sky-400 to-blue-600 text-white ring-4 ring-white"
        />
        <h2 className="mt-3 text-lg font-bold text-slate-900">{perfil.nome}</h2>
        <p className="text-sm font-medium text-blue-600">{ou(perfil.cargo)}</p>

        <div className="mt-2 flex flex-col items-center gap-1 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            {perfil.email}
          </span>
          {area && (
            <span className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              {area}
            </span>
          )}
        </div>

        <div className="mt-5 grid w-full grid-cols-3 gap-2 border-t border-slate-100 pt-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-lg font-bold text-blue-600">{stat.value}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
