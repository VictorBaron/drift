import { Injectable } from '@nestjs/common';

import {
  LinearApiGateway,
  type LinearIssue,
  type LinearProject,
  type LinearTeam,
} from '../../domain/gateways/linear-api.gateway';

@Injectable()
export class FakeLinearApiGateway extends LinearApiGateway {
  private teams: LinearTeam[] = [];
  private projects: LinearProject[] = [];
  private projectIssues: Map<string, LinearIssue[]> = new Map();
  private teamIssues: Map<string, LinearIssue[]> = new Map();
  private exchangedToken = 'fake-linear-token';

  seedExchangedToken(token: string): void {
    this.exchangedToken = token;
  }

  seedTeams(teams: LinearTeam[]): void {
    this.teams = teams;
  }

  seedProjects(projects: LinearProject[]): void {
    this.projects = projects;
  }

  seedProjectIssues(projectId: string, issues: LinearIssue[]): void {
    this.projectIssues.set(projectId, issues);
  }

  seedTeamIssues(teamId: string, issues: LinearIssue[]): void {
    this.teamIssues.set(teamId, issues);
  }

  clear(): void {
    this.teams = [];
    this.projects = [];
    this.projectIssues.clear();
    this.teamIssues.clear();
    this.exchangedToken = 'fake-linear-token';
  }

  async exchangeToken(_code: string, _redirectUri: string): Promise<string> {
    return this.exchangedToken;
  }

  async listTeams(_token: string): Promise<LinearTeam[]> {
    return this.teams;
  }

  async listProjects(_token: string, _teamId?: string): Promise<LinearProject[]> {
    return this.projects;
  }

  async getProjectIssues(_token: string, projectId: string, since: Date): Promise<LinearIssue[]> {
    const issues = this.projectIssues.get(projectId) ?? [];
    return issues.filter((issue) => issue.updatedAt >= since);
  }

  async getTeamIssues(_token: string, teamId: string, since: Date): Promise<LinearIssue[]> {
    const issues = this.teamIssues.get(teamId) ?? [];
    return issues.filter((issue) => issue.updatedAt >= since);
  }
}
