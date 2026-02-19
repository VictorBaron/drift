import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { RepositoryMikroORM } from 'common/domain';

import { Conversation, ConversationRepository } from '@/conversations/domain';

import { ConversationMapper } from './mappers/conversation.mapper';
import { ConversationMikroOrm } from './models/conversation.mikroORM';

@Injectable()
export class ConversationRepositoryMikroOrm
  extends RepositoryMikroORM<Conversation, ConversationMikroOrm>
  implements ConversationRepository
{
  constructor(em: EntityManager, eventBus: EventBus) {
    super(em, eventBus, ConversationMapper, ConversationMikroOrm);
  }

  async findById(id: string): Promise<Conversation | null> {
    const entity = await this.em.findOne(ConversationMikroOrm, { id });
    return this.mapToDomain(entity);
  }

  async findByAccountId(accountId: string): Promise<Conversation[]> {
    const entities = await this.em.find(ConversationMikroOrm, {
      account: accountId,
    });
    return this.mapArrayToDomain(entities);
  }

  async findBySlackConversationId({
    accountId,
    slackConversationId,
  }: {
    accountId: string;
    slackConversationId: string;
  }): Promise<Conversation | null> {
    const entity = await this.em.findOne(ConversationMikroOrm, {
      account: accountId,
      slackConversationId,
    });
    return this.mapToDomain(entity);
  }
}
