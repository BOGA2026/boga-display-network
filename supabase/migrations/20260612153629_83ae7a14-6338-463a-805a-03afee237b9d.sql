
ALTER TABLE public.screens
  ADD COLUMN IF NOT EXISTS gps_lat double precision,
  ADD COLUMN IF NOT EXISTS gps_lng double precision,
  ADD COLUMN IF NOT EXISTS gps_accuracy double precision,
  ADD COLUMN IF NOT EXISTS gps_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS ip_lat double precision,
  ADD COLUMN IF NOT EXISTS ip_lng double precision,
  ADD COLUMN IF NOT EXISTS ip_city text,
  ADD COLUMN IF NOT EXISTS ip_region text,
  ADD COLUMN IF NOT EXISTS ip_country text,
  ADD COLUMN IF NOT EXISTS ip_geo_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS ip_geo_for text;
