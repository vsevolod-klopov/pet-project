-- Goal steps as family journal entries (comment + status + optional photo)

ALTER TABLE goal_steps
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users (id) ON DELETE SET NULL;

ALTER TABLE goal_steps
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'spark';

ALTER TABLE goal_steps
    ADD COLUMN IF NOT EXISTS image TEXT;

ALTER TABLE goal_steps
    ADD COLUMN IF NOT EXISTS image_alt VARCHAR(255);

ALTER TABLE goal_steps
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE goal_steps
SET status = 'spark'
WHERE status IS NULL OR status = '';
