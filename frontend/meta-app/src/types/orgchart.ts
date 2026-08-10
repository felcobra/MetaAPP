export interface OrgPerson {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
}

export interface OrgTeamGroup {
  areaLabel: string;
  title: string;
  members: OrgPerson[];
}

export interface OrgNode {
  id: string;
  title: string;
  person?: OrgPerson;
  children?: OrgNode[];
  team?: OrgTeamGroup;
}

export interface OrgDivision {
  id: string;
  /** ID numérico do banco — necessário para criar/remover nós via API. */
  divisaoNumId: number;
  label: string;
  root: OrgNode;
}

// ── Resposta crua de GET /hr/orgchart ────────────────────────────────────────

export interface MembroResumoApi {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  foto_url: string | null;
}

export interface OrgEquipeApi {
  cargo_id: number | null;
  cargo_nome: string | null;
  coordenacao_id: number | null;
  coordenacao_nome: string | null;
  membros: MembroResumoApi[];
  /** IDs adicionados à mão (não vêm do cargo) — usado para pré-marcar o
   * multi-select ao editar, sem misturar com quem já entra por cargo. */
  membro_ids_manual: number[];
}

export interface OrgNoApi {
  id: number;
  titulo: string;
  membro: MembroResumoApi | null;
  /** Nó de time (ex: "Consultores"): pessoas derivadas do cargo/coordenação no RH. */
  equipe: OrgEquipeApi | null;
  filhos: OrgNoApi[];
}

export interface OrgDivisaoApi {
  id: string;
  /** ID numérico (PK) da divisão — retornado pelo backend para uso no painel admin. */
  divisao_num_id: number;
  label: string;
  /** null quando a divisão foi criada mas ainda não tem nó raiz. */
  root: OrgNoApi | null;
}

function normalizarNo(no: OrgNoApi, divisaoLabel: string): OrgNode {
  return {
    id: String(no.id),
    title: no.titulo,
    person: no.membro
      ? {
          id: String(no.membro.id),
          name: no.membro.nome,
          // O cargo da pessoa não vem nesta árvore; o título do nó é o papel
          // que ela ocupa aqui, que é o que o organograma quer mostrar.
          role: no.titulo,
          email: no.membro.email,
          phone: no.membro.telefone ?? undefined,
          photoUrl: no.membro.foto_url ?? undefined,
        }
      : undefined,
    // Nó de time: várias pessoas com o mesmo cargo (e coordenação, se o nó
    // refina por ela) — a lista vem pronta do RH, sem cadastro manual aqui.
    team: no.equipe
      ? {
          areaLabel: no.equipe.coordenacao_nome ?? divisaoLabel,
          title: no.titulo,
          members: no.equipe.membros.map((m) => ({
            id: String(m.id),
            name: m.nome,
            role: no.equipe!.cargo_nome ?? no.titulo,
            email: m.email,
            phone: m.telefone ?? undefined,
            photoUrl: m.foto_url ?? undefined,
          })),
        }
      : undefined,
    children: no.filhos.length ? no.filhos.map((filho) => normalizarNo(filho, divisaoLabel)) : undefined,
  };
}

/** Divisões sem nó raiz são descartadas: o explorador exige uma raiz para
 * desenhar a árvore, e uma divisão vazia viraria uma aba em branco. */
export function normalizarDivisoes(divisoes: OrgDivisaoApi[]): OrgDivision[] {
  return divisoes
    .filter((d): d is OrgDivisaoApi & { root: OrgNoApi } => d.root !== null)
    .map((d) => ({
      id: d.id,
      divisaoNumId: d.divisao_num_id,
      label: d.label,
      root: normalizarNo(d.root, d.label),
    }));
}
