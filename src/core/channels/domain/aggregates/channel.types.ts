import type { AggregateRootJSON, AggregateRootProps } from 'common/domain';

export interface ChannelProps extends AggregateRootProps {
  accountId: string;
  slackChannelId: string;
  name: string;
  topic: string;
  purpose: string;
  isPrivate: boolean;
  isArchived: boolean;
  memberIds: string[];
}

export interface CreateChannelProps {
  accountId: string;
  slackChannelId: string;
  name: string;
  topic: string;
  purpose: string;
  isPrivate: boolean;
  isArchived: boolean;
  memberIds: string[];
}

export interface UpdateChannelProps {
  name: string;
  topic: string;
  purpose: string;
  isPrivate: boolean;
  isArchived: boolean;
  memberIds: string[];
}

export interface ChannelJSON extends AggregateRootJSON {
  accountId: string;
  slackChannelId: string;
  name: string;
  topic: string;
  purpose: string;
  isPrivate: boolean;
  isArchived: boolean;
  memberIds: string[];
}
