
-- 1. Create a test business
INSERT INTO public.businesses (id, name)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Visualia Demo Business');

-- 2. Link user mochisand to the business as admin
INSERT INTO public.business_memberships (user_id, business_id, role)
VALUES ('456a6892-0f74-44ea-a467-5325d51d73f8', 'a0000000-0000-0000-0000-000000000001', 'admin');

-- 3. Update profile with business_id
UPDATE public.profiles
SET business_id = 'a0000000-0000-0000-0000-000000000001'
WHERE id = '456a6892-0f74-44ea-a467-5325d51d73f8';

-- 4. Create test locations
INSERT INTO public.locations (id, business_id, name, address) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Mall Central', 'Cra 7 #45-12, Bogotá'),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Food Court Piso 3', 'CC Unicentro, Bogotá'),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Sede Norte', 'Av Principal #45, Bogotá');

-- 5. Create a starter subscription
INSERT INTO public.subscriptions (id, business_id, plan, status, screens_count, price_per_screen, total_amount, billing_cycle)
VALUES ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'pro', 'active', 10, 50000, 500000, 'monthly');

-- 6. Create test screens
INSERT INTO public.screens (id, location_id, name, status, subscription_id, license_status, last_seen_at) VALUES
('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Mall Entrance – Left', 'online', 'c0000000-0000-0000-0000-000000000001', 'active', now() - interval '2 minutes'),
('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Mall Entrance – Right', 'online', 'c0000000-0000-0000-0000-000000000001', 'active', now() - interval '5 minutes'),
('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'Food Court Screen', 'online', 'c0000000-0000-0000-0000-000000000001', 'active', now() - interval '10 minutes'),
('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 'Outdoor Billboard', 'offline', 'c0000000-0000-0000-0000-000000000001', 'active', now() - interval '1 day'),
('d0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003', 'Lobby Vertical', 'online', 'c0000000-0000-0000-0000-000000000001', 'active', now() - interval '1 minute');
