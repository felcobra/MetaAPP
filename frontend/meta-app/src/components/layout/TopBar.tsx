"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, PanelLeftClose, Search, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import LogoMark from "../../../public/logo.png";
import { useAuth } from "@/lib/auth-context";

interface TopBarProps {
  pageTitle: string;
  sidebarExpanded: boolean;
  onMenuClick: () => void;
}

export function TopBar({ pageTitle, sidebarExpanded, onMenuClick }: TopBarProps) {
  const { user, logout } = useAuth();

  // Fallback enquanto o perfil carrega
  const displayName = user?.name ?? "…";
  const displayRole = user?.role ?? "";
  const displayInitials = user?.initials ?? "?";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition-colors hover:bg-slate-50"
          aria-label={sidebarExpanded ? "Fechar menu lateral" : "Abrir menu lateral"}
        >
          {sidebarExpanded ? <PanelLeftClose className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
        </button>
        <Link href="/home" className="hidden min-w-0 items-center gap-3 whitespace-nowrap text-base font-bold text-slate-900 sm:flex">
          <Image src={LogoMark} alt="Meta logo" className="h-8 w-8 shrink-0" width={32} height={32} />
          <span className="truncate">Meta Consultoria</span>
        </Link>
        <span className="hidden px-2 text-slate-400 sm:inline">/</span>
        <span className="min-w-0 truncate text-sm font-medium text-slate-500 sm:text-base">{pageTitle}</span>
      </div>

      <div className="hidden max-w-md flex-1 md:flex">
        <div className="relative w-full min-w-0">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Buscar pessoas..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button type="button" className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-blue-600 transition-colors hover:bg-slate-50" aria-label="Notificacoes">
          !
        </button>
        <Link href="/profile" className="hidden min-w-0 items-center gap-2.5 rounded-full border border-slate-200 px-3 py-2 transition-colors hover:bg-slate-50 sm:flex">
          <Avatar initials={displayInitials} size="sm" className="bg-gradient-to-r from-sky-400 to-blue-600 text-white" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
            <p className="truncate text-xs text-slate-400">{displayRole}</p>
          </div>
        </Link>

        {/* Botão de logout */}
        <button
          type="button"
          onClick={() => void logout()}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
          aria-label="Sair da conta"
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
