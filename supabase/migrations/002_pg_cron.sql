-- Requires pg_cron extension enabled (Dashboard > Database > Extensions)
-- Calls the Edge Function daily at midnight BRT (03:00 UTC)
-- The service_role_key must be stored in Supabase Vault beforehand:
--   SELECT vault.create_secret('<your_service_role_key>', 'service_role_key');

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'process-recurring-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://lyfvpbzsvlpluhfvcxad.supabase.co/functions/v1/process-recurring',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key'
      ),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
