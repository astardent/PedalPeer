CREATE TABLE condition_ledger (
    id          SERIAL PRIMARY KEY,
    booking_id  INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    stage       TEXT NOT NULL CHECK (stage IN ('pre', 'post')),
    photo_path  TEXT NOT NULL,   -- local path for now, S3 URL later
    notes       TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (booking_id, stage)
);