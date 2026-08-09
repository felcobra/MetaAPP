const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

/** Valor monetário sem centavos — os cards mostram ordem de grandeza. */
export function brl(valor: number | null | undefined): string {
  return BRL.format(valor ?? 0);
}

/** Percentual inteiro, protegido contra divisão por zero. */
export function pctDe(parte: number, total: number): number {
  if (!total) return 0;
  return Math.round((parte / total) * 100);
}
