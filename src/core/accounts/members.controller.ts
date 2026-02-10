import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { CookieAuthGuard } from 'src/auth/cookie-auth.guard';

import {
  AcceptInvitationCommand,
  AcceptInvitationHandler,
  ChangeMemberRoleCommand,
  ChangeMemberRoleHandler,
  DisableMemberCommand,
  DisableMemberHandler,
  EnableMemberCommand,
  EnableMemberHandler,
  InviteMemberCommand,
  InviteMemberHandler,
} from './application/commands';
import {
  GetAccountMembersHandler,
  GetAccountMembersQuery,
  GetPendingInvitationsHandler,
  GetPendingInvitationsQuery,
} from './application/queries';
import { AccountRepository, Member, MemberRepository } from './domain';
import {
  ChangeMemberRoleDto,
  InvitationResponseDTO,
  InviteMemberDto,
  MemberResponseDTO,
} from './dto';

interface AuthRequest extends Request {
  user: { sub: string; email: string; name?: string };
}

@Controller('v1/accounts/:accountId/members')
@UseGuards(CookieAuthGuard)
export class MembersController {
  constructor(
    private readonly inviteMemberHandler: InviteMemberHandler,
    private readonly acceptInvitationHandler: AcceptInvitationHandler,
    private readonly disableMemberHandler: DisableMemberHandler,
    private readonly enableMemberHandler: EnableMemberHandler,
    private readonly changeMemberRoleHandler: ChangeMemberRoleHandler,
    private readonly getAccountMembersHandler: GetAccountMembersHandler,
    private readonly memberRepository: MemberRepository,
  ) {}

  private mapToResponse(member: Member): MemberResponseDTO {
    const json = member.toJSON();
    return {
      id: json.id,
      accountId: json.accountId,
      userId: json.userId,
      role: json.role,
      invitedAt: json.invitedAt,
      activatedAt: json.activatedAt,
      disabledAt: json.disabledAt,
      invitedById: json.invitedById,
      lastActiveAt: json.lastActiveAt,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
    };
  }

  private async getActor({
    accountId,
    userId,
    allowInactive = false,
  }: {
    accountId: string;
    userId: string;
    allowInactive?: boolean;
  }): Promise<Member> {
    const actor = await this.memberRepository.findByAccountIdAndUserId({
      accountId,
      userId,
    });
    if (!actor || actor.isDisabled()) {
      throw new NotFoundException(
        'Cannot found member for this user and account',
      );
    }
    if (!allowInactive && actor.isPending()) {
      throw new NotFoundException(
        'Cannot found member for this user and account',
      );
    }

    return actor;
  }

  @Post()
  async invite(
    @Req() req: AuthRequest,
    @Param('accountId') accountId: string,
    @Body() dto: InviteMemberDto,
  ) {
    const actor = await this.getActor({ accountId, userId: req.user.sub });

    const command = new InviteMemberCommand({
      actor,
      email: dto.email,
    });

    const member = await this.inviteMemberHandler.execute(command);
    return this.mapToResponse(member);
  }

  @Get()
  async findAll(
    @Req() req: AuthRequest,
    @Param('accountId') accountId: string,
  ) {
    const actor = await this.getActor({ accountId, userId: req.user.sub });

    const query = new GetAccountMembersQuery({
      accountId,
      actor,
    });
    const members = await this.getAccountMembersHandler.execute(query);
    return members.map((member) => this.mapToResponse(member));
  }

  @Post(':id/accept')
  async accept(
    @Req() req: AuthRequest,
    @Param('accountId') accountId: string,
    @Param('id') id: string,
  ) {
    const actor = await this.getActor({
      accountId,
      userId: req.user.sub,
      allowInactive: true,
    });
    if (actor.id !== id)
      throw new ForbiddenException('Cannot accept ivitation for this member');

    const command = new AcceptInvitationCommand({
      accountId,
      actor,
    });

    const member = await this.acceptInvitationHandler.execute(command);
    return this.mapToResponse(member);
  }

  @Post(':id/changeRole')
  async changeRole(
    @Req() req: AuthRequest,
    @Param('accountId') accountId: string,
    @Param('id') id: string,
    @Body() dto: ChangeMemberRoleDto,
  ) {
    const actor = await this.getActor({ accountId, userId: req.user.sub });

    const command = new ChangeMemberRoleCommand({
      accountId,
      memberId: id,
      role: dto.role,
      actor,
    });

    const member = await this.changeMemberRoleHandler.execute(command);
    return this.mapToResponse(member);
  }

  @Post(':id/disable')
  async disable(
    @Req() req: AuthRequest,
    @Param('accountId') accountId: string,
    @Param('id') id: string,
  ) {
    const actor = await this.getActor({ accountId, userId: req.user.sub });

    const command = new DisableMemberCommand({
      accountId,
      memberId: id,
      actor,
    });

    const member = await this.disableMemberHandler.execute(command);
    return this.mapToResponse(member);
  }

  @Post(':id/enable')
  async enable(
    @Req() req: AuthRequest,
    @Param('accountId') accountId: string,
    @Param('id') id: string,
  ) {
    const actor = await this.getActor({ accountId, userId: req.user.sub });

    const command = new EnableMemberCommand({
      accountId,
      memberId: id,
      actor,
    });

    const member = await this.enableMemberHandler.execute(command);
    return this.mapToResponse(member);
  }
}

@Controller('v1/me/invitations')
@UseGuards(CookieAuthGuard)
export class InvitationsController {
  constructor(
    private readonly getPendingInvitationsHandler: GetPendingInvitationsHandler,
    private readonly accountRepository: AccountRepository,
  ) {}

  @Get()
  async findPending(@Req() req: AuthRequest): Promise<InvitationResponseDTO[]> {
    const query = new GetPendingInvitationsQuery(req.user.sub);
    const members = await this.getPendingInvitationsHandler.execute(query);

    const invitations: InvitationResponseDTO[] = [];
    for (const member of members) {
      const account = await this.accountRepository.findById(
        member.getAccountId(),
      );
      if (account) {
        const invitedMember = member.toJSON();
        invitations.push({
          id: invitedMember.id,
          accountId: invitedMember.accountId,
          accountName: account.getName(),
          invitedAt: invitedMember.invitedAt as Date,
          invitedById: invitedMember.invitedById,
        });
      }
    }

    return invitations;
  }
}
