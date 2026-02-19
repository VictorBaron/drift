import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { MemberFactory } from '@/accounts/__tests__/factories/member.factory';
import { type Member, MemberInvitedEvent, type MemberJSON, MemberRepository } from '@/accounts/domain';
import { MemberRole, MemberRoleLevel } from '@/accounts/domain/value-objects';
import { MemberRepositoryInMemory } from '@/accounts/infrastructure/persistence/in-memory/member.repository.in-memory';
import { UserFactory } from '@/users/__tests__/factories/user.factory';
import { Email, type User, UserRepository } from '@/users/domain';
import { UserRepositoryInMemory } from '@/users/infrastructure/persistence/inmemory/user.repository.in-memory';

import { InviteMember, InviteMemberCommand } from './invite-member';

describe('Invite member', () => {
  let handler: InviteMember;
  let memberRepository: MemberRepositoryInMemory;
  let userRepository: UserRepositoryInMemory;

  let inviter: Member;
  let inviterUser: User;

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01'));

    const module = await Test.createTestingModule({
      providers: [
        InviteMember,
        { provide: MemberRepository, useClass: MemberRepositoryInMemory },
        { provide: UserRepository, useClass: UserRepositoryInMemory },
      ],
    }).compile();

    handler = module.get<InviteMember>(InviteMember);

    memberRepository = module.get<MemberRepositoryInMemory>(MemberRepository);
    userRepository = module.get<UserRepositoryInMemory>(UserRepository);

    inviterUser = UserFactory.create({ id: 'inviterUserId' });
    inviter = MemberFactory.createAdmin({
      id: 'inviterId',
      user: inviterUser,
    });

    memberRepository.clear();
    userRepository.clear();
    await memberRepository.save(inviter);
    await userRepository.save(inviterUser);
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
        user: inviterUser,
        role: MemberRole.create(MemberRoleLevel.USER),
      });
      await memberRepository.save(inviter);

      const command = new InviteMemberCommand({
        email: 'new@email.com',
        actor: inviter,
      });

      await expect(handler.execute(command)).rejects.toThrow(ForbiddenException);
      await expect(handler.execute(command)).rejects.toThrow('Only active admins can invite new members');
    });
  });

  describe('when inviter is an admin but not active', () => {
    it('should throw ForbiddenException when inviter is pending', async () => {
      inviter = MemberFactory.create({
        id: 'inviterId',
        user: inviterUser,
        role: MemberRole.create(MemberRoleLevel.ADMIN),
        activatedAt: null,
      });
      await memberRepository.save(inviter);

      const command = new InviteMemberCommand({
        email: 'new@email.com',
        actor: inviter,
      });

      await expect(handler.execute(command)).rejects.toThrow(ForbiddenException);
      await expect(handler.execute(command)).rejects.toThrow('Only active admins can invite new members');
    });

    it('should throw ForbiddenException when inviter is disabled', async () => {
      inviter = MemberFactory.create({
        id: 'inviterId',
        user: inviterUser,
        role: MemberRole.create(MemberRoleLevel.ADMIN),
        activatedAt: new Date(),
        disabledAt: new Date(),
      });

      await memberRepository.save(inviter);

      const command = new InviteMemberCommand({
        email: 'new@email.com',
        actor: inviter,
      });

      await expect(handler.execute(command)).rejects.toThrow(ForbiddenException);
      await expect(handler.execute(command)).rejects.toThrow('Only active admins can invite new members');
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
          user: existingUser,
          activatedAt: new Date(),
        });

        await memberRepository.save(existingMember);

        const command = new InviteMemberCommand({
          email: existingUserEmail,
          actor: inviter,
        });

        await expect(handler.execute(command)).rejects.toThrow(ConflictException);
        await expect(handler.execute(command)).rejects.toThrow('User is already a member of this account');
      });
    });

    describe('member is pending', () => {
      it('should send another invitation', async () => {
        const existingMember = MemberFactory.create({
          accountId: 'accountId',
          user: existingUser,
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
          user: existingUser,
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
