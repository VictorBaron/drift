import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { RepositoryMikroORM } from 'common/domain';

import type { SlackInstallation } from '@/integrations/slack/domain/aggregates/slack-installation.aggregate';
import { SlackInstallationRepository } from '@/integrations/slack/domain/repositories/slack-installation.repository';
import { SlackInstallationMapper } from './mappers/slack-installation.mapper';
import { SlackInstallationMikroOrm } from './models/slack-installation.mikroORM';

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
