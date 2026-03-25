CREATE TABLE "us_mil_usaspending_awards" (
	"id" serial PRIMARY KEY NOT NULL,
	"award_id" varchar(100) NOT NULL,
	"piid" varchar(100),
	"awardee_name" text,
	"awardee_uei" varchar(50),
	"total_obligation" numeric(15, 2),
	"base_and_all_options" numeric(15, 2),
	"competition_type" varchar(100),
	"number_of_offers" integer,
	"naics_code" varchar(10),
	"naics_description" text,
	"psc" varchar(10),
	"psc_description" text,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"funding_agency" text,
	"funding_sub_agency" text,
	"awarding_agency" text,
	"performance_country" varchar(10),
	"performance_city" text,
	"set_aside" text,
	"sam_award_id" integer,
	"raw_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "us_mil_usaspending_awards_award_id_unique" UNIQUE("award_id")
);
--> statement-breakpoint
CREATE TABLE "us_mil_vendor_naics_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_uei" varchar(50) NOT NULL,
	"naics_code" varchar(10) NOT NULL,
	"award_count" integer DEFAULT 0,
	"total_amount" numeric(15, 2) DEFAULT '0',
	"avg_amount" numeric(15, 2),
	"competitive_win_count" integer DEFAULT 0,
	"sole_source_count" integer DEFAULT 0,
	"last_award_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "us_mil_vendor_naics_unique" UNIQUE("vendor_uei","naics_code")
);
--> statement-breakpoint
CREATE TABLE "us_mil_vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"uei" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"duns" varchar(20),
	"total_award_count" integer DEFAULT 0,
	"total_award_amount" numeric(15, 2) DEFAULT '0',
	"primary_naics" text[],
	"primary_psc" text[],
	"competitive_win_count" integer DEFAULT 0,
	"sole_source_count" integer DEFAULT 0,
	"avg_contract_value" numeric(15, 2),
	"last_award_date" timestamp with time zone,
	"raw_recipient_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "us_mil_vendors_uei_unique" UNIQUE("uei")
);
--> statement-breakpoint
ALTER TABLE "us_mil_usaspending_awards" ADD CONSTRAINT "us_mil_usaspending_awards_sam_award_id_us_mil_awards_id_fk" FOREIGN KEY ("sam_award_id") REFERENCES "public"."us_mil_awards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "us_mil_vendor_naics_stats" ADD CONSTRAINT "us_mil_vendor_naics_stats_vendor_uei_us_mil_vendors_uei_fk" FOREIGN KEY ("vendor_uei") REFERENCES "public"."us_mil_vendors"("uei") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_us_mil_usa_naics" ON "us_mil_usaspending_awards" USING btree ("naics_code");--> statement-breakpoint
CREATE INDEX "idx_us_mil_usa_awardee" ON "us_mil_usaspending_awards" USING btree ("awardee_name");--> statement-breakpoint
CREATE INDEX "idx_us_mil_usa_awardee_uei" ON "us_mil_usaspending_awards" USING btree ("awardee_uei");--> statement-breakpoint
CREATE INDEX "idx_us_mil_usa_competition" ON "us_mil_usaspending_awards" USING btree ("competition_type");--> statement-breakpoint
CREATE INDEX "idx_us_mil_usa_start_date" ON "us_mil_usaspending_awards" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "idx_us_mil_usa_piid" ON "us_mil_usaspending_awards" USING btree ("piid");--> statement-breakpoint
CREATE INDEX "idx_us_mil_usa_country" ON "us_mil_usaspending_awards" USING btree ("performance_country");--> statement-breakpoint
CREATE INDEX "idx_us_mil_vns_uei" ON "us_mil_vendor_naics_stats" USING btree ("vendor_uei");--> statement-breakpoint
CREATE INDEX "idx_us_mil_vns_naics" ON "us_mil_vendor_naics_stats" USING btree ("naics_code");--> statement-breakpoint
CREATE INDEX "idx_us_mil_vendor_name" ON "us_mil_vendors" USING btree ("name");