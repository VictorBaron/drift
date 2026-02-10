import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { UserPersistenceModule } from 'src/core/users/infrastructure';

import { AccountsController } from './accounts.controller';
import {
  AcceptInvitationHandler,
  ChangeMemberRoleHandler,
  CreateAccountHandler,
  DeleteAccountHandler,
  DisableMemberHandler,
  EnableMemberHandler,
  InviteMemberHandler,
  UpdateAccountHandler,
} from './application/commands';
import {
  GetAccountByIdHandler,
  GetAccountMembersHandler,
  GetPendingInvitationsHandler,
  GetUserAccountsHandler,
} from './application/queries';
import { AccountPersistenceModule } from './infrastructure/persistence/account-persistence.module';
import { InvitationsController, MembersController } from './members.controller';

@Module({
  imports: [
    AuthModule,
    AccountPersistenceModule.use('orm'),
    UserPersistenceModule.use('orm'),
  ],
  controllers: [AccountsController, MembersController, InvitationsController],
  providers: [
    CreateAccountHandler,
    UpdateAccountHandler,
    DeleteAccountHandler,
    InviteMemberHandler,
    AcceptInvitationHandler,
    DisableMemberHandler,
    EnableMemberHandler,
    ChangeMemberRoleHandler,
    GetAccountByIdHandler,
    GetUserAccountsHandler,
    GetAccountMembersHandler,
    GetPendingInvitationsHandler,
  ],
  exports: [
    GetAccountByIdHandler,
    GetUserAccountsHandler,
    GetAccountMembersHandler,
    GetPendingInvitationsHandler,
  ],
})
export class AccountsModule {}
