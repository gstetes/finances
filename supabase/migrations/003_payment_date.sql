-- Add payment_date to transactions
-- date = when the purchase happened
-- payment_date = when it will actually be paid / debited (determines month projection)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_date date;

-- Backfill: existing transactions use date as payment_date
UPDATE transactions SET payment_date = date WHERE payment_date IS NULL;
