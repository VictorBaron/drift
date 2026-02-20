import { Migration } from '@mikro-orm/migrations';

export class Migration20260218171831_urgency extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "message" add column "urgency_score" smallint null, add column "urgency_reasoning" text null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "message" drop column "urgency_score", drop column "urgency_reasoning";`);
  }
}
