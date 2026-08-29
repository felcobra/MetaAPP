import { apiFetch } from "@/lib/api";

export interface Member {
  id: number;
  nome: string;
  email: string;
  ativo: boolean;
  status_vinculo: "ativo" | "vinculado" | "desligado";
}

export async function fetchMembers(apenasAtivos: boolean = false): Promise<Member[]> {
  return apiFetch<Member[]>(`/membros?apenas_ativos=${apenasAtivos}`);
}

export async function updateMemberStatus(id: number, ativo: boolean, status_vinculo: string): Promise<Member> {
  return apiFetch<Member>(`/membros/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ ativo, status_vinculo }),
  });
}

export async function createMember(nome: string, email: string): Promise<Member> {
  return apiFetch<Member>(`/membros`, {
    method: "POST",
    body: JSON.stringify({ nome, email }),
  });
}
