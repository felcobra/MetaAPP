"use client";

/**
 * Contexto de Autenticação — MetaAPP Frontend
 *
 * Expõe: user, isAuthenticated, isLoading, login(), logout()
 * - Persiste tokens em localStorage via api.ts (setTokens / clearTokens)
 * - Ao inicializar, tenta restaurar sessão dos tokens existentes
 * - login() chama POST /auth/login (form-encoded, padrão OAuth2) e carrega perfil
 * - logout() chama POST /auth/logout (best-effort) e limpa estado local
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  apiFetch,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./api";

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface SessionUser {
  name: string;
  role: string;
  email: string;
  initials: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface AuthContextValue {
  user: SessionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Tenta restaurar sessão a partir de tokens existentes no localStorage
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    apiFetch<SessionUser>("/users/me/profile")
      .then((profile) => setUser(profile))
      .catch(() => {
        // Token inválido ou expirado e refresh falhou → limpa sessão
        clearTokens();
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // FastAPI OAuth2PasswordRequestForm espera application/x-www-form-urlencoded
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);

    const data = await apiFetch<TokenResponse>("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    setTokens(data.access_token, data.refresh_token);

    // Carrega o perfil do usuário logo após o login
    const profile = await apiFetch<SessionUser>("/users/me/profile");
    setUser(profile);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      // Best-effort: não lança erro se o servidor estiver indisponível
      await apiFetch("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      }).catch(() => {});
    }
    clearTokens();
    setUser(null);
    // Redireciona para o login
    window.location.href = "/";
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() deve ser usado dentro de <AuthProvider>.");
  }
  return ctx;
}
