"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import LogoMark from "../../../public/logo.png";

export type AgendaView = "preencher" | "painel";

interface AgendaHeaderProps {
  view: AgendaView;
  onChangeView: (view: AgendaView) => void;
}

export function AgendaHeader({ view, onChangeView }: AgendaHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1560px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/home" className="flex min-w-0 items-center gap-3">
          <Image src={LogoMark} alt="Meta Consultoria" width={36} height={36} className="h-9 w-9 shrink-0" />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-lg font-extrabold text-slate-950">Agenda TI</span>
            <span className="block truncate text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
              Meta Consultoria
            </span>
          </span>
        </Link>

        <nav className="flex shrink-0 items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => onChangeView("preencher")}
            className={cn(
              "rounded-full px-3 py-2 text-[15px] transition",
              view === "preencher"
                ? "font-bold text-slate-950"
                : "font-semibold text-slate-500 hover:text-slate-800",
            )}
          >
            Preencher
          </button>
          <button
            type="button"
            onClick={() => onChangeView("painel")}
            className={cn(
              "rounded-full bg-navy-900 px-6 py-2.5 text-[15px] font-bold text-white transition hover:bg-navy-800",
              view === "painel" && "ring-4 ring-navy-900/10",
            )}
          >
            Painel
          </button>
        </nav>
      </div>
    </header>
  );
}
