ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS hostel         TEXT,
    ADD COLUMN IF NOT EXISTS price_per_hour INTEGER CHECK (price_per_hour >= 0),
    ADD COLUMN IF NOT EXISTS total_fare     NUMERIC(10, 2);

-- fill existing bookings from their cycle
UPDATE bookings b
SET hostel = c.hostel, price_per_hour = c.price_per_hour
FROM cycles c
WHERE b.cycle_id = c.id AND b.price_per_hour IS NULL;

-- fare for rides already completed
UPDATE bookings
SET total_fare = ROUND((EXTRACT(EPOCH FROM (actual_end - actual_start)) / 3600 * price_per_hour)::numeric, 2)
WHERE status = 'completed' AND actual_start IS NOT NULL AND actual_end IS NOT NULL AND total_fare IS NULL;
