import { Collection, rel } from '@mikro-orm/core';
import { MemberMikroOrm } from '@/accounts/infrastructure/persistence/mikro-orm';
import { AccountMikroOrm } from '@/accounts/infrastructure/persistence/mikro-orm/models/account.mikroORM';
import { Channel } from '@/channels/domain';
import { ChannelMikroOrm } from '@/channels/infrastructure/persistence/mikro-orm/models/channel.mikroORM';

export class ChannelMapper {
  static toDomain(raw: ChannelMikroOrm): Channel {
    if (!raw.account) throw new Error('Error reconstructing Channel: missing account');
    return Channel.reconstitute({
      id: raw.id,
      accountId: raw.account?.id,
      slackChannelId: raw.slackChannelId,
      name: raw.name,
      topic: raw.topic,
      purpose: raw.purpose,
      isPrivate: raw.isPrivate,
      isArchived: raw.isArchived,
      memberIds: raw.members.map((member) => member.id),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(channel: Channel): ChannelMikroOrm {
    const json = channel.toJSON();

    const members = new Collection<MemberMikroOrm>(
      ChannelMikroOrm,
      json.memberIds.map((memberId) => rel(MemberMikroOrm, memberId)),
    );

    return ChannelMikroOrm.build({
      id: json.id,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
      deletedAt: json.deletedAt,
      account: rel(AccountMikroOrm, json.accountId),
      slackChannelId: json.slackChannelId,
      name: json.name,
      topic: json.topic,
      purpose: json.purpose,
      isPrivate: json.isPrivate,
      isArchived: json.isArchived,
      members,
    });
  }
}
