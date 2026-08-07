import { Card } from "@/components/ui/Card";

interface SecurityItem {
  label: string;
  description: string;
  actionLabel: string;
  /** Sem endpoint no backend ainda — o botão fica visível mas inerte. */
  indisponivel?: boolean;
}

/**
 * Texto de interface, não dado: nada aqui vem do banco.
 *
 * A versão em mocks exibia "Alterada há 2 meses" e "3 dispositivos", números
 * inventados. O backend não registra data de troca de senha, não implementa
 * 2FA e não lista sessões — revoked_tokens só guarda o JTI de tokens
 * deslogados. Enquanto isso não existir, é melhor a tela admitir a lacuna do
 * que exibir um número que ninguém pode conferir.
 */
const ITENS: SecurityItem[] = [
  {
    label: "Senha",
    description: "Defina uma nova senha de acesso",
    actionLabel: "Alterar",
    indisponivel: true,
  },
  {
    label: "Autenticação em 2 fatores",
    description: "Ainda não disponível",
    actionLabel: "Ativar",
    indisponivel: true,
  },
  {
    label: "Sessões ativas",
    description: "Ainda não disponível",
    actionLabel: "Ver",
    indisponivel: true,
  },
];

export function SecurityCard() {
  return (
    <Card>
      <h3 className="text-base font-bold text-slate-900">Segurança</h3>

      <div className="mt-4 flex flex-col gap-3">
        {ITENS.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-slate-800">{item.label}</p>
              <p className="mt-0.5 text-xs text-slate-400">{item.description}</p>
            </div>
            <button
              type="button"
              disabled={item.indisponivel}
              className="shrink-0 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:text-slate-300"
            >
              {item.actionLabel}
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
