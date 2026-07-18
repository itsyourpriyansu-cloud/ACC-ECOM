import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Keeps a fresh database aligned with the custom Alemah product collection.
 * Each statement is idempotent so it is also safe for the existing catalogue.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "asin" varchar,
      ADD COLUMN IF NOT EXISTS "sku" varchar,
      ADD COLUMN IF NOT EXISTS "catalogue_sales_rank" numeric,
      ADD COLUMN IF NOT EXISTS "catalogue_pricing_note" varchar,
      ADD COLUMN IF NOT EXISTS "catalogue_variant_group_key" varchar,
      ADD COLUMN IF NOT EXISTS "catalogue_attributes_size" varchar,
      ADD COLUMN IF NOT EXISTS "catalogue_attributes_size_inches" numeric,
      ADD COLUMN IF NOT EXISTS "catalogue_attributes_curtain_type" varchar,
      ADD COLUMN IF NOT EXISTS "catalogue_attributes_fabric" varchar,
      ADD COLUMN IF NOT EXISTS "catalogue_attributes_pattern" varchar,
      ADD COLUMN IF NOT EXISTS "catalogue_attributes_opacity" varchar,
      ADD COLUMN IF NOT EXISTS "catalogue_attributes_color" varchar,
      ADD COLUMN IF NOT EXISTS "catalogue_attributes_color_family" varchar,
      ADD COLUMN IF NOT EXISTS "catalogue_attributes_recommended_room" varchar,
      ADD COLUMN IF NOT EXISTS "catalogue_attributes_pack_of" numeric,
      ADD COLUMN IF NOT EXISTS "catalogue_attributes_closure_type" varchar,
      ADD COLUMN IF NOT EXISTS "catalogue_attributes_installation" varchar,
      ADD COLUMN IF NOT EXISTS "catalogue_attributes_style_note" varchar,
      ADD COLUMN IF NOT EXISTS "catalogue_sales_insight_sessions90d" numeric,
      ADD COLUMN IF NOT EXISTS "catalogue_sales_insight_units_ordered" numeric,
      ADD COLUMN IF NOT EXISTS "catalogue_sales_insight_revenue_i_n_r" numeric,
      ADD COLUMN IF NOT EXISTS "catalogue_sales_insight_conversion_rate_pct" numeric,
      ADD COLUMN IF NOT EXISTS "catalogue_sales_insight_source_note" varchar,
      ADD COLUMN IF NOT EXISTS "seo_keywords_focus_keyword" varchar;

    ALTER TABLE "_products_v"
      ADD COLUMN IF NOT EXISTS "version_asin" varchar,
      ADD COLUMN IF NOT EXISTS "version_sku" varchar,
      ADD COLUMN IF NOT EXISTS "version_catalogue_sales_rank" numeric,
      ADD COLUMN IF NOT EXISTS "version_catalogue_pricing_note" varchar,
      ADD COLUMN IF NOT EXISTS "version_catalogue_variant_group_key" varchar,
      ADD COLUMN IF NOT EXISTS "version_catalogue_attributes_size" varchar,
      ADD COLUMN IF NOT EXISTS "version_catalogue_attributes_size_inches" numeric,
      ADD COLUMN IF NOT EXISTS "version_catalogue_attributes_curtain_type" varchar,
      ADD COLUMN IF NOT EXISTS "version_catalogue_attributes_fabric" varchar,
      ADD COLUMN IF NOT EXISTS "version_catalogue_attributes_pattern" varchar,
      ADD COLUMN IF NOT EXISTS "version_catalogue_attributes_opacity" varchar,
      ADD COLUMN IF NOT EXISTS "version_catalogue_attributes_color" varchar,
      ADD COLUMN IF NOT EXISTS "version_catalogue_attributes_color_family" varchar,
      ADD COLUMN IF NOT EXISTS "version_catalogue_attributes_recommended_room" varchar,
      ADD COLUMN IF NOT EXISTS "version_catalogue_attributes_pack_of" numeric,
      ADD COLUMN IF NOT EXISTS "version_catalogue_attributes_closure_type" varchar,
      ADD COLUMN IF NOT EXISTS "version_catalogue_attributes_installation" varchar,
      ADD COLUMN IF NOT EXISTS "version_catalogue_attributes_style_note" varchar,
      ADD COLUMN IF NOT EXISTS "version_catalogue_sales_insight_sessions90d" numeric,
      ADD COLUMN IF NOT EXISTS "version_catalogue_sales_insight_units_ordered" numeric,
      ADD COLUMN IF NOT EXISTS "version_catalogue_sales_insight_revenue_i_n_r" numeric,
      ADD COLUMN IF NOT EXISTS "version_catalogue_sales_insight_conversion_rate_pct" numeric,
      ADD COLUMN IF NOT EXISTS "version_catalogue_sales_insight_source_note" varchar,
      ADD COLUMN IF NOT EXISTS "version_seo_keywords_focus_keyword" varchar;

    CREATE TABLE IF NOT EXISTS "products_highlights" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
      "id" varchar PRIMARY KEY NOT NULL,
      "text" varchar NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "products_faqs" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
      "id" varchar PRIMARY KEY NOT NULL,
      "question" varchar NOT NULL,
      "answer" varchar NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "products_seo_keywords_secondary_keywords" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
      "id" varchar PRIMARY KEY NOT NULL,
      "keyword" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "_products_v_version_highlights" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL REFERENCES "_products_v"("id") ON DELETE CASCADE,
      "id" serial PRIMARY KEY NOT NULL,
      "text" varchar NOT NULL,
      "_uuid" varchar
    );
    CREATE TABLE IF NOT EXISTS "_products_v_version_faqs" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL REFERENCES "_products_v"("id") ON DELETE CASCADE,
      "id" serial PRIMARY KEY NOT NULL,
      "question" varchar NOT NULL,
      "answer" varchar NOT NULL,
      "_uuid" varchar
    );
    CREATE TABLE IF NOT EXISTS "_products_v_version_seo_keywords_secondary_keywords" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL REFERENCES "_products_v"("id") ON DELETE CASCADE,
      "id" serial PRIMARY KEY NOT NULL,
      "keyword" varchar NOT NULL,
      "_uuid" varchar
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "products_asin_idx" ON "products" USING btree ("asin");
    CREATE UNIQUE INDEX IF NOT EXISTS "products_sku_idx" ON "products" USING btree ("sku");
    CREATE INDEX IF NOT EXISTS "products_catalogue_catalogue_variant_group_key_idx" ON "products" USING btree ("catalogue_variant_group_key");
    CREATE INDEX IF NOT EXISTS "_products_v_version_version_asin_idx" ON "_products_v" USING btree ("version_asin");
    CREATE INDEX IF NOT EXISTS "_products_v_version_version_sku_idx" ON "_products_v" USING btree ("version_sku");
    CREATE INDEX IF NOT EXISTS "_products_v_version_catalogue_version_catalogue_variant__idx" ON "_products_v" USING btree ("version_catalogue_variant_group_key");

    CREATE INDEX IF NOT EXISTS "products_highlights_order_idx" ON "products_highlights" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "products_highlights_parent_id_idx" ON "products_highlights" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "products_faqs_order_idx" ON "products_faqs" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "products_faqs_parent_id_idx" ON "products_faqs" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "products_seo_keywords_secondary_keywords_order_idx" ON "products_seo_keywords_secondary_keywords" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "products_seo_keywords_secondary_keywords_parent_id_idx" ON "products_seo_keywords_secondary_keywords" USING btree ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "_products_v_version_seo_keywords_secondary_keywords";
    DROP TABLE IF EXISTS "_products_v_version_faqs";
    DROP TABLE IF EXISTS "_products_v_version_highlights";
    DROP TABLE IF EXISTS "products_seo_keywords_secondary_keywords";
    DROP TABLE IF EXISTS "products_faqs";
    DROP TABLE IF EXISTS "products_highlights";
  `)
}
