import type { AggregateRootJSON, AggregateRootProps } from 'common/domain';

export interface AccountProps extends AggregateRootProps {
  name: string;
  slackTeamId: string;
}

export interface CreateAccountProps {
  name: string;
  slackTeamId: string;
}

export interface AccountJSON extends AggregateRootJSON {
  name: string;
  slackTeamId: string;
}
