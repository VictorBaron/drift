import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AccountFactory } from '@/accounts/__tests__/factories/account.factory';
import { MemberFactory } from '@/accounts/__tests__/factories/member.factory';
import { AccountRepository, type MemberJSON, MemberRepository } from '@/accounts/domain';
import { AccountRepositoryInMemory } from '@/accounts/infrastructure/persistence/in-memory/account.repository.in-memory';
import { MemberRepositoryInMemory } from '@/accounts/infrastructure/persistence/in-memory/member.repository.in-memory';
import { UserFactory } from '@/users/__tests__/factories/user.factory';

import { StartFocusTime, StartFocusTimeCommand } from './start-focus-time';

describe('StartFocusTime', () => {
  let handler: StartFocusTime;
  let accountRepository: AccountRepositoryInMemory;
  let memberRepository: MemberRepositoryInMemory;

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T10:00:00.000Z'));

    const module = await Test.createTestingModule({
      providers: [
        StartFocusTime,
        { provide: AccountRepository, useClass: AccountRepositoryInMemory },
        { provide: MemberRepository, useClass: MemberRepositoryInMemory },
      ],
    }).compile();

    handler = module.get<StartFocusTime>(StartFocusTime);
    accountRepository = module.get<AccountRepositoryInMemory>(AccountRepository);
    memberRepository = module.get<MemberRepositoryInMemory>(MemberRepository);

    accountRepository.clear();
    memberRepository.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('when account and member exist and member is active', () => {
    it('should start focus time for a member identified by slackUserId and teamId', async () => {
      const account = AccountFactory.create({ id: 'accountId', slackTeamId: 'T_TEST' });
      const user = UserFactory.create({ id: 'userId', slackId: 'U123' });
      const member = MemberFactory.create({ id: 'memberId', accountId: 'accountId', user });

      await accountRepository.save(account);
      await memberRepository.save(member);

      const command = new StartFocusTimeCommand({
        slackUserId: 'U123',
        teamId: 'T_TEST',
        minutes: 30,
      });

      const result = await handler.execute(command);

      expect(result.isInFocusTime()).toBe(true);
    });

    it('should persist the updated member with focusEndsAt set', async () => {
      const account = AccountFactory.create({ id: 'accountId', slackTeamId: 'T_TEST' });
      const user = UserFactory.create({ id: 'userId', slackId: 'U123' });
      const member = MemberFactory.create({ id: 'memberId', accountId: 'accountId', user });

      await accountRepository.save(account);
      await memberRepository.save(member);

      const command = new StartFocusTimeCommand({
        slackUserId: 'U123',
        teamId: 'T_TEST',
        minutes: 30,
      });

      await handler.execute(command);

      const savedMember = await memberRepository.findById('memberId');

      expect(savedMember?.isInFocusTime()).toBe(true);
      expect(savedMember?.toJSON()).toMatchObject<Partial<MemberJSON>>({
        id: 'memberId',
        accountId: 'accountId',
      });
      expect(savedMember?.getFocusEndsAt()).toEqual(new Date('2026-01-01T10:30:00.000Z'));
    });
  });

  describe('when no account is found for the teamId', () => {
    it('should throw NotFoundException', async () => {
      const command = new StartFocusTimeCommand({
        slackUserId: 'U123',
        teamId: 'T_UNKNOWN',
        minutes: 30,
      });

      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
    });
  });

  describe('when no member is found for the slackUserId', () => {
    it('should throw NotFoundException', async () => {
      const account = AccountFactory.create({ id: 'accountId', slackTeamId: 'T_TEST' });
      await accountRepository.save(account);

      const command = new StartFocusTimeCommand({
        slackUserId: 'U_UNKNOWN',
        teamId: 'T_TEST',
        minutes: 30,
      });

      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
    });
  });

  describe('when member is not active', () => {
    it('should throw when member is pending', async () => {
      const account = AccountFactory.create({ id: 'accountId', slackTeamId: 'T_TEST' });
      const user = UserFactory.create({ id: 'userId', slackId: 'U123' });
      const pendingMember = MemberFactory.createPending({ id: 'memberId', accountId: 'accountId', user });

      await accountRepository.save(account);
      await memberRepository.save(pendingMember);

      const command = new StartFocusTimeCommand({
        slackUserId: 'U123',
        teamId: 'T_TEST',
        minutes: 30,
      });

      await expect(handler.execute(command)).rejects.toThrow();
    });
  });
});
