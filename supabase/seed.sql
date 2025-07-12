SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: account_lockouts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: accounting_account_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."accounting_account_templates" ("id", "template_name", "industry", "account_number", "account_name", "account_type", "account_category", "normal_balance", "is_required", "sort_order", "created_at") VALUES
	('043c0397-e1f0-422e-9012-f6cdd2f53f9c', 'Standard Gym COA', 'fitness', '1010', 'Checking Account', 'Asset', 'Current Assets', 'debit', true, 2, '2025-07-02 15:25:13.524767+00'),
	('aa81ce0e-8b5b-4bae-952b-b7f332bb755a', 'Standard Gym COA', 'fitness', '1100', 'Accounts Receivable', 'Asset', 'Current Assets', 'debit', true, 5, '2025-07-02 15:25:13.524767+00'),
	('96b57336-1c24-4f3a-9668-46743c9d6b35', 'Standard Gym COA', 'fitness', '1110', 'Member Accounts Receivable', 'Asset', 'Current Assets', 'debit', true, 6, '2025-07-02 15:25:13.524767+00'),
	('ffde7ff2-6625-401b-982b-d91b4d2ce872', 'Standard Gym COA', 'fitness', '1200', 'Inventory', 'Asset', 'Current Assets', 'debit', false, 8, '2025-07-02 15:25:13.524767+00'),
	('1538b32e-4fc4-4b05-9a2f-4ca00933bfd0', 'Standard Gym COA', 'fitness', '1500', 'Equipment', 'Asset', 'Fixed Assets', 'debit', true, 12, '2025-07-02 15:25:13.524767+00'),
	('6e0ceb17-32b8-40d4-84ad-15749523954c', 'Standard Gym COA', 'fitness', '2100', 'Accrued Expenses', 'Liability', 'Current Liabilities', 'credit', false, 21, '2025-07-02 15:25:13.524767+00'),
	('8e7e77e3-ac0a-49eb-96fe-f52deca80944', 'Standard Gym COA', 'fitness', '2110', 'Accrued Payroll', 'Liability', 'Current Liabilities', 'credit', true, 22, '2025-07-02 15:25:13.524767+00'),
	('5d1a750f-9ba6-43ae-a0be-2ca2d34c2a43', 'Standard Gym COA', 'fitness', '3000', 'Owner Equity', 'Equity', 'Owner Equity', 'credit', true, 30, '2025-07-02 15:25:13.524767+00'),
	('a1f01cd1-af99-4951-bc48-064aece772a4', 'Standard Gym COA', 'fitness', '4010', 'Monthly Membership Fees', 'Revenue', 'Operating Revenue', 'credit', true, 41, '2025-07-02 15:25:13.524767+00'),
	('cf14c914-ddb0-4239-a0b7-188c9ef3dbfa', 'Standard Gym COA', 'fitness', '4100', 'Personal Training Revenue', 'Revenue', 'Operating Revenue', 'credit', false, 44, '2025-07-02 15:25:13.524767+00'),
	('8d97193d-2b0e-46a2-834c-5a3a8f59b2e6', 'Standard Gym COA', 'fitness', '6010', 'Salaries and Wages', 'Expense', 'Operating Expenses', 'debit', true, 61, '2025-07-02 15:25:13.524767+00'),
	('fe9c33f2-ab1a-4884-b726-ad0c954d3788', 'Standard Gym COA', 'fitness', '6100', 'Rent Expense', 'Expense', 'Operating Expenses', 'debit', true, 64, '2025-07-02 15:25:13.524767+00'),
	('3b538d8c-2b20-414b-8279-c6449393b3db', 'Standard Gym COA', 'fitness', '6200', 'Utilities', 'Expense', 'Operating Expenses', 'debit', true, 65, '2025-07-02 15:25:13.524767+00'),
	('4085d996-093f-45da-b656-961f02c04580', 'Standard Gym COA', 'fitness', '6300', 'Equipment Maintenance', 'Expense', 'Operating Expenses', 'debit', true, 69, '2025-07-02 15:25:13.524767+00'),
	('da455b62-b55f-4657-8bf8-003b7866a4b1', 'Standard Gym COA', 'fitness', '6400', 'Insurance', 'Expense', 'Operating Expenses', 'debit', true, 70, '2025-07-02 15:25:13.524767+00');


--
-- Data for Name: accounting_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."accounting_accounts" ("id", "account_number", "account_name", "account_code", "account_type", "account_category", "account_subcategory", "description", "normal_balance", "is_active", "is_system_account", "is_protected", "allow_manual_entries", "requires_department", "requires_location", "parent_account_id", "account_level", "sort_order", "quickbooks_account_id", "external_account_id", "created_by", "created_at", "updated_at") VALUES
	('23450c49-4092-48b6-bf25-e4d42953884f', '1000', 'Cash and Cash Equivalents', NULL, 'Asset', 'Current Assets', NULL, NULL, 'debit', true, true, true, true, false, false, NULL, 1, 0, NULL, NULL, NULL, '2025-07-02 15:24:38.643545+00', '2025-07-02 15:24:38.643545+00'),
	('d635baad-5184-4ae3-86a0-ae9851a27621', '2000', 'Unearned Membership Fees', NULL, 'Liability', 'Current Liabilities', NULL, NULL, 'credit', true, true, true, true, false, false, NULL, 1, 0, NULL, NULL, NULL, '2025-07-02 15:24:38.643545+00', '2025-07-02 15:24:38.643545+00'),
	('fbf05811-c53d-4947-ae06-125d766865c2', '4000', 'Membership Revenue', NULL, 'Revenue', 'Operating Revenue', NULL, NULL, 'credit', true, true, true, true, false, false, NULL, 1, 0, NULL, NULL, NULL, '2025-07-02 15:24:38.643545+00', '2025-07-02 15:24:38.643545+00'),
	('abb24be4-8872-46eb-8853-77b3ecf84ab7', '5000', 'Payroll Expenses', NULL, 'Expense', 'Operating Expenses', NULL, NULL, 'debit', true, true, true, true, false, false, NULL, 1, 0, NULL, NULL, NULL, '2025-07-02 15:24:38.643545+00', '2025-07-02 15:24:38.643545+00'),
	('f6a0049f-e16c-492a-9fc7-fe22aa7c0618', '6000', 'Rent Expense', NULL, 'Expense', 'Operating Expenses', NULL, NULL, 'debit', true, true, true, true, false, false, NULL, 1, 0, NULL, NULL, NULL, '2025-07-02 15:24:38.643545+00', '2025-07-02 15:24:38.643545+00');


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."organizations" ("id", "name", "slug", "timezone", "currency", "created_at", "updated_at") VALUES
	('c9cbf496-cd77-451a-9494-aa5aeca3b818', 'Momentum Fitness Demo', 'momentum-demo', 'America/New_York', 'USD', '2025-07-02 19:20:09.093695+00', '2025-07-02 19:20:09.093695+00');


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."locations" ("id", "organization_id", "name", "address", "phone", "email", "manager_name", "timezone", "is_active", "is_primary", "status", "created_at", "updated_at", "slug") VALUES
	('9fa932f9-6f4b-4abb-9813-7ef37f00ea72', 'c9cbf496-cd77-451a-9494-aa5aeca3b818', 'Main Location', NULL, NULL, NULL, NULL, 'America/New_York', true, false, 'active', '2025-07-02 19:20:09.093695+00', '2025-07-02 19:20:09.093695+00', 'main');


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."announcements" ("id", "title", "content", "announcement_type", "priority", "target_audience", "start_date", "end_date", "is_active", "created_by", "created_at", "updated_at", "location_id") VALUES
	('8f67df8d-ce8e-4a1c-84fc-53074fd0c60f', 'Welcome to Momentum Fitness!', 'We''re excited to have you as part of our fitness community. Check out our class schedule and book your first session today!', 'general', 'normal', 'members', '2025-06-19', '2025-07-19', true, NULL, '2025-06-19 20:45:03.522453+00', '2025-06-19 20:45:03.522453+00', NULL),
	('4cfc0710-6e05-4fcc-86ca-3d8bf552ab3f', 'Special Offer: Bring a Friend Week', 'Bring a friend this week and get 10% off your next month''s membership! Valid for new member referrals only.', 'promotion', 'high', 'members', '2025-06-19', '2025-06-26', true, NULL, '2025-06-19 20:45:03.522453+00', '2025-06-19 20:45:03.522453+00', NULL),
	('5871eb8d-a363-449f-be38-efa4a9b5c5ba', 'New HIIT Classes Added!', 'Due to popular demand, we''ve added more HIIT classes to our schedule. Check out the new early morning sessions!', 'general', 'normal', 'members', '2025-06-19', '2025-07-03', true, NULL, '2025-06-19 20:45:03.522453+00', '2025-06-19 20:45:03.522453+00', NULL),
	('57a30311-a182-4eb2-93a0-cad172329bcf', 'Welcome New Members!', 'We are excited to welcome our new members to the Momentum Gym family! Please stop by the front desk to pick up your welcome package.', 'general', 'normal', 'members', '2025-06-19', '2025-07-19', true, 'ee156134-0474-4ceb-b172-5669037b2a6d', '2025-06-19 22:06:47.939355+00', '2025-06-19 22:06:47.939355+00', NULL),
	('6a370603-67e8-4a71-bd93-78bfc1db0f66', 'Holiday Hours Update', 'Please note modified hours during the upcoming holiday weekend. Check with front desk for details.', 'general', 'high', 'all', '2025-06-19', '2025-07-03', true, 'ee156134-0474-4ceb-b172-5669037b2a6d', '2025-06-19 22:06:47.939355+00', '2025-06-19 22:06:47.939355+00', NULL),
	('5812b7eb-463f-4513-96bc-c6d3a292f721', 'Welcome New Members!', 'We are excited to welcome our new members to the Momentum Gym family! Please stop by the front desk to pick up your welcome package.', 'general', 'normal', 'members', '2025-06-19', '2025-07-19', true, 'ee156134-0474-4ceb-b172-5669037b2a6d', '2025-06-19 22:08:17.912484+00', '2025-06-19 22:08:17.912484+00', NULL),
	('0a8b56cc-9d10-4cbf-99b5-69e1f5660513', 'Holiday Hours Update', 'Please note modified hours during the upcoming holiday weekend. Check with front desk for details.', 'general', 'high', 'all', '2025-06-19', '2025-07-03', true, 'ee156134-0474-4ceb-b172-5669037b2a6d', '2025-06-19 22:08:17.912484+00', '2025-06-19 22:08:17.912484+00', NULL),
	('d8895599-86c2-49bf-9b45-266d0dfed6b3', 'Welcome New Members!', 'We are excited to welcome our new members to the Momentum Gym family! Please stop by the front desk to pick up your welcome package.', 'general', 'normal', 'members', '2025-06-19', '2025-07-19', true, 'ee156134-0474-4ceb-b172-5669037b2a6d', '2025-06-19 22:10:00.01255+00', '2025-06-19 22:10:00.01255+00', NULL),
	('6f56c5be-4697-4b97-8ed2-b3bc09ab3d0b', 'Holiday Hours Update', 'Please note modified hours during the upcoming holiday weekend. Check with front desk for details.', 'general', 'high', 'all', '2025-06-19', '2025-07-03', true, 'ee156134-0474-4ceb-b172-5669037b2a6d', '2025-06-19 22:10:00.01255+00', '2025-06-19 22:10:00.01255+00', NULL),
	('a3792b47-1d4e-4c5a-8b3a-59d31986bd93', 'Welcome New Members!', 'We are excited to welcome our new members to the Momentum Gym family! Please stop by the front desk to pick up your welcome package.', 'general', 'normal', 'members', '2025-06-19', '2025-07-19', true, '4c09e1d3-7c5c-4167-b2c2-a9a0f5ed0b82', '2025-06-19 22:14:15.487867+00', '2025-06-19 22:14:15.487867+00', NULL),
	('cec7715d-fe7f-41b2-b764-19fd23182275', 'Holiday Hours Update', 'Please note modified hours during the upcoming holiday weekend. Check with front desk for details.', 'general', 'high', 'all', '2025-06-19', '2025-07-03', true, '4c09e1d3-7c5c-4167-b2c2-a9a0f5ed0b82', '2025-06-19 22:14:15.487867+00', '2025-06-19 22:14:15.487867+00', NULL);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."audit_logs" ("id", "user_id", "action", "resource_type", "resource_id", "details", "ip_address", "user_agent", "created_at") VALUES
	('e16fd166-8845-4614-9a89-c472bc8a0350', 'fb22f72c-2deb-45bc-8927-4f35e0e4256e', 'DATABASE_RESET', NULL, NULL, '{"timestamp": "2025-07-02 19:20:09.093695+00", "description": "Database reset to clean state with demo data"}', NULL, NULL, '2025-07-02 19:20:09.093695+00'),
	('2f5eecc3-a3e3-451f-9ce4-8b5642cca2ed', 'fb22f72c-2deb-45bc-8927-4f35e0e4256e', 'SSO_TOKEN_GENERATED', NULL, NULL, '{"token_expires_at": "2025-07-02T20:17:21.000Z", "organization_slug": "momentum-demo", "target_organization_id": "c9cbf496-cd77-451a-9494-aa5aeca3b818"}', NULL, NULL, '2025-07-02 20:16:24.065+00'),
	('23954a98-688d-44c6-9396-3a62a5acf183', 'fb22f72c-2deb-45bc-8927-4f35e0e4256e', 'SSO_TOKEN_GENERATED', NULL, NULL, '{"token_expires_at": "2025-07-02T20:19:48.000Z", "organization_slug": "momentum-demo", "target_organization_id": "c9cbf496-cd77-451a-9494-aa5aeca3b818"}', NULL, NULL, '2025-07-02 20:18:48.778+00'),
	('b4d75c7c-3742-4995-8741-a7c9395f5f0e', 'fb22f72c-2deb-45bc-8927-4f35e0e4256e', 'SSO_TOKEN_GENERATED', NULL, NULL, '{"token_expires_at": "2025-07-03T15:33:02.000Z", "organization_slug": "momentum-demo", "target_organization_id": "c9cbf496-cd77-451a-9494-aa5aeca3b818"}', NULL, NULL, '2025-07-03 15:32:02.546+00'),
	('6010f399-12f8-4606-a73b-af20b9de6c33', 'fb22f72c-2deb-45bc-8927-4f35e0e4256e', 'SSO_TOKEN_GENERATED', NULL, NULL, '{"token_expires_at": "2025-07-03T15:36:43.000Z", "organization_slug": "momentum-demo", "target_organization_id": "c9cbf496-cd77-451a-9494-aa5aeca3b818"}', NULL, NULL, '2025-07-03 15:35:44.417+00'),
	('733cb13e-5652-466c-b412-c7ef85fc7fd4', 'fb22f72c-2deb-45bc-8927-4f35e0e4256e', 'SSO_TOKEN_GENERATED', NULL, NULL, '{"token_expires_at": "2025-07-03T15:47:24.000Z", "organization_slug": "momentum-demo", "target_organization_id": "c9cbf496-cd77-451a-9494-aa5aeca3b818"}', NULL, NULL, '2025-07-03 15:46:24.218+00'),
	('d9c9ce2b-f73a-43a4-9f01-37bf55500529', 'fb22f72c-2deb-45bc-8927-4f35e0e4256e', 'SSO_TOKEN_GENERATED', NULL, NULL, '{"token_expires_at": "2025-07-03T15:50:16.000Z", "organization_slug": "momentum-demo", "target_organization_id": "c9cbf496-cd77-451a-9494-aa5aeca3b818"}', NULL, NULL, '2025-07-03 15:49:16.345+00');


--
-- Data for Name: club_configuration; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."club_configuration" ("id", "club_name", "club_type", "business_model", "billing_cycle", "billing_day", "anniversary_billing", "prorated_billing", "late_payment_grace_period", "auto_suspend_on_failure", "payment_processor", "currency", "tax_rate", "processing_fees_charged_to", "access_system", "guest_policy", "guest_limit_per_month", "guest_fee", "timezone", "operating_hours", "class_booking_window", "class_cancellation_window", "waitlist_enabled", "freeze_policy_enabled", "max_freeze_days_per_year", "min_freeze_duration", "contract_required", "family_membership_enabled", "corporate_membership_enabled", "check_in_method", "daily_visit_limit", "guest_check_in_enabled", "attendance_tracking", "sms_notifications_enabled", "email_notifications_enabled", "marketing_communications", "automated_reminders", "equipment_reservation_enabled", "locker_rental_enabled", "towel_service_enabled", "personal_training_enabled", "financial_reporting_level", "member_analytics_enabled", "staff_performance_tracking", "mailchimp_integration", "quickbooks_integration", "social_media_sync", "liability_waiver_required", "age_verification_required", "photo_id_required", "emergency_contact_required", "custom_member_fields", "brand_colors", "logo_url", "custom_css", "staff_commission_enabled", "inventory_tracking", "retail_pos_enabled", "membership_sales_goals", "created_at", "updated_at", "avatar_url") VALUES
	(1, 'The LiftZone', 'standard', 'membership', 'monthly', 1, false, true, 3, 30, 'stripe', 'USD', 0.0000, 'club', 'key_fob', 'limited', 4, 0.00, 'America/New_York', '{}', 7, 2, true, true, 60, 7, false, true, false, 'scan', 1, true, true, true, true, true, true, false, true, false, true, 'detailed', true, false, false, false, false, true, true, true, true, '[]', '{}', 'https://vuzurdmwqabyjjoaeghv.supabase.co/storage/v1/object/public/branding/login-logo-1750968034015.png?t=1750968034878', NULL, false, false, false, false, '2025-06-22 00:31:35.013555+00', '2025-06-27 19:41:55.339457+00', 'https://vuzurdmwqabyjjoaeghv.supabase.co/storage/v1/object/public/branding/navbar-logo-1750968217582.png');


--
-- Data for Name: billing_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."billing_rules" ("id", "club_id", "rule_name", "rule_type", "conditions", "actions", "priority", "active", "created_at") VALUES
	('15f35515-2688-4a2d-b328-9fdafc03c773', 1, 'Anniversary Billing', 'membership_start', '{"billing_type": "anniversary"}', '{"charge_on": "signup_date", "prorate_first": true}', 1, true, '2025-06-22 00:31:35.013555+00'),
	('d21eb953-72ae-4c6d-896d-8067834858ac', 1, 'Monthly 1st Billing', 'membership_start', '{"billing_type": "monthly_fixed"}', '{"charge_on": 1, "prorate_first": true}', 1, true, '2025-06-22 00:31:35.013555+00'),
	('26dafa08-698c-4f6e-9259-9748f1b4c521', 1, 'Payment Failure Grace Period', 'payment_failure', '{"attempt_count": 1}', '{"send_reminder": true, "grace_period_days": 3}', 1, true, '2025-06-22 00:31:35.013555+00'),
	('d5a69e06-5735-438c-9743-627538ce0ccb', 1, 'Auto Suspend After Failures', 'payment_failure', '{"attempt_count": 3, "days_past_due": 30}', '{"action": "suspend_membership", "notify_member": true}', 1, true, '2025-06-22 00:31:35.013555+00');


--
-- Data for Name: staff_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "system_member_id", "first_name", "last_name", "email", "phone", "address", "dob", "emergency_contact_name", "emergency_contact_phone", "profile_picture_url", "created_at", "role", "status", "updated_at", "date_of_birth", "staff_role_id", "location_id", "organization_id", "default_location_id", "location_access_level", "last_accessed_location_id", "access_card_number", "emergency_contact_email", "emergency_contact_relationship", "join_date", "gender", "is_global_admin") VALUES
	('c4c3c66a-a8ce-4285-a874-3251ddf89145', 1, 'Global', 'Administrator', 'global.admin@momentum-demo.momentum.internal', NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-03 15:48:52.824407+00', 'admin', 'active', '2025-07-03 15:48:52.824407+00', NULL, NULL, NULL, 'c9cbf496-cd77-451a-9494-aa5aeca3b818', NULL, 'restricted', NULL, NULL, NULL, NULL, NULL, NULL, false);


--
-- Data for Name: corporate_partners; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: membership_types; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: corporate_discounts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: memberships; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: branding_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: check_ins; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: checkin_history; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: class_waitlist; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: club_rules_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: member_cohorts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: cohort_member_snapshots; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: corporate_analytics_summary; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: corporate_audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: corporate_metrics_cache; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: corporate_report_configurations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: corporate_report_delivery_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: corporate_report_recipients; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: custom_fields; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."custom_fields" ("id", "label", "field_key", "type", "placeholder", "description", "is_required", "is_active", "order_index", "options", "validation_rules", "created_at", "updated_at", "created_by", "updated_by") VALUES
	('b5ba284f-2bf8-4853-a5d5-333a032100c9', 'Fitness Goals', 'fitness_goals', 'textarea', 'Describe your fitness goals', 'Member''s fitness objectives and goals', false, true, 5, NULL, NULL, '2025-06-24 18:47:28.995084+00', '2025-06-24 18:47:28.995084+00', NULL, NULL),
	('5da7c00f-2761-4588-9260-217a552af8d4', 'Locker Preference', 'locker_preference', 'select', NULL, 'Preferred locker room area', false, true, 6, '[{"label": "Men''s Main Area", "value": "men_main"}, {"label": "Men''s Family Area", "value": "men_family"}, {"label": "Women''s Main Area", "value": "women_main"}, {"label": "Women''s Family Area", "value": "women_family"}, {"label": "No Preference", "value": "no_preference"}]', NULL, '2025-06-24 18:47:28.995084+00', '2025-06-24 18:47:28.995084+00', NULL, NULL),
	('3c3d90c4-82a2-4585-a4ab-a6127a01f431', 'Marketing Consent', 'marketing_consent', 'checkbox', NULL, 'Consent to receive marketing communications', false, true, 7, NULL, NULL, '2025-06-24 18:47:28.995084+00', '2025-06-24 18:47:28.995084+00', NULL, NULL),
	('fbb414d2-bcaf-45ca-b18b-7bba4e5b051b', 'Instagram Handle', 'instagram_handle', 'text', '@username', 'Member''s Instagram handle for social features', false, true, 8, NULL, NULL, '2025-06-24 18:47:28.995084+00', '2025-06-24 18:47:28.995084+00', NULL, NULL),
	('11ee1815-90dc-4127-9669-7b8cc84e912a', 'Referral Code', 'referral_code', 'text', 'Enter referral code', 'Code used if member was referred by someone', false, true, 9, NULL, NULL, '2025-06-24 18:47:28.995084+00', '2025-06-24 18:47:28.995084+00', NULL, NULL),
	('bae4cec9-6007-49d6-a8ea-068f9b305cce', 'Emergency Medical Information', 'emergency_medical_info', 'textarea', 'Enter any medical conditions, allergies, or medications', 'Important medical information for emergency situations', false, true, 3, NULL, NULL, '2025-06-24 18:47:28.995084+00', '2025-06-24 18:57:56.707055+00', NULL, NULL),
	('673353af-6e5e-412d-9119-5688b8a736fe', 'T-Shirt Size', 'tshirt_size', 'select', NULL, 'T-shirt size for events and promotions', false, true, 2, '[{"label": "XS", "value": "xs"}, {"label": "S", "value": "s"}, {"label": "M", "value": "m"}, {"label": "L", "value": "l"}, {"label": "XL", "value": "xl"}, {"label": "XXL", "value": "xxl"}, {"label": "3XL", "value": "xxxl"}]', NULL, '2025-06-24 18:47:28.995084+00', '2025-06-24 18:57:56.887204+00', NULL, NULL),
	('bae9cb64-140b-400e-be82-0d90a91c38be', 'Preferred Trainer', 'preferred_trainer', 'text', 'Enter preferred trainer name', 'Member''s preferred personal trainer', false, true, 1, NULL, NULL, '2025-06-24 18:47:28.995084+00', '2025-06-24 19:22:35.99687+00', NULL, NULL),
	('f1b8d1e7-d924-48a0-bd0a-6a82666a60ad', 'Membership Source', 'membership_source', 'select', NULL, 'How did the member hear about us?', false, true, 0, '[{"label": "Referral from friend/family", "value": "referral"}, {"label": "Social Media", "value": "social_media"}, {"label": "Google Search", "value": "google"}, {"label": "Advertisement", "value": "advertisement"}, {"label": "Walk-in", "value": "walk_in"}, {"label": "Corporate Partnership", "value": "corporate"}, {"label": "Other", "value": "other"}]', NULL, '2025-06-24 18:47:28.995084+00', '2025-06-24 19:22:36.12857+00', NULL, NULL);


--
-- Data for Name: family_members; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: general_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."general_settings" ("id", "gym_name", "admin_email", "timezone", "updated_at", "stripe_publishable_key", "stripe_secret_key", "online_joining", "contact_phone", "allow_online_joining", "allow_online_upgrades", "allow_addons_online", "allow_family_additions_online", "require_first_name", "require_last_name", "require_email", "require_phone", "require_dob", "require_address", "multi_location_enabled", "address", "website") VALUES
	(1, 'The LiftZone', 'info@liftzone.com', 'America/New_York', '2025-06-30 12:35:07.577+00', NULL, NULL, true, '(555) 123-4567', true, true, true, true, true, true, true, false, false, false, false, '', 'liftzone.com');


--
-- Data for Name: help_articles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: holiday_hours; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."holiday_hours" ("id", "club_id", "holiday_date", "holiday_name", "open_time", "close_time", "is_closed", "special_note", "created_at") VALUES
	('8750dfaf-28a0-4e50-9d24-45ae8d622926', 1, '2025-01-01', 'New Year''s Day', NULL, NULL, true, NULL, '2025-06-22 00:31:35.013555+00'),
	('682759d4-cb5a-4277-a5ad-c64996916822', 1, '2025-07-04', 'Independence Day', NULL, NULL, true, NULL, '2025-06-22 00:31:35.013555+00'),
	('e471de06-535d-4eb6-ad51-0e0e5c228c1e', 1, '2025-11-27', 'Thanksgiving Day', NULL, NULL, true, NULL, '2025-06-22 00:31:35.013555+00'),
	('34881e62-17be-4fe1-a07a-04150d7054f5', 1, '2025-12-25', 'Christmas Day', NULL, NULL, true, NULL, '2025-06-22 00:31:35.013555+00');


--
-- Data for Name: instructors; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."instructors" ("id", "auth_user_id", "first_name", "last_name", "email", "phone", "specializations", "bio", "certifications", "hire_date", "hourly_rate", "profile_image_url", "is_active", "created_at", "updated_at", "location_id") VALUES
	('550e8400-e29b-41d4-a716-446655440001', NULL, 'Sarah', 'Johnson', 'sarah.johnson@momentum.com', NULL, '{yoga,pilates}', 'Certified yoga instructor with 8 years of experience in Hatha and Vinyasa yoga.', '{RYT-500,"Pilates Certification"}', '2025-06-19', 75.00, NULL, true, '2025-06-19 20:45:03.522453+00', '2025-06-19 20:45:03.522453+00', NULL),
	('550e8400-e29b-41d4-a716-446655440002', NULL, 'Mike', 'Chen', 'mike.chen@momentum.com', NULL, '{hiit,strength}', 'Former personal trainer specializing in high-intensity workouts and strength training.', '{NASM-CPT,"HIIT Specialist"}', '2025-06-19', 80.00, NULL, true, '2025-06-19 20:45:03.522453+00', '2025-06-19 20:45:03.522453+00', NULL),
	('550e8400-e29b-41d4-a716-446655440003', NULL, 'Emma', 'Rodriguez', 'emma.rodriguez@momentum.com', NULL, '{dance,cardio}', 'Professional dancer turned fitness instructor, bringing energy and fun to every class.', '{"Dance Fitness Certification","Group Fitness Instructor"}', '2025-06-19', 70.00, NULL, true, '2025-06-19 20:45:03.522453+00', '2025-06-19 20:45:03.522453+00', NULL);


--
-- Data for Name: location_billing_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: login_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: member_corporate_affiliations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: member_custom_field_values; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: member_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: member_membership_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: member_membership_log; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: member_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: tag_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: member_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: member_tag_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: member_tag_history; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: membership_addons; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notification_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notification_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: operating_hours; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."operating_hours" ("id", "club_id", "day_of_week", "open_time", "close_time", "is_closed", "special_hours_note", "created_at") VALUES
	('064166b6-eb00-4f21-bf5c-199489685d38', 1, 1, '00:00:00', '23:59:59', false, NULL, '2025-06-22 00:31:35.013555+00'),
	('2d170f75-b617-4baf-8940-45559177fe72', 1, 0, '00:00:00', '23:59:59', false, NULL, '2025-06-22 00:31:35.013555+00'),
	('4e09808f-5d4c-4edd-80ee-5863eedfc312', 1, 3, '00:00:00', '23:59:59', false, NULL, '2025-06-22 00:31:35.013555+00'),
	('4e9d7855-2327-41c2-8319-ed49c837ae40', 1, 5, '00:00:00', '23:59:59', false, NULL, '2025-06-22 00:31:35.013555+00'),
	('aa69041a-9fd2-4bc4-8ac2-f31cbac8b136', 1, 4, '00:00:00', '23:59:59', false, NULL, '2025-06-22 00:31:35.013555+00'),
	('cfcb8598-db2f-417d-a798-e35c9197e544', 1, 2, '00:00:00', '23:59:59', false, NULL, '2025-06-22 00:31:35.013555+00'),
	('e2d63724-4dc2-4903-84eb-973c98b17542', 1, 6, '00:00:00', '23:59:59', false, NULL, '2025-06-22 00:31:35.013555+00');


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: pos_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: pos_inventory; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: report_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: report_execution_log; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: service_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: service_locations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: service_staff; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sso_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: staff_location_access; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: stripe_customers; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."system_settings" ("id", "multi_location_enabled", "online_joining_enabled", "electronic_agreements_enabled", "pos_integration_enabled", "advanced_reporting_enabled", "created_at", "updated_at", "timeclock_enabled", "timeclock_location_tracking", "timeclock_break_tracking", "timeclock_overtime_threshold", "member_self_checkin", "staff_schedule_management", "accounting_method", "accounting_settings") VALUES
	(1, false, true, true, false, true, '2025-06-30 15:11:23.640396+00', '2025-07-01 15:29:56.943+00', true, true, true, 40, true, true, 'accrual', '{}');


--
-- Data for Name: timeclock_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Name: members_system_member_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."members_system_member_id_seq"', 101, true);


--
-- PostgreSQL database dump complete
--

RESET ALL;
