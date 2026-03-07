SELECT cron.schedule(
  'dispatch-advisor-every-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ovuhtroiuuqsiltqgqpp.supabase.co/functions/v1/dispatch-advisor',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92dWh0cm9pdXVxc2lsdHFncXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzQ2NjIsImV4cCI6MjA4NjQxMDY2Mn0.qjpz83tFpdxDa8YwbSdQLit4T_IiFV5H6GtEmH1TBNw"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);