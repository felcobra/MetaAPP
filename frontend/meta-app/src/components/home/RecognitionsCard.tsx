import { Card, CardEyebrow } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { VazioCard } from "@/components/ui/AsyncState";
import type { Recognition } from "@/types/home";

export function RecognitionsCard({ itens }: { itens: Recognition[] }) {
  return (
    <Card>
      <CardEyebrow>RECONHECIMENTOS</CardEyebrow>
      {/* O título era "Destaques de maio", fixo no código. Os destaques vêm de
          membro_perfil_metaapp.destaque_texto, que não é datado por mês. */}
      <h3 className="mt-1 text-xl font-bold text-slate-900">Destaques da equipe</h3>

      {itens.length === 0 ? (
        <VazioCard mensagem="Nenhum destaque registrado." />
      ) : (
        <ul className="mt-4 space-y-4">
          {itens.map((item) => (
            <li key={item.name} className="flex items-start gap-3">
              <Avatar initials={item.initials} size="sm" />
              <div>
                <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                <p className="text-xs text-slate-400">{item.achievement}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
