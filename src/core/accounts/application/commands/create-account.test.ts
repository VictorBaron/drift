import { Test } from '@nestjs/testing';

import {
  Account,
  AccountCreatedEvent,
  type AccountJSON,
  AccountRepository,
  type MemberJSON,
  MemberRepository,
} from '@/accounts/domain';
import { MemberRoleLevel } from '@/accounts/domain/value-objects';
import { AccountRepositoryInMemory } from '@/accounts/infrastructure/persistence/in-memory/account.repository.in-memory';
import { MemberRepositoryInMemory } from '@/accounts/infrastructure/persistence/in-memory/member.repository.in-memory';
import { UserFactory } from '@/users/__tests__/factories/user.factory';
import { UserRepository } from '@/users/domain';
import { UserRepositoryInMemory } from '@/users/infrastructure/persistence/inmemory/user.repository.in-memory';
import { CreateAccount, CreateAccountCommand } from './create-account';

describe('Create Account', () => {
  let handler: CreateAccount;
  let accountRepository: AccountRepositoryInMemory;
  let memberRepository: MemberRepositoryInMemory;
  let userRepository: UserRepositoryInMemory;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CreateAccount,
        { provide: AccountRepository, useClass: AccountRepositoryInMemory },
        { provide: MemberRepository, useClass: MemberRepositoryInMemory },
        { provide: UserRepository, useClass: UserRepositoryInMemory },
      ],
    }).compile();

    handler = module.get<CreateAccount>(CreateAccount);
    accountRepository = module.get<AccountRepositoryInMemory>(AccountRepository);
    memberRepository = module.get<MemberRepositoryInMemory>(MemberRepository);
    userRepository = module.get<UserRepositoryInMemory>(UserRepository);

    accountRepository.clear();
    memberRepository.clear();
    userRepository.save(UserFactory.create({ id: 'user-abc' }));
  });

  describe('when valid props are provided', () => {
    it('should create an account with the given name and slackTeamId', async () => {
      const command = new CreateAccountCommand({
        name: 'Acme Corp',
        slackTeamId: 'T01234',
        creatorUserId: 'user-abc',
      });

      const account = await handler.execute(command);
      expect(account).toBeInstanceOf(Account);

      const saved = await accountRepository.findBySlackTeamId('T01234');

      expect(saved?.toJSON()).toMatchObject<Partial<AccountJSON>>({
        name: 'Acme Corp',
        slackTeamId: 'T01234',
      });
    });

    it('should create a founder member for the creator user', async () => {
      const command = new CreateAccountCommand({
        name: 'Acme Corp',
        slackTeamId: 'T01234',
        creatorUserId: 'user-abc',
      });

      const account = await handler.execute(command);

      const members = await memberRepository.findByAccountId(account.getId());
      expect(members).toHaveLength(1);

      const founder = members[0];
      expect(founder.toJSON()).toMatchObject<Partial<MemberJSON>>({
        accountId: account.getId(),
        userId: 'user-abc',
        role: MemberRoleLevel.ADMIN,
      });
      expect(founder.isActive()).toBe(true);

      expect(account.findEvents(AccountCreatedEvent)).toHaveLength(1);
    });
  });
});
