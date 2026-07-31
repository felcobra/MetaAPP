export interface ProfileStat {
  label: string;
  value: string;
}

export interface ProfileFields {
  fullName: string;
  corporateEmail: string;
  phone: string;
  location: string;
  role: string;
  about: string;
}

export interface SecurityItem {
  label: string;
  description: string;
  actionLabel: string;
}

export const profileUser = {
  name: "João Miller",
  role: "Gerente de Projetos",
  initials: "JM",
  email: "joao.miller@metaconsultoria.com",
  location: "São Paulo, SP",
};

export const profileStats: ProfileStat[] = [
  { label: "PAPEs respondidos", value: "14" },
  { label: "Projetos ativos", value: "8" },
  { label: "Entregas no prazo", value: "96%" },
];

export const profileFields: ProfileFields = {
  fullName: "João Miller",
  corporateEmail: "joao.miller@metaconsultoria.com",
  phone: "+55 11 98000-2233",
  location: "São Paulo, SP",
  role: "Gerente de Projetos.",
  about:
    "Gerente de projetos com 8 anos de experiência em consultoria estratégica. Apaixonado por transformar processos em resultados.",
};

export const securityItems: SecurityItem[] = [
  { label: "Senha", description: "Alterada há 2 meses", actionLabel: "Alterar" },
  {
    label: "Autenticação em 2 fatores",
    description: "Proteja sua conta com um segundo fator",
    actionLabel: "Ativar",
  },
  { label: "Sessões ativas", description: "3 dispositivos · revisar acessos", actionLabel: "Ver" },
];
