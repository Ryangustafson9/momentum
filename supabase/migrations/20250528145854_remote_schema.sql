create sequence "public"."members_system_member_id_seq";

create table "public"."admin_panel_settings" (
    "id" integer not null default 1,
    "require_first_name" boolean default true,
    "require_last_name" boolean default true,
    "require_email" boolean default true,
    "require_phone" boolean default false,
    "require_dob" boolean default false,
    "require_address" boolean default false,
    "updated_at" timestamp with time zone default now()
);


create table "public"."attendance" (
    "id" uuid not null default gen_random_uuid(),
    "member_id" uuid,
    "member_name" text,
    "class_id" uuid,
    "class_name" text,
    "check_in_time" timestamp with time zone default now(),
    "status" text default 'Present'::text,
    "notes" text,
    "created_at" timestamp with time zone default now()
);


create table "public"."branding_settings" (
    "id" integer not null default 1,
    "club_logo_url" text,
    "primary_color" character varying(7) default '#3B82F6'::character varying,
    "secondary_color" character varying(7) default '#10B981'::character varying,
    "header_bg_color" character varying(7) default '#1F2937'::character varying,
    "header_text_color" character varying(7) default '#FFFFFF'::character varying,
    "updated_at" timestamp with time zone default now()
);


create table "public"."class_waitlist" (
    "id" uuid not null default gen_random_uuid(),
    "class_id" uuid not null,
    "member_id" uuid not null,
    "requested_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "notified_at" timestamp with time zone,
    "status" text default 'Waiting'::text
);


create table "public"."classes" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "instructor_id" uuid,
    "start_time" timestamp with time zone not null,
    "end_time" timestamp with time zone not null,
    "max_capacity" integer,
    "booked_count" integer default 0,
    "location" text,
    "difficulty" text,
    "recurring_rule" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "created_by" uuid
);


create table "public"."club_rules_settings" (
    "id" integer not null default 1,
    "rules_content" text,
    "updated_at" timestamp with time zone default now()
);


create table "public"."general_settings" (
    "id" integer not null default 1,
    "gym_name" text,
    "admin_email" text,
    "timezone" text,
    "updated_at" timestamp with time zone default now(),
    "stripe_publishable_key" text,
    "stripe_secret_key" text
);


create table "public"."help_articles" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "slug" text not null,
    "content" text not null,
    "category" text not null,
    "tags" text[],
    "author_id" uuid,
    "view_count" integer default 0,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "is_published" boolean default true
);


create table "public"."member_membership_assignments" (
    "id" uuid not null default gen_random_uuid(),
    "member_id" uuid,
    "membership_type_id" uuid,
    "start_date" date,
    "end_date" date,
    "status" text,
    "price_paid" numeric,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."member_membership_assignments" enable row level security;

create table "public"."member_membership_log" (
    "id" uuid not null default gen_random_uuid(),
    "member_id" uuid,
    "membership_type_id" uuid,
    "plan_name" text,
    "action" text not null,
    "start_date" date,
    "end_date" date,
    "price_paid" numeric,
    "status_before" text,
    "status_after" text,
    "logged_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "notes" text,
    "created_by" uuid
);


alter table "public"."member_membership_log" enable row level security;

create table "public"."member_notes" (
    "id" uuid not null default gen_random_uuid(),
    "member_id" uuid not null,
    "content" text not null,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP
);


alter table "public"."member_notes" enable row level security;

create table "public"."membership_types" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "price" numeric(10,2),
    "billing_type" text,
    "duration_months" integer,
    "features" text[],
    "available_for_sale" boolean default true,
    "available_online" boolean default false,
    "active" boolean default true,
    "description" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "category" text,
    "color" text,
    "role_id" text
);


alter table "public"."membership_types" enable row level security;

create table "public"."memberships" (
    "id" uuid not null default gen_random_uuid(),
    "system_member_id" integer not null default nextval('members_system_member_id_seq'::regclass),
    "join_date" date,
    "status" text default 'Active'::text,
    "dependents_count" integer default 0,
    "role" text default 'member'::text,
    "current_membership_type_id" uuid,
    "auth_user_id" uuid,
    "assigned_plan_ids" text[],
    "staff_role_id" text,
    "parent_member_id" uuid,
    "user_id" uuid
);


alter table "public"."memberships" enable row level security;

create table "public"."notification_settings" (
    "id" integer not null default 1,
    "email_new_member" boolean default true,
    "email_class_booking" boolean default false,
    "updated_at" timestamp with time zone default now(),
    "email_membership_expiry" boolean default true,
    "sms_payment_reminder" boolean default false
);


create table "public"."notification_templates" (
    "id" uuid not null default gen_random_uuid(),
    "template_name" text not null,
    "subject" text not null,
    "body_text" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" text,
    "type" text,
    "message" text not null,
    "link" text,
    "read" boolean default false,
    "created_at" timestamp with time zone default now()
);


alter table "public"."notifications" enable row level security;

create table "public"."payments" (
    "id" uuid not null default gen_random_uuid(),
    "member_id" uuid not null,
    "stripe_payment_intent_id" text,
    "stripe_charge_id" text,
    "stripe_setup_intent_id" text,
    "amount" numeric(10,2) not null,
    "currency" character varying(3) not null default 'usd'::character varying,
    "status" text not null,
    "description" text,
    "payment_method_details" jsonb,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP
);


create table "public"."profiles" (
    "id" uuid not null default gen_random_uuid(),
    "system_member_id" integer not null default nextval('members_system_member_id_seq'::regclass),
    "name" text,
    "first_name" text,
    "last_name" text,
    "email" text,
    "phone" text,
    "access_card_number" text,
    "address" text,
    "dob" date,
    "emergency_contact_name" text,
    "emergency_contact_phone" text,
    "profile_picture_url" text,
    "created_at" timestamp with time zone default now(),
    "role" text default 'non-member'::text
);


create table "public"."staff_member_notes" (
    "id" uuid not null default gen_random_uuid(),
    "member_id" uuid not null,
    "staff_id" uuid not null,
    "content" text not null,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP
);


alter table "public"."staff_member_notes" enable row level security;

create table "public"."staff_roles" (
    "id" text not null,
    "name" text not null,
    "description" text,
    "permissions" jsonb,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP
);


alter table "public"."staff_roles" enable row level security;

create table "public"."stripe_customers" (
    "member_id" uuid not null,
    "stripe_customer_id" text not null,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP
);


create table "public"."support_tickets" (
    "id" uuid not null default gen_random_uuid(),
    "member_id" uuid not null,
    "subject" text not null,
    "description" text not null,
    "category" text,
    "status" text default 'Open'::text,
    "priority" text default 'Medium'::text,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "resolved_at" timestamp with time zone,
    "assigned_to_staff_id" uuid
);


alter sequence "public"."members_system_member_id_seq" owned by "public"."memberships"."system_member_id";

CREATE UNIQUE INDEX admin_panel_settings_pkey ON public.admin_panel_settings USING btree (id);

CREATE UNIQUE INDEX attendance_pkey ON public.attendance USING btree (id);

CREATE UNIQUE INDEX branding_settings_pkey ON public.branding_settings USING btree (id);

CREATE UNIQUE INDEX class_waitlist_pkey ON public.class_waitlist USING btree (id);

CREATE UNIQUE INDEX classes_pkey ON public.classes USING btree (id);

CREATE UNIQUE INDEX club_rules_settings_pkey ON public.club_rules_settings USING btree (id);

CREATE UNIQUE INDEX general_settings_pkey ON public.general_settings USING btree (id);

CREATE UNIQUE INDEX help_articles_pkey ON public.help_articles USING btree (id);

CREATE UNIQUE INDEX help_articles_slug_key ON public.help_articles USING btree (slug);

CREATE INDEX idx_attendance_class_id ON public.attendance USING btree (class_id);

CREATE INDEX idx_attendance_member_id ON public.attendance USING btree (member_id);

CREATE INDEX idx_class_waitlist_class_id ON public.class_waitlist USING btree (class_id);

CREATE INDEX idx_class_waitlist_member_id ON public.class_waitlist USING btree (member_id);

CREATE INDEX idx_help_articles_category ON public.help_articles USING btree (category);

CREATE INDEX idx_help_articles_is_published ON public.help_articles USING btree (is_published);

CREATE INDEX idx_member_membership_assignments_member_id ON public.member_membership_assignments USING btree (member_id);

CREATE INDEX idx_member_membership_assignments_membership_type_id ON public.member_membership_assignments USING btree (membership_type_id);

CREATE INDEX idx_member_membership_log_member_id ON public.member_membership_log USING btree (member_id);

CREATE INDEX idx_members_current_membership_type_id ON public.memberships USING btree (current_membership_type_id);

CREATE INDEX idx_members_parent_member_id ON public.memberships USING btree (parent_member_id);

CREATE INDEX idx_members_staff_role_id ON public.memberships USING btree (staff_role_id);

CREATE INDEX idx_payments_member_id ON public.payments USING btree (member_id);

CREATE INDEX idx_payments_stripe_payment_intent_id ON public.payments USING btree (stripe_payment_intent_id);

CREATE INDEX idx_staff_member_notes_member_id ON public.staff_member_notes USING btree (member_id);

CREATE INDEX idx_staff_member_notes_staff_id ON public.staff_member_notes USING btree (staff_id);

CREATE INDEX idx_support_tickets_category ON public.support_tickets USING btree (category);

CREATE INDEX idx_support_tickets_member_id ON public.support_tickets USING btree (member_id);

CREATE INDEX idx_support_tickets_status ON public.support_tickets USING btree (status);

CREATE UNIQUE INDEX member_membership_assignments_pkey ON public.member_membership_assignments USING btree (id);

CREATE UNIQUE INDEX member_membership_log_pkey ON public.member_membership_log USING btree (id);

CREATE UNIQUE INDEX member_notes_pkey ON public.member_notes USING btree (id);

CREATE UNIQUE INDEX members_pkey ON public.memberships USING btree (id);

CREATE UNIQUE INDEX membership_types_pkey ON public.membership_types USING btree (id);

CREATE UNIQUE INDEX notification_settings_pkey ON public.notification_settings USING btree (id);

CREATE UNIQUE INDEX notification_templates_pkey ON public.notification_templates USING btree (id);

CREATE UNIQUE INDEX notification_templates_template_name_key ON public.notification_templates USING btree (template_name);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (id);

CREATE UNIQUE INDEX profile_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profile_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX staff_member_notes_pkey ON public.staff_member_notes USING btree (id);

CREATE UNIQUE INDEX staff_roles_name_key ON public.staff_roles USING btree (name);

CREATE UNIQUE INDEX staff_roles_pkey ON public.staff_roles USING btree (id);

CREATE UNIQUE INDEX stripe_customers_pkey ON public.stripe_customers USING btree (member_id);

CREATE UNIQUE INDEX stripe_customers_stripe_customer_id_key ON public.stripe_customers USING btree (stripe_customer_id);

CREATE UNIQUE INDEX support_tickets_pkey ON public.support_tickets USING btree (id);

CREATE UNIQUE INDEX unique_waitlist_entry ON public.class_waitlist USING btree (class_id, member_id);

alter table "public"."admin_panel_settings" add constraint "admin_panel_settings_pkey" PRIMARY KEY using index "admin_panel_settings_pkey";

alter table "public"."attendance" add constraint "attendance_pkey" PRIMARY KEY using index "attendance_pkey";

alter table "public"."branding_settings" add constraint "branding_settings_pkey" PRIMARY KEY using index "branding_settings_pkey";

alter table "public"."class_waitlist" add constraint "class_waitlist_pkey" PRIMARY KEY using index "class_waitlist_pkey";

alter table "public"."classes" add constraint "classes_pkey" PRIMARY KEY using index "classes_pkey";

alter table "public"."club_rules_settings" add constraint "club_rules_settings_pkey" PRIMARY KEY using index "club_rules_settings_pkey";

alter table "public"."general_settings" add constraint "general_settings_pkey" PRIMARY KEY using index "general_settings_pkey";

alter table "public"."help_articles" add constraint "help_articles_pkey" PRIMARY KEY using index "help_articles_pkey";

alter table "public"."member_membership_assignments" add constraint "member_membership_assignments_pkey" PRIMARY KEY using index "member_membership_assignments_pkey";

alter table "public"."member_membership_log" add constraint "member_membership_log_pkey" PRIMARY KEY using index "member_membership_log_pkey";

alter table "public"."member_notes" add constraint "member_notes_pkey" PRIMARY KEY using index "member_notes_pkey";

alter table "public"."membership_types" add constraint "membership_types_pkey" PRIMARY KEY using index "membership_types_pkey";

alter table "public"."memberships" add constraint "members_pkey" PRIMARY KEY using index "members_pkey";

alter table "public"."notification_settings" add constraint "notification_settings_pkey" PRIMARY KEY using index "notification_settings_pkey";

alter table "public"."notification_templates" add constraint "notification_templates_pkey" PRIMARY KEY using index "notification_templates_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."payments" add constraint "payments_pkey" PRIMARY KEY using index "payments_pkey";

alter table "public"."profiles" add constraint "profile_pkey" PRIMARY KEY using index "profile_pkey";

alter table "public"."staff_member_notes" add constraint "staff_member_notes_pkey" PRIMARY KEY using index "staff_member_notes_pkey";

alter table "public"."staff_roles" add constraint "staff_roles_pkey" PRIMARY KEY using index "staff_roles_pkey";

alter table "public"."stripe_customers" add constraint "stripe_customers_pkey" PRIMARY KEY using index "stripe_customers_pkey";

alter table "public"."support_tickets" add constraint "support_tickets_pkey" PRIMARY KEY using index "support_tickets_pkey";

alter table "public"."admin_panel_settings" add constraint "single_row_admin_panel_settings" CHECK ((id = 1)) not valid;

alter table "public"."admin_panel_settings" validate constraint "single_row_admin_panel_settings";

alter table "public"."attendance" add constraint "attendance_class_id_fkey" FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL not valid;

alter table "public"."attendance" validate constraint "attendance_class_id_fkey";

alter table "public"."attendance" add constraint "attendance_member_id_fkey" FOREIGN KEY (member_id) REFERENCES memberships(id) ON DELETE SET NULL not valid;

alter table "public"."attendance" validate constraint "attendance_member_id_fkey";

alter table "public"."branding_settings" add constraint "single_row_constraint" CHECK ((id = 1)) not valid;

alter table "public"."branding_settings" validate constraint "single_row_constraint";

alter table "public"."class_waitlist" add constraint "class_waitlist_class_id_fkey" FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE not valid;

alter table "public"."class_waitlist" validate constraint "class_waitlist_class_id_fkey";

alter table "public"."class_waitlist" add constraint "class_waitlist_member_id_fkey" FOREIGN KEY (member_id) REFERENCES memberships(id) ON DELETE CASCADE not valid;

alter table "public"."class_waitlist" validate constraint "class_waitlist_member_id_fkey";

alter table "public"."class_waitlist" add constraint "unique_waitlist_entry" UNIQUE using index "unique_waitlist_entry";

alter table "public"."classes" add constraint "classes_instructor_id_fkey" FOREIGN KEY (instructor_id) REFERENCES memberships(id) ON DELETE SET NULL not valid;

alter table "public"."classes" validate constraint "classes_instructor_id_fkey";

alter table "public"."club_rules_settings" add constraint "single_row_constraint_rules" CHECK ((id = 1)) not valid;

alter table "public"."club_rules_settings" validate constraint "single_row_constraint_rules";

alter table "public"."general_settings" add constraint "single_row_general_settings" CHECK ((id = 1)) not valid;

alter table "public"."general_settings" validate constraint "single_row_general_settings";

alter table "public"."help_articles" add constraint "help_articles_author_id_fkey" FOREIGN KEY (author_id) REFERENCES memberships(id) ON DELETE SET NULL not valid;

alter table "public"."help_articles" validate constraint "help_articles_author_id_fkey";

alter table "public"."help_articles" add constraint "help_articles_slug_key" UNIQUE using index "help_articles_slug_key";

alter table "public"."member_membership_assignments" add constraint "member_membership_assignments_member_id_fkey" FOREIGN KEY (member_id) REFERENCES memberships(id) ON DELETE CASCADE not valid;

alter table "public"."member_membership_assignments" validate constraint "member_membership_assignments_member_id_fkey";

alter table "public"."member_membership_assignments" add constraint "member_membership_assignments_membership_type_id_fkey" FOREIGN KEY (membership_type_id) REFERENCES membership_types(id) ON DELETE CASCADE not valid;

alter table "public"."member_membership_assignments" validate constraint "member_membership_assignments_membership_type_id_fkey";

alter table "public"."member_membership_log" add constraint "member_membership_log_member_id_fkey" FOREIGN KEY (member_id) REFERENCES memberships(id) ON DELETE CASCADE not valid;

alter table "public"."member_membership_log" validate constraint "member_membership_log_member_id_fkey";

alter table "public"."member_membership_log" add constraint "member_membership_log_membership_type_id_fkey" FOREIGN KEY (membership_type_id) REFERENCES membership_types(id) ON DELETE SET NULL not valid;

alter table "public"."member_membership_log" validate constraint "member_membership_log_membership_type_id_fkey";

alter table "public"."member_notes" add constraint "member_notes_member_id_fkey" FOREIGN KEY (member_id) REFERENCES memberships(id) ON DELETE CASCADE not valid;

alter table "public"."member_notes" validate constraint "member_notes_member_id_fkey";

alter table "public"."memberships" add constraint "fk_staff_role_id" FOREIGN KEY (staff_role_id) REFERENCES staff_roles(id) ON DELETE SET NULL not valid;

alter table "public"."memberships" validate constraint "fk_staff_role_id";

alter table "public"."memberships" add constraint "members_current_membership_type_id_fkey" FOREIGN KEY (current_membership_type_id) REFERENCES membership_types(id) ON DELETE SET NULL not valid;

alter table "public"."memberships" validate constraint "members_current_membership_type_id_fkey";

alter table "public"."memberships" add constraint "members_parent_member_id_fkey" FOREIGN KEY (parent_member_id) REFERENCES memberships(id) ON DELETE SET NULL not valid;

alter table "public"."memberships" validate constraint "members_parent_member_id_fkey";

alter table "public"."memberships" add constraint "memberships_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) not valid;

alter table "public"."memberships" validate constraint "memberships_user_id_fkey";

alter table "public"."notification_settings" add constraint "single_row_notification_settings" CHECK ((id = 1)) not valid;

alter table "public"."notification_settings" validate constraint "single_row_notification_settings";

alter table "public"."notification_templates" add constraint "notification_templates_template_name_key" UNIQUE using index "notification_templates_template_name_key";

alter table "public"."payments" add constraint "payments_member_id_fkey" FOREIGN KEY (member_id) REFERENCES memberships(id) ON DELETE CASCADE not valid;

alter table "public"."payments" validate constraint "payments_member_id_fkey";

alter table "public"."profiles" add constraint "profile_email_key" UNIQUE using index "profile_email_key";

alter table "public"."staff_member_notes" add constraint "staff_member_notes_member_id_fkey" FOREIGN KEY (member_id) REFERENCES memberships(id) ON DELETE CASCADE not valid;

alter table "public"."staff_member_notes" validate constraint "staff_member_notes_member_id_fkey";

alter table "public"."staff_member_notes" add constraint "staff_member_notes_staff_id_fkey" FOREIGN KEY (staff_id) REFERENCES memberships(id) ON DELETE CASCADE not valid;

alter table "public"."staff_member_notes" validate constraint "staff_member_notes_staff_id_fkey";

alter table "public"."staff_roles" add constraint "staff_roles_name_key" UNIQUE using index "staff_roles_name_key";

alter table "public"."stripe_customers" add constraint "stripe_customers_member_id_fkey" FOREIGN KEY (member_id) REFERENCES memberships(id) ON DELETE CASCADE not valid;

alter table "public"."stripe_customers" validate constraint "stripe_customers_member_id_fkey";

alter table "public"."stripe_customers" add constraint "stripe_customers_stripe_customer_id_key" UNIQUE using index "stripe_customers_stripe_customer_id_key";

alter table "public"."support_tickets" add constraint "support_tickets_assigned_to_staff_id_fkey" FOREIGN KEY (assigned_to_staff_id) REFERENCES memberships(id) ON DELETE SET NULL not valid;

alter table "public"."support_tickets" validate constraint "support_tickets_assigned_to_staff_id_fkey";

alter table "public"."support_tickets" add constraint "support_tickets_member_id_fkey" FOREIGN KEY (member_id) REFERENCES memberships(id) ON DELETE CASCADE not valid;

alter table "public"."support_tickets" validate constraint "support_tickets_member_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_member_transactional(member_payload jsonb)
 RETURNS SETOF memberships
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_member_notes_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_staff_member_notes_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."admin_panel_settings" to "anon";

grant insert on table "public"."admin_panel_settings" to "anon";

grant references on table "public"."admin_panel_settings" to "anon";

grant select on table "public"."admin_panel_settings" to "anon";

grant trigger on table "public"."admin_panel_settings" to "anon";

grant truncate on table "public"."admin_panel_settings" to "anon";

grant update on table "public"."admin_panel_settings" to "anon";

grant delete on table "public"."admin_panel_settings" to "authenticated";

grant insert on table "public"."admin_panel_settings" to "authenticated";

grant references on table "public"."admin_panel_settings" to "authenticated";

grant select on table "public"."admin_panel_settings" to "authenticated";

grant trigger on table "public"."admin_panel_settings" to "authenticated";

grant truncate on table "public"."admin_panel_settings" to "authenticated";

grant update on table "public"."admin_panel_settings" to "authenticated";

grant delete on table "public"."admin_panel_settings" to "service_role";

grant insert on table "public"."admin_panel_settings" to "service_role";

grant references on table "public"."admin_panel_settings" to "service_role";

grant select on table "public"."admin_panel_settings" to "service_role";

grant trigger on table "public"."admin_panel_settings" to "service_role";

grant truncate on table "public"."admin_panel_settings" to "service_role";

grant update on table "public"."admin_panel_settings" to "service_role";

grant delete on table "public"."attendance" to "anon";

grant insert on table "public"."attendance" to "anon";

grant references on table "public"."attendance" to "anon";

grant select on table "public"."attendance" to "anon";

grant trigger on table "public"."attendance" to "anon";

grant truncate on table "public"."attendance" to "anon";

grant update on table "public"."attendance" to "anon";

grant delete on table "public"."attendance" to "authenticated";

grant insert on table "public"."attendance" to "authenticated";

grant references on table "public"."attendance" to "authenticated";

grant select on table "public"."attendance" to "authenticated";

grant trigger on table "public"."attendance" to "authenticated";

grant truncate on table "public"."attendance" to "authenticated";

grant update on table "public"."attendance" to "authenticated";

grant delete on table "public"."attendance" to "service_role";

grant insert on table "public"."attendance" to "service_role";

grant references on table "public"."attendance" to "service_role";

grant select on table "public"."attendance" to "service_role";

grant trigger on table "public"."attendance" to "service_role";

grant truncate on table "public"."attendance" to "service_role";

grant update on table "public"."attendance" to "service_role";

grant delete on table "public"."branding_settings" to "anon";

grant insert on table "public"."branding_settings" to "anon";

grant references on table "public"."branding_settings" to "anon";

grant select on table "public"."branding_settings" to "anon";

grant trigger on table "public"."branding_settings" to "anon";

grant truncate on table "public"."branding_settings" to "anon";

grant update on table "public"."branding_settings" to "anon";

grant delete on table "public"."branding_settings" to "authenticated";

grant insert on table "public"."branding_settings" to "authenticated";

grant references on table "public"."branding_settings" to "authenticated";

grant select on table "public"."branding_settings" to "authenticated";

grant trigger on table "public"."branding_settings" to "authenticated";

grant truncate on table "public"."branding_settings" to "authenticated";

grant update on table "public"."branding_settings" to "authenticated";

grant delete on table "public"."branding_settings" to "service_role";

grant insert on table "public"."branding_settings" to "service_role";

grant references on table "public"."branding_settings" to "service_role";

grant select on table "public"."branding_settings" to "service_role";

grant trigger on table "public"."branding_settings" to "service_role";

grant truncate on table "public"."branding_settings" to "service_role";

grant update on table "public"."branding_settings" to "service_role";

grant delete on table "public"."class_waitlist" to "anon";

grant insert on table "public"."class_waitlist" to "anon";

grant references on table "public"."class_waitlist" to "anon";

grant select on table "public"."class_waitlist" to "anon";

grant trigger on table "public"."class_waitlist" to "anon";

grant truncate on table "public"."class_waitlist" to "anon";

grant update on table "public"."class_waitlist" to "anon";

grant delete on table "public"."class_waitlist" to "authenticated";

grant insert on table "public"."class_waitlist" to "authenticated";

grant references on table "public"."class_waitlist" to "authenticated";

grant select on table "public"."class_waitlist" to "authenticated";

grant trigger on table "public"."class_waitlist" to "authenticated";

grant truncate on table "public"."class_waitlist" to "authenticated";

grant update on table "public"."class_waitlist" to "authenticated";

grant delete on table "public"."class_waitlist" to "service_role";

grant insert on table "public"."class_waitlist" to "service_role";

grant references on table "public"."class_waitlist" to "service_role";

grant select on table "public"."class_waitlist" to "service_role";

grant trigger on table "public"."class_waitlist" to "service_role";

grant truncate on table "public"."class_waitlist" to "service_role";

grant update on table "public"."class_waitlist" to "service_role";

grant delete on table "public"."classes" to "anon";

grant insert on table "public"."classes" to "anon";

grant references on table "public"."classes" to "anon";

grant select on table "public"."classes" to "anon";

grant trigger on table "public"."classes" to "anon";

grant truncate on table "public"."classes" to "anon";

grant update on table "public"."classes" to "anon";

grant delete on table "public"."classes" to "authenticated";

grant insert on table "public"."classes" to "authenticated";

grant references on table "public"."classes" to "authenticated";

grant select on table "public"."classes" to "authenticated";

grant trigger on table "public"."classes" to "authenticated";

grant truncate on table "public"."classes" to "authenticated";

grant update on table "public"."classes" to "authenticated";

grant delete on table "public"."classes" to "service_role";

grant insert on table "public"."classes" to "service_role";

grant references on table "public"."classes" to "service_role";

grant select on table "public"."classes" to "service_role";

grant trigger on table "public"."classes" to "service_role";

grant truncate on table "public"."classes" to "service_role";

grant update on table "public"."classes" to "service_role";

grant delete on table "public"."club_rules_settings" to "anon";

grant insert on table "public"."club_rules_settings" to "anon";

grant references on table "public"."club_rules_settings" to "anon";

grant select on table "public"."club_rules_settings" to "anon";

grant trigger on table "public"."club_rules_settings" to "anon";

grant truncate on table "public"."club_rules_settings" to "anon";

grant update on table "public"."club_rules_settings" to "anon";

grant delete on table "public"."club_rules_settings" to "authenticated";

grant insert on table "public"."club_rules_settings" to "authenticated";

grant references on table "public"."club_rules_settings" to "authenticated";

grant select on table "public"."club_rules_settings" to "authenticated";

grant trigger on table "public"."club_rules_settings" to "authenticated";

grant truncate on table "public"."club_rules_settings" to "authenticated";

grant update on table "public"."club_rules_settings" to "authenticated";

grant delete on table "public"."club_rules_settings" to "service_role";

grant insert on table "public"."club_rules_settings" to "service_role";

grant references on table "public"."club_rules_settings" to "service_role";

grant select on table "public"."club_rules_settings" to "service_role";

grant trigger on table "public"."club_rules_settings" to "service_role";

grant truncate on table "public"."club_rules_settings" to "service_role";

grant update on table "public"."club_rules_settings" to "service_role";

grant delete on table "public"."general_settings" to "anon";

grant insert on table "public"."general_settings" to "anon";

grant references on table "public"."general_settings" to "anon";

grant select on table "public"."general_settings" to "anon";

grant trigger on table "public"."general_settings" to "anon";

grant truncate on table "public"."general_settings" to "anon";

grant update on table "public"."general_settings" to "anon";

grant delete on table "public"."general_settings" to "authenticated";

grant insert on table "public"."general_settings" to "authenticated";

grant references on table "public"."general_settings" to "authenticated";

grant select on table "public"."general_settings" to "authenticated";

grant trigger on table "public"."general_settings" to "authenticated";

grant truncate on table "public"."general_settings" to "authenticated";

grant update on table "public"."general_settings" to "authenticated";

grant delete on table "public"."general_settings" to "service_role";

grant insert on table "public"."general_settings" to "service_role";

grant references on table "public"."general_settings" to "service_role";

grant select on table "public"."general_settings" to "service_role";

grant trigger on table "public"."general_settings" to "service_role";

grant truncate on table "public"."general_settings" to "service_role";

grant update on table "public"."general_settings" to "service_role";

grant delete on table "public"."help_articles" to "anon";

grant insert on table "public"."help_articles" to "anon";

grant references on table "public"."help_articles" to "anon";

grant select on table "public"."help_articles" to "anon";

grant trigger on table "public"."help_articles" to "anon";

grant truncate on table "public"."help_articles" to "anon";

grant update on table "public"."help_articles" to "anon";

grant delete on table "public"."help_articles" to "authenticated";

grant insert on table "public"."help_articles" to "authenticated";

grant references on table "public"."help_articles" to "authenticated";

grant select on table "public"."help_articles" to "authenticated";

grant trigger on table "public"."help_articles" to "authenticated";

grant truncate on table "public"."help_articles" to "authenticated";

grant update on table "public"."help_articles" to "authenticated";

grant delete on table "public"."help_articles" to "service_role";

grant insert on table "public"."help_articles" to "service_role";

grant references on table "public"."help_articles" to "service_role";

grant select on table "public"."help_articles" to "service_role";

grant trigger on table "public"."help_articles" to "service_role";

grant truncate on table "public"."help_articles" to "service_role";

grant update on table "public"."help_articles" to "service_role";

grant delete on table "public"."member_membership_assignments" to "anon";

grant insert on table "public"."member_membership_assignments" to "anon";

grant references on table "public"."member_membership_assignments" to "anon";

grant select on table "public"."member_membership_assignments" to "anon";

grant trigger on table "public"."member_membership_assignments" to "anon";

grant truncate on table "public"."member_membership_assignments" to "anon";

grant update on table "public"."member_membership_assignments" to "anon";

grant delete on table "public"."member_membership_assignments" to "authenticated";

grant insert on table "public"."member_membership_assignments" to "authenticated";

grant references on table "public"."member_membership_assignments" to "authenticated";

grant select on table "public"."member_membership_assignments" to "authenticated";

grant trigger on table "public"."member_membership_assignments" to "authenticated";

grant truncate on table "public"."member_membership_assignments" to "authenticated";

grant update on table "public"."member_membership_assignments" to "authenticated";

grant delete on table "public"."member_membership_assignments" to "service_role";

grant insert on table "public"."member_membership_assignments" to "service_role";

grant references on table "public"."member_membership_assignments" to "service_role";

grant select on table "public"."member_membership_assignments" to "service_role";

grant trigger on table "public"."member_membership_assignments" to "service_role";

grant truncate on table "public"."member_membership_assignments" to "service_role";

grant update on table "public"."member_membership_assignments" to "service_role";

grant delete on table "public"."member_membership_log" to "anon";

grant insert on table "public"."member_membership_log" to "anon";

grant references on table "public"."member_membership_log" to "anon";

grant select on table "public"."member_membership_log" to "anon";

grant trigger on table "public"."member_membership_log" to "anon";

grant truncate on table "public"."member_membership_log" to "anon";

grant update on table "public"."member_membership_log" to "anon";

grant delete on table "public"."member_membership_log" to "authenticated";

grant insert on table "public"."member_membership_log" to "authenticated";

grant references on table "public"."member_membership_log" to "authenticated";

grant select on table "public"."member_membership_log" to "authenticated";

grant trigger on table "public"."member_membership_log" to "authenticated";

grant truncate on table "public"."member_membership_log" to "authenticated";

grant update on table "public"."member_membership_log" to "authenticated";

grant delete on table "public"."member_membership_log" to "service_role";

grant insert on table "public"."member_membership_log" to "service_role";

grant references on table "public"."member_membership_log" to "service_role";

grant select on table "public"."member_membership_log" to "service_role";

grant trigger on table "public"."member_membership_log" to "service_role";

grant truncate on table "public"."member_membership_log" to "service_role";

grant update on table "public"."member_membership_log" to "service_role";

grant delete on table "public"."member_notes" to "anon";

grant insert on table "public"."member_notes" to "anon";

grant references on table "public"."member_notes" to "anon";

grant select on table "public"."member_notes" to "anon";

grant trigger on table "public"."member_notes" to "anon";

grant truncate on table "public"."member_notes" to "anon";

grant update on table "public"."member_notes" to "anon";

grant delete on table "public"."member_notes" to "authenticated";

grant insert on table "public"."member_notes" to "authenticated";

grant references on table "public"."member_notes" to "authenticated";

grant select on table "public"."member_notes" to "authenticated";

grant trigger on table "public"."member_notes" to "authenticated";

grant truncate on table "public"."member_notes" to "authenticated";

grant update on table "public"."member_notes" to "authenticated";

grant delete on table "public"."member_notes" to "service_role";

grant insert on table "public"."member_notes" to "service_role";

grant references on table "public"."member_notes" to "service_role";

grant select on table "public"."member_notes" to "service_role";

grant trigger on table "public"."member_notes" to "service_role";

grant truncate on table "public"."member_notes" to "service_role";

grant update on table "public"."member_notes" to "service_role";

grant delete on table "public"."membership_types" to "anon";

grant insert on table "public"."membership_types" to "anon";

grant references on table "public"."membership_types" to "anon";

grant select on table "public"."membership_types" to "anon";

grant trigger on table "public"."membership_types" to "anon";

grant truncate on table "public"."membership_types" to "anon";

grant update on table "public"."membership_types" to "anon";

grant delete on table "public"."membership_types" to "authenticated";

grant insert on table "public"."membership_types" to "authenticated";

grant references on table "public"."membership_types" to "authenticated";

grant select on table "public"."membership_types" to "authenticated";

grant trigger on table "public"."membership_types" to "authenticated";

grant truncate on table "public"."membership_types" to "authenticated";

grant update on table "public"."membership_types" to "authenticated";

grant delete on table "public"."membership_types" to "service_role";

grant insert on table "public"."membership_types" to "service_role";

grant references on table "public"."membership_types" to "service_role";

grant select on table "public"."membership_types" to "service_role";

grant trigger on table "public"."membership_types" to "service_role";

grant truncate on table "public"."membership_types" to "service_role";

grant update on table "public"."membership_types" to "service_role";

grant delete on table "public"."memberships" to "anon";

grant insert on table "public"."memberships" to "anon";

grant references on table "public"."memberships" to "anon";

grant select on table "public"."memberships" to "anon";

grant trigger on table "public"."memberships" to "anon";

grant truncate on table "public"."memberships" to "anon";

grant update on table "public"."memberships" to "anon";

grant delete on table "public"."memberships" to "authenticated";

grant insert on table "public"."memberships" to "authenticated";

grant references on table "public"."memberships" to "authenticated";

grant select on table "public"."memberships" to "authenticated";

grant trigger on table "public"."memberships" to "authenticated";

grant truncate on table "public"."memberships" to "authenticated";

grant update on table "public"."memberships" to "authenticated";

grant delete on table "public"."memberships" to "service_role";

grant insert on table "public"."memberships" to "service_role";

grant references on table "public"."memberships" to "service_role";

grant select on table "public"."memberships" to "service_role";

grant trigger on table "public"."memberships" to "service_role";

grant truncate on table "public"."memberships" to "service_role";

grant update on table "public"."memberships" to "service_role";

grant delete on table "public"."notification_settings" to "anon";

grant insert on table "public"."notification_settings" to "anon";

grant references on table "public"."notification_settings" to "anon";

grant select on table "public"."notification_settings" to "anon";

grant trigger on table "public"."notification_settings" to "anon";

grant truncate on table "public"."notification_settings" to "anon";

grant update on table "public"."notification_settings" to "anon";

grant delete on table "public"."notification_settings" to "authenticated";

grant insert on table "public"."notification_settings" to "authenticated";

grant references on table "public"."notification_settings" to "authenticated";

grant select on table "public"."notification_settings" to "authenticated";

grant trigger on table "public"."notification_settings" to "authenticated";

grant truncate on table "public"."notification_settings" to "authenticated";

grant update on table "public"."notification_settings" to "authenticated";

grant delete on table "public"."notification_settings" to "service_role";

grant insert on table "public"."notification_settings" to "service_role";

grant references on table "public"."notification_settings" to "service_role";

grant select on table "public"."notification_settings" to "service_role";

grant trigger on table "public"."notification_settings" to "service_role";

grant truncate on table "public"."notification_settings" to "service_role";

grant update on table "public"."notification_settings" to "service_role";

grant delete on table "public"."notification_templates" to "anon";

grant insert on table "public"."notification_templates" to "anon";

grant references on table "public"."notification_templates" to "anon";

grant select on table "public"."notification_templates" to "anon";

grant trigger on table "public"."notification_templates" to "anon";

grant truncate on table "public"."notification_templates" to "anon";

grant update on table "public"."notification_templates" to "anon";

grant delete on table "public"."notification_templates" to "authenticated";

grant insert on table "public"."notification_templates" to "authenticated";

grant references on table "public"."notification_templates" to "authenticated";

grant select on table "public"."notification_templates" to "authenticated";

grant trigger on table "public"."notification_templates" to "authenticated";

grant truncate on table "public"."notification_templates" to "authenticated";

grant update on table "public"."notification_templates" to "authenticated";

grant delete on table "public"."notification_templates" to "service_role";

grant insert on table "public"."notification_templates" to "service_role";

grant references on table "public"."notification_templates" to "service_role";

grant select on table "public"."notification_templates" to "service_role";

grant trigger on table "public"."notification_templates" to "service_role";

grant truncate on table "public"."notification_templates" to "service_role";

grant update on table "public"."notification_templates" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."payments" to "anon";

grant insert on table "public"."payments" to "anon";

grant references on table "public"."payments" to "anon";

grant select on table "public"."payments" to "anon";

grant trigger on table "public"."payments" to "anon";

grant truncate on table "public"."payments" to "anon";

grant update on table "public"."payments" to "anon";

grant delete on table "public"."payments" to "authenticated";

grant insert on table "public"."payments" to "authenticated";

grant references on table "public"."payments" to "authenticated";

grant select on table "public"."payments" to "authenticated";

grant trigger on table "public"."payments" to "authenticated";

grant truncate on table "public"."payments" to "authenticated";

grant update on table "public"."payments" to "authenticated";

grant delete on table "public"."payments" to "service_role";

grant insert on table "public"."payments" to "service_role";

grant references on table "public"."payments" to "service_role";

grant select on table "public"."payments" to "service_role";

grant trigger on table "public"."payments" to "service_role";

grant truncate on table "public"."payments" to "service_role";

grant update on table "public"."payments" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."staff_member_notes" to "anon";

grant insert on table "public"."staff_member_notes" to "anon";

grant references on table "public"."staff_member_notes" to "anon";

grant select on table "public"."staff_member_notes" to "anon";

grant trigger on table "public"."staff_member_notes" to "anon";

grant truncate on table "public"."staff_member_notes" to "anon";

grant update on table "public"."staff_member_notes" to "anon";

grant delete on table "public"."staff_member_notes" to "authenticated";

grant insert on table "public"."staff_member_notes" to "authenticated";

grant references on table "public"."staff_member_notes" to "authenticated";

grant select on table "public"."staff_member_notes" to "authenticated";

grant trigger on table "public"."staff_member_notes" to "authenticated";

grant truncate on table "public"."staff_member_notes" to "authenticated";

grant update on table "public"."staff_member_notes" to "authenticated";

grant delete on table "public"."staff_member_notes" to "service_role";

grant insert on table "public"."staff_member_notes" to "service_role";

grant references on table "public"."staff_member_notes" to "service_role";

grant select on table "public"."staff_member_notes" to "service_role";

grant trigger on table "public"."staff_member_notes" to "service_role";

grant truncate on table "public"."staff_member_notes" to "service_role";

grant update on table "public"."staff_member_notes" to "service_role";

grant delete on table "public"."staff_roles" to "anon";

grant insert on table "public"."staff_roles" to "anon";

grant references on table "public"."staff_roles" to "anon";

grant select on table "public"."staff_roles" to "anon";

grant trigger on table "public"."staff_roles" to "anon";

grant truncate on table "public"."staff_roles" to "anon";

grant update on table "public"."staff_roles" to "anon";

grant delete on table "public"."staff_roles" to "authenticated";

grant insert on table "public"."staff_roles" to "authenticated";

grant references on table "public"."staff_roles" to "authenticated";

grant select on table "public"."staff_roles" to "authenticated";

grant trigger on table "public"."staff_roles" to "authenticated";

grant truncate on table "public"."staff_roles" to "authenticated";

grant update on table "public"."staff_roles" to "authenticated";

grant delete on table "public"."staff_roles" to "service_role";

grant insert on table "public"."staff_roles" to "service_role";

grant references on table "public"."staff_roles" to "service_role";

grant select on table "public"."staff_roles" to "service_role";

grant trigger on table "public"."staff_roles" to "service_role";

grant truncate on table "public"."staff_roles" to "service_role";

grant update on table "public"."staff_roles" to "service_role";

grant delete on table "public"."stripe_customers" to "anon";

grant insert on table "public"."stripe_customers" to "anon";

grant references on table "public"."stripe_customers" to "anon";

grant select on table "public"."stripe_customers" to "anon";

grant trigger on table "public"."stripe_customers" to "anon";

grant truncate on table "public"."stripe_customers" to "anon";

grant update on table "public"."stripe_customers" to "anon";

grant delete on table "public"."stripe_customers" to "authenticated";

grant insert on table "public"."stripe_customers" to "authenticated";

grant references on table "public"."stripe_customers" to "authenticated";

grant select on table "public"."stripe_customers" to "authenticated";

grant trigger on table "public"."stripe_customers" to "authenticated";

grant truncate on table "public"."stripe_customers" to "authenticated";

grant update on table "public"."stripe_customers" to "authenticated";

grant delete on table "public"."stripe_customers" to "service_role";

grant insert on table "public"."stripe_customers" to "service_role";

grant references on table "public"."stripe_customers" to "service_role";

grant select on table "public"."stripe_customers" to "service_role";

grant trigger on table "public"."stripe_customers" to "service_role";

grant truncate on table "public"."stripe_customers" to "service_role";

grant update on table "public"."stripe_customers" to "service_role";

grant delete on table "public"."support_tickets" to "anon";

grant insert on table "public"."support_tickets" to "anon";

grant references on table "public"."support_tickets" to "anon";

grant select on table "public"."support_tickets" to "anon";

grant trigger on table "public"."support_tickets" to "anon";

grant truncate on table "public"."support_tickets" to "anon";

grant update on table "public"."support_tickets" to "anon";

grant delete on table "public"."support_tickets" to "authenticated";

grant insert on table "public"."support_tickets" to "authenticated";

grant references on table "public"."support_tickets" to "authenticated";

grant select on table "public"."support_tickets" to "authenticated";

grant trigger on table "public"."support_tickets" to "authenticated";

grant truncate on table "public"."support_tickets" to "authenticated";

grant update on table "public"."support_tickets" to "authenticated";

grant delete on table "public"."support_tickets" to "service_role";

grant insert on table "public"."support_tickets" to "service_role";

grant references on table "public"."support_tickets" to "service_role";

grant select on table "public"."support_tickets" to "service_role";

grant trigger on table "public"."support_tickets" to "service_role";

grant truncate on table "public"."support_tickets" to "service_role";

grant update on table "public"."support_tickets" to "service_role";

create policy "Allow anon read access to admin panel settings"
on "public"."admin_panel_settings"
as permissive
for select
to anon
using (true);


create policy "Allow authenticated write access to admin panel settings"
on "public"."admin_panel_settings"
as permissive
for all
to authenticated
using (true)
with check (true);


create policy "Allow authenticated users to delete their own attendance record"
on "public"."attendance"
as permissive
for delete
to authenticated
using ((( SELECT auth.uid() AS uid) = member_id));


create policy "Allow authenticated users to insert their own attendance record"
on "public"."attendance"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = member_id));


create policy "Allow authenticated users to update their own attendance record"
on "public"."attendance"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = member_id))
with check ((( SELECT auth.uid() AS uid) = member_id));


create policy "Allow authenticated users to view their own attendance records"
on "public"."attendance"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = member_id));


create policy "Allow authenticated read access to waitlist"
on "public"."class_waitlist"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));


create policy "Allow members to manage own waitlist entries"
on "public"."class_waitlist"
as permissive
for all
to public
using ((auth.uid() = member_id))
with check ((auth.uid() = member_id));


create policy "Allow authenticated users to delete their own classes"
on "public"."classes"
as permissive
for delete
to authenticated
using ((( SELECT auth.uid() AS uid) = instructor_id));


create policy "Allow authenticated users to insert new classes"
on "public"."classes"
as permissive
for insert
to authenticated
with check (true);


create policy "Allow authenticated users to update their own classes"
on "public"."classes"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = instructor_id))
with check ((( SELECT auth.uid() AS uid) = instructor_id));


create policy "Allow authenticated users to view classes"
on "public"."classes"
as permissive
for select
to authenticated
using (true);


create policy "Allow anon read access to general settings"
on "public"."general_settings"
as permissive
for select
to anon
using (true);


create policy "Allow authenticated write access to general settings"
on "public"."general_settings"
as permissive
for all
to authenticated
using (true)
with check (true);


create policy "Allow admin/staff full access to help_articles"
on "public"."help_articles"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM memberships
  WHERE ((memberships.auth_user_id = auth.uid()) AND ((memberships.role = 'admin'::text) OR (memberships.role = 'staff'::text))))))
with check ((EXISTS ( SELECT 1
   FROM memberships
  WHERE ((memberships.auth_user_id = auth.uid()) AND ((memberships.role = 'admin'::text) OR (memberships.role = 'staff'::text))))));


create policy "Allow public read access to published help articles"
on "public"."help_articles"
as permissive
for select
to public
using ((is_published = true));


create policy "Allow anon insert for member_membership_assignments"
on "public"."member_membership_assignments"
as permissive
for insert
to anon
with check (true);


create policy "Allow anon select for member_membership_assignments"
on "public"."member_membership_assignments"
as permissive
for select
to anon
using (true);


create policy "delete_own_membership_assignments"
on "public"."member_membership_assignments"
as permissive
for delete
to public
using ((member_id = ( SELECT memberships.id
   FROM memberships
  WHERE (memberships.auth_user_id = auth.uid()))));


create policy "insert_own_membership_assignments"
on "public"."member_membership_assignments"
as permissive
for insert
to public
with check ((member_id = ( SELECT memberships.id
   FROM memberships
  WHERE (memberships.auth_user_id = auth.uid()))));


create policy "select_own_membership_assignments"
on "public"."member_membership_assignments"
as permissive
for select
to public
using ((member_id = ( SELECT memberships.id
   FROM memberships
  WHERE (memberships.auth_user_id = auth.uid()))));


create policy "update_own_membership_assignments"
on "public"."member_membership_assignments"
as permissive
for update
to public
using ((member_id = ( SELECT memberships.id
   FROM memberships
  WHERE (memberships.auth_user_id = auth.uid()))));


create policy "Allow anon insert for member_membership_log"
on "public"."member_membership_log"
as permissive
for insert
to anon
with check (true);


create policy "Allow anon select for member_membership_log"
on "public"."member_membership_log"
as permissive
for select
to anon
using (true);


create policy "Members can delete their own notes"
on "public"."member_notes"
as permissive
for delete
to public
using ((auth.uid() = member_id));


create policy "Members can insert their own notes"
on "public"."member_notes"
as permissive
for insert
to public
with check ((auth.uid() = member_id));


create policy "Members can update their own notes"
on "public"."member_notes"
as permissive
for update
to public
using ((auth.uid() = member_id))
with check ((auth.uid() = member_id));


create policy "Members can view their own notes"
on "public"."member_notes"
as permissive
for select
to public
using ((auth.uid() = member_id));


create policy "Allow anon insert for membership_types"
on "public"."membership_types"
as permissive
for insert
to anon
with check (true);


create policy "Allow anon read access to membership_types"
on "public"."membership_types"
as permissive
for select
to anon
using (true);


create policy "Allow anon select for membership_types"
on "public"."membership_types"
as permissive
for select
to anon
using (true);


create policy "Allow staff to manage membership_types"
on "public"."membership_types"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM memberships
  WHERE ((memberships.id = auth.uid()) AND (memberships.role = 'staff'::text)))))
with check ((EXISTS ( SELECT 1
   FROM memberships
  WHERE ((memberships.id = auth.uid()) AND (memberships.role = 'staff'::text)))));


create policy "Allow anon insert for members"
on "public"."memberships"
as permissive
for insert
to anon
with check (true);


create policy "Allow anon read access to members"
on "public"."memberships"
as permissive
for select
to anon
using (true);


create policy "Allow anon select for members"
on "public"."memberships"
as permissive
for select
to anon
using (true);


create policy "Allow authenticated users to manage their own data"
on "public"."memberships"
as permissive
for all
to authenticated
using ((auth.uid() = id))
with check ((auth.uid() = id));


create policy "Allow staff to manage all member data"
on "public"."memberships"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM memberships memberships_1
  WHERE ((memberships_1.id = auth.uid()) AND (memberships_1.role = 'staff'::text)))))
with check ((EXISTS ( SELECT 1
   FROM memberships memberships_1
  WHERE ((memberships_1.id = auth.uid()) AND (memberships_1.role = 'staff'::text)))));


create policy "Allow anon read access to notification settings"
on "public"."notification_settings"
as permissive
for select
to anon
using (true);


create policy "Allow authenticated write access to notification settings"
on "public"."notification_settings"
as permissive
for all
to authenticated
using (true)
with check (true);


create policy "Allow anon delete for notifications"
on "public"."notifications"
as permissive
for delete
to anon
using (true);


create policy "Allow anon insert for notifications"
on "public"."notifications"
as permissive
for insert
to anon
with check (true);


create policy "Allow anon select for notifications"
on "public"."notifications"
as permissive
for select
to anon
using (true);


create policy "Allow anon update for notifications"
on "public"."notifications"
as permissive
for update
to anon
using (true)
with check (true);


create policy "Allow authenticated users to delete their own notifications"
on "public"."notifications"
as permissive
for delete
to authenticated
using ((( SELECT (auth.uid())::text AS uid) = user_id));


create policy "Allow authenticated users to insert new notifications"
on "public"."notifications"
as permissive
for insert
to authenticated
with check (true);


create policy "Allow authenticated users to update their own notifications"
on "public"."notifications"
as permissive
for update
to authenticated
using ((( SELECT (auth.uid())::text AS uid) = user_id))
with check ((( SELECT (auth.uid())::text AS uid) = user_id));


create policy "Allow authenticated users to view their own notifications"
on "public"."notifications"
as permissive
for select
to authenticated
using ((( SELECT (auth.uid())::text AS uid) = user_id));


create policy "Allow admin/staff full access to payments"
on "public"."payments"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM memberships
  WHERE ((memberships.auth_user_id = auth.uid()) AND ((memberships.role = 'admin'::text) OR (memberships.role = 'staff'::text))))))
with check ((EXISTS ( SELECT 1
   FROM memberships
  WHERE ((memberships.auth_user_id = auth.uid()) AND ((memberships.role = 'admin'::text) OR (memberships.role = 'staff'::text))))));


create policy "Members can view own payments"
on "public"."payments"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM memberships
  WHERE ((memberships.auth_user_id = auth.uid()) AND (memberships.id = payments.member_id)))));


create policy "Members can view notes about themselves if specifically allowed"
on "public"."staff_member_notes"
as permissive
for select
to public
using (false);


create policy "Staff can manage notes on members"
on "public"."staff_member_notes"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM memberships
  WHERE ((memberships.id = auth.uid()) AND (memberships.role = 'staff'::text)))))
with check ((EXISTS ( SELECT 1
   FROM memberships
  WHERE ((memberships.id = auth.uid()) AND (memberships.role = 'staff'::text)))));


create policy "Allow anon insert for staff_roles"
on "public"."staff_roles"
as permissive
for insert
to anon
with check (true);


create policy "Allow anon select for staff_roles"
on "public"."staff_roles"
as permissive
for select
to anon
using (true);


create policy "Allow anon to delete from staff_roles"
on "public"."staff_roles"
as permissive
for delete
to anon
using (true);


create policy "Allow anon to insert into staff_roles"
on "public"."staff_roles"
as permissive
for insert
to anon
with check (true);


create policy "Allow anon to select from staff_roles"
on "public"."staff_roles"
as permissive
for select
to anon
using (true);


create policy "Allow anon to update staff_roles"
on "public"."staff_roles"
as permissive
for update
to anon
with check (true);


create policy "Allow anon update for staff_roles"
on "public"."staff_roles"
as permissive
for update
to anon
using (true)
with check (true);


create policy "Allow admin/staff full access to stripe_customers"
on "public"."stripe_customers"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM memberships
  WHERE ((memberships.auth_user_id = auth.uid()) AND ((memberships.role = 'admin'::text) OR (memberships.role = 'staff'::text))))))
with check ((EXISTS ( SELECT 1
   FROM memberships
  WHERE ((memberships.auth_user_id = auth.uid()) AND ((memberships.role = 'admin'::text) OR (memberships.role = 'staff'::text))))));


create policy "Members can manage own stripe customer link"
on "public"."stripe_customers"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM memberships
  WHERE ((memberships.auth_user_id = auth.uid()) AND (memberships.id = stripe_customers.member_id)))))
with check ((EXISTS ( SELECT 1
   FROM memberships
  WHERE ((memberships.auth_user_id = auth.uid()) AND (memberships.id = stripe_customers.member_id)))));


create policy "Allow admin/staff full access to support_tickets"
on "public"."support_tickets"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM memberships
  WHERE ((memberships.auth_user_id = auth.uid()) AND ((memberships.role = 'admin'::text) OR (memberships.role = 'staff'::text))))))
with check ((EXISTS ( SELECT 1
   FROM memberships
  WHERE ((memberships.auth_user_id = auth.uid()) AND ((memberships.role = 'admin'::text) OR (memberships.role = 'staff'::text))))));


create policy "Members can manage own support tickets"
on "public"."support_tickets"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM memberships
  WHERE ((memberships.auth_user_id = auth.uid()) AND (memberships.id = support_tickets.member_id)))))
with check ((EXISTS ( SELECT 1
   FROM memberships
  WHERE ((memberships.auth_user_id = auth.uid()) AND (memberships.id = support_tickets.member_id)))));


CREATE TRIGGER update_member_notes_modtime BEFORE UPDATE ON public.member_notes FOR EACH ROW EXECUTE FUNCTION update_member_notes_updated_at_column();

CREATE TRIGGER update_staff_member_notes_modtime BEFORE UPDATE ON public.staff_member_notes FOR EACH ROW EXECUTE FUNCTION update_staff_member_notes_updated_at_column();


