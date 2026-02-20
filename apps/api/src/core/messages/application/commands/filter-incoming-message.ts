import { Inject } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import type { GenericMessageEvent } from '@slack/types';
import { BaseCommand } from 'common/application/command-handler';
import { AccountRepository, Member, MemberRepository } from '@/accounts';
import { ChannelRepository } from '@/channels/domain';
import { ConversationRepository } from '@/conversations/domain';
import {
  Message,
  MessageRepository,
  URGENT_NOTIFICATION_GATEWAY,
  type UrgentNotificationGateway,
} from '@/messages/domain';
import { URGENCY_SCORING_GATEWAY, type UrgencyScoringGateway } from '@/scoring/domain/gateways';

export class FilterIncomingMessageCommand {
  constructor(
    readonly props: {
      messageEvent: GenericMessageEvent;
    },
  ) {}
}

@CommandHandler(FilterIncomingMessageCommand)
export class FilterIncomingMessage extends BaseCommand<FilterIncomingMessageCommand> {
  constructor(
    private readonly messageRepository: MessageRepository,
    private accountRepository: AccountRepository,
    private memberRepository: MemberRepository,
    private channelRepository: ChannelRepository,
    private conversationRepository: ConversationRepository,
    @Inject(URGENCY_SCORING_GATEWAY)
    private scoringGateway: UrgencyScoringGateway,
    @Inject(URGENT_NOTIFICATION_GATEWAY)
    private notificationGateway: UrgentNotificationGateway,
  ) {
    super();
  }

  async execute(command: FilterIncomingMessageCommand): Promise<Message | null> {
    const { messageEvent } = command.props;

    this.logger.log(messageEvent);

    if (!messageEvent.text) {
      this.logger.warn('Received Slack message with no text');
      return null;
    }

    const { sender, account } = await this.getSender({
      team: messageEvent.team,
      user: messageEvent.user,
    });

    const { recipients, channelName } = await this.getRecipients({
      accountId: sender.getAccountId(),
      senderId: sender.getId(),
      slackChannelId: messageEvent.channel,
      channelType: messageEvent.channel_type,
    });

    const message = Message.create({
      sender,
      text: messageEvent.text,
      slackChannelId: messageEvent.channel,
      slackChannelType: messageEvent.channel_type,
      slackThreadTs: messageEvent.thread_ts ?? null,
      slackTs: messageEvent.ts,
    });

    const { score, reasoning } = await this.scoringGateway.scoreMessage({
      text: messageEvent.text,
      recipients,
    });
    message.setUrgencyScore({ score, reasoning });

    await this.messageRepository.save(message);

    if (message.isUrgent()) {
      this.logger.log('🚨 URGENT MESSAGE 🚨');
      await this.notificationGateway.notifyUrgentMessage({
        messageId: message.id,
        text: messageEvent.text,
        score,
        reasoning,
        sender: {
          name: sender.getName(),
          email: sender.getEmail(),
        },
        channel: {
          name: channelName,
          type: messageEvent.channel_type,
        },
        slackLink: `slack://channel?team=${account.getSlackTeamId()}&id=${messageEvent.channel}`,
      });
    }

    return message;
  }

  private async getSender({ team, user }: { team?: string; user: string }) {
    if (!team) throw new Error(`Received message with no team`);

    const account = await this.accountRepository.findBySlackTeamId(team);
    if (!account?.isActive) {
      throw new Error(`No account found for Slack team ${team}`);
    }

    const sender = await this.memberRepository.findByAccountIdAndSlackUserId({
      accountId: account.id,
      slackUserId: user,
    });
    if (!sender) {
      throw new Error(`No user found for Slack user ${user}`);
    }
    return { sender, account };
  }

  private async getRecipients({
    accountId,
    senderId,
    slackChannelId,
    channelType,
  }: {
    accountId: string;
    senderId: string;
    slackChannelId: string;
    channelType: GenericMessageEvent['channel_type'];
  }): Promise<{ recipients: Member[]; channelName: string | null }> {
    const isGroupOrChannel = (channelType: GenericMessageEvent['channel_type']) =>
      channelType === 'channel' || channelType === 'group';

    if (isGroupOrChannel(channelType)) {
      const channel = await this.channelRepository.findBySlackChannelId({
        accountId,
        slackChannelId,
      });
      if (!channel) return { recipients: [], channelName: null };

      const members = await this.memberRepository.findManyByIds(channel.getMemberIds());
      return {
        recipients: members.filter((m) => m.getId() !== senderId),
        channelName: channel.getName(),
      };
    }

    const conversation = await this.conversationRepository.findBySlackConversationId({
      accountId,
      slackConversationId: slackChannelId,
    });
    if (!conversation) return { recipients: [], channelName: null };

    const members = await this.memberRepository.findManyByIds(conversation.toJSON().memberIds);
    return {
      recipients: members.filter((m) => m.getId() !== senderId),
      channelName: null,
    };
  }
}
