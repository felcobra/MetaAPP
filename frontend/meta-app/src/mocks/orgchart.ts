import type { OrgDivision } from "@/types/orgchart";

const consultoresTD = [
  { id: "anna-pimentel", name: "Anna Pimentel", role: "Consultora" },
  { id: "aloysio-saad", name: "Aloysio Saad", role: "Consultor" },
  { id: "camille-sa", name: "Camille Sá", role: "Consultora" },
  { id: "davi-moreno", name: "Davi Moreno", role: "Consultor" },
  { id: "felipe-cabral", name: "Felipe Cabral", role: "Consultor" },
  { id: "filipe-moreira", name: "Filipe Moreira", role: "Consultor" },
  { id: "filipe-pinto", name: "Filipe Pinto", role: "Consultor" },
  { id: "joao-pedro-costa", name: "João Pedro Costa", role: "Consultor" },
  { id: "nicholas-coutinho", name: "Nicholas Coutinho", role: "Consultor" },
  { id: "samuel-rangel", name: "Samuel Rangel", role: "Consultor" },
];

export const orgDivisions: OrgDivision[] = [
  {
    id: "presidencia",
    label: "Presidência",
    root: {
      id: "diretor-presidente",
      title: "Diretor(a) Presidente",
      person: {
        id: "marina-castro",
        name: "Marina Castro",
        role: "Diretora Presidente",
        email: "marina.castro@metaconsultoria.com",
        phone: "(11) 98888-1234",
      },
      children: [
        { id: "head-parcerias", title: "Head de Parcerias" },
        { id: "head-conteudo", title: "Head de Conteúdo" },
        { id: "head-logistica", title: "Head de Logística" },
        {
          id: "gerente-relacionamentos",
          title: "Gerente de Relacionamentos",
          children: [
            { id: "articulador-engajamento", title: "Articulador(a) de Engajamento" },
            { id: "articulador-posicionamento", title: "Articulador(a) de Posicionamento" },
          ],
        },
      ],
    },
  },
  {
    id: "diretoria-projetos",
    label: "Diretoria de Projetos",
    root: {
      id: "diretor-projetos",
      title: "Diretor(a) de Projetos",
      children: [
        { id: "pmo", title: "PMO", children: [{ id: "gerentes", title: "Gerentes" }] },
        {
          id: "coord-ce",
          title: "Coordenador(a) de CE",
          children: [{ id: "consultores-ce", title: "Consultores" }],
        },
        {
          id: "coord-td",
          title: "Coordenador(a) de TD",
          children: [
            {
              id: "consultores-td",
              title: "Consultores",
              team: {
                areaLabel: "TECNOLOGIA E DESENVOLVIMENTO",
                title: "Consultores",
                members: consultoresTD,
              },
            },
          ],
        },
        {
          id: "coord-op",
          title: "Coordenador(a) de OP",
          children: [{ id: "consultores-op", title: "Consultores" }],
        },
        {
          id: "coord-gn",
          title: "Coordenador(a) de GN",
          children: [{ id: "consultores-gn", title: "Consultores" }],
        },
        {
          id: "coord-dm",
          title: "Coordenador(a) de DM",
          children: [{ id: "consultores-dm", title: "Consultores" }],
        },
        {
          id: "gerente-inovacao",
          title: "Gerente de Inovação",
          children: [{ id: "analistas", title: "Analistas" }],
        },
      ],
    },
  },
];
