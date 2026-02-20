import { Migration } from '@mikro-orm/migrations';

export class Migration20260215160000_AddSlackIdToUser extends Migration {
  override up(): void {
    this.addSql(`alter table "user" add column "slack_id" varchar(255) null;`);
    this.addSql(`alter table "user" add constraint "user_slack_id_unique" unique ("slack_id");`);
    this.addSql(`create index "user_slack_id_index" on "user" ("slack_id");`);
  }

  override down(): void {
    this.addSql(`drop index "user_slack_id_index";`);
    this.addSql(`alter table "user" drop constraint "user_slack_id_unique";`);
    this.addSql(`alter table "user" drop column "slack_id";`);
  }
}
