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

    const sender = await this.getSender({
      team: messageEvent.team,
      user: messageEvent.user,
    });

    const recipients = await this.getRecipients({
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
      await this.notificationGateway.notifyUrgentMessage({
        messageId: message.id,
        text: messageEvent.text,
        score,
        reasoning,
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
    return sender;
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
  }): Promise<Member[]> {
    const isGroupOrChannel = (channelType: GenericMessageEvent['channel_type']) =>
      channelType === 'channel' || channelType === 'group';

    const findMembersInConversation = async () => {
      if (isGroupOrChannel(channelType)) {
        const channel = await this.channelRepository.findBySlackChannelId({
          accountId,
          slackChannelId,
        });
        if (!channel) return [];

        return this.memberRepository.findManyByIds(channel.getMemberIds());
      }

      const conversation = await this.conversationRepository.findBySlackConversationId({
        accountId,
        slackConversationId: slackChannelId,
      });
      if (!conversation) return [];

      return this.memberRepository.findManyByIds(conversation.toJSON().memberIds);
    };

    const members = await findMembersInConversation();

    return members.filter((m) => m.getId() !== senderId);
  }
}
