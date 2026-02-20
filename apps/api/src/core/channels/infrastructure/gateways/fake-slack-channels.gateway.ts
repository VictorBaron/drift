import type { SlackChannelInfo, SlackChannelsGateway } from '@/channels/domain/gateways/slack-channels.gateway';

export class FakeSlackChannelsGateway implements SlackChannelsGateway {
  private channels: SlackChannelInfo[] = [];

  async listTeamChannels(_botToken: string): Promise<SlackChannelInfo[]> {
    return this.channels;
  }

  setChannels(channels: SlackChannelInfo[]) {
    this.channels = channels;
  }
}
