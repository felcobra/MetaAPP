import type { ProfileDetail } from "@/mocks/profile";
import { Card, CardEyebrow } from "@/components/ui/Card";

export function ProfileDetailsCard({ details }: { details: ProfileDetail[] }) {
  return (
    <Card>
      <CardEyebrow>DADOS CADASTRAIS</CardEyebrow>
      <h3 className="mt-1 text-xl font-bold text-slate-900">Informações da conta</h3>

      <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {details.map((detail) => (
          <div key={detail.label}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {detail.label}
            </dt>
            <dd className="mt-1 text-sm font-medium text-slate-800">{detail.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
