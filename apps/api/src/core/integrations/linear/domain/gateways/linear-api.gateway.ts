export const LINEAR_API_GATEWAY = 'LINEAR_API_GATEWAY';

export interface LinearTeam {
  id: string;
  name: string;
  key: string;
}

export interface LinearProject {
  id: string;
  name: string;
}

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description: string | null;
  stateName: string;
  stateType: string;
  priority: number;
  assigneeName: string | null;
  labelNames: string[];
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export abstract class LinearApiGateway {
  abstract listTeams(token: string): Promise<LinearTeam[]>;
  abstract listProjects(token: string, teamId?: string): Promise<LinearProject[]>;
  abstract getProjectIssues(token: string, projectId: string, since: Date): Promise<LinearIssue[]>;
  abstract getTeamIssues(token: string, teamId: string, since: Date): Promise<LinearIssue[]>;
}
