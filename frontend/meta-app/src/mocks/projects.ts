import type { ExternalProject } from "@/types/projects";

export const externalProjects: ExternalProject[] = [
  {
    id: "sicredi",
    code: "SI",
    client: "Sicredi",
    area: "Operações",
    manager: "Carla D.",
    status: "no-prazo",
    progress: 78,
  },
  {
    id: "vivo",
    code: "VI",
    client: "Vivo",
    area: "Atendimento",
    manager: "João M.",
    status: "no-prazo",
    progress: 64,
  },
  {
    id: "itau",
    code: "IT",
    client: "Itaú",
    area: "Eficiência",
    manager: "Pedro H.",
    status: "atencao",
    progress: 42,
  },
  {
    id: "magalu",
    code: "MA",
    client: "Magalu",
    area: "Logística",
    manager: "Felipe T.",
    status: "atrasado",
    progress: 28,
  },
];
