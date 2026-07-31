ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Platos fuertes';

CREATE INDEX IF NOT EXISTS content_items_business_active_sort_idx
  ON public.content_items (business_id, is_active, category, sort_order);