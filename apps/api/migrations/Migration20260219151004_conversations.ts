import { Migration } from '@mikro-orm/migrations';

export class Migration20260219151004_conversations extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "conversation" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "account_id" uuid not null, "slack_conversation_id" varchar(255) not null, "is_group_dm" boolean not null default false, constraint "conversation_pkey" primary key ("id"));`,
    );
    this.addSql(
      `alter table "conversation" add constraint "conversation_account_id_slack_conversation_id_unique" unique ("account_id", "slack_conversation_id");`,
    );

    this.addSql(
      `create table "conversation_members" ("conversation_mikro_orm_id" uuid not null, "member_mikro_orm_id" uuid not null, constraint "conversation_members_pkey" primary key ("conversation_mikro_orm_id", "member_mikro_orm_id"));`,
    );

    this.addSql(
      `alter table "conversation" add constraint "conversation_account_id_foreign" foreign key ("account_id") references "account" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "conversation_members" add constraint "conversation_members_conversation_mikro_orm_id_foreign" foreign key ("conversation_mikro_orm_id") references "conversation" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "conversation_members" add constraint "conversation_members_member_mikro_orm_id_foreign" foreign key ("member_mikro_orm_id") references "member" ("id") on update cascade on delete cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "conversation_members" drop constraint "conversation_members_conversation_mikro_orm_id_foreign";`,
    );

    this.addSql(`drop table if exists "conversation" cascade;`);

    this.addSql(`drop table if exists "conversation_members" cascade;`);
  }
}
