import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_users_roles" ADD VALUE IF NOT EXISTS 'support';

    DO $$ BEGIN
      CREATE TYPE "public"."enum_users_account_status" AS ENUM('active', 'blocked', 'pendingDeletion');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_users_auth_methods" AS ENUM('password', 'google');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_users_last_login_provider" AS ENUM('password', 'google');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_auth_identities_provider" AS ENUM('google');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_auth_audit_events_event" AS ENUM(
        'signup_succeeded', 'signup_failed', 'email_verification_succeeded',
        'email_verification_failed', 'password_login_succeeded', 'password_login_failed',
        'google_login_succeeded', 'google_login_failed', 'google_identity_linked',
        'logout', 'logout_all_devices', 'password_reset_requested',
        'password_reset_completed', 'account_blocked', 'identity_conflict',
        'oauth_state_mismatch', 'oauth_callback_expired'
      );
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_auth_audit_events_provider" AS ENUM('password', 'google');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "first_name" varchar,
      ADD COLUMN IF NOT EXISTS "last_name" varchar,
      ADD COLUMN IF NOT EXISTS "display_name" varchar,
      ADD COLUMN IF NOT EXISTS "avatar_u_r_l" varchar,
      ADD COLUMN IF NOT EXISTS "account_status" "enum_users_account_status" DEFAULT 'active' NOT NULL,
      ADD COLUMN IF NOT EXISTS "has_local_password" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "email_verified_at" timestamp(3) with time zone,
      ADD COLUMN IF NOT EXISTS "accepted_terms_at" timestamp(3) with time zone,
      ADD COLUMN IF NOT EXISTS "last_login_at" timestamp(3) with time zone,
      ADD COLUMN IF NOT EXISTS "last_login_provider" "enum_users_last_login_provider",
      ADD COLUMN IF NOT EXISTS "_verified" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "_verificationtoken" varchar;

    CREATE TABLE IF NOT EXISTS "users_auth_methods" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_users_auth_methods",
      "id" serial PRIMARY KEY NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "users_auth_methods_order_idx" ON "users_auth_methods" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "users_auth_methods_parent_idx" ON "users_auth_methods" USING btree ("parent_id");
    DO $$ BEGIN
      ALTER TABLE "users_auth_methods" ADD CONSTRAINT "users_auth_methods_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE TABLE IF NOT EXISTS "auth_identities" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL,
      "provider" "enum_auth_identities_provider" NOT NULL,
      "provider_account_id" varchar NOT NULL,
      "provider_key" varchar NOT NULL,
      "provider_email" varchar,
      "linked_at" timestamp(3) with time zone NOT NULL,
      "last_used_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    DO $$ BEGIN
      ALTER TABLE "auth_identities" ADD CONSTRAINT "auth_identities_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    CREATE INDEX IF NOT EXISTS "auth_identities_user_idx" ON "auth_identities" USING btree ("user_id");
    CREATE INDEX IF NOT EXISTS "auth_identities_provider_idx" ON "auth_identities" USING btree ("provider");
    CREATE INDEX IF NOT EXISTS "auth_identities_provider_account_id_idx" ON "auth_identities" USING btree ("provider_account_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "auth_identities_provider_key_idx" ON "auth_identities" USING btree ("provider_key");
    CREATE INDEX IF NOT EXISTS "auth_identities_linked_at_idx" ON "auth_identities" USING btree ("linked_at");
    CREATE INDEX IF NOT EXISTS "auth_identities_updated_at_idx" ON "auth_identities" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "auth_identities_created_at_idx" ON "auth_identities" USING btree ("created_at");

    CREATE TABLE IF NOT EXISTS "oauth_sessions" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL,
      "token_hash" varchar NOT NULL,
      "expires_at" timestamp(3) with time zone NOT NULL,
      "revoked_at" timestamp(3) with time zone,
      "created_user_agent_hash" varchar,
      "created_i_p_hash" varchar,
      "last_used_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    DO $$ BEGIN
      ALTER TABLE "oauth_sessions" ADD CONSTRAINT "oauth_sessions_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    CREATE INDEX IF NOT EXISTS "oauth_sessions_user_idx" ON "oauth_sessions" USING btree ("user_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "oauth_sessions_token_hash_idx" ON "oauth_sessions" USING btree ("token_hash");
    CREATE INDEX IF NOT EXISTS "oauth_sessions_expires_at_idx" ON "oauth_sessions" USING btree ("expires_at");
    CREATE INDEX IF NOT EXISTS "oauth_sessions_revoked_at_idx" ON "oauth_sessions" USING btree ("revoked_at");
    CREATE INDEX IF NOT EXISTS "oauth_sessions_updated_at_idx" ON "oauth_sessions" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "oauth_sessions_created_at_idx" ON "oauth_sessions" USING btree ("created_at");

    CREATE TABLE IF NOT EXISTS "auth_audit_events" (
      "id" serial PRIMARY KEY NOT NULL,
      "event" "enum_auth_audit_events_event" NOT NULL,
      "user_id" integer,
      "provider" "enum_auth_audit_events_provider",
      "success" boolean NOT NULL,
      "reason_code" varchar,
      "ip_hash" varchar,
      "user_agent" varchar,
      "metadata" jsonb,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    DO $$ BEGIN
      ALTER TABLE "auth_audit_events" ADD CONSTRAINT "auth_audit_events_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    CREATE INDEX IF NOT EXISTS "auth_audit_events_event_idx" ON "auth_audit_events" USING btree ("event");
    CREATE INDEX IF NOT EXISTS "auth_audit_events_user_idx" ON "auth_audit_events" USING btree ("user_id");
    CREATE INDEX IF NOT EXISTS "auth_audit_events_provider_idx" ON "auth_audit_events" USING btree ("provider");
    CREATE INDEX IF NOT EXISTS "auth_audit_events_success_idx" ON "auth_audit_events" USING btree ("success");
    CREATE INDEX IF NOT EXISTS "auth_audit_events_reason_code_idx" ON "auth_audit_events" USING btree ("reason_code");
    CREATE INDEX IF NOT EXISTS "auth_audit_events_ip_hash_idx" ON "auth_audit_events" USING btree ("ip_hash");
    CREATE INDEX IF NOT EXISTS "auth_audit_events_updated_at_idx" ON "auth_audit_events" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "auth_audit_events_created_at_idx" ON "auth_audit_events" USING btree ("created_at");

    CREATE TABLE IF NOT EXISTS "auth_rate_limits" (
      "id" serial PRIMARY KEY NOT NULL,
      "bucket_key" varchar NOT NULL,
      "action" varchar NOT NULL,
      "count" numeric NOT NULL,
      "expires_at" timestamp(3) with time zone NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "auth_rate_limits_bucket_key_idx" ON "auth_rate_limits" USING btree ("bucket_key");
    CREATE INDEX IF NOT EXISTS "auth_rate_limits_action_idx" ON "auth_rate_limits" USING btree ("action");
    CREATE INDEX IF NOT EXISTS "auth_rate_limits_expires_at_idx" ON "auth_rate_limits" USING btree ("expires_at");
    CREATE INDEX IF NOT EXISTS "auth_rate_limits_updated_at_idx" ON "auth_rate_limits" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "auth_rate_limits_created_at_idx" ON "auth_rate_limits" USING btree ("created_at");

    UPDATE "users"
      SET "_verified" = true,
          "email_verified_at" = COALESCE("email_verified_at", "created_at"),
          "has_local_password" = ("hash" IS NOT NULL)
      WHERE "_verified" IS DISTINCT FROM true;
    INSERT INTO "users_auth_methods" ("order", "parent_id", "value")
      SELECT 1, "id", 'password'::"enum_users_auth_methods"
      FROM "users" WHERE "hash" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM "users_auth_methods" methods
          WHERE methods."parent_id" = "users"."id" AND methods."value" = 'password'
        );
    INSERT INTO "users_auth_methods" ("order", "parent_id", "value")
      SELECT 2, "id", 'google'::"enum_users_auth_methods"
      FROM "users" WHERE "google_subject" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM "users_auth_methods" methods
          WHERE methods."parent_id" = "users"."id" AND methods."value" = 'google'
        );
    INSERT INTO "auth_identities" (
      "user_id", "provider", "provider_account_id", "provider_key",
      "provider_email", "linked_at", "last_used_at"
    )
      SELECT "id", 'google', "google_subject", 'google:' || "google_subject",
        "email", COALESCE("created_at", now()), now()
      FROM "users"
      WHERE "google_subject" IS NOT NULL
      ON CONFLICT ("provider_key") DO NOTHING;

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "auth_identities_id" integer,
      ADD COLUMN IF NOT EXISTS "oauth_sessions_id" integer,
      ADD COLUMN IF NOT EXISTS "auth_audit_events_id" integer,
      ADD COLUMN IF NOT EXISTS "auth_rate_limits_id" integer;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_auth_identities_fk"
        FOREIGN KEY ("auth_identities_id") REFERENCES "public"."auth_identities"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_oauth_sessions_fk"
        FOREIGN KEY ("oauth_sessions_id") REFERENCES "public"."oauth_sessions"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_auth_audit_events_fk"
        FOREIGN KEY ("auth_audit_events_id") REFERENCES "public"."auth_audit_events"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_auth_rate_limits_fk"
        FOREIGN KEY ("auth_rate_limits_id") REFERENCES "public"."auth_rate_limits"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_auth_identities_id_idx" ON "payload_locked_documents_rels" USING btree ("auth_identities_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_oauth_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("oauth_sessions_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_auth_audit_events_id_idx" ON "payload_locked_documents_rels" USING btree ("auth_audit_events_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_auth_rate_limits_id_idx" ON "payload_locked_documents_rels" USING btree ("auth_rate_limits_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_auth_identities_fk",
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_oauth_sessions_fk",
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_auth_audit_events_fk",
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_auth_rate_limits_fk",
      DROP COLUMN IF EXISTS "auth_identities_id",
      DROP COLUMN IF EXISTS "oauth_sessions_id",
      DROP COLUMN IF EXISTS "auth_audit_events_id",
      DROP COLUMN IF EXISTS "auth_rate_limits_id";

    DROP TABLE IF EXISTS "auth_rate_limits" CASCADE;
    DROP TABLE IF EXISTS "auth_audit_events" CASCADE;
    DROP TABLE IF EXISTS "oauth_sessions" CASCADE;
    DROP TABLE IF EXISTS "auth_identities" CASCADE;
    DROP TABLE IF EXISTS "users_auth_methods" CASCADE;

    ALTER TABLE "users"
      DROP COLUMN IF EXISTS "first_name",
      DROP COLUMN IF EXISTS "last_name",
      DROP COLUMN IF EXISTS "display_name",
      DROP COLUMN IF EXISTS "avatar_u_r_l",
      DROP COLUMN IF EXISTS "account_status",
      DROP COLUMN IF EXISTS "has_local_password",
      DROP COLUMN IF EXISTS "email_verified_at",
      DROP COLUMN IF EXISTS "accepted_terms_at",
      DROP COLUMN IF EXISTS "last_login_at",
      DROP COLUMN IF EXISTS "last_login_provider",
      DROP COLUMN IF EXISTS "_verified",
      DROP COLUMN IF EXISTS "_verificationtoken";

    DROP TYPE IF EXISTS "public"."enum_auth_audit_events_provider";
    DROP TYPE IF EXISTS "public"."enum_auth_audit_events_event";
    DROP TYPE IF EXISTS "public"."enum_auth_identities_provider";
    DROP TYPE IF EXISTS "public"."enum_users_last_login_provider";
    DROP TYPE IF EXISTS "public"."enum_users_auth_methods";
    DROP TYPE IF EXISTS "public"."enum_users_account_status";
    -- PostgreSQL cannot safely remove an enum value in place; the additive
    -- 'support' role is intentionally retained on rollback.
  `)
}
