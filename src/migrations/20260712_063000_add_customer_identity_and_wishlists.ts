import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "phone_number" varchar,
      ADD COLUMN IF NOT EXISTS "phone_verified_at" timestamp(3) with time zone,
      ADD COLUMN IF NOT EXISTS "google_subject" varchar;
    CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_number_idx" ON "users" USING btree ("phone_number");
    CREATE UNIQUE INDEX IF NOT EXISTS "users_google_subject_idx" ON "users" USING btree ("google_subject");

    CREATE TABLE IF NOT EXISTS "wishlists" (
      "id" serial PRIMARY KEY NOT NULL,
      "customer_id" integer NOT NULL,
      "product_id" integer NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_customer_id_users_id_fk"
      FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_product_id_products_id_fk"
      FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX IF NOT EXISTS "wishlists_customer_idx" ON "wishlists" USING btree ("customer_id");
    CREATE INDEX IF NOT EXISTS "wishlists_product_idx" ON "wishlists" USING btree ("product_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "wishlists_customer_product_idx" ON "wishlists" USING btree ("customer_id", "product_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "wishlists";
    DROP INDEX IF EXISTS "users_phone_number_idx";
    DROP INDEX IF EXISTS "users_google_subject_idx";
    ALTER TABLE "users"
      DROP COLUMN IF EXISTS "phone_number",
      DROP COLUMN IF EXISTS "phone_verified_at",
      DROP COLUMN IF EXISTS "google_subject";
  `)
}
