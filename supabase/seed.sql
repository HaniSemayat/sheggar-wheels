-- Sheggar Wheels: Authoritative Demonstration Seed Data
-- Fictional records designed for Addis Ababa, Ethiopia marketplace demonstration
-- Uses deterministic stable UUIDs for repeatable, idempotent seeding

DO $$
DECLARE
  v_admin_id UUID := 'a0000000-0000-0000-0000-000000000001';
  v_owner1_id UUID := 'b0000000-0000-0000-0000-000000000001';
  v_owner2_id UUID := 'b0000000-0000-0000-0000-000000000002';
  v_owner3_id UUID := 'b0000000-0000-0000-0000-000000000003';
  v_renter1_id UUID := 'c0000000-0000-0000-0000-000000000001';
  v_renter2_id UUID := 'c0000000-0000-0000-0000-000000000002';

  v_car1_id UUID := '10000000-0000-0000-0000-000000000001';
  v_car2_id UUID := '10000000-0000-0000-0000-000000000002';
  v_car3_id UUID := '10000000-0000-0000-0000-000000000003';
  v_car4_id UUID := '10000000-0000-0000-0000-000000000004';
  v_car5_id UUID := '10000000-0000-0000-0000-000000000005';
  v_car6_id UUID := '10000000-0000-0000-0000-000000000006';
  v_car7_id UUID := '10000000-0000-0000-0000-000000000007';
  v_car8_id UUID := '10000000-0000-0000-0000-000000000008';
  v_car9_id UUID := '10000000-0000-0000-0000-000000000009';
  v_car10_id UUID := '10000000-0000-0000-0000-000000000010';
  v_car11_id UUID := '10000000-0000-0000-0000-000000000011';
  v_car12_id UUID := '10000000-0000-0000-0000-000000000012';
  v_car13_id UUID := '10000000-0000-0000-0000-000000000013';
  v_car14_id UUID := '10000000-0000-0000-0000-000000000014';
  v_car15_id UUID := '10000000-0000-0000-0000-000000000015';
  v_car_pending_id UUID := '10000000-0000-0000-0000-000000000016';

  v_booking1_id UUID := '20000000-0000-0000-0000-000000000001';
  v_booking2_id UUID := '20000000-0000-0000-0000-000000000002';
  v_booking3_id UUID := '20000000-0000-0000-0000-000000000003';
  v_booking4_id UUID := '20000000-0000-0000-0000-000000000004';

  v_announcement1_id UUID := 'e0000000-0000-0000-0000-000000000001';
  v_announcement2_id UUID := 'e0000000-0000-0000-0000-000000000002';
BEGIN

  -- 1. Create Demo Users in auth.users if auth schema is present
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES
      (v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@sheggar.demo', '$2a$10$wT7Rj3l25y0iPq32c02m.OCJ8.M18i1F/Gk6ZgU8h8pWbCg2J1Piy', now(), '{"name":"Sheggar Administrator","role":"admin"}'::jsonb, now(), now()),
      (v_owner1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner@sheggar.demo', '$2a$10$wT7Rj3l25y0iPq32c02m.OCJ8.M18i1F/Gk6ZgU8h8pWbCg2J1Piy', now(), '{"name":"Mekdes Tadesse","role":"owner"}'::jsonb, now(), now()),
      (v_owner2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dawit@sheggar.demo', '$2a$10$wT7Rj3l25y0iPq32c02m.OCJ8.M18i1F/Gk6ZgU8h8pWbCg2J1Piy', now(), '{"name":"Dawit Haile","role":"owner"}'::jsonb, now(), now()),
      (v_owner3_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'selam@sheggar.demo', '$2a$10$wT7Rj3l25y0iPq32c02m.OCJ8.M18i1F/Gk6ZgU8h8pWbCg2J1Piy', now(), '{"name":"Selamawit Bekele","role":"owner"}'::jsonb, now(), now()),
      (v_renter1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'renter@sheggar.demo', '$2a$10$wT7Rj3l25y0iPq32c02m.OCJ8.M18i1F/Gk6ZgU8h8pWbCg2J1Piy', now(), '{"name":"Abebe Kebede","role":"renter"}'::jsonb, now(), now()),
      (v_renter2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'almaz@sheggar.demo', '$2a$10$wT7Rj3l25y0iPq32c02m.OCJ8.M18i1F/Gk6ZgU8h8pWbCg2J1Piy', now(), '{"name":"Almaz Tefera","role":"renter"}'::jsonb, now(), now())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 2. Profiles
  INSERT INTO public.profiles (id, name, phone, roles, status)
  VALUES
    (v_admin_id, 'Sheggar Administrator', '+251911000003', ARRAY['renter','owner','admin'], 'active'),
    (v_owner1_id, 'Mekdes Tadesse', '+251911000002', ARRAY['renter','owner'], 'active'),
    (v_owner2_id, 'Dawit Haile', '+251911000004', ARRAY['renter','owner'], 'active'),
    (v_owner3_id, 'Selamawit Bekele', '+251911000005', ARRAY['renter','owner'], 'active'),
    (v_renter1_id, 'Abebe Kebede', '+251911000001', ARRAY['renter'], 'active'),
    (v_renter2_id, 'Almaz Tefera', '+251911000006', ARRAY['renter'], 'active')
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    roles = EXCLUDED.roles,
    status = EXCLUDED.status;

  -- 3. Cars (15 Varied Approved Vehicles + 1 Pending Moderation)
  INSERT INTO public.cars (id, owner_id, make, model, year, transmission, fuel, seats, category, city, neighbourhood, latitude, longitude, price_per_day, photos, description, status)
  VALUES
    (v_car1_id, v_owner1_id, 'Toyota', 'Corolla', 2022, 'Automatic', 'Petrol', 5, 'Economy', 'Addis Ababa', 'Bole', 9.005401, 38.788502, 2500, '{"front":"/images/cars/toyota-corolla-2022/front.jpg","side":"/images/cars/toyota-corolla-2022/side.jpg","rear":"/images/cars/toyota-corolla-2022/rear.jpg"}'::jsonb, 'A comfortable, fuel-efficient sedan for everyday city trips and business travel.', 'approved'),
    (v_car2_id, v_owner2_id, 'Hyundai', 'Accent', 2021, 'Automatic', 'Petrol', 5, 'Economy', 'Addis Ababa', 'Mexico', 9.011800, 38.745600, 2200, '{"front":"/images/cars/hyundai-accent-2021/front.jpg","side":"/images/cars/hyundai-accent-2021/side.jpg","rear":"/images/cars/hyundai-accent-2021/rear.jpg"}'::jsonb, 'A practical compact sedan suited to commuting, errands, and short getaways.', 'approved'),
    (v_car3_id, v_owner3_id, 'Kia', 'Picanto', 2023, 'Automatic', 'Petrol', 5, 'Economy', 'Addis Ababa', 'Kazanchis', 9.018500, 38.769200, 1800, '{"front":"/images/cars/toyota-corolla-2022/front.jpg","side":"/images/cars/toyota-corolla-2022/side.jpg","rear":"/images/cars/toyota-corolla-2022/rear.jpg"}'::jsonb, 'A small city car for easy parking and convenient urban journeys.', 'approved'),
    (v_car4_id, v_owner1_id, 'Suzuki', 'Swift', 2022, 'Manual', 'Petrol', 5, 'Compact', 'Addis Ababa', 'Sar Bet', 8.995400, 38.742000, 2000, '{"front":"/images/cars/toyota-corolla-2022/front.jpg","side":"/images/cars/toyota-corolla-2022/side.jpg","rear":"/images/cars/toyota-corolla-2022/rear.jpg"}'::jsonb, 'A nimble hatchback for drivers who want an economical, easy-to-handle car.', 'approved'),
    (v_car5_id, v_owner2_id, 'Nissan', 'Sunny', 2020, 'Manual', 'Petrol', 5, 'Economy', 'Addis Ababa', 'Piassa', 9.035000, 38.752000, 2100, '{"front":"/images/cars/hyundai-accent-2021/front.jpg","side":"/images/cars/hyundai-accent-2021/side.jpg","rear":"/images/cars/hyundai-accent-2021/rear.jpg"}'::jsonb, 'A straightforward sedan with a roomy cabin for everyday transport.', 'approved'),
    (v_car6_id, v_owner2_id, 'Hyundai', 'Tucson', 2023, 'Automatic', 'Petrol', 5, 'SUV', 'Addis Ababa', 'Bole', 9.003000, 38.784000, 4500, '{"front":"/images/cars/hyundai-tucson.jpg","side":"/images/cars/hyundai-tucson.jpg","rear":"/images/cars/hyundai-tucson.jpg"}'::jsonb, 'A modern SUV with generous space for family outings and weekend travel.', 'approved'),
    (v_car7_id, v_owner3_id, 'Toyota', 'RAV4', 2022, 'Automatic', 'Petrol', 5, 'SUV', 'Addis Ababa', 'CMC', 9.021000, 38.834000, 5000, '{"front":"/images/cars/toyota-corolla-2022/front.jpg","side":"/images/cars/toyota-corolla-2022/side.jpg","rear":"/images/cars/toyota-corolla-2022/rear.jpg"}'::jsonb, 'A versatile SUV for city driving, family plans, and longer road journeys.', 'approved'),
    (v_car8_id, v_owner3_id, 'Honda', 'CR-V', 2021, 'Automatic', 'Petrol', 5, 'SUV', 'Addis Ababa', 'Gerji', 8.992000, 38.812000, 4800, '{"front":"/images/cars/toyota-corolla-2022/front.jpg","side":"/images/cars/toyota-corolla-2022/side.jpg","rear":"/images/cars/toyota-corolla-2022/rear.jpg"}'::jsonb, 'A spacious, versatile SUV for comfortable daily travel and family trips.', 'approved'),
    (v_car9_id, v_owner1_id, 'Toyota', 'HiAce', 2020, 'Manual', 'Diesel', 12, 'Van', 'Addis Ababa', 'Megenagna', 9.021500, 38.801000, 6500, '{"front":"/images/cars/toyota-corolla-2022/front.jpg","side":"/images/cars/toyota-corolla-2022/side.jpg","rear":"/images/cars/toyota-corolla-2022/rear.jpg"}'::jsonb, 'A people carrier for group outings, organized trips, and larger families.', 'approved'),
    (v_car10_id, v_owner2_id, 'Mitsubishi', 'Outlander', 2022, 'Automatic', 'Petrol', 7, 'SUV', 'Addis Ababa', 'Ayat', 9.034000, 38.854000, 5200, '{"front":"/images/cars/toyota-corolla-2022/front.jpg","side":"/images/cars/toyota-corolla-2022/side.jpg","rear":"/images/cars/toyota-corolla-2022/rear.jpg"}'::jsonb, 'A family-focused SUV with extra seating for group travel.', 'approved'),
    (v_car11_id, v_owner1_id, 'Mercedes-Benz', 'C-Class', 2023, 'Automatic', 'Petrol', 5, 'Luxury', 'Addis Ababa', 'Bole', 8.998000, 38.791000, 7000, '{"front":"/images/cars/mercedes-c-class.jpg","side":"/images/cars/mercedes-c-class.jpg","rear":"/images/cars/mercedes-c-class.jpg"}'::jsonb, 'A refined luxury sedan for executive travel and special occasions.', 'approved'),
    (v_car12_id, v_owner2_id, 'BMW', '3 Series', 2022, 'Automatic', 'Petrol', 5, 'Luxury', 'Addis Ababa', 'Old Airport', 8.985000, 38.745000, 7500, '{"front":"/images/cars/toyota-corolla-2022/front.jpg","side":"/images/cars/toyota-corolla-2022/side.jpg","rear":"/images/cars/toyota-corolla-2022/rear.jpg"}'::jsonb, 'A sporty premium sedan for drivers who appreciate performance and comfort.', 'approved'),
    (v_car13_id, v_owner3_id, 'Lexus', 'RX', 2022, 'Automatic', 'Petrol', 5, 'Luxury SUV', 'Addis Ababa', 'Bole', 9.006000, 38.789000, 8500, '{"front":"/images/cars/hyundai-tucson.jpg","side":"/images/cars/hyundai-tucson.jpg","rear":"/images/cars/hyundai-tucson.jpg"}'::jsonb, 'A premium SUV offering a comfortable cabin and an upscale travel experience.', 'approved'),
    (v_car14_id, v_owner3_id, 'Toyota', 'Land Cruiser', 2021, 'Automatic', 'Diesel', 7, 'Premium SUV', 'Addis Ababa', 'CMC', 9.025000, 38.838000, 12000, '{"front":"/images/cars/toyota-corolla-2022/front.jpg","side":"/images/cars/toyota-corolla-2022/side.jpg","rear":"/images/cars/toyota-corolla-2022/rear.jpg"}'::jsonb, 'A rugged, premium SUV for extended journeys and demanding road conditions.', 'approved'),
    (v_car15_id, v_owner1_id, 'Land Rover', 'Range Rover Evoque', 2023, 'Automatic', 'Petrol', 5, 'Luxury SUV', 'Addis Ababa', 'Old Airport', 8.987000, 38.742000, 10000, '{"front":"/images/cars/mercedes-c-class.jpg","side":"/images/cars/mercedes-c-class.jpg","rear":"/images/cars/mercedes-c-class.jpg"}'::jsonb, 'A stylish compact luxury SUV for premium city drives and special occasions.', 'approved'),
    (v_car_pending_id, v_owner1_id, 'Volkswagen', 'ID.4', 2024, 'Automatic', 'Electric', 5, 'Electric SUV', 'Addis Ababa', 'Bole', 9.001000, 38.785000, 6000, '{"front":"/images/cars/toyota-corolla-2022/front.jpg","side":"/images/cars/toyota-corolla-2022/side.jpg","rear":"/images/cars/toyota-corolla-2022/rear.jpg"}'::jsonb, 'Electric SUV pending administrative listing verification.', 'pending')
  ON CONFLICT (id) DO UPDATE
  SET
    price_per_day = EXCLUDED.price_per_day,
    status = EXCLUDED.status,
    description = EXCLUDED.description;

  -- 4. Bookings
  -- Booking 1: Completed rental (eligible for review)
  INSERT INTO public.bookings (id, car_id, renter_id, owner_id, start_date, end_date, days, price_per_day, subtotal, platform_fee, total, payment_status, status, created_at)
  VALUES
    (v_booking1_id, v_car1_id, v_renter1_id, v_owner1_id, '2026-10-10', '2026-10-12', 2, 2500, 5000, 500, 5500, 'demo_paid', 'completed', '2026-10-01T09:00:00Z')
  ON CONFLICT (id) DO NOTHING;

  -- Booking 2: Confirmed upcoming rental
  INSERT INTO public.bookings (id, car_id, renter_id, owner_id, start_date, end_date, days, price_per_day, subtotal, platform_fee, total, payment_status, status, created_at)
  VALUES
    (v_booking2_id, v_car3_id, v_renter1_id, v_owner3_id, '2026-11-15', '2026-11-17', 2, 1800, 3600, 360, 3960, 'demo_paid', 'confirmed', '2026-10-21T11:00:00Z')
  ON CONFLICT (id) DO NOTHING;

  -- Booking 3: Requested rental (pending owner response)
  INSERT INTO public.bookings (id, car_id, renter_id, owner_id, start_date, end_date, days, price_per_day, subtotal, platform_fee, total, payment_status, status, created_at)
  VALUES
    (v_booking3_id, v_car6_id, v_renter2_id, v_owner2_id, '2026-11-20', '2026-11-23', 3, 4500, 13500, 1350, 14850, 'unpaid', 'requested', '2026-10-25T14:00:00Z')
  ON CONFLICT (id) DO NOTHING;

  -- Booking 4: Cancelled rental (dates released)
  INSERT INTO public.bookings (id, car_id, renter_id, owner_id, start_date, end_date, days, price_per_day, subtotal, platform_fee, total, payment_status, status, cancellation_reason, created_at)
  VALUES
    (v_booking4_id, v_car7_id, v_renter1_id, v_owner3_id, '2026-10-05', '2026-10-06', 1, 5000, 5000, 500, 5500, 'unpaid', 'cancelled', 'Travel plans changed', '2026-09-25T12:00:00Z')
  ON CONFLICT (id) DO NOTHING;

  -- 5. Review for Completed Booking 1
  INSERT INTO public.reviews (booking_id, car_id, renter_id, owner_id, rating, comment, owner_reply, created_at)
  VALUES
    (v_booking1_id, v_car1_id, v_renter1_id, v_owner1_id, 5, 'Clean car, smooth pickup in Bole, and a comfortable ride. Highly recommended!', 'Thank you Abebe! Glad you had a great trip.', '2026-10-13T08:00:00Z')
  ON CONFLICT (booking_id) DO NOTHING;

  -- 6. Platform Announcements
  INSERT INTO public.announcements (id, title, message, active, created_by, created_at)
  VALUES
    (v_announcement1_id, 'Welcome to Sheggar Wheels', 'Explore Addis Ababa with verified peer-to-peer car rentals. All bookings feature demo transactions.', true, v_admin_id, now()),
    (v_announcement2_id, 'Bole District Expansion', 'More than 8 new listings are now available across Bole and Kazanchis.', true, v_admin_id, now())
  ON CONFLICT (id) DO UPDATE
  SET
    title = EXCLUDED.title,
    message = EXCLUDED.message,
    active = EXCLUDED.active;

END $$;
