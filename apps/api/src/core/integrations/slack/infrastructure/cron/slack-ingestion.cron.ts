import { Injectable, Logger } from '@nestjs/common';

import { OrganizationRepository } from '@/accounts/domain/repositories/organization.repository';
import {
  IngestOrganizationSlackCommand,
  IngestOrganizationSlackHandler,
} from '@/integrations/slack/application/commands/ingest-organization-slack/ingest-organization-slack.handler';

@Injectable()
export class SlackIngestionCron {
  private readonly logger = new Logger(SlackIngestionCron.name);

  constructor(
    private readonly organizationRepo: OrganizationRepository,
    private readonly ingestOrganizationHandler: IngestOrganizationSlackHandler,
  ) {}

  // @Cron('0 * * * *') — add @nestjs/schedule and uncomment to enable hourly ingestion
  async run(): Promise<void> {
    const organizations = await this.organizationRepo.findAll();

    this.logger.log(`Starting Slack ingestion for ${organizations.length} organization(s)`);

    for (const org of organizations) {
      try {
        await this.ingestOrganizationHandler.execute(new IngestOrganizationSlackCommand(org.getId()));
      } catch (err) {
        this.logger.error(`Failed to ingest organization ${org.getId()}: ${err}`);
      }
    }
  }
}
