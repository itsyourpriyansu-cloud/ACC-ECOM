import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_transactions_payment_method" ADD VALUE IF NOT EXISTS 'phonepe';
    ALTER TABLE "transactions"
      ADD COLUMN IF NOT EXISTS "phonepe_merchant_order_i_d" varchar,
      ADD COLUMN IF NOT EXISTS "phonepe_phone_pe_transaction_i_d" varchar;
    CREATE UNIQUE INDEX IF NOT EXISTS "transactions_phonepe_merchant_order_i_d_idx"
      ON "transactions" USING btree ("phonepe_merchant_order_i_d");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "transactions_phonepe_merchant_order_i_d_idx";
    ALTER TABLE "transactions"
      DROP COLUMN IF EXISTS "phonepe_merchant_order_i_d",
      DROP COLUMN IF EXISTS "phonepe_phone_pe_transaction_i_d";
  `)
}
