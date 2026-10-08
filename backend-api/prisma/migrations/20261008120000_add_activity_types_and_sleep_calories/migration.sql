ALTER TABLE "daily_logs"
ADD COLUMN "activity_types" VARCHAR(30)[] NOT NULL DEFAULT ARRAY[]::VARCHAR(30)[],
ADD COLUMN "activity_calories_burned" DECIMAL(8,2) NOT NULL DEFAULT 0,
ADD COLUMN "sleep_hours" DECIMAL(4,2),
ADD COLUMN "sleep_calories" DECIMAL(8,2) NOT NULL DEFAULT 0,
ADD COLUMN "sleep_calories_confirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "activity_logged_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "daily_logs"
SET "activity_calories_burned" = "calories_burned";

ALTER TABLE "user_profiles"
ADD COLUMN "daily_calorie_target_override" DECIMAL(7,2),
ADD COLUMN "daily_steps_target_override" INTEGER;
