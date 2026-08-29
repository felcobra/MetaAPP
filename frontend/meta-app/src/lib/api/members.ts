const API_URL = "http://localhost:8000/api/v1"; // Substituir pela env correcta no futuro

export interface Member {
  id: number;
  nome: string;
  email: string;
  ativo: boolean;
  status_vinculo: "ativo" | "vinculado" | "desligado";
}

export async function fetchMembers(apenasAtivos: boolean = false): Promise<Member[]> {
  const response = await fetch(`${API_URL}/membros?apenas_ativos=${apenasAtivos}`, {
    headers: {
      "Content-Type": "application/json",
      // Adicionar Authorization header de acordo com auth logic da aplicação
    },
    // cache: "no-store", se precisar forçar bypass do cache NextJS
  });
  if (!response.ok) {
    throw new Error("Erro ao buscar membros");
  }
  return response.json();
}

export async function updateMemberStatus(id: number, ativo: boolean, status_vinculo: string): Promise<Member> {
  const response = await fetch(`${API_URL}/membros/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      // Adicionar Authorization
    },
    body: JSON.stringify({ ativo, status_vinculo }),
  });
  if (!response.ok) {
    throw new Error("Erro ao atualizar status");
  }
  return response.json();
}

export async function createMember(nome: string, email: string): Promise<Member> {
  const response = await fetch(`${API_URL}/membros`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Adicionar Authorization
    },
    body: JSON.stringify({ nome, email }),
  });
  if (!response.ok) {
    throw new Error("Erro ao cadastrar membro");
  }
  return response.json();
}
