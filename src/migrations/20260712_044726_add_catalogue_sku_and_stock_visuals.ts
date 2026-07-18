import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// The catalogue, SKU and insight fields were migrated in the original Alemah
// database setup. This follow-up intentionally adds only the new stock-visual
// fields, making it safe for the existing production catalogue.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "catalogue_visual_stock_image_url" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "catalogue_visual_alt" varchar;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_catalogue_visual_stock_image_url" varchar;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_catalogue_visual_alt" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" DROP COLUMN IF EXISTS "catalogue_visual_stock_image_url";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "catalogue_visual_alt";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_catalogue_visual_stock_image_url";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_catalogue_visual_alt";
  `)
}
