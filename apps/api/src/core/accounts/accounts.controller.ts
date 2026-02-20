import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CookieAuthGuard } from 'auth/cookie-auth.guard';
import type { Request } from 'express';

import { CreateAccountCommand, UpdateAccountCommand } from './application/commands';
import { GetAccountById, GetAccountByIdQuery, GetUserAccounts, GetUserAccountsQuery } from './application/queries';
import { Account, Member, MemberRepository } from './domain';
import type { AccountResponseDTO, CreateAccountDto, UpdateAccountDto } from './dto';

interface AuthRequest extends Request {
  user: { sub: string; email: string; name?: string };
}

@Controller('v1/accounts')
@UseGuards(CookieAuthGuard)
export class AccountsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly getAccountById: GetAccountById,
    private readonly getUserAccounts: GetUserAccounts,
    private readonly memberRepository: MemberRepository,
  ) {}

  private async getActor({ accountId, userId }: { accountId: string; userId: string }): Promise<Member> {
    const actor = await this.memberRepository.findByAccountIdAndUserId({
      accountId,
      userId,
    });
    if (!actor || actor.isDisabled()) {
      throw new NotFoundException('Cannot found member for this user and account');
    }

    return actor;
  }

  private mapToResponse(account: Account): AccountResponseDTO {
    const json = account.toJSON();
    return {
      id: json.id,
      name: json.name,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
    };
  }

  @Post()
  async create(@Req() req: AuthRequest, @Body() dto: CreateAccountDto) {
    const command = new CreateAccountCommand({
      name: dto.name,
      slackTeamId: dto.slackTeamId,
      creatorUserId: req.user.sub,
    });

    const account = await this.commandBus.execute(command);
    return this.mapToResponse(account);
  }

  @Get()
  async findAll(@Req() req: AuthRequest) {
    const query = new GetUserAccountsQuery(req.user.sub);
    const accounts = await this.getUserAccounts.execute(query);
    return accounts.map((account) => this.mapToResponse(account));
  }

  @Get(':id')
  async findOne(@Req() req: AuthRequest, @Param('id') id: string) {
    const query = new GetAccountByIdQuery({
      accountId: id,
      actorUserId: req.user.sub,
    });
    const account = await this.getAccountById.execute(query);
    return this.mapToResponse(account);
  }

  @Patch(':id')
  async update(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: UpdateAccountDto) {
    const actor = await this.getActor({ accountId: id, userId: req.user.sub });

    const command = new UpdateAccountCommand({
      accountId: id,
      name: dto.name,
      actor,
    });

    const account = await this.commandBus.execute(command);
    return this.mapToResponse(account);
  }
}
