CREATE TYPE booking_status AS ENUM (
    'requested', 'accepted', 'active', 'completed', 'cancelled'
);

CREATE TABLE bookings (
    id           SERIAL PRIMARY KEY,
    cycle_id     INTEGER NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
    renter_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time   TIMESTAMPTZ NOT NULL,
    end_time     TIMESTAMPTZ NOT NULL,
    status       booking_status NOT NULL DEFAULT 'requested',
    start_otp    CHAR(64),      -- hashed, set when accepted
    end_otp      CHAR(64),      -- hashed, set when active
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_time > start_time)
);