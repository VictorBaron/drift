import { Migration } from '@mikro-orm/migrations';

export class Migration20260218144958 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table "message" drop constraint "message_sender_id_sender_account_id_sender_user_id_foreign";`);

    this.addSql(`alter table "channel" drop constraint "channel_pkey";`);

    this.addSql(`alter table "channel" add constraint "channel_pkey" primary key ("id");`);

    this.addSql(`alter table "member" drop constraint "member_pkey";`);

    this.addSql(`alter table "member" add constraint "member_pkey" primary key ("id");`);

    this.addSql(`alter table "message" drop constraint "message_pkey";`);
    this.addSql(`alter table "message" drop column "sender_account_id", drop column "sender_user_id";`);

    this.addSql(
      `alter table "message" add constraint "message_sender_id_foreign" foreign key ("sender_id") references "member" ("id") on update cascade;`,
    );
    this.addSql(`alter table "message" add constraint "message_pkey" primary key ("id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "message" drop constraint "message_sender_id_foreign";`);

    this.addSql(`alter table "channel" drop constraint "channel_pkey";`);

    this.addSql(`alter table "channel" add constraint "channel_pkey" primary key ("id", "account_id");`);

    this.addSql(`alter table "member" drop constraint "member_pkey";`);

    this.addSql(`alter table "member" add constraint "member_pkey" primary key ("id", "account_id", "user_id");`);

    this.addSql(`alter table "message" drop constraint "message_pkey";`);

    this.addSql(
      `alter table "message" add column "sender_account_id" uuid not null, add column "sender_user_id" uuid not null;`,
    );
    this.addSql(
      `alter table "message" add constraint "message_sender_id_sender_account_id_sender_user_id_foreign" foreign key ("sender_id", "sender_account_id", "sender_user_id") references "member" ("id", "account_id", "user_id") on update cascade;`,
    );
    this.addSql(
      `alter table "message" add constraint "message_pkey" primary key ("id", "account_id", "sender_id", "sender_account_id", "sender_user_id");`,
    );
  }
}
