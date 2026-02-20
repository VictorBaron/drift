import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { RepositoryMikroORM } from 'common/domain';

import { Message, MessageRepository } from '@/messages/domain';

import { MessageMapper } from './mappers';
import { MessageMikroOrm } from './models';

@Injectable()
export class MessageRepositoryMikroOrm
  extends RepositoryMikroORM<Message, MessageMikroOrm>
  implements MessageRepository
{
  constructor(em: EntityManager, eventBus: EventBus) {
    super(em, eventBus, MessageMapper, MessageMikroOrm);
  }

  async findById(id: string): Promise<Message | null> {
    const entity = await this.em.findOne(MessageMikroOrm, { id });
    return entity ? MessageMapper.toDomain(entity) : null;
  }

  async findBySlackTs(slackTs: string): Promise<Message | null> {
    const entity = await this.em.findOne(MessageMikroOrm, { slackTs });
    return entity ? MessageMapper.toDomain(entity) : null;
  }
}
