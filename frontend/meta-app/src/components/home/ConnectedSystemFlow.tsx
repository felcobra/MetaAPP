import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { connectedSystemSteps } from "@/mocks/home";
import { Card, CardEyebrow } from "@/components/ui/Card";

export function ConnectedSystemFlow() {
  return (
    <Card className="mb-6">
      <div className="mb-5 flex h-8 w-8 items-center justify-center rounded-lg bg-navy-950 text-white">
        <span className="h-2.5 w-2.5 rounded-sm bg-white" />
      </div>
      <CardEyebrow>FATURAMENTO</CardEyebrow>
      <p className="mt-2 max-w-3xl text-sm text-slate-600">
        Cada bloco é uma porta de entrada. O fluxo lê-se da esquerda para a direita:{" "}
        <span className="font-semibold text-slate-800">
          quem somos → o que oferecemos → o que entregamos → para quem → sob qual contrato → com
          qual impacto financeiro
        </span>
        . Clique para navegar.
      </p>

      <div className="mt-5 flex flex-wrap items-stretch gap-3 lg:flex-nowrap">
        {connectedSystemSteps.map((step, index) => (
          <div key={step.label} className="flex flex-1 items-stretch gap-3">
            <Link
              href={step.href}
              className="flex min-w-[9.5rem] flex-1 flex-col gap-4 rounded-2xl border border-slate-200 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/40"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${step.iconClassName}`}>
                <step.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{step.value}</p>
                <p className="text-sm font-semibold text-slate-700">{step.label}</p>
                <p className="text-xs text-slate-400">{step.helper}</p>
              </div>
            </Link>
            {index < connectedSystemSteps.length - 1 ? (
              <div className="hidden items-center text-slate-300 lg:flex">
                <ChevronRight className="h-5 w-5" />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
