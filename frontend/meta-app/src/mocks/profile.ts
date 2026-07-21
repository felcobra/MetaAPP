export interface ProfileDetail {
  label: string;
  value: string;
}

export const profileDetails: ProfileDetail[] = [
  { label: "Cargo", value: "Gerente de Projetos" },
  { label: "Coordenação", value: "Tecnologia e Desenvolvimento (TD)" },
  { label: "E-mail corporativo", value: "joao.marques@metaconsultoria.com" },
  { label: "Telefone", value: "(11) 98765-4321" },
  { label: "Entrou na Meta em", value: "Março de 2023" },
  { label: "Projetos ativos", value: "4 projetos externos" },
];

export const profileStats = [
  { label: "Projetos ativos", value: "4" },
  { label: "Formulários em dia", value: "92%" },
  { label: "NPS médio dos clientes", value: "88" },
];
