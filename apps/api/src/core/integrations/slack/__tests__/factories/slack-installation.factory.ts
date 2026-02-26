import {
  SlackInstallation,
  type SlackInstallationJSON,
} from '@/integrations/slack/domain/aggregates/slack-installation.aggregate';

export class SlackInstallationFactory {
  static create(overrides?: Partial<SlackInstallationJSON>): SlackInstallation {
    return SlackInstallation.reconstitute({
      id: 'slackInstallationId',
      teamId: 'teamId',
      teamName: 'Team',
      enterpriseId: 'enterpriseId',
      enterpriseName: 'Enterprise',
      userId: 'userId',
      botToken: 'botToken',
      userToken: 'userToken',
      botId: 'botId',
      botUserId: 'botUserId',
      tokenType: 'bot',
      isEnterpriseInstall: false,
      rawInstallation: {},
      installedAt: new Date('2025-01-01'),
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      deletedAt: null,
      ...overrides,
    });
  }
}
