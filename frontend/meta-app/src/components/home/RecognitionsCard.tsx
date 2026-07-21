import { recognitions } from "@/mocks/home";
import { Card, CardEyebrow } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";

export function RecognitionsCard() {
  return (
    <Card>
      <CardEyebrow>RECONHECIMENTOS</CardEyebrow>
      <h3 className="mt-1 text-xl font-bold text-slate-900">Destaques de maio</h3>

      <ul className="mt-4 space-y-4">
        {recognitions.map((item) => (
          <li key={item.name} className="flex items-start gap-3">
            <Avatar initials={item.initials} size="sm" />
            <div>
              <p className="text-sm font-semibold text-slate-800">{item.name}</p>
              <p className="text-xs text-slate-400">{item.achievement}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
