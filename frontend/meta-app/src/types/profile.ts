/** Resposta de GET /users/me/perfil. */
export interface MeuPerfil {
  /** null quando o login não está vinculado a um membro (ex: admin do seed). */
  membroId: number | null;
  nome: string;
  email: string;
  iniciais: string;
  cargo: string | null;
  celula: string | null;
  coordenacao: string | null;
  telefone: string | null;
  fotoUrl: string | null;
  dataEntrada: string | null;
  dataNascimento: string | null;
  sobre: string | null;
  stats: {
    papesRespondidos: number;
    projetosAtivos: number;
    membroDesde: number | null;
  };
}

/** Formato cru da API (snake_case). Convertido por `normalizarPerfil`. */
interface PerfilApi {
  membro_id: number | null;
  nome: string;
  email: string;
  iniciais: string;
  cargo: string | null;
  celula: string | null;
  coordenacao: string | null;
  telefone: string | null;
  foto_url: string | null;
  data_entrada: string | null;
  data_nascimento: string | null;
  sobre: string | null;
  stats: {
    papes_respondidos: number;
    projetos_ativos: number;
    membro_desde: number | null;
  };
}

export function normalizarPerfil(raw: PerfilApi): MeuPerfil {
  return {
    membroId: raw.membro_id,
    nome: raw.nome,
    email: raw.email,
    iniciais: raw.iniciais,
    cargo: raw.cargo,
    celula: raw.celula,
    coordenacao: raw.coordenacao,
    telefone: raw.telefone,
    fotoUrl: raw.foto_url,
    dataEntrada: raw.data_entrada,
    dataNascimento: raw.data_nascimento,
    sobre: raw.sobre,
    stats: {
      papesRespondidos: raw.stats.papes_respondidos,
      projetosAtivos: raw.stats.projetos_ativos,
      membroDesde: raw.stats.membro_desde,
    },
  };
}

export interface ProfileStat {
  label: string;
  value: string;
}

/**
 * Campos que o membro ainda não preencheu chegam null. Mostrar "—" deixa
 * explícito que está vazio, em vez de sumir com a linha e dar a impressão
 * de que o campo não existe.
 */
export const VAZIO = "—";

export function ou(valor: string | null | undefined): string {
  return valor?.trim() ? valor : VAZIO;
}

/**
 * Formata uma data ISO (AAAA-MM-DD) como dd/mm/aaaa.
 *
 * Feito na mão, sem passar por `new Date()`: uma string de data pura é lida
 * como meia-noite UTC, e no Brasil (UTC-3) o `toLocaleDateString` devolve o dia
 * anterior — um aniversário no dia 1º apareceria como dia 31 do mês passado.
 */
export function dataBR(iso: string | null | undefined): string {
  if (!iso) return VAZIO;

  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  if (!ano || !mes || !dia) return VAZIO;

  return `${dia}/${mes}/${ano}`;
}

export function statsDoPerfil(perfil: MeuPerfil): ProfileStat[] {
  return [
    { label: "PAPEs respondidos", value: String(perfil.stats.papesRespondidos) },
    { label: "Projetos ativos", value: String(perfil.stats.projetosAtivos) },
    {
      label: "Membro desde",
      value: perfil.stats.membroDesde ? String(perfil.stats.membroDesde) : VAZIO,
    },
  ];
}
