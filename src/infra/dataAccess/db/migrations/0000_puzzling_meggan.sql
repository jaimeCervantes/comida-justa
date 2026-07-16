CREATE TABLE IF NOT EXISTS "post_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" text NOT NULL,
	"url" text NOT NULL,
	"type" text NOT NULL,
	"alt" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "post_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" text NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "posts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"price" numeric,
	"contact_phone" text,
	"contact_email" text,
	"contact_whatsapp" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'post_media_post_id_posts_id_fk'
	) THEN
		ALTER TABLE "post_media" ADD CONSTRAINT "post_media_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'post_translations_post_id_posts_id_fk'
	) THEN
		ALTER TABLE "post_translations" ADD CONSTRAINT "post_translations_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_media_post_id" ON "post_media" USING btree ("post_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_translations_post_id" ON "post_translations" USING btree ("post_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_translations_slug" ON "post_translations" USING btree ("slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_posts_created_at" ON "posts" USING btree ("created_at" DESC NULLS LAST);
