import { Inject, Injectable } from '@nestjs/common';
import { BaseService } from 'common/application/service';
import { Account, Member, MemberRepository } from '@/accounts/domain';
import { Conversation, ConversationRepository } from '@/conversations/domain';
import {
  SLACK_CONVERSATIONS_GATEWAY,
  type SlackConversationsGateway,
} from '@/conversations/domain/gateways/slack-conversations.gateway';

@Injectable()
export class SlackConversationsImportService extends BaseService {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly conversationRepository: ConversationRepository,
    @Inject(SLACK_CONVERSATIONS_GATEWAY)
    private readonly slackConversationsGateway: SlackConversationsGateway,
  ) {
    super();
  }

  async importConversations({
    account,
    botToken,
  }: {
    account: Account;
    botToken: string;
  }): Promise<void> {
    const accountId = account.getId();
    const slackConversations =
      await this.slackConversationsGateway.listUserConversations(botToken);

    this.logger.log(slackConversations);

    const uniqueSlackUserIds = [
      ...new Set(slackConversations.flatMap((conv) => conv.memberSlackIds)),
    ];

    const allMembers = await this.resolveMembers(uniqueSlackUserIds, accountId);

    for (const sc of slackConversations) {
      const resolvedMembers = allMembers.filter((member) =>
        sc.memberSlackIds.some((slackUserId) =>
          member.identify({ accountId, slackUserId }),
        ),
      );
      const memberIds = resolvedMembers.map((member) => member.getId());
      if (!resolvedMembers.length) continue;

      const existing =
        await this.conversationRepository.findBySlackConversationId({
          accountId,
          slackConversationId: sc.slackConversationId,
        });

      if (existing) {
        existing.update({ memberIds });
        await this.conversationRepository.save(existing);
        continue;
      }

      const conversation = Conversation.create({
        accountId,
        slackConversationId: sc.slackConversationId,
        memberIds,
        isGroupDm: sc.isGroupDm,
      });
      await this.conversationRepository.save(conversation);
    }
  }

  private async resolveMembers(
    memberSlackIds: string[],
    accountId: string,
  ): Promise<Member[]> {
    const members: Member[] = [];
    for (const slackUserId of memberSlackIds) {
      const member = await this.memberRepository.findByAccountIdAndSlackUserId({
        accountId,
        slackUserId,
      });
      if (!member) continue;
      members.push(member);
    }
    return members;
  }
}
