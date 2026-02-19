import { Migration } from '@mikro-orm/migrations';

export class Migration20260216203611_message_channels extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "channel" ("id" uuid not null, "account_id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "slack_channel_id" varchar(255) not null, "name" varchar(255) not null, "topic" text not null default '', "purpose" text not null default '', "is_private" boolean not null default false, "is_archived" boolean not null default false, "member_count" int not null default 0, constraint "channel_pkey" primary key ("id", "account_id"));`,
    );
    this.addSql(
      `alter table "channel" add constraint "channel_account_id_slack_channel_id_unique" unique ("account_id", "slack_channel_id");`,
    );

    this.addSql(
      `create table "message" ("id" uuid not null, "account_id" uuid not null, "sender_id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "slack_ts" varchar(64) not null, "slack_channel_id" varchar(64) not null, "slack_channel_type" varchar(32) not null, "slack_thread_ts" varchar(64) null, "text" text null, constraint "message_pkey" primary key ("id", "account_id", "sender_id"));`,
    );
    this.addSql(`create index "message_slack_ts_index" on "message" ("slack_ts");`);

    this.addSql(
      `alter table "channel" add constraint "channel_account_id_foreign" foreign key ("account_id") references "account" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "message" add constraint "message_account_id_foreign" foreign key ("account_id") references "account" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "message" add constraint "message_sender_id_foreign" foreign key ("sender_id") references "member" ("id") on update cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "channel" cascade;`);

    this.addSql(`drop table if exists "message" cascade;`);
  }
}
