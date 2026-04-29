CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any previous version of the same job
SELECT cron.unschedule('mark-offline-screens-every-2min')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'mark-offline-screens-every-2min');

-- Schedule the job
SELECT cron.schedule(
  'mark-offline-screens-every-2min',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ovuhtroiuuqsiltqgqpp.supabase.co/functions/v1/mark-offline-screens',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92dWh0cm9pdXVxc2lsdHFncXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzQ2NjIsImV4cCI6MjA4NjQxMDY2Mn0.qjpz83tFpdxDa8YwbSdQLit4T_IiFV5H6GtEmH1TBNw"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);