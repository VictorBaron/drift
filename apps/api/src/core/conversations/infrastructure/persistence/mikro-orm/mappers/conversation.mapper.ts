import { Collection, rel } from '@mikro-orm/core';
import { MemberMikroOrm } from '@/accounts/infrastructure/persistence/mikro-orm';
import { AccountMikroOrm } from '@/accounts/infrastructure/persistence/mikro-orm/models/account.mikroORM';
import { Conversation } from '@/conversations/domain';
import { ConversationMikroOrm } from '@/conversations/infrastructure/persistence/mikro-orm/models/conversation.mikroORM';

export class ConversationMapper {
  static toDomain(raw: ConversationMikroOrm): Conversation {
    if (!raw.account) throw new Error('Error reconstructing Conversation: missing account');
    return Conversation.reconstitute({
      id: raw.id,
      accountId: raw.account.id,
      slackConversationId: raw.slackConversationId,
      memberIds: raw.members.map((member) => member.id),
      isGroupDm: raw.isGroupDm,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(conversation: Conversation): ConversationMikroOrm {
    const json = conversation.toJSON();
    const members = new Collection<MemberMikroOrm>(
      ConversationMikroOrm,
      json.memberIds.map((memberId) => rel(MemberMikroOrm, memberId)),
    );

    const entity = ConversationMikroOrm.build({
      id: json.id,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
      deletedAt: json.deletedAt,
      account: rel(AccountMikroOrm, json.accountId),
      slackConversationId: json.slackConversationId,
      isGroupDm: json.isGroupDm,
      members,
    });

    return entity;
  }
}
