import type {
  SlackConversationInfo,
  SlackConversationsGateway,
} from '@/conversations/domain/gateways/slack-conversations.gateway';

export class FakeSlackConversationsGateway
  implements SlackConversationsGateway
{
  private conversations: SlackConversationInfo[] = [];

  async listUserConversations(
    _userToken: string,
  ): Promise<SlackConversationInfo[]> {
    return this.conversations;
  }

  setConversations(conversations: SlackConversationInfo[]) {
    this.conversations = conversations;
  }
}
