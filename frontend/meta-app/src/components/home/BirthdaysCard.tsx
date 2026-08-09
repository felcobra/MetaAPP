import { Card, CardEyebrow } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { VazioCard } from "@/components/ui/AsyncState";
import type { Birthday } from "@/types/home";

export function BirthdaysCard({ pessoas }: { pessoas: Birthday[] }) {
  return (
    <Card>
      <CardEyebrow>PESSOAS</CardEyebrow>
      <h3 className="mt-1 text-xl font-bold text-slate-900">Aniversariantes do mês</h3>

      {pessoas.length === 0 ? (
        // Enquanto ninguém preencher a data de nascimento no perfil, esta
        // lista fica vazia — o banco da empresa não guarda esse dado.
        <VazioCard mensagem="Ninguém preencheu a data de nascimento ainda." />
      ) : (
        <ul className="mt-4 space-y-4">
          {pessoas.map((person) => (
            <li key={person.name} className="flex items-center gap-3">
              <Avatar initials={person.initials} size="sm" />
              <div>
                <p className="text-sm font-semibold text-slate-800">{person.name}</p>
                <p className="text-xs text-slate-400">{person.department}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
