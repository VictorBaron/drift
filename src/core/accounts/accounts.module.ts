import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from 'auth/auth.module';

import { ChannelsModule } from '@/channels/channels.module';
import { SLACK_CHANNELS_GATEWAY } from '@/channels/domain/gateways/slack-channels.gateway';
import { WebApiSlackChannelsGateway } from '@/channels/infrastructure/gateways/web-api-slack-channels.gateway';
import { ConversationsModule } from '@/conversations/conversations.module';
import { SLACK_CONVERSATIONS_GATEWAY } from '@/conversations/domain/gateways/slack-conversations.gateway';
import { WebApiSlackConversationsGateway } from '@/conversations/infrastructure/gateways/web-api-slack-conversations.gateway';
import { UserPersistenceModule } from '@/users/infrastructure';
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
import { ProvisionAccountFromSlackHandler } from './application/commands/provision-account-from-slack';
import {
  GetAccountByIdHandler,
  GetAccountMembersHandler,
  GetPendingInvitationsHandler,
  GetUserAccountsHandler,
} from './application/queries';
import { SLACK_USERS_GATEWAY } from './domain/gateways/slack-users.gateway';
import { WebApiSlackUsersGateway } from './infrastructure/gateways/web-api-slack-users.gateway';
import { AccountPersistenceModule } from './infrastructure/persistence/account-persistence.module';
import { InvitationsController, MembersController } from './members.controller';

@Module({
  imports: [
    CqrsModule,
    AuthModule,
    AccountPersistenceModule.use('orm'),
    UserPersistenceModule.use('orm'),
    ChannelsModule,
    ConversationsModule,
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
    ProvisionAccountFromSlackHandler,
    { provide: SLACK_USERS_GATEWAY, useClass: WebApiSlackUsersGateway },
    { provide: SLACK_CHANNELS_GATEWAY, useClass: WebApiSlackChannelsGateway },
    {
      provide: SLACK_CONVERSATIONS_GATEWAY,
      useClass: WebApiSlackConversationsGateway,
    },
    GetAccountByIdHandler,
    GetUserAccountsHandler,
    GetAccountMembersHandler,
    GetPendingInvitationsHandler,
  ],
  exports: [],
})
export class AccountsModule {}
