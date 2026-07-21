import type { LucideIcon } from "lucide-react";

export interface ConnectedSystemStep {
  icon: LucideIcon;
  value: string;
  label: string;
  helper: string;
  href: string;
  iconClassName: string;
}

export interface RevenueProgress {
  percentage: number;
  currentLabel: string;
  currentValue: string;
  targetLabel: string;
  targetValue: string;
  negotiationLabel: string;
  negotiationValue: string;
  gapLabel: string;
  gapValue: string;
}

export interface SalesFunnelStage {
  label: string;
  value: number;
  percentage: number;
}

export interface ProjectsOverview {
  active: number;
  activeDelta: string;
  completed: number;
  completedOnTimeLabel: string;
  teamCapacityLabel: string;
  teamCapacityPercentage: number;
}

export interface Birthday {
  initials: string;
  name: string;
  department: string;
}

export interface Recognition {
  initials: string;
  name: string;
  achievement: string;
}
