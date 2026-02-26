import { Injectable } from '@nestjs/common';
import { BaseService } from 'common/application/service';

import { OrganizationRepository } from '@/accounts/domain/repositories/organization.repository';
import {
  IngestOrganizationSlackCommand,
  IngestOrganizationSlackService,
} from '@/integrations/slack/domain/services/ingest-organization-slack/ingest-organization-slack.service';

@Injectable()
export class SlackIngestionCron extends BaseService {
  constructor(
    private readonly organizationRepo: OrganizationRepository,
    private readonly ingestOrganizationSlack: IngestOrganizationSlackService,
  ) {
    super();
  }

  // @Cron('0 * * * *') — add @nestjs/schedule and uncomment to enable hourly ingestion
  async run(): Promise<void> {
    const organizations = await this.organizationRepo.findAll();

    this.logger.log(`Starting Slack ingestion for ${organizations.length} organization(s)`);

    for (const org of organizations) {
      try {
        await this.ingestOrganizationSlack.execute(new IngestOrganizationSlackCommand(org.getId()));
      } catch (err) {
        this.logger.error(`Failed to ingest organization ${org.getId()}: ${err}`);
      }
    }
  }
}
