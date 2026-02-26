import { Test } from '@nestjs/testing';
import type { MemberJSON } from '@/accounts/domain/aggregates/member.aggregate';
import { Member } from '@/accounts/domain/aggregates/member.aggregate';
import type { OrganizationJSON } from '@/accounts/domain/aggregates/organization.aggregate';
import { Organization } from '@/accounts/domain/aggregates/organization.aggregate';
import { MemberRepository } from '@/accounts/domain/repositories/member.repository';
import { OrganizationRepository } from '@/accounts/domain/repositories/organization.repository';
import { MemberRepositoryInMemory } from '@/accounts/infrastructure/persistence/in-memory/member.repository.in-memory';
import { OrganizationRepositoryInMemory } from '@/accounts/infrastructure/persistence/in-memory/organization.repository.in-memory';

import {
  RegisterSlackInstallationCommand,
  RegisterSlackInstallationHandler,
} from './register-slack-installation.handler';

describe('RegisterSlackInstallation', () => {
  let handler: RegisterSlackInstallationHandler;
  let orgRepo: OrganizationRepositoryInMemory;
  let memberRepo: MemberRepositoryInMemory;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RegisterSlackInstallationHandler,
        { provide: OrganizationRepository, useClass: OrganizationRepositoryInMemory },
        { provide: MemberRepository, useClass: MemberRepositoryInMemory },
      ],
    }).compile();

    handler = module.get<RegisterSlackInstallationHandler>(RegisterSlackInstallationHandler);
    orgRepo = module.get<OrganizationRepositoryInMemory>(OrganizationRepository);
    memberRepo = module.get<MemberRepositoryInMemory>(MemberRepository);

    orgRepo.clear();
    memberRepo.clear();
  });

  describe('when no organization exists for the team', () => {
    it('should create a new organization and an admin member', async () => {
      const command = new RegisterSlackInstallationCommand(
        'T_NEW',
        'New Team',
        'enc-bot-token',
        'U_ALICE',
        null,
        'alice@example.com',
        'Alice',
        'https://example.com/alice.png',
      );

      const result = await handler.execute(command);

      const savedOrg = await orgRepo.findBySlackTeamId('T_NEW');
      expect(savedOrg?.toJSON()).toMatchObject<Partial<OrganizationJSON>>({
        name: 'New Team',
        slackTeamId: 'T_NEW',
        slackBotToken: 'enc-bot-token',
      });

      const savedMember = await memberRepo.findById(result.memberId);
      expect(savedMember?.toJSON()).toMatchObject<Partial<MemberJSON>>({
        slackUserId: 'U_ALICE',
        email: 'alice@example.com',
        name: 'Alice',
        avatarUrl: 'https://example.com/alice.png',
        role: 'admin',
        organizationId: result.orgId,
      });
    });
  });

  describe('when an organization already exists for the team', () => {
    it('should update the bot token and create a member with role member', async () => {
      const existingOrg = Organization.create({
        name: 'Existing Team',
        slackTeamId: 'T_EXISTING',
        slackBotToken: 'old-enc-bot-token',
      });
      await orgRepo.save(existingOrg);

      const command = new RegisterSlackInstallationCommand(
        'T_EXISTING',
        'Existing Team',
        'new-enc-bot-token',
        'U_BOB',
        null,
        'bob@example.com',
        'Bob',
        null,
      );

      const result = await handler.execute(command);

      const savedOrg = await orgRepo.findBySlackTeamId('T_EXISTING');
      expect(savedOrg?.toJSON()).toMatchObject<Partial<OrganizationJSON>>({
        id: existingOrg.getId(),
        slackBotToken: 'new-enc-bot-token',
      });

      const savedMember = await memberRepo.findById(result.memberId);
      expect(savedMember?.toJSON()).toMatchObject<Partial<MemberJSON>>({
        slackUserId: 'U_BOB',
        role: 'member',
        organizationId: existingOrg.getId(),
      });
    });

    it('should not create a duplicate member when the member already exists', async () => {
      const existingOrg = Organization.create({
        name: 'Existing Team',
        slackTeamId: 'T_EXISTING',
        slackBotToken: 'old-enc-bot-token',
      });
      await orgRepo.save(existingOrg);

      const existingMember = Member.create({
        email: 'carol@example.com',
        name: 'Carol',
        slackUserId: 'U_CAROL',
        avatarUrl: null,
        role: 'admin',
        organizationId: existingOrg.getId(),
      });
      await memberRepo.save(existingMember);

      const command = new RegisterSlackInstallationCommand(
        'T_EXISTING',
        'Existing Team',
        'new-enc-bot-token',
        'U_CAROL',
        null,
        'carol@example.com',
        'Carol',
        null,
      );

      const result = await handler.execute(command);

      const allMembers = await memberRepo.findByOrganizationId(existingOrg.getId());
      expect(allMembers).toHaveLength(1);
      expect(result.memberId).toBe(existingMember.getId());
    });
  });

  describe('when an encrypted user token is provided', () => {
    it('should store the user token on the organization', async () => {
      const command = new RegisterSlackInstallationCommand(
        'T_WITH_USER_TOKEN',
        'Token Team',
        'enc-bot-token',
        'U_DAVE',
        'enc-user-token',
        'dave@example.com',
        'Dave',
        null,
      );

      await handler.execute(command);

      const savedOrg = await orgRepo.findBySlackTeamId('T_WITH_USER_TOKEN');
      expect(savedOrg?.toJSON()).toMatchObject<Partial<OrganizationJSON>>({
        slackUserTokens: { U_DAVE: 'enc-user-token' },
      });
    });

    it('should store the user token on an existing organization', async () => {
      const existingOrg = Organization.create({
        name: 'Existing Team',
        slackTeamId: 'T_EXISTING_TOKEN',
        slackBotToken: 'old-enc-bot-token',
      });
      await orgRepo.save(existingOrg);

      const command = new RegisterSlackInstallationCommand(
        'T_EXISTING_TOKEN',
        'Existing Team',
        'new-enc-bot-token',
        'U_EVE',
        'enc-user-token-eve',
        'eve@example.com',
        'Eve',
        null,
      );

      await handler.execute(command);

      const savedOrg = await orgRepo.findBySlackTeamId('T_EXISTING_TOKEN');
      expect(savedOrg?.toJSON()).toMatchObject<Partial<OrganizationJSON>>({
        slackUserTokens: { U_EVE: 'enc-user-token-eve' },
      });
    });
  });

  describe('when no encrypted user token is provided', () => {
    it('should not add any user token to the organization', async () => {
      const command = new RegisterSlackInstallationCommand(
        'T_NO_USER_TOKEN',
        'No Token Team',
        'enc-bot-token',
        'U_FRANK',
        null,
        'frank@example.com',
        'Frank',
        null,
      );

      await handler.execute(command);

      const savedOrg = await orgRepo.findBySlackTeamId('T_NO_USER_TOKEN');
      expect(savedOrg?.toJSON()).toMatchObject<Partial<OrganizationJSON>>({
        slackUserTokens: {},
      });
    });
  });
});
