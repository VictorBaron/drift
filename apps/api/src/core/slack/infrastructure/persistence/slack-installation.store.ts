import { Injectable } from '@nestjs/common';
import type { Installation, InstallationQuery, InstallationStore } from '@slack/bolt';
import { type CreateSlackInstallationProps, SlackInstallation } from '@/slack/domain/slack-installation.aggregate';
import { SlackInstallationRepository } from '@/slack/domain/slack-installation.repository';
import { SlackInstallationMapper } from './mikro-orm/slack-installation.mapper';

@Injectable()
export class SlackInstallationStore implements InstallationStore {
  constructor(private readonly repository: SlackInstallationRepository) {}

  async storeInstallation<AuthVersion extends 'v1' | 'v2'>(
    installation: Installation<AuthVersion, boolean>,
  ): Promise<void> {
    const teamId = installation.team?.id ?? null;
    const enterpriseId = installation.enterprise?.id ?? null;

    const fields: CreateSlackInstallationProps = {
      teamId,
      teamName: installation.team?.name ?? null,
      enterpriseId,
      enterpriseName: installation.enterprise?.name ?? null,
      userId: installation.user.id,
      botToken: installation.bot?.token ?? null,
      userToken: installation.user.token ?? null,
      botId: installation.bot?.id ?? null,
      botUserId: installation.bot?.userId ?? null,
      tokenType: installation.tokenType ?? null,
      isEnterpriseInstall: installation.isEnterpriseInstall ?? false,
      rawInstallation: installation as unknown as Record<string, unknown>,
    };

    await this.createOrUpdate({ fields });

    if (!teamId) return;
    if (!fields.botToken) return;
  }

  async createOrUpdate({ fields }: { fields: CreateSlackInstallationProps }): Promise<SlackInstallation> {
    const { teamId, enterpriseId } = fields;
    const existing = await this.repository.findByTeamAndEnterprise({
      teamId,
      enterpriseId,
    });

    if (existing) {
      existing.update(fields);
      await this.repository.save(existing);
      return existing;
    }

    const slackInstallation = SlackInstallation.create(fields);

    await this.repository.save(slackInstallation);
    return slackInstallation;
  }

  async fetchInstallation(query: InstallationQuery<boolean>): Promise<Installation<'v1' | 'v2', boolean>> {
    const entity = await this.findByQuery(query);

    if (!entity) {
      throw new Error(`Installation not found for team=${query.teamId} enterprise=${query.enterpriseId}`);
    }

    return SlackInstallationMapper.toInstallation(entity);
  }

  async deleteInstallation(query: InstallationQuery<boolean>): Promise<void> {
    const slackInstallation = await this.findByQuery(query);

    if (!slackInstallation) {
      throw new Error(`Installation not found for team=${query.teamId} enterprise=${query.enterpriseId}`);
    }
    slackInstallation.delete();

    await this.repository.save(slackInstallation);
  }

  private async findByQuery(query: InstallationQuery<boolean>) {
    if (query.isEnterpriseInstall && query.enterpriseId) {
      return this.repository.findByEnterpriseId(query.enterpriseId);
    }

    if (query.teamId) {
      return this.repository.findByTeamId(query.teamId);
    }

    throw new Error('Either teamId or enterpriseId is required to look up an installation');
  }
}
