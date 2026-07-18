import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "wishlists_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_wishlists_fk"
      FOREIGN KEY ("wishlists_id") REFERENCES "public"."wishlists"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_wishlists_id_idx"
      ON "payload_locked_documents_rels" USING btree ("wishlists_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload_locked_documents_rels_wishlists_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_wishlists_fk",
      DROP COLUMN IF EXISTS "wishlists_id";
  `)
}
