import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { RepositoryMikroORM } from 'common/domain';
import { Channel, ChannelRepository } from '@/channels/domain';

import { ChannelMapper } from './mappers/channel.mapper';
import { ChannelMikroOrm } from './models/channel.mikroORM';

@Injectable()
export class ChannelRepositoryMikroOrm
  extends RepositoryMikroORM<Channel, ChannelMikroOrm>
  implements ChannelRepository
{
  constructor(em: EntityManager, eventBus: EventBus) {
    super(em, eventBus, ChannelMapper, ChannelMikroOrm);
  }

  async findById(id: string): Promise<Channel | null> {
    const entity = await this.em.findOne(ChannelMikroOrm, { id });
    return this.mapToDomain(entity);
  }

  async findByAccountId(accountId: string): Promise<Channel[]> {
    const entities = await this.em.find(ChannelMikroOrm, { account: accountId }, { orderBy: { name: 'ASC' } });
    return this.mapArrayToDomain(entities);
  }

  async findBySlackChannelId({
    accountId,
    slackChannelId,
  }: {
    accountId: string;
    slackChannelId: string;
  }): Promise<Channel | null> {
    const entity = await this.em.findOne(ChannelMikroOrm, {
      account: accountId,
      slackChannelId,
    });
    return this.mapToDomain(entity);
  }
}
