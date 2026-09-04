/**
 * Cliente HTTP centralizado — MetaAPP Frontend
 *
 * Funcionalidades:
 * - Injeta automaticamente Authorization: Bearer <token> em todas as requisições
 * - Auto-refresh silencioso quando o access token expira (401 → usa refresh → retry)
 * - Logout automático e redirect para "/" se o refresh também falhar
 * - Gerenciamento de tokens em localStorage + cookie de sessão para o middleware
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ── Chaves de storage ─────────────────────────────────────────────────────────
const ACCESS_TOKEN_KEY = "meta_access_token";
const REFRESH_TOKEN_KEY = "meta_refresh_token";
const SESSION_COOKIE = "meta_session";

// ── Helpers de token ──────────────────────────────────────────────────────────
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  // Cookie não-HttpOnly usado pelo middleware do Next.js para proteção de rotas.
  // Não armazena dados sensíveis — apenas sinaliza que a sessão existe.
  const maxAge = 7 * 24 * 60 * 60; // 7 dias (igual ao refresh token)
  // Flag Secure adicionada automaticamente em produção (HTTPS).
  // Em desenvolvimento local (HTTP), a flag Secure impediria o browser de
  // enviar o cookie e quebraria o login.
  const isSecure =
    typeof window !== "undefined" && window.location.protocol === "https:";
  const secureFlag = isSecure ? "; Secure" : "";
  document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${maxAge}; SameSite=Strict${secureFlag}`;
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Strict`;
}

// ── Controle de refresh concorrente ──────────────────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

async function runRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    return null;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
    };
    setTokens(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    clearTokens();
    return null;
  }
}

// Endpoints de autenticação: um 401 aqui é resposta de negócio (credencial
// errada, token de refresh inválido), não uma sessão que expirou no meio de
// uso. Não deve disparar o fluxo de auto-refresh + redirect — isso mascarava
// "Email ou senha incorretos" com um falso "Sessão expirada".
const AUTH_ENDPOINTS = new Set(["/auth/login", "/auth/register", "/auth/refresh"]);

// ── Cliente principal ─────────────────────────────────────────────────────────
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const accessToken = getAccessToken();

  const callerHeaders = (options.headers ?? {}) as Record<string, string>;
  const headers: Record<string, string> = { ...callerHeaders };

  // Define Content-Type padrão como JSON se não sobrescrito pelo caller
  if (!headers["Content-Type"] && !headers["content-type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  let response = await fetch(url, { ...options, headers });

  // ── Auto-refresh em 401 ───────────────────────────────────────────────────
  if (response.status === 401 && !AUTH_ENDPOINTS.has(path)) {
    let newToken: string | null;

    if (!isRefreshing) {
      isRefreshing = true;
      newToken = await runRefresh().finally(() => {
        isRefreshing = false;
        // Notifica todos os requests que estavam aguardando
        refreshQueue.forEach((cb) => cb(newToken));
        refreshQueue = [];
      });
    } else {
      // Aguarda o refresh que já está em andamento
      newToken = await new Promise<string | null>((resolve) => {
        refreshQueue.push(resolve);
      });
    }

    if (newToken) {
      // Retry com o novo token
      const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
      response = await fetch(url, { ...options, headers: retryHeaders });
    } else {
      // Refresh falhou — redireciona para login
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
      throw new Error("Sessão expirada. Faça login novamente.");
    }
  }

  // ── Tratamento de erro ────────────────────────────────────────────────────
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    const detail = (error as any)?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ")
          : detail
            ? JSON.stringify(detail)
            : `Erro ${response.status}`;
    throw new Error(message);
  }

  // 204 No Content
  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}
