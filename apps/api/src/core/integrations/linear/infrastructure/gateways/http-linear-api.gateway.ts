import { Injectable, Logger } from '@nestjs/common';

import {
  LinearApiGateway,
  type LinearIssue,
  type LinearProject,
  type LinearTeam,
} from '../../domain/gateways/linear-api.gateway';

const LINEAR_API_URL = 'https://api.linear.app/graphql';
const MAX_DESCRIPTION_LENGTH = 200;

interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

@Injectable()
export class HttpLinearApiGateway extends LinearApiGateway {
  private readonly logger = new Logger(HttpLinearApiGateway.name);

  async listTeams(token: string): Promise<LinearTeam[]> {
    const query = `query { teams { nodes { id name key } } }`;
    const data = await this.execute<{ teams: { nodes: LinearTeam[] } }>(token, query);
    return data.teams.nodes;
  }

  async listProjects(token: string, teamId?: string): Promise<LinearProject[]> {
    if (teamId) {
      const query = `query Teams($teamId: String) {
        teams(filter: { id: { eq: $teamId } }) {
          nodes { projects { nodes { id name } } }
        }
      }`;
      const data = await this.execute<{
        teams: { nodes: Array<{ projects: { nodes: LinearProject[] } }> };
      }>(token, query, { teamId });

      return data.teams.nodes.flatMap((team) => team.projects.nodes);
    }

    const query = `query { projects { nodes { id name } } }`;
    const data = await this.execute<{ projects: { nodes: LinearProject[] } }>(token, query);
    return data.projects.nodes;
  }

  async getProjectIssues(token: string, projectId: string, since: Date): Promise<LinearIssue[]> {
    return this.fetchIssuesPaginated(token, projectId, since, 'project');
  }

  async getTeamIssues(token: string, teamId: string, since: Date): Promise<LinearIssue[]> {
    return this.fetchIssuesPaginated(token, teamId, since, 'team');
  }

  private async fetchIssuesPaginated(
    token: string,
    entityId: string,
    since: Date,
    entityType: 'project' | 'team',
  ): Promise<LinearIssue[]> {
    const allIssues: LinearIssue[] = [];
    let hasNextPage = true;
    let afterCursor: string | null = null;

    while (hasNextPage) {
      const { issues, pageInfo } = await this.fetchIssuePage(token, entityId, since, entityType, afterCursor);
      allIssues.push(...issues);
      hasNextPage = pageInfo.hasNextPage;
      afterCursor = pageInfo.endCursor;
    }

    return allIssues;
  }

  private async fetchIssuePage(
    token: string,
    entityId: string,
    since: Date,
    entityType: 'project' | 'team',
    afterCursor: string | null,
  ): Promise<{ issues: LinearIssue[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } }> {
    const query = this.buildIssueQuery(entityType);
    const variables: Record<string, unknown> = {
      entityId,
      after: afterCursor,
      updatedAfter: { gt: since.toISOString() },
    };

    const data = await this.execute<Record<string, { issues: { nodes: RawIssue[]; pageInfo: PageInfo } }>>(
      token,
      query,
      variables,
    );

    const entity = data[entityType];
    const issues = entity.issues.nodes.map((node) => this.mapIssue(node));

    return { issues, pageInfo: entity.issues.pageInfo };
  }

  private buildIssueQuery(entityType: 'project' | 'team'): string {
    const issueFields = `
      nodes {
        id identifier title description
        state { name type }
        priority assignee { name }
        createdAt updatedAt completedAt
        labels { nodes { name } }
        comments { totalCount }
      }
      pageInfo { hasNextPage endCursor }
    `;

    if (entityType === 'project') {
      return `query ProjectIssues($entityId: String!, $after: String, $updatedAfter: DateComparison) {
        project(id: $entityId) {
          issues(first: 100, after: $after, orderBy: updatedAt, filter: { updatedAt: $updatedAfter }) {
            ${issueFields}
          }
        }
      }`;
    }

    return `query TeamIssues($entityId: String!, $after: String, $updatedAfter: DateComparison) {
      team(id: $entityId) {
        issues(first: 100, after: $after, orderBy: updatedAt, filter: { updatedAt: $updatedAfter }) {
          ${issueFields}
        }
      }
    }`;
  }

  private mapIssue(raw: RawIssue): LinearIssue {
    return {
      id: raw.id,
      identifier: raw.identifier,
      title: raw.title,
      description: this.truncateDescription(raw.description),
      stateName: raw.state.name,
      stateType: raw.state.type,
      priority: raw.priority,
      assigneeName: raw.assignee?.name ?? null,
      labelNames: raw.labels.nodes.map((l) => l.name),
      commentCount: raw.comments.totalCount,
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
      completedAt: raw.completedAt ? new Date(raw.completedAt) : null,
    };
  }

  private truncateDescription(description: string | null): string | null {
    if (!description) return null;
    if (description.length <= MAX_DESCRIPTION_LENGTH) return description;
    return `${description.slice(0, MAX_DESCRIPTION_LENGTH)}...`;
  }

  private async execute<T>(token: string, query: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await fetch(LINEAR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`Linear API request failed: ${response.status} ${response.statusText}`);
    }

    const result = (await response.json()) as GraphQLResponse<T>;

    if (result.errors?.length) {
      this.logger.error(`Linear GraphQL errors: ${JSON.stringify(result.errors)}`);
      throw new Error(`Linear GraphQL error: ${result.errors[0].message}`);
    }

    return result.data;
  }
}

interface RawIssue {
  id: string;
  identifier: string;
  title: string;
  description: string | null;
  state: { name: string; type: string };
  priority: number;
  assignee: { name: string } | null;
  labels: { nodes: Array<{ name: string }> };
  comments: { totalCount: number };
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}
