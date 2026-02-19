import { Injectable } from '@nestjs/common';
import { WebClient } from '@slack/web-api';

import type {
  SlackConversationInfo,
  SlackConversationsGateway,
} from '@/conversations/domain/gateways/slack-conversations.gateway';

@Injectable()
export class WebApiSlackConversationsGateway
  implements SlackConversationsGateway
{
  async listUserConversations(
    userToken: string,
  ): Promise<SlackConversationInfo[]> {
    const client = new WebClient(userToken);
    const conversations: SlackConversationInfo[] = [];
    let cursor: string | undefined;

    do {
      const response = await client.conversations.list({
        cursor,
        limit: 200,
        types: 'im,mpim',
      });

      for (const channel of response.channels ?? []) {
        if (!channel.id) continue;

        const isGroupDm = channel.is_mpim ?? false;

        const membersResponse = await client.conversations.members({
          channel: channel.id,
          limit: 200,
        });

        const memberSlackIds = membersResponse.members ?? [];

        conversations.push({
          slackConversationId: channel.id,
          memberSlackIds,
          isGroupDm,
        });
      }

      cursor = response.response_metadata?.next_cursor || undefined;
    } while (cursor);

    return conversations;
  }
}
