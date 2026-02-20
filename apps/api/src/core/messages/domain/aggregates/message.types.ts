import { GenericMessageEvent } from '@slack/web-api';
import type { AggregateRootJSON, AggregateRootProps } from 'common/domain';
import { Member } from '@/accounts';

export interface MessageProps extends AggregateRootProps {
  accountId: string;
  senderId: string;
  slackTs: string;
  slackChannelId: string;
  slackChannelType: GenericMessageEvent['channel_type'];
  slackThreadTs: string | null;
  text: string | null;
  urgencyScore: number | null;
  urgencyReasoning: string | null;
}
export interface CreateMessageProps {
  sender: Member;
  slackTs: string;
  slackChannelId: string;
  slackChannelType: GenericMessageEvent['channel_type'];
  slackThreadTs: string | null;
  text: string | null;
}

export interface MessageJSON extends AggregateRootJSON {
  accountId: string;
  senderId: string;
  slackTs: string;
  slackChannelId: string;
  slackChannelType: GenericMessageEvent['channel_type'];
  slackThreadTs: string | null;
  text: string | null;
  urgencyScore: number | null;
  urgencyReasoning: string | null;
}
