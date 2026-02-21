import { Migration } from '@mikro-orm/migrations';

export class Migration20260220234703 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table "member" add column "focus_ends_at" timestamptz null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "member" drop column "focus_ends_at";`);
  }
}
