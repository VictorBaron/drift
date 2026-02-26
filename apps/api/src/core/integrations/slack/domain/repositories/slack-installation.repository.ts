import { RepositoryPort } from 'common/domain';

import type { SlackInstallation } from '../aggregates/slack-installation.aggregate';

export interface SlackInstallationLookup {
  teamId: string | null;
  enterpriseId: string | null;
}

export abstract class SlackInstallationRepository extends RepositoryPort<SlackInstallation> {
  abstract findByTeamAndEnterprise({
    teamId,
    enterpriseId,
  }: SlackInstallationLookup): Promise<SlackInstallation | null>;
  abstract findByTeamId(teamId: string): Promise<SlackInstallation | null>;
  abstract findByEnterpriseId(enterpriseId: string): Promise<SlackInstallation | null>;
  abstract save(slackInstallation: SlackInstallation): Promise<void>;
  abstract delete(slackInstallation: SlackInstallation): Promise<void>;
}
