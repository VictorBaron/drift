import { ConflictException } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { BaseCommand } from 'common/application/command-handler';
import { Member, MemberRepository } from '@/accounts/domain';
import { User, UserRepository } from '@/users/domain';

export class InviteMemberCommand {
  constructor(
    readonly props: {
      email: string;
      actor: Member;
    },
  ) {}
}

@CommandHandler(InviteMemberCommand)
export class InviteMember extends BaseCommand<InviteMemberCommand> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly memberRepository: MemberRepository,
  ) {
    super();
  }

  async execute(command: InviteMemberCommand): Promise<Member> {
    const { actor, email } = command.props;
    const accountId = actor.getAccountId();

    const user = await this.findOrCreateUser(email);

    const existingMember = await this.memberRepository.findByAccountIdAndUserId({
      accountId,
      userId: user.id,
    });

    if (!existingMember) {
      const member = Member.invite({
        inviter: actor,
        user,
      });

      await this.memberRepository.save(member);

      return member;
    }

    if (existingMember?.isActive()) {
      throw new ConflictException('User is already a member of this account');
    }

    existingMember.inviteAgain(actor);

    await this.memberRepository.save(existingMember);

    return existingMember;
  }

  private async findOrCreateUser(email: string): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) return existingUser;

    const newUser = User.create({ email });

    await this.userRepository.save(newUser);
    return newUser;
  }
}
