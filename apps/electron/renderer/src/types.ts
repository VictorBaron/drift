export interface Message {
  id: string;
  title: string;
  description: string;
  body: string;
  source: string;
  timeAgo: string;
  score: number;
  channelLabel: string | null;
  slackLink: string | null;
}
