import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { RepositoryMikroORM } from 'common/domain';

import type { SlackInstallation } from '@/slack/domain/slack-installation.aggregate';
import { SlackInstallationRepository } from '@/slack/domain/slack-installation.repository';

import { SlackInstallationMikroOrm } from './models/slack-installation.mikroORM';
import { SlackInstallationMapper } from './slack-installation.mapper';

export interface SlackInstallationLookup {
  teamId: string | null;
  enterpriseId: string | null;
}

@Injectable()
export class SlackInstallationRepositoryMikroOrm
  extends RepositoryMikroORM<SlackInstallation, SlackInstallationMikroOrm>
  implements SlackInstallationRepository
{
  constructor(em: EntityManager, eventBus: EventBus) {
    super(em, eventBus, SlackInstallationMapper, SlackInstallationMikroOrm);
  }

  async findByTeamAndEnterprise({ teamId, enterpriseId }: SlackInstallationLookup): Promise<SlackInstallation | null> {
    const entity = await this.em.findOne(SlackInstallationMikroOrm, {
      teamId,
      enterpriseId,
      deletedAt: null,
    });
    return entity ? SlackInstallationMapper.toDomain(entity) : null;
  }

  async findByTeamId(teamId: string): Promise<SlackInstallation | null> {
    const entity = await this.em.findOne(SlackInstallationMikroOrm, {
      teamId,
      deletedAt: null,
    });
    return entity ? SlackInstallationMapper.toDomain(entity) : null;
  }

  async findByEnterpriseId(enterpriseId: string): Promise<SlackInstallation | null> {
    const entity = await this.em.findOne(SlackInstallationMikroOrm, {
      enterpriseId,
      deletedAt: null,
    });
    return entity ? SlackInstallationMapper.toDomain(entity) : null;
  }
}
