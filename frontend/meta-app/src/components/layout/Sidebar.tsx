"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { primaryNav } from "@/mocks/nav";
import { cn } from "@/lib/cn";
import LogoMark from "../../../public/logo.png";

interface SidebarProps {
  open: boolean;
  desktopOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ open, desktopOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/40 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 -translate-x-full flex-col border-r border-slate-200 bg-white shadow-xl transition-all duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none",
          open && "translate-x-0",
          desktopOpen ? "lg:w-72" : "lg:w-20",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
          <Link
            href="/home"
            onClick={onClose}
            className={cn(
              "flex min-w-0 items-center gap-2 text-lg font-bold text-slate-900",
              !desktopOpen && "lg:justify-center",
            )}
          >
            <Image
              src={LogoMark}
              alt="Meta logo"
              className="h-7 w-7 shrink-0"
              width={28}
              height={28}
            />
            <span className={cn("truncate", !desktopOpen && "lg:hidden")}>Meta Consultoria</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {primaryNav.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={!desktopOpen ? item.label : undefined}
                onClick={onClose}
                className={cn(
                  "flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  !desktopOpen && "lg:justify-center lg:px-2",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span className={cn("truncate", !desktopOpen && "lg:hidden")}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div
          className={cn(
            "border-t border-slate-100 p-4 text-xs text-slate-400",
            !desktopOpen && "lg:px-2 lg:text-center",
          )}
        >
          <span className={cn(!desktopOpen && "lg:hidden")}>(c) 2026 Meta Consultoria</span>
          <span className={cn("hidden", !desktopOpen && "lg:inline")}>(c)</span>
        </div>
      </aside>
    </>
  );
}
