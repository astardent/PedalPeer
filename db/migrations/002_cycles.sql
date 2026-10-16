CREATE TABLE cycles (
    id          SERIAL PRIMARY KEY,
    owner_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 80),
    description TEXT,
    price_per_hour INTEGER NOT NULL CHECK (price_per_hour >= 0),  
    hostel      TEXT,          
    lat         DOUBLE PRECISION,
    lng         DOUBLE PRECISION,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);