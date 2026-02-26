import 'dotenv/config';

import { defineConfig } from '@mikro-orm/postgresql';

import { MemberMikroOrm } from './src/core/accounts/infrastructure/persistence/mikro-orm/models/member.mikroORM';
import { OrganizationMikroOrm } from './src/core/accounts/infrastructure/persistence/mikro-orm/models/organization.mikroORM';
import { LinearTicketSnapshotMikroOrm } from './src/core/integrations/linear/infrastructure/persistence/mikro-orm/models/linear-ticket-snapshot.mikroORM';
import { SlackInstallationMikroOrm } from './src/core/integrations/slack/infrastructure/persistence/mikro-orm/models/slack-installation.mikroORM';
import { SlackMessageMikroOrm } from './src/core/integrations/slack/infrastructure/persistence/mikro-orm/models/slack-message.mikroORM';
import { ProjectMikroOrm } from './src/core/projects/infrastructure/persistence/mikro-orm/models/project.mikroORM';
import { ReportMikroOrm } from './src/core/reports/infrastructure/persistence/mikro-orm/models/report.mikroORM';

export default defineConfig({
  entities: [
    SlackInstallationMikroOrm,
    OrganizationMikroOrm,
    MemberMikroOrm,
    ProjectMikroOrm,
    SlackMessageMikroOrm,
    LinearTicketSnapshotMikroOrm,
    ReportMikroOrm,
  ],
  clientUrl: process.env.DATABASE_URL,
  migrations: {
    path: './migrations',
    tableName: 'mikro_orm_migrations',
    transactional: true,
  },
});
