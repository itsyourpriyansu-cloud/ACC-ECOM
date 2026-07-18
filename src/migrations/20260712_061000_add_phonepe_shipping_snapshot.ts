import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "phonepe_shipping_address" jsonb;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "transactions" DROP COLUMN IF EXISTS "phonepe_shipping_address";
  `)
}
