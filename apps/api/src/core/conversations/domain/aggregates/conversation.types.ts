import type { AggregateRootJSON, AggregateRootProps } from 'common/domain';

export interface ConversationProps extends AggregateRootProps {
  accountId: string;
  slackConversationId: string;
  memberIds: string[];
  isGroupDm: boolean;
}

export interface CreateConversationProps {
  accountId: string;
  slackConversationId: string;
  memberIds: string[];
  isGroupDm: boolean;
}

export interface UpdateConversationProps {
  memberIds: string[];
}

export interface ConversationJSON extends AggregateRootJSON {
  accountId: string;
  slackConversationId: string;
  memberIds: string[];
  isGroupDm: boolean;
}
