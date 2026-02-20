import { rel } from '@mikro-orm/core';
import { AccountMikroOrm } from '@/accounts/infrastructure/persistence/mikro-orm/models/account.mikroORM';
import { MemberMikroOrm } from '@/accounts/infrastructure/persistence/mikro-orm/models/member.mikroORM';
import { Message } from '@/messages/domain';
import { MessageMikroOrm } from '@/messages/infrastructure/persistence/mikro-orm/models';

export class MessageMapper {
  static toDomain(raw: MessageMikroOrm): Message {
    if (!raw.account) throw new Error('Error reconstructing message: missing account');
    if (!raw.sender) throw new Error('Error reconstructing message: missing sender');
    return Message.reconstitute({
      id: raw.id,
      accountId: raw.account?.id,
      senderId: raw.sender?.id,
      slackTs: raw.slackTs,
      slackChannelId: raw.slackChannelId,
      slackChannelType: raw.slackChannelType,
      slackThreadTs: raw.slackThreadTs,
      text: raw.text,
      urgencyScore: raw.urgencyScore,
      urgencyReasoning: raw.urgencyReasoning,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(message: Message): MessageMikroOrm {
    const json = message.toJSON();
    return MessageMikroOrm.build({
      id: json.id,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
      deletedAt: json.deletedAt,
      account: rel(AccountMikroOrm, json.accountId),
      sender: rel(MemberMikroOrm, json.senderId),
      slackTs: json.slackTs,
      slackChannelId: json.slackChannelId,
      slackChannelType: json.slackChannelType,
      slackThreadTs: json.slackThreadTs,
      text: json.text,
      urgencyScore: json.urgencyScore,
      urgencyReasoning: json.urgencyReasoning,
    });
  }
}
