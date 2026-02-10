import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MemberFactory } from 'src/core/accounts/__tests__/factories/member.factory';
import {
  Member,
  MemberInvitedEvent,
  MemberJSON,
  MemberRepository,
} from 'src/core/accounts/domain';
import {
  MemberRole,
  MemberRoleLevel,
} from 'src/core/accounts/domain/value-objects';
import { InMemoryMemberRepository } from 'src/core/accounts/infrastructure/persistence/in-memory/in-memory-member.repository';
import { UserFactory } from 'src/core/users/__tests__/factories/user.factory';
import { Email, User, UserRepository } from 'src/core/users/domain';
import { InMemoryUserRepository } from 'src/core/users/infrastructure/persistence/inmemory/user.repository.inmemory';

import {
  InviteMemberCommand,
  InviteMemberHandler,
} from './invite-member.command';

describe('Invite member', () => {
  let handler: InviteMemberHandler;
  let memberRepository: InMemoryMemberRepository;
  let userRepository: InMemoryUserRepository;

  let inviter: Member;

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01'));

    const module = await Test.createTestingModule({
      providers: [
        InviteMemberHandler,
        { provide: MemberRepository, useClass: InMemoryMemberRepository },
        { provide: UserRepository, useClass: InMemoryUserRepository },
      ],
    }).compile();

    handler = module.get<InviteMemberHandler>(InviteMemberHandler);

    memberRepository = module.get<InMemoryMemberRepository>(MemberRepository);
    userRepository = module.get<InMemoryUserRepository>(UserRepository);

    inviter = MemberFactory.createAdmin({
      id: 'inviterId',
      userId: 'inviterUserId',
    });

    memberRepository.clear();
    userRepository.clear();
    await memberRepository.save(inviter);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('when account exists and inviter is an active admin', () => {
    it('should create a new pending member', async () => {
      const command = new InviteMemberCommand({
        email: 'new@email.com',
        actor: inviter,
      });

      const member = await handler.execute(command);

      expect(member).toBeDefined();

      const savedUser = await userRepository.findByEmail('new@email.com');
      expect(savedUser).toBeDefined();

      const savedMember = await memberRepository.findById(member.id);

      expect(savedMember?.toJSON()).toMatchObject<Partial<MemberJSON>>({
        accountId: 'accountId',
        invitedById: 'inviterId',
        role: MemberRoleLevel.USER,
        userId: savedUser?.id,
      });
      expect(savedMember?.isPending()).toBe(true);

      expect(savedMember?.findEvents(MemberInvitedEvent)).toHaveLength(1);
    });
  });

  describe('when inviter is not an admin', () => {
    it('should throw ForbiddenException', async () => {
      inviter = MemberFactory.create({
        id: 'inviterId',
        userId: 'inviterUserId',
        role: MemberRole.create(MemberRoleLevel.USER),
      });
      await memberRepository.save(inviter);

      const command = new InviteMemberCommand({
        email: 'new@email.com',
        actor: inviter,
      });

      await expect(handler.execute(command)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        'Only active admins can invite new members',
      );
    });
  });

  describe('when inviter is an admin but not active', () => {
    it('should throw ForbiddenException when inviter is pending', async () => {
      inviter = MemberFactory.create({
        id: 'inviterId',
        userId: 'inviterUserId',
        role: MemberRole.create(MemberRoleLevel.ADMIN),
        activatedAt: null,
      });
      await memberRepository.save(inviter);

      const command = new InviteMemberCommand({
        email: 'new@email.com',
        actor: inviter,
      });

      await expect(handler.execute(command)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        'Only active admins can invite new members',
      );
    });

    it('should throw ForbiddenException when inviter is disabled', async () => {
      inviter = MemberFactory.create({
        id: 'inviterId',
        userId: 'inviterUserId',
        role: MemberRole.create(MemberRoleLevel.ADMIN),
        activatedAt: new Date(),
        disabledAt: new Date(),
      });

      await memberRepository.save(inviter);

      const command = new InviteMemberCommand({
        email: 'new@email.com',
        actor: inviter,
      });

      await expect(handler.execute(command)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        'Only active admins can invite new members',
      );
    });
  });

  describe('when user is already a member', () => {
    const existingUserEmail = 'existing@email.com';
    let existingUser: User;

    beforeEach(async () => {
      existingUser = UserFactory.create({
        email: Email.create(existingUserEmail),
      });
      userRepository.clear();
      await userRepository.save(existingUser);
    });

    describe('member is active', () => {
      it('should throw ConflictException', async () => {
        const existingMember = MemberFactory.create({
          accountId: 'accountId',
          userId: existingUser.id,
          activatedAt: new Date(),
        });

        await memberRepository.save(existingMember);

        const command = new InviteMemberCommand({
          email: existingUserEmail,
          actor: inviter,
        });

        await expect(handler.execute(command)).rejects.toThrow(
          ConflictException,
        );
        await expect(handler.execute(command)).rejects.toThrow(
          'User is already a member of this account',
        );
      });
    });

    describe('member is pending', () => {
      it('should send another invitation', async () => {
        const existingMember = MemberFactory.create({
          accountId: 'accountId',
          userId: existingUser.id,
          activatedAt: null,
          invitedAt: new Date('2025-01-01'),
        });

        await memberRepository.save(existingMember);

        const command = new InviteMemberCommand({
          email: existingUserEmail,
          actor: inviter,
        });

        const member = await handler.execute(command);

        expect(member).toBeDefined();

        const savedMember = await memberRepository.findByAccountIdAndUserId({
          accountId: 'accountId',
          userId: existingUser.id,
        });

        expect(savedMember?.toJSON()).toMatchObject<Partial<MemberJSON>>({
          userId: existingUser.id,
          accountId: 'accountId',
          invitedById: 'inviterId',
          role: MemberRoleLevel.USER,
          invitedAt: new Date(),
          activatedAt: null,
          disabledAt: null,
        });
        expect(savedMember?.isPending()).toBe(true);
      });
    });

    describe('member is disabled', () => {
      it('should enable and re-invite the user if it is disabled', async () => {
        const existingMember = MemberFactory.create({
          accountId: 'accountId',
          userId: existingUser.id,
          activatedAt: new Date('2025-06-01'),
          disabledAt: new Date('2025-06-02'),
          invitedAt: new Date('2025-01-01'),
        });

        await memberRepository.save(existingMember);

        const command = new InviteMemberCommand({
          email: existingUserEmail,
          actor: inviter,
        });

        const member = await handler.execute(command);

        expect(member).toBeDefined();

        const savedMember = await memberRepository.findByAccountIdAndUserId({
          accountId: 'accountId',
          userId: existingUser.id,
        });

        expect(savedMember?.toJSON()).toMatchObject<Partial<MemberJSON>>({
          userId: existingUser.id,
          accountId: 'accountId',
          invitedById: 'inviterId',
          role: MemberRoleLevel.USER,
          invitedAt: new Date(),
          activatedAt: null,
          disabledAt: null,
        });
        expect(savedMember?.isPending()).toBe(true);
      });
    });
  });
});
