import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { dataBR, ou, VAZIO, type MeuPerfil } from "@/types/profile";
import { ProfileEditModal } from "./ProfileEditModal";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p
        className={
          value === VAZIO
            ? "mt-1 text-sm font-medium text-slate-300"
            : "mt-1 text-sm font-medium text-slate-800"
        }
      >
        {value}
      </p>
    </div>
  );
}

export function ProfileDetailsCard({
  perfil,
  onAtualizado,
}: {
  perfil: MeuPerfil;
  onAtualizado: () => void;
}) {
  const sobre = perfil.sobre?.trim();
  const [editando, setEditando] = useState(false);

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-slate-900">Dados pessoais</h3>
        {perfil.membroId && (
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="shrink-0 text-xs font-medium text-slate-400 transition-colors hover:text-blue-600"
          >
            Editar todos os campos
          </button>
        )}
      </div>

      <div className="mt-4 divide-y divide-slate-100">
        <div className="grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2">
          <Field label="NOME COMPLETO" value={perfil.nome} />
          <Field label="E-MAIL CORPORATIVO" value={perfil.email} />
        </div>
        <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
          <Field label="TELEFONE" value={ou(perfil.telefone)} />
          <Field label="DATA DE ANIVERSÁRIO" value={dataBR(perfil.dataNascimento)} />
        </div>
        <div className="pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            SOBRE VOCÊ
          </p>
          <p
            className={
              sobre
                ? "mt-1.5 pb-16 text-sm leading-relaxed text-slate-700"
                : "mt-1.5 pb-16 text-sm leading-relaxed text-slate-300"
            }
          >
            {sobre || "Você ainda não escreveu nada por aqui."}
          </p>
        </div>
      </div>

      {editando && (
        <ProfileEditModal
          perfil={perfil}
          onClose={() => setEditando(false)}
          onSaved={() => {
            setEditando(false);
            onAtualizado();
          }}
        />
      )}
    </Card>
  );
}
