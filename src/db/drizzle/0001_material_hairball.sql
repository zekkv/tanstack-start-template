ALTER TABLE "notes" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "notes_user_id_created_at_idx" ON "notes" USING btree ("user_id","created_at");