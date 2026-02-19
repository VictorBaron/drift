import { Migration } from '@mikro-orm/migrations';

export class Migration20260213163303_Init extends Migration {
  override up(): void {
    this.addSql(
      `create table "account" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "name" varchar(255) not null, constraint "account_pkey" primary key ("id"));`,
    );
    this.addSql(`alter table "account" add constraint "account_name_unique" unique ("name");`);

    this.addSql(
      `create table "member" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "account_id" uuid not null, "user_id" uuid not null, "role" varchar(50) not null, "invited_at" timestamptz null, "activated_at" timestamptz null, "disabled_at" timestamptz null, "invited_by_id" uuid null, "last_active_at" timestamptz null, "preferences" jsonb not null, constraint "member_pkey" primary key ("id"));`,
    );
    this.addSql(`create index "idx_member_userId" on "member" ("user_id");`);
    this.addSql(`create index "idx_member_accountId" on "member" ("account_id");`);
    this.addSql(
      `alter table "member" add constraint "member_account_id_user_id_unique" unique ("account_id", "user_id");`,
    );

    this.addSql(
      `create table "slack_installation" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "team_id" varchar(255) null, "team_name" varchar(255) null, "enterprise_id" varchar(255) null, "enterprise_name" varchar(255) null, "user_id" varchar(255) not null, "bot_token" text null, "user_token" text null, "bot_id" varchar(255) null, "bot_user_id" varchar(255) null, "token_type" varchar(50) null, "is_enterprise_install" boolean not null default false, "raw_installation" jsonb not null, "installed_at" timestamptz not null, constraint "slack_installation_pkey" primary key ("id"));`,
    );
    this.addSql(`create index "slack_installation_team_id_index" on "slack_installation" ("team_id");`);
    this.addSql(`create index "slack_installation_enterprise_id_index" on "slack_installation" ("enterprise_id");`);
    this.addSql(`create index "slack_installation_user_id_index" on "slack_installation" ("user_id");`);
    this.addSql(
      `alter table "slack_installation" add constraint "slack_installation_team_id_enterprise_id_unique" unique ("team_id", "enterprise_id");`,
    );

    this.addSql(
      `create table "user" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "email" varchar(255) not null, "name" varchar(255) null, "password" varchar(255) null, "google_id" varchar(255) null, constraint "user_pkey" primary key ("id"));`,
    );
    this.addSql(`alter table "user" add constraint "user_email_unique" unique ("email");`);
    this.addSql(`create index "user_google_id_index" on "user" ("google_id");`);
    this.addSql(`alter table "user" add constraint "user_google_id_unique" unique ("google_id");`);
  }
}
