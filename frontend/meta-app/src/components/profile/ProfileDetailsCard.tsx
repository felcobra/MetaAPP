import type { ProfileFields } from "@/mocks/profile";
import { Card } from "@/components/ui/Card";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

export function ProfileDetailsCard({ fields }: { fields: ProfileFields }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-slate-900">Dados pessoais</h3>
        <button
          type="button"
          className="shrink-0 text-xs font-medium text-slate-400 transition-colors hover:text-blue-600"
        >
          Editar todos os campos
        </button>
      </div>

      <div className="mt-4 divide-y divide-slate-100">
        <div className="grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2">
          <Field label="NOME COMPLETO" value={fields.fullName} />
          <Field label="E-MAIL CORPORATIVO" value={fields.corporateEmail} />
        </div>
        <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
          <Field label="TELEFONE" value={fields.phone} />
          <Field label="LOCALIZAÇÃO" value={fields.location} />
        </div>
        <div className="py-4">
          <Field label="CARGO" value={fields.role} />
        </div>
        <div className="pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            SOBRE VOCÊ
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-700 pb-16">{fields.about}</p>
        </div>
      </div>
    </Card>
  );
}
