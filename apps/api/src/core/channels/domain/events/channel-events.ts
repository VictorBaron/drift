import { DomainEvent } from 'common/domain';

export class ChannelImportedEvent extends DomainEvent {
  readonly eventName = 'channel.imported';
  readonly channelId: string;
  readonly accountId: string;

  constructor({ channelId, accountId }: { channelId: string; accountId: string }) {
    super();
    this.channelId = channelId;
    this.accountId = accountId;
  }
}
