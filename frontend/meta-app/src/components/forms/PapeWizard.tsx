"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PapeStep } from "@/types/forms";
import { LogoMark } from "@/components/layout/Logo";
import { Card } from "@/components/ui/Card";
import { PapeFieldRenderer } from "./PapeFieldRenderer";

export function PapeWizard({ steps }: { steps: PapeStep[] }) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<Record<number, string>>({});

  const step = steps[stepIndex];
  const percentage = Math.round(((stepIndex + 1) / steps.length) * 100);
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;

  function updateField(fieldId: number, value: string) {
    setValues((current) => ({ ...current, [fieldId]: value }));
  }

  function goBack() {
    if (isFirstStep) {
      router.push("/forms");
      return;
    }
    setStepIndex((current) => current - 1);
  }

  function goNext() {
    if (isLastStep) {
      router.push("/forms");
      return;
    }
    setStepIndex((current) => current + 1);
  }

  return (
    <div>
      <div className="brand-gradient-diagonal px-6 py-10 text-white sm:px-10 sm:py-14">
        <div className="mx-auto flex max-w-3xl items-center gap-2 text-sm font-semibold tracking-wide">
          <LogoMark className="h-5 w-5" />
          META CONSULTORIA
        </div>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold sm:text-5xl">PAPE</h1>
        <p className="mx-auto mt-2 max-w-3xl text-base text-white/90">
          Plano de Acompanhamento de Projetos Externos
        </p>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-0">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-blue-600">
          <span>
            ETAPA {step.index} DE {step.total}
          </span>
          <span>{percentage}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full brand-gradient transition-[width] duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <Card className="mt-6">
          <div className="mb-6 h-1 w-full rounded-full brand-gradient" />
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            {step.sectionLabel}
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">{step.title}</h2>
          <p className="mt-1 text-sm text-slate-500">{step.description}</p>

          <div className="mt-8 space-y-8">
            {step.fields.map((field, index) => (
              <PapeFieldRenderer
                key={field.id}
                field={field}
                order={index + 3}
                value={values[field.id] ?? ""}
                onChange={(value) => updateField(field.id, value)}
              />
            ))}
          </div>
        </Card>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            className="flex h-11 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            ← Voltar
          </button>
          <button
            type="button"
            onClick={() => router.push("/forms")}
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Salvar e sair
          </button>
          <button
            type="button"
            onClick={goNext}
            className="brand-gradient flex h-11 items-center gap-1.5 rounded-xl px-5 text-sm font-semibold text-white hover:brightness-105"
          >
            {isLastStep ? "Enviar" : "Avançar"} →
          </button>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs text-slate-400 sm:flex-row">
          <span>💾 Salvamento automático ativo · alterações salvas há instantes</span>
          <span>
            Dúvidas? Fale com{" "}
            <a href="mailto:pape@metaconsultoria.com" className="font-medium text-blue-600">
              pape@metaconsultoria.com
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
