CREATE TYPE "public"."us_mil_notification_type" AS ENUM('new_match', 'deadline_warning', 'status_change');--> statement-breakpoint
ALTER TABLE "us_mil_notifications" ADD COLUMN "type" "us_mil_notification_type" DEFAULT 'new_match' NOT NULL;--> statement-breakpoint
ALTER TABLE "us_mil_notifications" ADD COLUMN "read_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "idx_us_mil_notif_user_read" ON "us_mil_notifications" USING btree ("user_id","read_at");--> statement-breakpoint
ALTER TABLE "us_mil_notifications" ADD CONSTRAINT "us_mil_notif_unique" UNIQUE("user_id","opportunity_id","type");