"use client";

import Link from "next/link";
import { Bell, Menu, Search } from "lucide-react";
import { currentUser } from "@/mocks/session";
import { Avatar } from "@/components/ui/Avatar";
import { LogoMark } from "./Logo";

interface TopBarProps {
  pageTitle: string;
  onMenuClick: () => void;
}

export function TopBar({ pageTitle, onMenuClick }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          aria-label="Abrir menu"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>
        <Link
          href="/home"
          className="hidden items-center gap-2 whitespace-nowrap text-base font-bold text-slate-900 sm:flex"
        >
          <LogoMark />
          Meta Consultoria
        </Link>
        <span className="hidden text-slate-300 sm:inline">/</span>
        <span className="truncate text-sm font-medium text-slate-500 sm:text-base">
          {pageTitle}
        </span>
      </div>

      <div className="hidden flex-1 max-w-sm md:flex">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Buscar pessoas..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-colors focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
          aria-label="Notificações"
        >
          <Bell className="h-4 w-4" />
        </button>
        <Link
          href="/profile"
          className="hidden items-center gap-2.5 rounded-xl px-2 py-1 sm:flex hover:bg-slate-50"
        >
          <Avatar initials={currentUser.initials} size="sm" />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">{currentUser.name}</p>
            <p className="text-xs text-slate-400">{currentUser.role}</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
