import 'dotenv/config';

import { defineConfig } from '@mikro-orm/postgresql';

import { SlackInstallationMikroOrm } from './src/core/slack/infrastructure/persistence/mikro-orm/models/slack-installation.mikroORM';

export default defineConfig({
  entities: [SlackInstallationMikroOrm],
  clientUrl: process.env.DATABASE_URL,
  migrations: {
    path: './migrations',
    tableName: 'mikro_orm_migrations',
    transactional: true,
  },
});
