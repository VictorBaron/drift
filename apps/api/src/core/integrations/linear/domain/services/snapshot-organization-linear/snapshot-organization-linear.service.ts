import { Injectable } from '@nestjs/common';
import { TokenEncryption } from 'auth/token-encryption';
import { BaseService } from 'common/application/service';

import { OrganizationRepository } from '@/accounts/domain/repositories/organization.repository';
import { ProjectRepository } from '@/projects/domain/repositories/project.repository';

import {
  SnapshotLinearProjectCommand,
  SnapshotLinearProjectService,
} from '../snapshot-linear-project/snapshot-linear-project.service';

export class SnapshotOrganizationLinearCommand {
  constructor(public readonly organizationId: string) {}
}

export interface SnapshotOrganizationLinearResult {
  snapshots: number;
}

@Injectable()
export class SnapshotOrganizationLinearService extends BaseService {
  constructor(
    private readonly orgRepo: OrganizationRepository,
    private readonly projectRepo: ProjectRepository,
    private readonly snapshotLinearProject: SnapshotLinearProjectService,
    private readonly tokenEncryption: TokenEncryption,
  ) {
    super();
  }

  async execute(command: SnapshotOrganizationLinearCommand): Promise<SnapshotOrganizationLinearResult> {
    const { organizationId } = command;

    const org = await this.orgRepo.findById(organizationId);
    if (!org) throw new Error(`Organization not found: ${organizationId}`);

    const encryptedToken = org.getLinearAccessToken();
    if (!encryptedToken) {
      this.logger.log(`Organization ${organizationId}: no Linear access token, skipping`);
      return { snapshots: 0 };
    }

    const decryptedToken = this.tokenEncryption.decrypt(encryptedToken);
    const projects = await this.projectRepo.findActiveByOrganizationId(org.getId());
    const qualifyingProjects = projects.filter((p) => p.getLinearProjectId() || p.getLinearTeamId());

    let totalSnapshots = 0;

    for (const project of qualifyingProjects) {
      try {
        const result = await this.snapshotLinearProject.execute(
          new SnapshotLinearProjectCommand(project.getId(), org.getId(), decryptedToken),
        );
        totalSnapshots += result.snapshots;
      } catch (err) {
        this.logger.error(`Failed to snapshot project ${project.getId()}: ${err}`);
      }
    }

    this.logger.log(`Organization ${organizationId}: ${totalSnapshots} total snapshots`);
    return { snapshots: totalSnapshots };
  }
}
