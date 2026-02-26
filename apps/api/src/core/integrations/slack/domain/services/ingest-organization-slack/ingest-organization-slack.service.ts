import { Injectable } from '@nestjs/common';
import { BaseService } from 'common/application/service';

import { OrganizationRepository } from '@/accounts/domain/repositories/organization.repository';
import {
  IngestSlackMessagesCommand,
  IngestSlackMessagesService,
} from '@/integrations/slack/domain/services/ingest-slack-messages/ingest-slack-messages.service';
import { ProjectRepository } from '@/projects/domain/repositories/project.repository';

export class IngestOrganizationSlackCommand {
  constructor(public readonly organizationId: string) {}
}

export interface IngestOrganizationSlackResult {
  ingested: number;
  filtered: number;
}

@Injectable()
export class IngestOrganizationSlackService extends BaseService {
  constructor(
    private readonly organizationRepo: OrganizationRepository,
    private readonly projectRepo: ProjectRepository,
    private readonly ingestSlackMessages: IngestSlackMessagesService,
  ) {
    super();
  }

  async execute(command: IngestOrganizationSlackCommand): Promise<IngestOrganizationSlackResult> {
    const { organizationId } = command;

    const org = await this.organizationRepo.findById(organizationId);
    if (!org) throw new Error(`Organization not found: ${organizationId}`);

    const projects = await this.projectRepo.findActiveByOrganizationId(org.getId());
    const projectsWithSlack = projects.filter((p) => p.getSlackChannelIds().length > 0);

    let totalIngested = 0;
    let totalFiltered = 0;

    for (const project of projectsWithSlack) {
      try {
        const result = await this.ingestSlackMessages.execute(
          new IngestSlackMessagesCommand(project.getId(), org.getId(), org.getSlackBotToken()),
        );
        totalIngested += result.ingested;
        totalFiltered += result.filtered;
      } catch (err) {
        this.logger.error(`Failed to ingest project ${project.getId()}: ${err}`);
      }
    }

    this.logger.log(`Organization ${organizationId}: ingested=${totalIngested} filtered=${totalFiltered}`);
    return { ingested: totalIngested, filtered: totalFiltered };
  }
}
