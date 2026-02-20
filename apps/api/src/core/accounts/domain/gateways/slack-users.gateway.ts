export interface SlackUserInfo {
  slackId: string;
  email: string | null;
  name: string;
  isBot: boolean;
  deleted: boolean;
}

export const SLACK_USERS_GATEWAY = 'SLACK_USERS_GATEWAY';

export interface SlackUsersGateway {
  listTeamMembers(botToken: string): Promise<SlackUserInfo[]>;
}
