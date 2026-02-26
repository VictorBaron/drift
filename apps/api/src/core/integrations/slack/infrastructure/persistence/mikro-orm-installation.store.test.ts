import { CommandBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import type { Installation } from '@slack/bolt';
import { TokenEncryption } from 'auth/token-encryption';
import { SlackInstallationFactory } from '@/integrations/slack/__tests__/factories/slack-installation.factory';
import { SlackInstallationJSON } from '@/integrations/slack/domain/aggregates/slack-installation.aggregate';
import { SlackInstallationRepository } from '@/integrations/slack/domain/repositories/slack-installation.repository';
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
        {
          provide: TokenEncryption,
          useValue: {
            encrypt: jest.fn().mockReturnValue('enc-bot-token'),
            decrypt: jest.fn().mockReturnValue('xoxb-bot-token'),
          },
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
      expect(installation?.toJSON()).toMatchObject<Partial<SlackInstallationJSON>>(
        expect.objectContaining({
          teamId: 'T123',
          enterpriseId: null,
          userId: 'U456',
          botToken: 'enc-bot-token',
          userToken: 'enc-bot-token',
          botId: 'B789',
          botUserId: 'UB789',
          isEnterpriseInstall: false,
          rawInstallation: expect.objectContaining({
            appId: 'A111',
            bot: expect.objectContaining({
              id: 'B789',
              scopes: ['chat:write'],
              token: 'xoxb-bot-token',
              userId: 'UB789',
            }),
            enterprise: undefined,
            isEnterpriseInstall: false,
            team: expect.objectContaining({
              id: 'T123',
              name: 'Test Team',
            }),
            tokenType: 'bot',
            user: expect.objectContaining({
              id: 'U456',
              scopes: ['channels:read'],
              token: 'xoxp-user-token',
            }),
          }),
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
      expect(updated?.toJSON()).toMatchObject<Partial<SlackInstallationJSON>>(
        expect.objectContaining({
          userId: 'U456',
          botToken: 'enc-bot-token',
          userToken: 'enc-bot-token',
          rawInstallation: expect.objectContaining({
            appId: 'A111',
            bot: expect.objectContaining({
              id: 'B789',
              scopes: ['chat:write'],
              token: 'xoxb-bot-token',
              userId: 'UB789',
            }),
          }),
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
