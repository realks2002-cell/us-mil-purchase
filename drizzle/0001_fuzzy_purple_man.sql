ALTER TABLE "us_mil_awards" ALTER COLUMN "notice_id" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_us_mil_award_date_naics" ON "us_mil_awards" USING btree ("date_signed","naics_code");--> statement-breakpoint
CREATE INDEX "idx_us_mil_award_date_awardee" ON "us_mil_awards" USING btree ("date_signed","awardee_name");--> statement-breakpoint
ALTER TABLE "us_mil_awards" ADD CONSTRAINT "us_mil_awards_notice_id_unique" UNIQUE("notice_id");