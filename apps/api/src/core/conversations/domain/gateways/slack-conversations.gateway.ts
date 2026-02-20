export interface SlackConversationInfo {
  slackConversationId: string;
  memberSlackIds: string[];
  isGroupDm: boolean;
}

export const SLACK_CONVERSATIONS_GATEWAY = 'SLACK_CONVERSATIONS_GATEWAY';

export interface SlackConversationsGateway {
  listUserConversations(userToken: string): Promise<SlackConversationInfo[]>;
}
