import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface AuthenticatedUser {
  name: string;
  role: string;
  initials: string;
}
