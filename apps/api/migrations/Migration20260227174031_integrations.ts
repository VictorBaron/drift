import { Migration } from '@mikro-orm/migrations';

export class Migration20260227174031_integrations extends Migration {
  override async up(): Promise<void> {
    this.addSql(`drop index "member_organization_id_index";`);

    this.addSql(`alter table "member" alter column "organization_id" drop default;`);
    this.addSql(`alter table "member" alter column "organization_id" type uuid using ("organization_id"::text::uuid);`);
    this.addSql(
      `alter table "member" add constraint "member_organization_id_foreign" foreign key ("organization_id") references "organization" ("id") on update cascade;`,
    );

    this.addSql(`drop index "project_organization_id_index";`);

    this.addSql(`alter table "project" alter column "name" type varchar(1023) using ("name"::varchar(1023));`);
    this.addSql(`alter table "project" alter column "organization_id" drop default;`);
    this.addSql(
      `alter table "project" alter column "organization_id" type uuid using ("organization_id"::text::uuid);`,
    );
    this.addSql(
      `alter table "project" add constraint "project_organization_id_foreign" foreign key ("organization_id") references "organization" ("id") on update cascade;`,
    );

    this.addSql(`alter table "linear_ticket_snapshot" alter column "organization_id" drop default;`);
    this.addSql(
      `alter table "linear_ticket_snapshot" alter column "organization_id" type uuid using ("organization_id"::text::uuid);`,
    );
    this.addSql(`alter table "linear_ticket_snapshot" alter column "project_id" drop default;`);
    this.addSql(
      `alter table "linear_ticket_snapshot" alter column "project_id" type uuid using ("project_id"::text::uuid);`,
    );
    this.addSql(
      `alter table "linear_ticket_snapshot" add constraint "linear_ticket_snapshot_organization_id_foreign" foreign key ("organization_id") references "organization" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "linear_ticket_snapshot" add constraint "linear_ticket_snapshot_project_id_foreign" foreign key ("project_id") references "project" ("id") on update cascade on delete set null;`,
    );

    this.addSql(`alter table "report" drop constraint "report_project_id_week_start_unique";`);

    this.addSql(`alter table "report" add column "organization_id" uuid not null;`);
    this.addSql(`alter table "report" alter column "project_id" drop default;`);
    this.addSql(`alter table "report" alter column "project_id" type uuid using ("project_id"::text::uuid);`);
    this.addSql(
      `alter table "report" add constraint "report_organization_id_foreign" foreign key ("organization_id") references "organization" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "report" add constraint "report_project_id_foreign" foreign key ("project_id") references "organization" ("id") on update cascade;`,
    );

    this.addSql(`alter table "slack_message" alter column "organization_id" drop default;`);
    this.addSql(
      `alter table "slack_message" alter column "organization_id" type uuid using ("organization_id"::text::uuid);`,
    );
    this.addSql(`alter table "slack_message" alter column "project_id" drop default;`);
    this.addSql(`alter table "slack_message" alter column "project_id" type uuid using ("project_id"::text::uuid);`);
    this.addSql(
      `alter table "slack_message" add constraint "slack_message_organization_id_foreign" foreign key ("organization_id") references "organization" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "slack_message" add constraint "slack_message_project_id_foreign" foreign key ("project_id") references "project" ("id") on update cascade on delete set null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "linear_ticket_snapshot" alter column "organization_id" type text using ("organization_id"::text);`,
    );
    this.addSql(`alter table "linear_ticket_snapshot" alter column "project_id" type text using ("project_id"::text);`);

    this.addSql(
      `alter table "linear_ticket_snapshot" drop constraint "linear_ticket_snapshot_organization_id_foreign";`,
    );
    this.addSql(`alter table "linear_ticket_snapshot" drop constraint "linear_ticket_snapshot_project_id_foreign";`);

    this.addSql(`alter table "member" alter column "organization_id" type text using ("organization_id"::text);`);

    this.addSql(`alter table "member" drop constraint "member_organization_id_foreign";`);

    this.addSql(`alter table "project" alter column "organization_id" type text using ("organization_id"::text);`);

    this.addSql(`alter table "project" drop constraint "project_organization_id_foreign";`);

    this.addSql(`alter table "report" alter column "project_id" type text using ("project_id"::text);`);

    this.addSql(`alter table "report" drop constraint "report_organization_id_foreign";`);
    this.addSql(`alter table "report" drop constraint "report_project_id_foreign";`);

    this.addSql(
      `alter table "slack_message" alter column "organization_id" type text using ("organization_id"::text);`,
    );
    this.addSql(`alter table "slack_message" alter column "project_id" type text using ("project_id"::text);`);

    this.addSql(`alter table "slack_message" drop constraint "slack_message_organization_id_foreign";`);
    this.addSql(`alter table "slack_message" drop constraint "slack_message_project_id_foreign";`);

    this.addSql(
      `alter table "linear_ticket_snapshot" alter column "organization_id" type varchar(255) using ("organization_id"::varchar(255));`,
    );
    this.addSql(
      `alter table "linear_ticket_snapshot" alter column "project_id" type varchar(255) using ("project_id"::varchar(255));`,
    );

    this.addSql(
      `alter table "member" alter column "organization_id" type varchar(255) using ("organization_id"::varchar(255));`,
    );
    this.addSql(`create index "member_organization_id_index" on "member" ("organization_id");`);

    this.addSql(`alter table "project" alter column "name" type varchar(255) using ("name"::varchar(255));`);
    this.addSql(
      `alter table "project" alter column "organization_id" type varchar(255) using ("organization_id"::varchar(255));`,
    );
    this.addSql(`create index "project_organization_id_index" on "project" ("organization_id");`);

    this.addSql(`alter table "report" drop column "organization_id";`);

    this.addSql(`alter table "report" alter column "project_id" type varchar(255) using ("project_id"::varchar(255));`);
    this.addSql(
      `alter table "report" add constraint "report_project_id_week_start_unique" unique ("project_id", "week_start");`,
    );

    this.addSql(
      `alter table "slack_message" alter column "organization_id" type varchar(255) using ("organization_id"::varchar(255));`,
    );
    this.addSql(
      `alter table "slack_message" alter column "project_id" type varchar(255) using ("project_id"::varchar(255));`,
    );
  }
}
