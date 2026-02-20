import { Inject, Injectable } from '@nestjs/common';
import { BaseService } from 'common/application/service';
import { Account, Member, MemberRepository } from '@/accounts/domain';
import { Channel, ChannelRepository } from '@/channels/domain';
import { SLACK_CHANNELS_GATEWAY, type SlackChannelsGateway } from '@/channels/domain/gateways/slack-channels.gateway';

@Injectable()
export class SlackChannelsImportService extends BaseService {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly channelRepository: ChannelRepository,
    @Inject(SLACK_CHANNELS_GATEWAY)
    private readonly slackChannelsGateway: SlackChannelsGateway,
  ) {
    super();
  }

  async importChannels({ account, botToken }: { account: Account; botToken: string }): Promise<void> {
    const accountId = account.getId();
    const slackChannels = await this.slackChannelsGateway.listTeamChannels(botToken);

    this.logger.log(slackChannels);

    const uniqueSlackUserIds = [...new Set(slackChannels.flatMap((channel) => channel.memberSlackIds))];

    const allMembers = await this.memberRepository.findManyByAccountIdAndSlackUserIds({
      accountId,
      slackUserIds: uniqueSlackUserIds,
    });

    for (const sc of slackChannels) {
      const resolvedMembers = sc.memberSlackIds
        .map((slackUserId) => allMembers.find((member) => member.identify({ accountId, slackUserId })))
        .filter((member): member is Member => !!member);
      const memberIds = resolvedMembers.map((member) => member.getId());

      const existing = await this.channelRepository.findBySlackChannelId({
        accountId: account.getId(),
        slackChannelId: sc.slackChannelId,
      });

      if (existing) {
        existing.update({
          name: sc.name,
          topic: sc.topic,
          purpose: sc.purpose,
          isPrivate: sc.isPrivate,
          isArchived: sc.isArchived,
          memberIds,
        });
        await this.channelRepository.save(existing);
        continue;
      }
      const channel = Channel.create({
        accountId: account.getId(),
        slackChannelId: sc.slackChannelId,
        name: sc.name,
        topic: sc.topic,
        purpose: sc.purpose,
        isPrivate: sc.isPrivate,
        isArchived: sc.isArchived,
        memberIds,
      });
      await this.channelRepository.save(channel);
    }
  }
}
