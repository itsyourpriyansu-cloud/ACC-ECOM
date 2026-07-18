import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "shiprocket_order_id" varchar,
      ADD COLUMN IF NOT EXISTS "shiprocket_awb_code" varchar,
      ADD COLUMN IF NOT EXISTS "shiprocket_courier_name" varchar,
      ADD COLUMN IF NOT EXISTS "send_to_shiprocket" boolean DEFAULT false;
    CREATE UNIQUE INDEX IF NOT EXISTS "orders_shiprocket_order_id_idx"
      ON "orders" USING btree ("shiprocket_order_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "orders_shiprocket_order_id_idx";
    ALTER TABLE "orders"
      DROP COLUMN IF EXISTS "shiprocket_order_id",
      DROP COLUMN IF EXISTS "shiprocket_awb_code",
      DROP COLUMN IF EXISTS "shiprocket_courier_name",
      DROP COLUMN IF EXISTS "send_to_shiprocket";
  `)
}
