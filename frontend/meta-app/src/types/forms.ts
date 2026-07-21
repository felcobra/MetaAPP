export type FormFrequency = "QUINZENAL" | "MENSAL" | "SEMANAL";

export type FormStatus = "pendente" | "em-andamento" | "concluido";

export interface FormTask {
  id: string;
  frequency: FormFrequency;
  dueLabel: string;
  title: string;
  subtitle: string;
  description: string;
  steps: number;
  duration: string;
  audience: string;
  progress: number;
  status: FormStatus;
  ctaLabel: string;
}

export interface FormHistoryItem {
  id: string;
  title: string;
  client: string;
  date: string;
}

export type PapeFieldType = "date" | "text" | "textarea" | "radio";

export interface PapeField {
  id: number;
  type: PapeFieldType;
  label: string;
  required?: boolean;
  helper?: string;
  placeholder?: string;
  maxLength?: number;
  options?: string[];
}

export interface PapeStep {
  index: number;
  total: number;
  sectionLabel: string;
  title: string;
  description: string;
  fields: PapeField[];
}
