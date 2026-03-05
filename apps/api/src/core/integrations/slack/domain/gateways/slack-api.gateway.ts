export const SLACK_API_GATEWAY = 'SLACK_API_GATEWAY';

export interface SlackApiMessage {
  ts: string;
  threadTs: string | null;
  userId: string;
  text: string;
  isBot: boolean;
  hasFiles: boolean;
  reactionCount: number;
  replyCount: number;
  subtype: string | null;
}

export interface SlackApiChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  isMember: boolean;
}

export interface SlackApiUser {
  id: string;
  name: string;
  realName: string;
  email: string | null;
  avatarUrl: string | null;
  isBot: boolean;
}

export interface SlackApiPostedMessage {
  ts: string;
  channelId: string;
}

export abstract class SlackApiGateway {
  abstract getChannelHistory(
    token: string,
    channelId: string,
    oldest?: string,
    latest?: string,
  ): Promise<SlackApiMessage[]>;

  abstract getThreadReplies(token: string, channelId: string, threadTs: string): Promise<SlackApiMessage[]>;

  abstract listChannels(token: string): Promise<SlackApiChannel[]>;

  abstract getUserInfo(token: string, userId: string): Promise<SlackApiUser>;

  abstract postMessage(token: string, channelId: string, blocks: unknown[]): Promise<SlackApiPostedMessage>;

  abstract postDM(token: string, userId: string, blocks: unknown[]): Promise<SlackApiPostedMessage>;

  abstract publishAppHome(token: string, userId: string, view: unknown): Promise<void>;
}
