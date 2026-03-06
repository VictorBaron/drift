import { Inject, Injectable } from '@nestjs/common';
import { TokenEncryption } from 'auth/token-encryption';

import { OrganizationRepository } from '@/accounts/domain/repositories/organization.repository';
import {
  LINEAR_API_GATEWAY,
  LinearApiGateway,
  type LinearProject,
  type LinearTeam,
} from '@/integrations/linear/domain/gateways/linear-api.gateway';

export interface GetLinearTeamsQuery {
  orgId: string;
}

export type LinearTeamWithProjects = LinearTeam & { projects: LinearProject[] };

export type GetLinearTeamsResult =
  | { connected: false; teams: [] }
  | { connected: true; teams: LinearTeamWithProjects[] };

@Injectable()
export class GetLinearTeamsHandler {
  constructor(
    private readonly orgRepo: OrganizationRepository,
    private readonly tokenEncryption: TokenEncryption,
    @Inject(LINEAR_API_GATEWAY) private readonly linearApi: LinearApiGateway,
  ) {}

  async execute(query: GetLinearTeamsQuery): Promise<GetLinearTeamsResult> {
    const org = await this.orgRepo.findById(query.orgId);
    if (!org?.getLinearAccessToken()) return { connected: false, teams: [] };

    const token = this.tokenEncryption.decrypt(org.getLinearAccessToken()!);
    const teams = await this.linearApi.listTeams(token);
    const teamsWithProjects = await this.fetchProjectsForTeams(token, teams);

    return { connected: true, teams: teamsWithProjects };
  }

  private async fetchProjectsForTeams(token: string, teams: LinearTeam[]): Promise<LinearTeamWithProjects[]> {
    return Promise.all(
      teams.map(async (team) => {
        const projects = await this.linearApi.listProjects(token, team.id);
        return { ...team, projects };
      }),
    );
  }
}
