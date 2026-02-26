import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BaseService } from 'common/application/service';

import { OrganizationRepository } from '@/accounts/domain/repositories/organization.repository';
import {
  SnapshotOrganizationLinearCommand,
  SnapshotOrganizationLinearService,
} from '@/integrations/linear/domain/services/snapshot-organization-linear/snapshot-organization-linear.service';

@Injectable()
export class LinearIngestionCron extends BaseService {
  constructor(
    private readonly organizationRepo: OrganizationRepository,
    private readonly snapshotOrganizationLinear: SnapshotOrganizationLinearService,
  ) {
    super();
  }

  @Cron('0 12,19 * * 1-5')
  async run(): Promise<void> {
    const organizations = await this.organizationRepo.findAll();

    this.logger.log(`Starting Linear ingestion for ${organizations.length} organization(s)`);

    for (const org of organizations) {
      try {
        await this.snapshotOrganizationLinear.execute(new SnapshotOrganizationLinearCommand(org.getId()));
      } catch (err) {
        this.logger.error(`Failed to snapshot organization ${org.getId()}: ${err}`);
      }
    }
  }
}
