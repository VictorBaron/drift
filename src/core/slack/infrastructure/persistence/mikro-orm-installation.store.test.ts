import { CommandBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import type { Installation } from '@slack/bolt';

import { SlackInstallationFactory } from '@/slack/__tests__/factories/slack-installation.factory';
import { SlackInstallationRepository } from '@/slack/domain/slack-installation.repository';

import { SlackInstallationRepositoryInMemory } from './in-memory/slack-installation.repository.in-memory';
import { SlackInstallationStore } from './slack-installation.store';

function buildInstallation(overrides: Record<string, unknown> = {}): Installation<'v1' | 'v2', boolean> {
  return {
    team: { id: 'T123', name: 'Test Team' },
    enterprise: undefined,
    user: { id: 'U456', token: 'xoxp-user-token', scopes: ['channels:read'] },
    bot: {
      token: 'xoxb-bot-token',
      scopes: ['chat:write'],
      id: 'B789',
      userId: 'UB789',
    },
    tokenType: 'bot' as const,
    isEnterpriseInstall: false,
    appId: 'A111',
    ...overrides,
  };
}

describe('SlackInstallation Store', () => {
  let store: SlackInstallationStore;
  let repository: SlackInstallationRepositoryInMemory;

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01'));

    const module = await Test.createTestingModule({
      providers: [
        SlackInstallationStore,
        {
          provide: SlackInstallationRepository,
          useClass: SlackInstallationRepositoryInMemory,
        },
        {
          provide: CommandBus,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    repository = module.get<SlackInstallationRepositoryInMemory>(SlackInstallationRepository);
    store = module.get<SlackInstallationStore>(SlackInstallationStore);

    repository.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('storeInstallation', () => {
    it('should create a new installation when none exists', async () => {
      await store.storeInstallation(buildInstallation());

      const installation = await repository.findByTeamId('T123');
      expect(installation?.toJSON()).toMatchObject(
        expect.objectContaining({
          teamId: 'T123',
          enterpriseId: null,
          userId: 'U456',
          botToken: 'xoxb-bot-token',
          userToken: 'xoxp-user-token',
          botId: 'B789',
          botUserId: 'UB789',
          isEnterpriseInstall: false,
        }),
      );
    });

    it('should update an existing installation', async () => {
      const existing = SlackInstallationFactory.create({
        teamId: 'T123',
        enterpriseId: undefined,
        userId: 'U_OLD',
        botToken: 'old-bot',
        userToken: 'old-user',
        botId: 'B_OLD',
        botUserId: 'UB_OLD',
        tokenType: 'bot',
        isEnterpriseInstall: false,
      });
      await repository.save(existing);

      await store.storeInstallation(buildInstallation());

      const updated = await repository.findById(existing.id);
      expect(updated?.toJSON()).toMatchObject(
        expect.objectContaining({
          userId: 'U456',
          botToken: 'xoxb-bot-token',
          userToken: 'xoxp-user-token',
        }),
      );
    });

    it('should handle enterprise installations', async () => {
      await store.storeInstallation(
        buildInstallation({
          team: undefined,
          enterprise: { id: 'E999', name: 'Enterprise Org' },
          isEnterpriseInstall: true,
        }),
      );

      const installation = await repository.findByEnterpriseId('E999');
      expect(installation?.toJSON()).toMatchObject(
        expect.objectContaining({
          teamId: null,
          enterpriseId: 'E999',
          isEnterpriseInstall: true,
        }),
      );
    });
  });

  describe('deleteInstallation', () => {
    it('should soft-delete via repository', async () => {
      const existing = SlackInstallationFactory.create({
        teamId: 'T123',
        enterpriseId: undefined,
        isEnterpriseInstall: false,
      });
      await repository.save(existing);

      await store.deleteInstallation({
        teamId: 'T123',
        enterpriseId: undefined,
        isEnterpriseInstall: false,
      });

      const deleted = await repository.findById(existing.id);
      expect(deleted).toMatchObject(
        expect.objectContaining({
          deletedAt: new Date('2026-01-01'),
        }),
      );
    });

    it('should throw when installation to delete is not found', async () => {
      await expect(
        store.deleteInstallation({
          teamId: 'T_MISSING',
          enterpriseId: undefined,
          isEnterpriseInstall: false,
        }),
      ).rejects.toThrow('Installation not found');
    });
  });
});
