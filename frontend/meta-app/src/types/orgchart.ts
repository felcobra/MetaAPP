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
  label: string;
  root: OrgNode;
}

// ── Resposta crua de GET /hr/orgchart ────────────────────────────────────────

export interface OrgNoApi {
  id: number;
  titulo: string;
  membro: {
    id: number;
    nome: string;
    email: string;
    telefone: string | null;
    foto_url: string | null;
  } | null;
  filhos: OrgNoApi[];
}

export interface OrgDivisaoApi {
  id: string;
  label: string;
  /** null quando a divisão foi criada mas ainda não tem nó raiz. */
  root: OrgNoApi | null;
}

function normalizarNo(no: OrgNoApi): OrgNode {
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
    children: no.filhos.length ? no.filhos.map(normalizarNo) : undefined,
  };
}

/** Divisões sem nó raiz são descartadas: o explorador exige uma raiz para
 * desenhar a árvore, e uma divisão vazia viraria uma aba em branco. */
export function normalizarDivisoes(divisoes: OrgDivisaoApi[]): OrgDivision[] {
  return divisoes
    .filter((d): d is OrgDivisaoApi & { root: OrgNoApi } => d.root !== null)
    .map((d) => ({
      id: d.id,
      label: d.label,
      root: normalizarNo(d.root),
    }));
}
