import { Award, Compass, GraduationCap, ShieldCheck, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface AuthFeature {
  icon: LucideIcon;
  title: string;
  prefix: string;
  highlight: string;
  suffix?: string;
}

export const authFeatures: AuthFeature[] = [
  {
    icon: ShieldCheck,
    title: "Identidade",
    prefix: "Somos 1 só, agimos em ",
    highlight: "conjunto",
  },
  {
    icon: TrendingUp,
    title: "Resultado",
    prefix: "Nos guiamos por ",
    highlight: "evidência",
  },
  {
    icon: GraduationCap,
    title: "Cadência",
    prefix: "Ninguém está pronto, todos estão em ",
    highlight: "formação",
  },
  {
    icon: Compass,
    title: "Propósito",
    prefix: "Temos um ",
    highlight: "objetivo",
    suffix: " e não o perdemos de vista.",
  },
  {
    icon: Award,
    title: "Forja",
    prefix: "Somos ",
    highlight: "forjados",
    suffix: " em desafios reais.",
  },
];
