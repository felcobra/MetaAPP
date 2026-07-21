import { Play } from "lucide-react";

export function TvMetaBanner() {
  return (
    <div className="flex h-full min-h-[280px] flex-col justify-between rounded-2xl bg-navy-950 p-8 text-white">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">JULHO</p>
        <h3 className="mt-2 text-3xl font-bold">TV Meta</h3>
        <p className="mt-2 max-w-md text-sm text-slate-400">
          Acompanhe o top of membro, os destaques e saiba quem está por trás dos principais
          projetos da empresa.
        </p>
      </div>
      <button
        type="button"
        aria-label="Assistir TV Meta"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-navy-950 transition-transform hover:scale-105"
      >
        <Play className="ml-0.5 h-5 w-5 fill-current" />
      </button>
    </div>
  );
}
