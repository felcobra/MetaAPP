import { Card } from "@/components/ui/Card";

/** Placeholder de carregamento com a altura aproximada do card final. */
export function Skeleton({ className = "h-40" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-100 ${className}`} />;
}

/**
 * Erro de carregamento. Mostra a mensagem vinda da API em vez de um texto
 * genérico — "Sessão expirada" e "banco indisponível" pedem reações diferentes
 * de quem está olhando.
 */
export function ErroCard({ erro, titulo = "Não foi possível carregar" }: { erro: string; titulo?: string }) {
  return (
    <Card>
      <h3 className="text-base font-bold text-slate-900">{titulo}</h3>
      <p className="mt-1.5 text-sm text-slate-500">{erro}</p>
    </Card>
  );
}

/** Lista vazia — estado normal num banco recém-migrado, não um defeito. */
export function VazioCard({ mensagem }: { mensagem: string }) {
  return <p className="py-6 text-center text-sm text-slate-400">{mensagem}</p>;
}
