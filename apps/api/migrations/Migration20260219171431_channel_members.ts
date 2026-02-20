import { Migration } from '@mikro-orm/migrations';

export class Migration20260219171431_channel_members extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "channel_members" ("channel_mikro_orm_id" uuid not null, "member_mikro_orm_id" uuid not null, constraint "channel_members_pkey" primary key ("channel_mikro_orm_id", "member_mikro_orm_id"));`,
    );

    this.addSql(
      `alter table "channel_members" add constraint "channel_members_channel_mikro_orm_id_foreign" foreign key ("channel_mikro_orm_id") references "channel" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "channel_members" add constraint "channel_members_member_mikro_orm_id_foreign" foreign key ("member_mikro_orm_id") references "member" ("id") on update cascade on delete cascade;`,
    );

    this.addSql(`alter table "channel" drop column "member_count";`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "channel_members" cascade;`);

    this.addSql(`alter table "channel" add column "member_count" int not null default 0;`);
  }
}
