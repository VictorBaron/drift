import { Injectable } from '@nestjs/common';
import { WebClient } from '@slack/web-api';

import type { SlackUserInfo, SlackUsersGateway } from '@/accounts/domain/gateways/slack-users.gateway';

@Injectable()
export class WebApiSlackUsersGateway implements SlackUsersGateway {
  async listTeamMembers(botToken: string): Promise<SlackUserInfo[]> {
    const client = new WebClient(botToken);
    const users: SlackUserInfo[] = [];
    let cursor: string | undefined;

    do {
      const response = await client.users.list({ cursor, limit: 200 });

      for (const member of response.members ?? []) {
        if (!member.id) continue;
        users.push({
          slackId: member.id,
          email: member.profile?.email ?? null,
          name: member.real_name ?? member.name ?? 'Unknown',
          isBot: member.is_bot ?? false,
          deleted: member.deleted ?? false,
        });
      }

      cursor = response.response_metadata?.next_cursor || undefined;
    } while (cursor);

    return users;
  }
}
