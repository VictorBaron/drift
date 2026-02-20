import { Migration } from '@mikro-orm/migrations';

export class Migration20260215121911_SlackTeamIdForAccounts extends Migration {
  override up(): void {
    this.addSql(`alter table "account" drop constraint "account_name_unique";`);

    this.addSql(`alter table "account" add column "slack_team_id" varchar(255) not null;`);
    this.addSql(`alter table "account" add constraint "account_slack_team_id_unique" unique ("slack_team_id");`);
  }

  override down(): void {
    this.addSql(`alter table "account" drop constraint "account_slack_team_id_unique";`);
    this.addSql(`alter table "account" drop column "slack_team_id";`);

    this.addSql(`alter table "account" add constraint "account_name_unique" unique ("name");`);
  }
}
