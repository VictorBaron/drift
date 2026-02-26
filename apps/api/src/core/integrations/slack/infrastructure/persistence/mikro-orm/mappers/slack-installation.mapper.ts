import type { Installation } from '@slack/bolt';
import { TokenEncryption } from 'auth/token-encryption';
import { SlackInstallation } from '@/integrations/slack/domain/aggregates/slack-installation.aggregate';

import { SlackInstallationMikroOrm } from '../models/slack-installation.mikroORM';

export class SlackInstallationMapper {
  static toDomain(raw: SlackInstallationMikroOrm): SlackInstallation {
    return SlackInstallation.reconstitute({
      id: raw.id,
      teamId: raw.teamId,
      teamName: raw.teamName,
      enterpriseId: raw.enterpriseId,
      enterpriseName: raw.enterpriseName,
      userId: raw.userId,
      botToken: raw.botToken,
      userToken: raw.userToken,
      botId: raw.botId,
      botUserId: raw.botUserId,
      tokenType: raw.tokenType,
      isEnterpriseInstall: raw.isEnterpriseInstall,
      rawInstallation: raw.rawInstallation,
      installedAt: raw.installedAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(slackInstallation: SlackInstallation): SlackInstallationMikroOrm {
    const json = slackInstallation.toJSON();
    const entity = SlackInstallationMikroOrm.build({
      id: json.id,
      teamId: json.teamId,
      teamName: json.teamName,
      enterpriseId: json.enterpriseId,
      enterpriseName: json.enterpriseName,
      userId: json.userId,
      botToken: json.botToken,
      userToken: json.userToken,
      botId: json.botId,
      botUserId: json.botUserId,
      tokenType: json.tokenType,
      isEnterpriseInstall: json.isEnterpriseInstall,
      rawInstallation: json.rawInstallation,
      installedAt: json.installedAt,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
      deletedAt: json.deletedAt,
    });
    return entity;
  }

  static toInstallation(
    slackInstallation: SlackInstallation,
    tokenEncryption: TokenEncryption,
  ): Installation<'v1' | 'v2', boolean> {
    const json = slackInstallation.toJSON();
    return {
      team: { id: json.teamId ?? '', name: json.teamName ?? '' },
      enterprise: {
        id: json.enterpriseId ?? '',
        name: json.enterpriseName ?? '',
      },
      user: {
        id: json.userId,
        token: json.userToken ? tokenEncryption.decrypt(json.userToken) : undefined,
        scopes: undefined,
      },
      bot:
        json.botId && json.botToken && json.botUserId
          ? {
              id: json.botId,
              token: tokenEncryption.decrypt(json.botToken),
              userId: json.botUserId,
              scopes: [],
            }
          : undefined,
      tokenType: json.tokenType === 'bot' ? 'bot' : undefined,
      isEnterpriseInstall: json.isEnterpriseInstall,
      appId: undefined,
      metadata: undefined,
    };
  }
}
