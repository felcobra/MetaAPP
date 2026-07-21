import type { LucideIcon } from "lucide-react";

export interface PortfolioService {
  icon: LucideIcon;
  name: string;
  iconClassName: string;
}

export interface PortfolioCoordination {
  code: string;
  name: string;
  accentClassName: string;
  dotClassName: string;
  opportunities: number;
  services: PortfolioService[];
}
