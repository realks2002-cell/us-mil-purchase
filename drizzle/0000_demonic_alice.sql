CREATE TYPE "public"."us_mil_notification_channel" AS ENUM('email', 'sms', 'slack');--> statement-breakpoint
CREATE TYPE "public"."us_mil_notification_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."us_mil_opportunity_status" AS ENUM('active', 'inactive', 'archived', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."us_mil_sync_status" AS ENUM('running', 'success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."us_mil_user_role" AS ENUM('admin', 'user');--> statement-breakpoint
CREATE TABLE "us_mil_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "us_mil_accounts_provider_compound" UNIQUE("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "us_mil_awards" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_number" varchar(100),
	"opportunity_id" integer,
	"notice_id" varchar(100),
	"title" text,
	"awardee_name" text,
	"awardee_uei" varchar(50),
	"award_amount" numeric(15, 2),
	"date_signed" timestamp with time zone,
	"naics_code" varchar(10),
	"psc" varchar(10),
	"contract_type" text,
	"funding_agency" text,
	"funding_office" text,
	"performance_country" varchar(10),
	"raw_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "us_mil_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"opportunity_id" integer,
	"filter_id" integer,
	"channel" "us_mil_notification_channel" DEFAULT 'email' NOT NULL,
	"status" "us_mil_notification_status" DEFAULT 'pending' NOT NULL,
	"subject" text,
	"body" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "us_mil_opportunities" (
	"id" serial PRIMARY KEY NOT NULL,
	"notice_id" varchar(100) NOT NULL,
	"title" text NOT NULL,
	"solicitation_number" varchar(100),
	"department" text,
	"sub_tier" text,
	"office" text,
	"posted_date" timestamp with time zone,
	"type" varchar(100),
	"base_type" varchar(50),
	"archive_type" varchar(50),
	"archive_date" timestamp with time zone,
	"response_deadline" timestamp with time zone,
	"naics_code" varchar(10),
	"classification_code" varchar(10),
	"set_aside" text,
	"set_aside_description" text,
	"place_city" text,
	"place_state" text,
	"place_country" varchar(10),
	"place_zip" varchar(20),
	"description" text,
	"organization_type" text,
	"ui_link" text,
	"resource_links" jsonb,
	"point_of_contact" jsonb,
	"status" "us_mil_opportunity_status" DEFAULT 'active' NOT NULL,
	"raw_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "us_mil_opportunities_notice_id_unique" UNIQUE("notice_id")
);
--> statement-breakpoint
CREATE TABLE "us_mil_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"session_token" text NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "us_mil_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "us_mil_sync_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"api_type" varchar(50) NOT NULL,
	"status" "us_mil_sync_status" DEFAULT 'running' NOT NULL,
	"records_fetched" integer DEFAULT 0,
	"records_new" integer DEFAULT 0,
	"records_updated" integer DEFAULT 0,
	"error_message" text,
	"duration" integer,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "us_mil_user_filters" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"naics_codes" text[],
	"keywords" text[],
	"notice_types" text[],
	"set_asides" text[],
	"departments" text[],
	"is_active" boolean DEFAULT true NOT NULL,
	"notify_email" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "us_mil_users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"password_hash" text,
	"role" "us_mil_user_role" DEFAULT 'user' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"email_verified" timestamp with time zone,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "us_mil_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "us_mil_accounts" ADD CONSTRAINT "us_mil_accounts_user_id_us_mil_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."us_mil_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "us_mil_awards" ADD CONSTRAINT "us_mil_awards_opportunity_id_us_mil_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."us_mil_opportunities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "us_mil_notifications" ADD CONSTRAINT "us_mil_notifications_user_id_us_mil_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."us_mil_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "us_mil_notifications" ADD CONSTRAINT "us_mil_notifications_opportunity_id_us_mil_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."us_mil_opportunities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "us_mil_notifications" ADD CONSTRAINT "us_mil_notifications_filter_id_us_mil_user_filters_id_fk" FOREIGN KEY ("filter_id") REFERENCES "public"."us_mil_user_filters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "us_mil_sessions" ADD CONSTRAINT "us_mil_sessions_user_id_us_mil_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."us_mil_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "us_mil_user_filters" ADD CONSTRAINT "us_mil_user_filters_user_id_us_mil_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."us_mil_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_us_mil_award_naics" ON "us_mil_awards" USING btree ("naics_code");--> statement-breakpoint
CREATE INDEX "idx_us_mil_award_awardee" ON "us_mil_awards" USING btree ("awardee_name");--> statement-breakpoint
CREATE INDEX "idx_us_mil_award_date" ON "us_mil_awards" USING btree ("date_signed");--> statement-breakpoint
CREATE INDEX "idx_us_mil_award_country" ON "us_mil_awards" USING btree ("performance_country");--> statement-breakpoint
CREATE INDEX "idx_us_mil_notif_user_id" ON "us_mil_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_us_mil_opp_naics" ON "us_mil_opportunities" USING btree ("naics_code");--> statement-breakpoint
CREATE INDEX "idx_us_mil_opp_posted_date" ON "us_mil_opportunities" USING btree ("posted_date");--> statement-breakpoint
CREATE INDEX "idx_us_mil_opp_deadline" ON "us_mil_opportunities" USING btree ("response_deadline");--> statement-breakpoint
CREATE INDEX "idx_us_mil_opp_status_date" ON "us_mil_opportunities" USING btree ("status","posted_date");--> statement-breakpoint
CREATE INDEX "idx_us_mil_opp_country" ON "us_mil_opportunities" USING btree ("place_country");--> statement-breakpoint
CREATE INDEX "idx_us_mil_sessions_user_id" ON "us_mil_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_us_mil_filters_user_id" ON "us_mil_user_filters" USING btree ("user_id");