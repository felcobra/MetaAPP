export interface OrgPerson {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
}

export interface OrgTeamGroup {
  areaLabel: string;
  title: string;
  members: OrgPerson[];
}

export interface OrgNode {
  id: string;
  title: string;
  person?: OrgPerson;
  children?: OrgNode[];
  team?: OrgTeamGroup;
}

export interface OrgDivision {
  id: string;
  label: string;
  root: OrgNode;
}
