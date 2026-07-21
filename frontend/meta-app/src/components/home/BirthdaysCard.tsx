import { birthdays } from "@/mocks/home";
import { Card, CardEyebrow } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";

export function BirthdaysCard() {
  return (
    <Card>
      <CardEyebrow>PESSOAS</CardEyebrow>
      <h3 className="mt-1 text-xl font-bold text-slate-900">Aniversariantes do mês</h3>

      <ul className="mt-4 space-y-4">
        {birthdays.map((person) => (
          <li key={person.name} className="flex items-center gap-3">
            <Avatar initials={person.initials} size="sm" />
            <div>
              <p className="text-sm font-semibold text-slate-800">{person.name}</p>
              <p className="text-xs text-slate-400">{person.department}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
