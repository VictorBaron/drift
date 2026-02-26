import { RepositoryInMemory } from 'common/domain/repository.in-memory';

import type { SlackInstallation } from '@/integrations/slack/domain/aggregates/slack-installation.aggregate';
import type {
  SlackInstallationLookup,
  SlackInstallationRepository,
} from '@/integrations/slack/domain/repositories/slack-installation.repository';

export class SlackInstallationRepositoryInMemory
  extends RepositoryInMemory<SlackInstallation>
  implements SlackInstallationRepository
{
  findByTeamAndEnterprise({ teamId, enterpriseId }: SlackInstallationLookup): Promise<SlackInstallation | null> {
    if (!teamId && !enterpriseId) {
      return Promise.resolve(null);
    }
    if (teamId && !enterpriseId) {
      return this.findByTeamId(teamId);
    }
    if (!teamId && enterpriseId) {
      return this.findByEnterpriseId(enterpriseId);
    }
    return (
      this.find(
        (installation) => installation.getTeamId() === teamId && installation.getEnterpriseId() === enterpriseId,
      ) ?? null
    );
  }

  findByTeamId(teamId: string): Promise<SlackInstallation | null> {
    return this.find((installation) => installation.getTeamId() === teamId) ?? null;
  }

  findByEnterpriseId(enterpriseId: string): Promise<SlackInstallation | null> {
    return this.find((installation) => installation.getEnterpriseId() === enterpriseId) ?? null;
  }

  delete(slackInstallation: SlackInstallation): Promise<void> {
    this.aggregates.delete(slackInstallation.id);
    return Promise.resolve();
  }
}
