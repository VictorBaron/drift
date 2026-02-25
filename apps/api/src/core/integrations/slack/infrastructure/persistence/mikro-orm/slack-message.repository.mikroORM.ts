import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { RepositoryMikroORM } from 'common/domain';

import type { SlackMessage } from '@/integrations/slack/domain/aggregates/slack-message.aggregate';
import { SlackMessageRepository } from '@/integrations/slack/domain/repositories/slack-message.repository';

import { SlackMessageMapper } from './mappers/slack-message.mapper';
import { SlackMessageMikroOrm } from './models/slack-message.mikroORM';

@Injectable()
export class SlackMessageRepositoryMikroOrm
  extends RepositoryMikroORM<SlackMessage, SlackMessageMikroOrm>
  implements SlackMessageRepository
{
  constructor(em: EntityManager, eventBus: EventBus) {
    super(em, eventBus, SlackMessageMapper, SlackMessageMikroOrm);
  }

  async findByChannelAndTs(channelId: string, messageTs: string): Promise<SlackMessage | null> {
    const entity = await this.em.findOne(SlackMessageMikroOrm, { channelId, messageTs });
    return entity ? SlackMessageMapper.toDomain(entity) : null;
  }

  async findLatestByChannelId(channelId: string): Promise<SlackMessage | null> {
    const entity = await this.em.findOne(SlackMessageMikroOrm, { channelId }, { orderBy: { messageTs: 'DESC' } });
    return entity ? SlackMessageMapper.toDomain(entity) : null;
  }

  async findByProjectId(projectId: string, since?: Date): Promise<SlackMessage[]> {
    const where = since ? { projectId, ingestedAt: { $gte: since } } : { projectId };
    const entities = await this.em.find(SlackMessageMikroOrm, where, {
      orderBy: { ingestedAt: 'ASC' },
    });
    return entities.map(SlackMessageMapper.toDomain);
  }

  async saveMany(messages: SlackMessage[]): Promise<SlackMessage[]> {
    return super.saveMany(messages);
  }
}
