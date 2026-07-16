DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_name = 'accounts'
			AND column_name = 'expires_at'
			AND data_type <> 'integer'
	) THEN
		ALTER TABLE "accounts" ALTER COLUMN "expires_at" SET DATA TYPE integer USING EXTRACT(EPOCH FROM "expires_at")::integer;
	END IF;
END $$;
