import {
  BarChart3,
  Building2,
  ClipboardList,
  Home,
  LayoutGrid,
  Network,
  ShoppingBag,
  Wallet,
  Users,
} from "lucide-react";
import type { NavItem } from "@/types/nav";

export const primaryNav: NavItem[] = [
  { label: "Início", href: "/home", icon: Home },
  { label: "Formulários", href: "/forms", icon: ClipboardList },
  { label: "Dashboards", href: "/dashboards", icon: BarChart3 },
  { label: "Projetos externos", href: "/external-projects", icon: LayoutGrid },
  { label: "Organograma", href: "/orgchart", icon: Network },
  { label: "Membros", href: "/members", icon: Users },
  { label: "Serviços & Portfólio", href: "/portfolio", icon: ShoppingBag },
  { label: "Comercial", href: "/commercial", icon: Building2 },
  { label: "Contratos & Financeiro", href: "/financial", icon: Wallet },
];
