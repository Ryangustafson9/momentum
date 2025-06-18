

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."memberships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "system_member_id" integer NOT NULL,
    "join_date" "date",
    "status" "text" DEFAULT 'Active'::"text",
    "dependents_count" integer DEFAULT 0,
    "role" "text" DEFAULT 'member'::"text",
    "current_membership_type_id" "uuid",
    "auth_user_id" "uuid",
    "assigned_plan_ids" "text"[],
    "staff_role_id" "text",
    "parent_member_id" "uuid",
    "user_id" "uuid"
);


ALTER TABLE "public"."memberships" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_member_transactional"("member_payload" "jsonb") RETURNS SETOF "public"."memberships"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_member_id uuid;
  auth_user_id_provided uuid;
  new_auth_user_id uuid;
  member_email text;
  member_role text;
  system_id integer;
BEGIN
  -- Extract values from payload
  member_email := member_payload->>'email';
  member_role := member_payload->>'role';
  auth_user_id_provided := (member_payload->>'auth_user_id')::uuid;

  -- Generate a new UUID for the member if not provided
  new_member_id := COALESCE((member_payload->>'id')::uuid, gen_random_uuid());

  -- Generate system_member_id if not provided
  system_id := COALESCE((member_payload->>'system_member_id')::integer, floor(random() * 900000 + 100000)::integer);
  WHILE EXISTS (SELECT 1 FROM public.members WHERE system_member_id = system_id) LOOP
    system_id := floor(random() * 900000 + 100000)::integer;
  END LOOP;

  -- Handle auth user creation or linking
  IF auth_user_id_provided IS NOT NULL THEN
    new_auth_user_id := auth_user_id_provided;
  ELSE
    -- Check if an auth user already exists with this email
    SELECT id INTO new_auth_user_id FROM auth.users WHERE email = member_email;

    -- If no auth user exists, create one
    IF new_auth_user_id IS NULL THEN
      new_auth_user_id := auth.uid(); -- This might be null if called from a context without an active user
                                      -- For seeding, direct creation or a service role might be needed for auth.users
                                      -- For simplicity in seeding, we might skip auth.users creation or use a placeholder if allowed
      -- If truly needing to create an auth.user, it's complex from SQL without service_role key
      -- For now, let's assume auth_user_id might remain null if not provided and no matching email in auth.users
      -- Or, if this is for a test setup, we might not strictly need an auth.users entry for every seeded member.
    END IF;
  END IF;

  -- Insert into public.members
  INSERT INTO public.members (
    id,
    system_member_id,
    name,
    first_name,
    last_name,
    email,
    phone,
    join_date,
    status,
    notes,
    address,
    dob,
    emergency_contact_name,
    emergency_contact_phone,
    profile_picture_url,
    role,
    current_membership_type_id,
    staff_role_id,
    assigned_plan_ids,
    parent_member_id,
    auth_user_id, -- Link to auth.users
    created_at,
    updated_at,
    profile_creation_date
  )
  VALUES (
    new_member_id,
    system_id,
    member_payload->>'name',
    member_payload->>'first_name',
    member_payload->>'last_name',
    member_email,
    member_payload->>'phone',
    (member_payload->>'join_date')::date,
    member_payload->>'status',
    member_payload->>'notes',
    member_payload->>'address',
    (member_payload->>'dob')::date,
    member_payload->>'emergency_contact_name',
    member_payload->>'emergency_contact_phone',
    member_payload->>'profile_picture_url',
    member_role,
    (member_payload->>'current_membership_type_id')::uuid,
    member_payload->>'staff_role_id',
    (SELECT array_agg(value) FROM jsonb_array_elements_text(member_payload->'assigned_plan_ids') WHERE value IS NOT NULL),
    (member_payload->>'parent_member_id')::uuid,
    new_auth_user_id, 
    COALESCE((member_payload->>'created_at')::timestamptz, now()),
    COALESCE((member_payload->>'updated_at')::timestamptz, now()),
    COALESCE((member_payload->>'profile_creation_date')::timestamptz, now())
  )
  ON CONFLICT (email) DO NOTHING -- Or DO UPDATE if you want to update existing members by email
  RETURNING * INTO new_member_id; -- This is incorrect, INSERT ... RETURNING * returns the whole row

  -- Return the newly created or potentially existing (if ON CONFLICT DO NOTHING) member
  RETURN QUERY SELECT * FROM public.members WHERE id = new_member_id;
  IF NOT FOUND THEN
    -- If ON CONFLICT DO NOTHING and conflict occurred, try to return the existing member by email
    RETURN QUERY SELECT * FROM public.members WHERE email = member_email;
  END IF;

EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error in create_member_transactional for email %: %', member_email, SQLERRM;
    RETURN; -- Return nothing on error
END;
$$;


ALTER FUNCTION "public"."create_member_transactional"("member_payload" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_member_notes_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_member_notes_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_staff_member_notes_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_staff_member_notes_updated_at_column"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_panel_settings" (
    "id" integer DEFAULT 1 NOT NULL,
    "require_first_name" boolean DEFAULT true,
    "require_last_name" boolean DEFAULT true,
    "require_email" boolean DEFAULT true,
    "require_phone" boolean DEFAULT false,
    "require_dob" boolean DEFAULT false,
    "require_address" boolean DEFAULT false,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "single_row_admin_panel_settings" CHECK (("id" = 1))
);


ALTER TABLE "public"."admin_panel_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid",
    "member_name" "text",
    "class_id" "uuid",
    "class_name" "text",
    "check_in_time" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'Present'::"text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."attendance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."branding_settings" (
    "id" integer DEFAULT 1 NOT NULL,
    "club_logo_url" "text",
    "primary_color" character varying(7) DEFAULT '#3B82F6'::character varying,
    "secondary_color" character varying(7) DEFAULT '#10B981'::character varying,
    "header_bg_color" character varying(7) DEFAULT '#1F2937'::character varying,
    "header_text_color" character varying(7) DEFAULT '#FFFFFF'::character varying,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "single_row_constraint" CHECK (("id" = 1))
);


ALTER TABLE "public"."branding_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."class_waitlist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "class_id" "uuid" NOT NULL,
    "member_id" "uuid" NOT NULL,
    "requested_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "notified_at" timestamp with time zone,
    "status" "text" DEFAULT 'Waiting'::"text"
);


ALTER TABLE "public"."class_waitlist" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."classes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "instructor_id" "uuid",
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "max_capacity" integer,
    "booked_count" integer DEFAULT 0,
    "location" "text",
    "difficulty" "text",
    "recurring_rule" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."classes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."club_rules_settings" (
    "id" integer DEFAULT 1 NOT NULL,
    "rules_content" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "single_row_constraint_rules" CHECK (("id" = 1))
);


ALTER TABLE "public"."club_rules_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."general_settings" (
    "id" integer DEFAULT 1 NOT NULL,
    "gym_name" "text",
    "admin_email" "text",
    "timezone" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "stripe_publishable_key" "text",
    "stripe_secret_key" "text",
    CONSTRAINT "single_row_general_settings" CHECK (("id" = 1))
);


ALTER TABLE "public"."general_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."help_articles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "content" "text" NOT NULL,
    "category" "text" NOT NULL,
    "tags" "text"[],
    "author_id" "uuid",
    "view_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "is_published" boolean DEFAULT true
);


ALTER TABLE "public"."help_articles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."member_membership_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid",
    "membership_type_id" "uuid",
    "start_date" "date",
    "end_date" "date",
    "status" "text",
    "price_paid" numeric,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."member_membership_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."member_membership_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid",
    "membership_type_id" "uuid",
    "plan_name" "text",
    "action" "text" NOT NULL,
    "start_date" "date",
    "end_date" "date",
    "price_paid" numeric,
    "status_before" "text",
    "status_after" "text",
    "logged_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "notes" "text",
    "created_by" "uuid"
);


ALTER TABLE "public"."member_membership_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."member_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."member_notes" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."members_system_member_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."members_system_member_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."members_system_member_id_seq" OWNED BY "public"."memberships"."system_member_id";



CREATE TABLE IF NOT EXISTS "public"."membership_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "price" numeric(10,2),
    "billing_type" "text",
    "duration_months" integer,
    "features" "text"[],
    "available_for_sale" boolean DEFAULT true,
    "available_online" boolean DEFAULT false,
    "active" boolean DEFAULT true,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "category" "text",
    "color" "text",
    "role_id" "text"
);


ALTER TABLE "public"."membership_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_settings" (
    "id" integer DEFAULT 1 NOT NULL,
    "email_new_member" boolean DEFAULT true,
    "email_class_booking" boolean DEFAULT false,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "email_membership_expiry" boolean DEFAULT true,
    "sms_payment_reminder" boolean DEFAULT false,
    CONSTRAINT "single_row_notification_settings" CHECK (("id" = 1))
);


ALTER TABLE "public"."notification_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_name" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "body_text" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notification_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text",
    "type" "text",
    "message" "text" NOT NULL,
    "link" "text",
    "read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "stripe_payment_intent_id" "text",
    "stripe_charge_id" "text",
    "stripe_setup_intent_id" "text",
    "amount" numeric(10,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'usd'::character varying NOT NULL,
    "status" "text" NOT NULL,
    "description" "text",
    "payment_method_details" "jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "system_member_id" integer DEFAULT "nextval"('"public"."members_system_member_id_seq"'::"regclass") NOT NULL,
    "name" "text",
    "first_name" "text",
    "last_name" "text",
    "email" "text",
    "phone" "text",
    "access_card_number" "text",
    "address" "text",
    "dob" "date",
    "emergency_contact_name" "text",
    "emergency_contact_phone" "text",
    "profile_picture_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "role" "text" DEFAULT 'non-member'::"text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff_member_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "staff_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."staff_member_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff_roles" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "permissions" "jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."staff_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stripe_customers" (
    "member_id" "uuid" NOT NULL,
    "stripe_customer_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."stripe_customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "subject" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text",
    "status" "text" DEFAULT 'Open'::"text",
    "priority" "text" DEFAULT 'Medium'::"text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" timestamp with time zone,
    "assigned_to_staff_id" "uuid"
);


ALTER TABLE "public"."support_tickets" OWNER TO "postgres";


ALTER TABLE ONLY "public"."memberships" ALTER COLUMN "system_member_id" SET DEFAULT "nextval"('"public"."members_system_member_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."admin_panel_settings"
    ADD CONSTRAINT "admin_panel_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."branding_settings"
    ADD CONSTRAINT "branding_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."class_waitlist"
    ADD CONSTRAINT "class_waitlist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."club_rules_settings"
    ADD CONSTRAINT "club_rules_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."general_settings"
    ADD CONSTRAINT "general_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."help_articles"
    ADD CONSTRAINT "help_articles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."help_articles"
    ADD CONSTRAINT "help_articles_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."member_membership_assignments"
    ADD CONSTRAINT "member_membership_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."member_membership_log"
    ADD CONSTRAINT "member_membership_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."member_notes"
    ADD CONSTRAINT "member_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."membership_types"
    ADD CONSTRAINT "membership_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_settings"
    ADD CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_templates"
    ADD CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_templates"
    ADD CONSTRAINT "notification_templates_template_name_key" UNIQUE ("template_name");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profile_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profile_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff_member_notes"
    ADD CONSTRAINT "staff_member_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff_roles"
    ADD CONSTRAINT "staff_roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."staff_roles"
    ADD CONSTRAINT "staff_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_pkey" PRIMARY KEY ("member_id");



ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_stripe_customer_id_key" UNIQUE ("stripe_customer_id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."class_waitlist"
    ADD CONSTRAINT "unique_waitlist_entry" UNIQUE ("class_id", "member_id");



CREATE INDEX "idx_attendance_class_id" ON "public"."attendance" USING "btree" ("class_id");



CREATE INDEX "idx_attendance_member_id" ON "public"."attendance" USING "btree" ("member_id");



CREATE INDEX "idx_class_waitlist_class_id" ON "public"."class_waitlist" USING "btree" ("class_id");



CREATE INDEX "idx_class_waitlist_member_id" ON "public"."class_waitlist" USING "btree" ("member_id");



CREATE INDEX "idx_help_articles_category" ON "public"."help_articles" USING "btree" ("category");



CREATE INDEX "idx_help_articles_is_published" ON "public"."help_articles" USING "btree" ("is_published");



CREATE INDEX "idx_member_membership_assignments_member_id" ON "public"."member_membership_assignments" USING "btree" ("member_id");



CREATE INDEX "idx_member_membership_assignments_membership_type_id" ON "public"."member_membership_assignments" USING "btree" ("membership_type_id");



CREATE INDEX "idx_member_membership_log_member_id" ON "public"."member_membership_log" USING "btree" ("member_id");



CREATE INDEX "idx_members_current_membership_type_id" ON "public"."memberships" USING "btree" ("current_membership_type_id");



CREATE INDEX "idx_members_parent_member_id" ON "public"."memberships" USING "btree" ("parent_member_id");



CREATE INDEX "idx_members_staff_role_id" ON "public"."memberships" USING "btree" ("staff_role_id");



CREATE INDEX "idx_payments_member_id" ON "public"."payments" USING "btree" ("member_id");



CREATE INDEX "idx_payments_stripe_payment_intent_id" ON "public"."payments" USING "btree" ("stripe_payment_intent_id");



CREATE INDEX "idx_staff_member_notes_member_id" ON "public"."staff_member_notes" USING "btree" ("member_id");



CREATE INDEX "idx_staff_member_notes_staff_id" ON "public"."staff_member_notes" USING "btree" ("staff_id");



CREATE INDEX "idx_support_tickets_category" ON "public"."support_tickets" USING "btree" ("category");



CREATE INDEX "idx_support_tickets_member_id" ON "public"."support_tickets" USING "btree" ("member_id");



CREATE INDEX "idx_support_tickets_status" ON "public"."support_tickets" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "update_member_notes_modtime" BEFORE UPDATE ON "public"."member_notes" FOR EACH ROW EXECUTE FUNCTION "public"."update_member_notes_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_staff_member_notes_modtime" BEFORE UPDATE ON "public"."staff_member_notes" FOR EACH ROW EXECUTE FUNCTION "public"."update_staff_member_notes_updated_at_column"();



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."memberships"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."class_waitlist"
    ADD CONSTRAINT "class_waitlist_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."class_waitlist"
    ADD CONSTRAINT "class_waitlist_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."memberships"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "public"."memberships"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "fk_staff_role_id" FOREIGN KEY ("staff_role_id") REFERENCES "public"."staff_roles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."help_articles"
    ADD CONSTRAINT "help_articles_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."memberships"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."member_membership_assignments"
    ADD CONSTRAINT "member_membership_assignments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."memberships"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member_membership_assignments"
    ADD CONSTRAINT "member_membership_assignments_membership_type_id_fkey" FOREIGN KEY ("membership_type_id") REFERENCES "public"."membership_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member_membership_log"
    ADD CONSTRAINT "member_membership_log_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."memberships"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member_membership_log"
    ADD CONSTRAINT "member_membership_log_membership_type_id_fkey" FOREIGN KEY ("membership_type_id") REFERENCES "public"."membership_types"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."member_notes"
    ADD CONSTRAINT "member_notes_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."memberships"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "members_current_membership_type_id_fkey" FOREIGN KEY ("current_membership_type_id") REFERENCES "public"."membership_types"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "members_parent_member_id_fkey" FOREIGN KEY ("parent_member_id") REFERENCES "public"."memberships"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."memberships"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff_member_notes"
    ADD CONSTRAINT "staff_member_notes_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."memberships"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff_member_notes"
    ADD CONSTRAINT "staff_member_notes_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."memberships"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."memberships"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_assigned_to_staff_id_fkey" FOREIGN KEY ("assigned_to_staff_id") REFERENCES "public"."memberships"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."memberships"("id") ON DELETE CASCADE;



CREATE POLICY "Allow admin/staff full access to help_articles" ON "public"."help_articles" USING ((EXISTS ( SELECT 1
   FROM "public"."memberships"
  WHERE (("memberships"."auth_user_id" = "auth"."uid"()) AND (("memberships"."role" = 'admin'::"text") OR ("memberships"."role" = 'staff'::"text")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."memberships"
  WHERE (("memberships"."auth_user_id" = "auth"."uid"()) AND (("memberships"."role" = 'admin'::"text") OR ("memberships"."role" = 'staff'::"text"))))));



CREATE POLICY "Allow admin/staff full access to payments" ON "public"."payments" USING ((EXISTS ( SELECT 1
   FROM "public"."memberships"
  WHERE (("memberships"."auth_user_id" = "auth"."uid"()) AND (("memberships"."role" = 'admin'::"text") OR ("memberships"."role" = 'staff'::"text")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."memberships"
  WHERE (("memberships"."auth_user_id" = "auth"."uid"()) AND (("memberships"."role" = 'admin'::"text") OR ("memberships"."role" = 'staff'::"text"))))));



CREATE POLICY "Allow admin/staff full access to stripe_customers" ON "public"."stripe_customers" USING ((EXISTS ( SELECT 1
   FROM "public"."memberships"
  WHERE (("memberships"."auth_user_id" = "auth"."uid"()) AND (("memberships"."role" = 'admin'::"text") OR ("memberships"."role" = 'staff'::"text")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."memberships"
  WHERE (("memberships"."auth_user_id" = "auth"."uid"()) AND (("memberships"."role" = 'admin'::"text") OR ("memberships"."role" = 'staff'::"text"))))));



CREATE POLICY "Allow admin/staff full access to support_tickets" ON "public"."support_tickets" USING ((EXISTS ( SELECT 1
   FROM "public"."memberships"
  WHERE (("memberships"."auth_user_id" = "auth"."uid"()) AND (("memberships"."role" = 'admin'::"text") OR ("memberships"."role" = 'staff'::"text")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."memberships"
  WHERE (("memberships"."auth_user_id" = "auth"."uid"()) AND (("memberships"."role" = 'admin'::"text") OR ("memberships"."role" = 'staff'::"text"))))));



CREATE POLICY "Allow anon delete for notifications" ON "public"."notifications" FOR DELETE TO "anon" USING (true);



CREATE POLICY "Allow anon insert for member_membership_assignments" ON "public"."member_membership_assignments" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Allow anon insert for member_membership_log" ON "public"."member_membership_log" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Allow anon insert for members" ON "public"."memberships" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Allow anon insert for membership_types" ON "public"."membership_types" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Allow anon insert for notifications" ON "public"."notifications" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Allow anon insert for staff_roles" ON "public"."staff_roles" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Allow anon read access to admin panel settings" ON "public"."admin_panel_settings" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow anon read access to general settings" ON "public"."general_settings" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow anon read access to members" ON "public"."memberships" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow anon read access to membership_types" ON "public"."membership_types" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow anon read access to notification settings" ON "public"."notification_settings" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow anon select for member_membership_assignments" ON "public"."member_membership_assignments" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow anon select for member_membership_log" ON "public"."member_membership_log" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow anon select for members" ON "public"."memberships" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow anon select for membership_types" ON "public"."membership_types" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow anon select for notifications" ON "public"."notifications" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow anon select for staff_roles" ON "public"."staff_roles" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow anon to delete from staff_roles" ON "public"."staff_roles" FOR DELETE TO "anon" USING (true);



CREATE POLICY "Allow anon to insert into staff_roles" ON "public"."staff_roles" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Allow anon to select from staff_roles" ON "public"."staff_roles" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow anon to update staff_roles" ON "public"."staff_roles" FOR UPDATE TO "anon" WITH CHECK (true);



CREATE POLICY "Allow anon update for notifications" ON "public"."notifications" FOR UPDATE TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "Allow anon update for staff_roles" ON "public"."staff_roles" FOR UPDATE TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated read access to waitlist" ON "public"."class_waitlist" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to delete their own attendance record" ON "public"."attendance" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "member_id"));



CREATE POLICY "Allow authenticated users to delete their own classes" ON "public"."classes" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "instructor_id"));



CREATE POLICY "Allow authenticated users to delete their own notifications" ON "public"."notifications" FOR DELETE TO "authenticated" USING ((( SELECT ("auth"."uid"())::"text" AS "uid") = "user_id"));



CREATE POLICY "Allow authenticated users to insert new classes" ON "public"."classes" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to insert new notifications" ON "public"."notifications" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to insert their own attendance record" ON "public"."attendance" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "member_id"));



CREATE POLICY "Allow authenticated users to manage their own data" ON "public"."memberships" TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Allow authenticated users to update their own attendance record" ON "public"."attendance" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "member_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "member_id"));



CREATE POLICY "Allow authenticated users to update their own classes" ON "public"."classes" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "instructor_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "instructor_id"));



CREATE POLICY "Allow authenticated users to update their own notifications" ON "public"."notifications" FOR UPDATE TO "authenticated" USING ((( SELECT ("auth"."uid"())::"text" AS "uid") = "user_id")) WITH CHECK ((( SELECT ("auth"."uid"())::"text" AS "uid") = "user_id"));



CREATE POLICY "Allow authenticated users to view classes" ON "public"."classes" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to view their own attendance records" ON "public"."attendance" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "member_id"));



CREATE POLICY "Allow authenticated users to view their own notifications" ON "public"."notifications" FOR SELECT TO "authenticated" USING ((( SELECT ("auth"."uid"())::"text" AS "uid") = "user_id"));



CREATE POLICY "Allow authenticated write access to admin panel settings" ON "public"."admin_panel_settings" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated write access to general settings" ON "public"."general_settings" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated write access to notification settings" ON "public"."notification_settings" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow members to manage own waitlist entries" ON "public"."class_waitlist" USING (("auth"."uid"() = "member_id")) WITH CHECK (("auth"."uid"() = "member_id"));



CREATE POLICY "Allow public read access to published help articles" ON "public"."help_articles" FOR SELECT USING (("is_published" = true));



CREATE POLICY "Allow staff to manage all member data" ON "public"."memberships" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."memberships" "memberships_1"
  WHERE (("memberships_1"."id" = "auth"."uid"()) AND ("memberships_1"."role" = 'staff'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."memberships" "memberships_1"
  WHERE (("memberships_1"."id" = "auth"."uid"()) AND ("memberships_1"."role" = 'staff'::"text")))));



CREATE POLICY "Allow staff to manage membership_types" ON "public"."membership_types" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."memberships"
  WHERE (("memberships"."id" = "auth"."uid"()) AND ("memberships"."role" = 'staff'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."memberships"
  WHERE (("memberships"."id" = "auth"."uid"()) AND ("memberships"."role" = 'staff'::"text")))));



CREATE POLICY "Members can delete their own notes" ON "public"."member_notes" FOR DELETE USING (("auth"."uid"() = "member_id"));



CREATE POLICY "Members can insert their own notes" ON "public"."member_notes" FOR INSERT WITH CHECK (("auth"."uid"() = "member_id"));



CREATE POLICY "Members can manage own stripe customer link" ON "public"."stripe_customers" USING ((EXISTS ( SELECT 1
   FROM "public"."memberships"
  WHERE (("memberships"."auth_user_id" = "auth"."uid"()) AND ("memberships"."id" = "stripe_customers"."member_id"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."memberships"
  WHERE (("memberships"."auth_user_id" = "auth"."uid"()) AND ("memberships"."id" = "stripe_customers"."member_id")))));



CREATE POLICY "Members can manage own support tickets" ON "public"."support_tickets" USING ((EXISTS ( SELECT 1
   FROM "public"."memberships"
  WHERE (("memberships"."auth_user_id" = "auth"."uid"()) AND ("memberships"."id" = "support_tickets"."member_id"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."memberships"
  WHERE (("memberships"."auth_user_id" = "auth"."uid"()) AND ("memberships"."id" = "support_tickets"."member_id")))));



CREATE POLICY "Members can update their own notes" ON "public"."member_notes" FOR UPDATE USING (("auth"."uid"() = "member_id")) WITH CHECK (("auth"."uid"() = "member_id"));



CREATE POLICY "Members can view notes about themselves if specifically allowed" ON "public"."staff_member_notes" FOR SELECT USING (false);



CREATE POLICY "Members can view own payments" ON "public"."payments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."memberships"
  WHERE (("memberships"."auth_user_id" = "auth"."uid"()) AND ("memberships"."id" = "payments"."member_id")))));



CREATE POLICY "Members can view their own notes" ON "public"."member_notes" FOR SELECT USING (("auth"."uid"() = "member_id"));



CREATE POLICY "Staff can manage notes on members" ON "public"."staff_member_notes" USING ((EXISTS ( SELECT 1
   FROM "public"."memberships"
  WHERE (("memberships"."id" = "auth"."uid"()) AND ("memberships"."role" = 'staff'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."memberships"
  WHERE (("memberships"."id" = "auth"."uid"()) AND ("memberships"."role" = 'staff'::"text")))));



CREATE POLICY "delete_own_membership_assignments" ON "public"."member_membership_assignments" FOR DELETE USING (("member_id" = ( SELECT "memberships"."id"
   FROM "public"."memberships"
  WHERE ("memberships"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "insert_own_membership_assignments" ON "public"."member_membership_assignments" FOR INSERT WITH CHECK (("member_id" = ( SELECT "memberships"."id"
   FROM "public"."memberships"
  WHERE ("memberships"."auth_user_id" = "auth"."uid"()))));



ALTER TABLE "public"."member_membership_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."member_membership_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."member_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."membership_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."memberships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "select_own_membership_assignments" ON "public"."member_membership_assignments" FOR SELECT USING (("member_id" = ( SELECT "memberships"."id"
   FROM "public"."memberships"
  WHERE ("memberships"."auth_user_id" = "auth"."uid"()))));



ALTER TABLE "public"."staff_member_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."staff_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update_own_membership_assignments" ON "public"."member_membership_assignments" FOR UPDATE USING (("member_id" = ( SELECT "memberships"."id"
   FROM "public"."memberships"
  WHERE ("memberships"."auth_user_id" = "auth"."uid"()))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

















































































































































































GRANT ALL ON TABLE "public"."memberships" TO "anon";
GRANT ALL ON TABLE "public"."memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."memberships" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_member_transactional"("member_payload" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_member_transactional"("member_payload" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_member_transactional"("member_payload" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_member_notes_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_member_notes_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_member_notes_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_staff_member_notes_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_staff_member_notes_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_staff_member_notes_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."admin_panel_settings" TO "anon";
GRANT ALL ON TABLE "public"."admin_panel_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_panel_settings" TO "service_role";



GRANT ALL ON TABLE "public"."attendance" TO "anon";
GRANT ALL ON TABLE "public"."attendance" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance" TO "service_role";



GRANT ALL ON TABLE "public"."branding_settings" TO "anon";
GRANT ALL ON TABLE "public"."branding_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."branding_settings" TO "service_role";



GRANT ALL ON TABLE "public"."class_waitlist" TO "anon";
GRANT ALL ON TABLE "public"."class_waitlist" TO "authenticated";
GRANT ALL ON TABLE "public"."class_waitlist" TO "service_role";



GRANT ALL ON TABLE "public"."classes" TO "anon";
GRANT ALL ON TABLE "public"."classes" TO "authenticated";
GRANT ALL ON TABLE "public"."classes" TO "service_role";



GRANT ALL ON TABLE "public"."club_rules_settings" TO "anon";
GRANT ALL ON TABLE "public"."club_rules_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."club_rules_settings" TO "service_role";



GRANT ALL ON TABLE "public"."general_settings" TO "anon";
GRANT ALL ON TABLE "public"."general_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."general_settings" TO "service_role";



GRANT ALL ON TABLE "public"."help_articles" TO "anon";
GRANT ALL ON TABLE "public"."help_articles" TO "authenticated";
GRANT ALL ON TABLE "public"."help_articles" TO "service_role";



GRANT ALL ON TABLE "public"."member_membership_assignments" TO "anon";
GRANT ALL ON TABLE "public"."member_membership_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."member_membership_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."member_membership_log" TO "anon";
GRANT ALL ON TABLE "public"."member_membership_log" TO "authenticated";
GRANT ALL ON TABLE "public"."member_membership_log" TO "service_role";



GRANT ALL ON TABLE "public"."member_notes" TO "anon";
GRANT ALL ON TABLE "public"."member_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."member_notes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."members_system_member_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."members_system_member_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."members_system_member_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."membership_types" TO "anon";
GRANT ALL ON TABLE "public"."membership_types" TO "authenticated";
GRANT ALL ON TABLE "public"."membership_types" TO "service_role";



GRANT ALL ON TABLE "public"."notification_settings" TO "anon";
GRANT ALL ON TABLE "public"."notification_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_settings" TO "service_role";



GRANT ALL ON TABLE "public"."notification_templates" TO "anon";
GRANT ALL ON TABLE "public"."notification_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_templates" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."staff_member_notes" TO "anon";
GRANT ALL ON TABLE "public"."staff_member_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."staff_member_notes" TO "service_role";



GRANT ALL ON TABLE "public"."staff_roles" TO "anon";
GRANT ALL ON TABLE "public"."staff_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."staff_roles" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_customers" TO "anon";
GRANT ALL ON TABLE "public"."stripe_customers" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_customers" TO "service_role";



GRANT ALL ON TABLE "public"."support_tickets" TO "anon";
GRANT ALL ON TABLE "public"."support_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."support_tickets" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
