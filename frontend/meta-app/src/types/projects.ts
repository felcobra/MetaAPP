import type { ProjectStatus } from "./dashboard";

export interface ExternalProject {
  id: string;
  code: string;
  client: string;
  area: string;
  manager: string;
  status: ProjectStatus;
  progress: number;
}

export type ExternalProjectFilter = "todos" | ProjectStatus;
