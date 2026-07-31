import Link from "next/link";
import { ChevronRight, Network } from "lucide-react";
import { connectedSystemSteps } from "@/mocks/home";
import { Card, CardEyebrow } from "@/components/ui/Card";

export function ConnectedSystemFlow() {
  return (
    <div className="mb-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-950 text-white">
          <Network className="h-4 w-4 text-cyan-400" />
        </div>
        <h2 className="text-base font-bold text-slate-900">A Meta como sistema conectado</h2>
      </div>

      <Card>
        <CardEyebrow>FATURAMENTO</CardEyebrow>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Cada bloco é uma porta de entrada. O fluxo lê-se da esquerda para a direita:{" "}
          <span className="font-semibold text-slate-800">
            quem somos → o que oferecemos → o que entregamos → para quem → sob qual contrato →
            com qual impacto financeiro
          </span>
          . Clique para navegar.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-5">
          {connectedSystemSteps.map((step, index) => (
            <Link
              key={step.label}
              href={step.href}
              className="relative flex flex-col gap-3 rounded-2xl border border-slate-200 p-3 transition-colors hover:border-blue-300 hover:bg-blue-50/40"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${step.iconClassName}`}>
                <step.icon className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{step.value}</p>
                <p className="text-sm font-semibold leading-snug text-slate-700">{step.label}</p>
                <p className="text-xs leading-snug text-slate-400">{step.helper}</p>
              </div>
              {index < connectedSystemSteps.length - 1 ? (
                <ChevronRight className="absolute top-1/2 -right-4 hidden h-4 w-4 -translate-y-1/2 text-slate-300 lg:block" />
              ) : null}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
