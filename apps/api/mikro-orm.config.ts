import 'dotenv/config';

import { defineConfig } from '@mikro-orm/postgresql';

import { AccountMikroOrm } from './src/core/accounts/infrastructure/persistence/mikro-orm/models/account.mikroORM';
import { MemberMikroOrm } from './src/core/accounts/infrastructure/persistence/mikro-orm/models/member.mikroORM';
import { ChannelMikroOrm } from './src/core/channels/infrastructure/persistence/mikro-orm/models/channel.mikroORM';
import { ConversationMikroOrm } from './src/core/conversations/infrastructure/persistence/mikro-orm/models/conversation.mikroORM';
import { MessageMikroOrm } from './src/core/messages/infrastructure/persistence/mikro-orm/models/message.mikroORM';
import { SlackInstallationMikroOrm } from './src/core/slack/infrastructure/persistence/mikro-orm/models/slack-installation.mikroORM';
import { UserMikroOrm } from './src/core/users/infrastructure/persistence/mikro-orm/models/user.mikroORM';

export default defineConfig({
  entities: [
    UserMikroOrm,
    AccountMikroOrm,
    MemberMikroOrm,
    ChannelMikroOrm,
    ConversationMikroOrm,
    MessageMikroOrm,
    SlackInstallationMikroOrm,
  ],
  clientUrl: process.env.DATABASE_URL,
  migrations: {
    path: './migrations',
    tableName: 'mikro_orm_migrations',
    transactional: true,
  },
});
