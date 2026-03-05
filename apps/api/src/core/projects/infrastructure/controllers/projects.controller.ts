import { Body, Controller, Get, Inject, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser, type JwtPayload } from 'auth/current-user.decorator';
import { TokenEncryption } from 'auth/token-encryption';
import { OrganizationRepository } from '@/accounts/domain/repositories/organization.repository';
import { SLACK_API_GATEWAY, SlackApiGateway } from '@/integrations/slack/domain/gateways/slack-api.gateway';
import {
  CreateProjectCommand,
  CreateProjectHandler,
} from '@/projects/application/commands/create-project/create-project.handler';
import {
  UpdateProjectSourcesCommand,
  UpdateProjectSourcesHandler,
} from '@/projects/application/commands/update-project-sources/update-project-sources.handler';
import type { KeyResult } from '@/projects/domain/aggregates/project.aggregate';
import { ProjectRepository } from '@/projects/domain/repositories/project.repository';

interface UpdateProjectSourcesBody {
  slackChannelIds: string[];
  linearTeamId?: string | null;
  linearProjectId?: string | null;
  notionPageId?: string | null;
}

interface CreateProjectBody {
  name: string;
  emoji: string;
  pmLeadName?: string | null;
  techLeadName?: string | null;
  teamName?: string | null;
  targetDate?: string | null;
  slackChannelIds?: string[];
  linearProjectId?: string | null;
  linearTeamId?: string | null;
  notionPageId?: string | null;
  productObjective?: string | null;
  objectiveOrigin?: string | null;
  keyResults?: KeyResult[];
}

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly createProjectHandler: CreateProjectHandler,
    private readonly updateProjectSourcesHandler: UpdateProjectSourcesHandler,
    private readonly orgRepo: OrganizationRepository,
    private readonly tokenEncryption: TokenEncryption,
    @Inject(SLACK_API_GATEWAY) private readonly slackApi: SlackApiGateway,
  ) {}

  @Get()
  async getAll(@CurrentUser() user: JwtPayload) {
    const projects = await this.projectRepo.findActiveByOrganizationId(user.orgId);
    return projects.map((p) => p.toJSON());
  }

  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() body: CreateProjectBody) {
    const project = await this.createProjectHandler.execute(
      new CreateProjectCommand(
        user.orgId,
        body.name,
        body.emoji,
        body.pmLeadName ?? null,
        body.techLeadName ?? null,
        body.teamName ?? null,
        body.targetDate ? new Date(body.targetDate) : null,
        body.slackChannelIds ?? [],
        body.linearProjectId ?? null,
        body.linearTeamId ?? null,
        body.notionPageId ?? null,
        body.productObjective ?? null,
        body.objectiveOrigin ?? null,
        body.keyResults ?? [],
      ),
    );
    return project.toJSON();
  }

  @Patch(':id/sources')
  async updateSources(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: UpdateProjectSourcesBody,
  ) {
    await this.updateProjectSourcesHandler.execute(
      new UpdateProjectSourcesCommand(
        id,
        user.orgId,
        body.slackChannelIds ?? [],
        body.linearTeamId ?? null,
        body.linearProjectId ?? null,
        body.notionPageId ?? null,
      ),
    );
  }

  @Get('channels')
  async getChannels(@CurrentUser() user: JwtPayload) {
    const org = await this.orgRepo.findById(user.orgId);
    if (!org) return [];
    const channels = await this.slackApi.listChannels(this.tokenEncryption.decrypt(org.getSlackBotToken()));
    return channels;
  }
}
