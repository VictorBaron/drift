import { AggregateRoot } from 'common/domain';

import { ChannelImportedEvent } from '@/channels/domain/events/channel-events';

import type { ChannelJSON, ChannelProps, CreateChannelProps, UpdateChannelProps } from './channel.types';

export class Channel extends AggregateRoot {
  private accountId: string;
  private slackChannelId: string;
  private name: string;
  private topic: string;
  private purpose: string;
  private isPrivate: boolean;
  private isArchived: boolean;
  private memberIds: string[];

  private constructor(props: ChannelProps) {
    super({
      id: props.id,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      deletedAt: props.deletedAt,
    });
    this.accountId = props.accountId;
    this.slackChannelId = props.slackChannelId;
    this.name = props.name;
    this.topic = props.topic;
    this.purpose = props.purpose;
    this.isPrivate = props.isPrivate;
    this.isArchived = props.isArchived;
    this.memberIds = props.memberIds;
  }

  static create(props: CreateChannelProps): Channel {
    const now = new Date();

    const channel = new Channel({
      id: crypto.randomUUID(),
      accountId: props.accountId,
      slackChannelId: props.slackChannelId,
      name: props.name,
      topic: props.topic,
      purpose: props.purpose,
      isPrivate: props.isPrivate,
      isArchived: props.isArchived,
      memberIds: props.memberIds,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    channel.addDomainEvent(
      new ChannelImportedEvent({
        channelId: channel.id,
        accountId: channel.accountId,
      }),
    );

    return channel;
  }

  static reconstitute(props: ChannelProps): Channel {
    return new Channel(props);
  }

  update(props: UpdateChannelProps): void {
    this.name = props.name;
    this.topic = props.topic;
    this.purpose = props.purpose;
    this.isPrivate = props.isPrivate;
    this.isArchived = props.isArchived;
    this.memberIds = props.memberIds;
    this.updatedAt = new Date();
  }

  getMemberIds(): string[] {
    return this.memberIds;
  }

  getId(): string {
    return this.id;
  }

  toJSON(): ChannelJSON {
    return {
      id: this.id,
      accountId: this.accountId,
      slackChannelId: this.slackChannelId,
      name: this.name,
      topic: this.topic,
      purpose: this.purpose,
      isPrivate: this.isPrivate,
      isArchived: this.isArchived,
      memberIds: this.memberIds,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
