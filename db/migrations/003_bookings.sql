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
    start_otp    CHAR(6),       -- hashed, set when accepted
    end_otp      CHAR(6),       -- hashed, set when active
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_time > start_time)
);

-- Prevent overlapping bookings for same cycle
CREATE UNIQUE INDEX no_overlap ON bookings (cycle_id, status)
    WHERE status IN ('accepted', 'active');