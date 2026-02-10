import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { CookieAuthGuard } from 'src/auth/cookie-auth.guard';

import {
  CreateAccountCommand,
  CreateAccountHandler,
  UpdateAccountCommand,
  UpdateAccountHandler,
} from './application/commands';
import {
  GetAccountByIdHandler,
  GetAccountByIdQuery,
  GetUserAccountsHandler,
  GetUserAccountsQuery,
} from './application/queries';
import { Account, Member, MemberRepository } from './domain';
import { AccountResponseDTO, CreateAccountDto, UpdateAccountDto } from './dto';

interface AuthRequest extends Request {
  user: { sub: string; email: string; name?: string };
}

@Controller('v1/accounts')
@UseGuards(CookieAuthGuard)
export class AccountsController {
  constructor(
    private readonly createAccountHandler: CreateAccountHandler,
    private readonly updateAccountHandler: UpdateAccountHandler,
    private readonly getAccountByIdHandler: GetAccountByIdHandler,
    private readonly getUserAccountsHandler: GetUserAccountsHandler,
    private readonly memberRepository: MemberRepository,
  ) {}

  private async getActor({
    accountId,
    userId,
  }: {
    accountId: string;
    userId: string;
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
      creatorUserId: req.user.sub,
    });

    const account = await this.createAccountHandler.execute(command);
    return this.mapToResponse(account);
  }

  @Get()
  async findAll(@Req() req: AuthRequest) {
    const query = new GetUserAccountsQuery(req.user.sub);
    const accounts = await this.getUserAccountsHandler.execute(query);
    return accounts.map((account) => this.mapToResponse(account));
  }

  @Get(':id')
  async findOne(@Req() req: AuthRequest, @Param('id') id: string) {
    const query = new GetAccountByIdQuery({
      accountId: id,
      actorUserId: req.user.sub,
    });
    const account = await this.getAccountByIdHandler.execute(query);
    return this.mapToResponse(account);
  }

  @Patch(':id')
  async update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    const actor = await this.getActor({ accountId: id, userId: req.user.sub });

    const command = new UpdateAccountCommand({
      accountId: id,
      name: dto.name,
      actor,
    });

    const account = await this.updateAccountHandler.execute(command);
    return this.mapToResponse(account);
  }
}
