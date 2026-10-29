-- Sheggar Wheels Migration 001: Initial Relational Schema
-- PostgreSQL / Supabase Migration
-- Authoritative data models for profiles, cars, bookings, reviews, disputes, announcements

-- 1. Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Generic updated_at Timestamp Function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Profiles Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  roles TEXT[] NOT NULL DEFAULT '{renter}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4. Role Protection Trigger on Profiles
-- Guarantees that public users cannot self-assign the 'admin' role or unsuspend themselves
CREATE OR REPLACE FUNCTION public.protect_profile_roles()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.roles IS DISTINCT FROM NEW.roles) OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Check if executing user is an active admin
    IF auth.uid() IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND 'admin' = ANY(roles)
        AND status = 'active'
    ) THEN
      RAISE EXCEPTION 'Unauthorized: Only platform administrators can change user roles or account status.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_protect_profile_roles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_roles();

-- 5. Cars Table
CREATE TABLE IF NOT EXISTS public.cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year BETWEEN 1990 AND 2100),
  transmission TEXT NOT NULL CHECK (transmission IN ('Automatic', 'Manual')),
  fuel TEXT NOT NULL CHECK (fuel IN ('Petrol', 'Diesel', 'Hybrid', 'Electric')),
  seats INTEGER NOT NULL CHECK (seats BETWEEN 2 AND 50),
  category TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Addis Ababa',
  neighbourhood TEXT NOT NULL,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  price_per_day INTEGER NOT NULL CHECK (price_per_day > 0),
  photos JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'inactive')),
  unavailable_dates DATE[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_cars_updated_at
  BEFORE UPDATE ON public.cars
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 6. Car Moderation Protection Trigger
CREATE OR REPLACE FUNCTION public.protect_car_moderation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status IN ('approved', 'rejected') THEN
      IF auth.uid() IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND 'admin' = ANY(roles)
          AND status = 'active'
      ) THEN
        RAISE EXCEPTION 'Unauthorized: Only administrators can approve or reject car listings.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_protect_car_moderation
  BEFORE UPDATE ON public.cars
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_car_moderation();

-- 7. Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE RESTRICT,
  renter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER NOT NULL CHECK (days > 0),
  price_per_day INTEGER NOT NULL CHECK (price_per_day > 0),
  subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
  platform_fee INTEGER NOT NULL DEFAULT 0 CHECK (platform_fee >= 0),
  total INTEGER NOT NULL CHECK (total >= 0),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'demo_paid', 'refunded')),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'in_progress', 'completed', 'reviewed', 'declined', 'cancelled', 'disputed', 'resolved')),
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_booking_dates CHECK (end_date > start_date)
);

CREATE TRIGGER set_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 8. Exclusion Constraint: Date Overlap Prevention at Database Level
-- Active bookings (requested, confirmed, in_progress) cannot overlap for the same vehicle.
-- When a booking transitions to 'declined', 'cancelled', 'completed', 'reviewed', or 'resolved',
-- it is excluded from this index, immediately releasing the dates for new bookings.
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS no_overlapping_active_bookings;

ALTER TABLE public.bookings
  ADD CONSTRAINT no_overlapping_active_bookings
  EXCLUDE USING gist (
    car_id WITH =,
    daterange(start_date, end_date, '[)') WITH &&
  )
  WHERE (status IN ('requested', 'confirmed', 'in_progress'));

-- 9. Authoritative Booking Preparation Trigger
-- Automatically populates owner_id, price snapshot, days, subtotal, fee, and total from trusted car data.
CREATE OR REPLACE FUNCTION public.prepare_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_car RECORD;
BEGIN
  SELECT * INTO v_car FROM public.cars WHERE id = NEW.car_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Car listing not found.';
  END IF;

  IF v_car.status != 'approved' THEN
    RAISE EXCEPTION 'Vehicle is not currently approved for rental.';
  END IF;

  -- Ensure owner_id matches car owner authoritative record
  NEW.owner_id := v_car.owner_id;

  IF NEW.renter_id = NEW.owner_id THEN
    RAISE EXCEPTION 'Owners cannot book their own vehicles.';
  END IF;

  IF NEW.end_date <= NEW.start_date THEN
    RAISE EXCEPTION 'Return date must be strictly after pickup date.';
  END IF;

  -- Calculate days and authoritative price snapshot
  NEW.days := NEW.end_date - NEW.start_date;
  NEW.price_per_day := v_car.price_per_day;
  NEW.subtotal := NEW.days * NEW.price_per_day;
  NEW.platform_fee := ROUND(NEW.subtotal * 0.10); -- 10% demo marketplace commission
  NEW.total := NEW.subtotal + NEW.platform_fee;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_prepare_booking
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.prepare_booking();

-- 10. Booking Status Transition Validation Trigger
CREATE OR REPLACE FUNCTION public.validate_booking_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Valid FSM transitions
  IF OLD.status = 'requested' AND NEW.status IN ('confirmed', 'declined', 'cancelled') THEN
    RETURN NEW;
  ELSIF OLD.status = 'confirmed' AND NEW.status IN ('in_progress', 'cancelled') THEN
    RETURN NEW;
  ELSIF OLD.status = 'in_progress' AND NEW.status IN ('completed', 'disputed') THEN
    RETURN NEW;
  ELSIF OLD.status = 'completed' AND NEW.status IN ('reviewed', 'disputed') THEN
    RETURN NEW;
  ELSIF OLD.status = 'disputed' AND NEW.status = 'resolved' THEN
    RETURN NEW;
  ELSE
    RAISE EXCEPTION 'Invalid booking lifecycle transition: cannot move from "%" to "%"', OLD.status, NEW.status;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_booking_status
  BEFORE UPDATE OF status ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_booking_status_transition();

-- 11. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  renter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL CHECK (char_length(comment) >= 8),
  owner_reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 12. Review Submission Trigger (Auto-advances Booking to 'reviewed')
CREATE OR REPLACE FUNCTION public.handle_review_submitted()
RETURNS TRIGGER AS $$
DECLARE
  v_booking RECORD;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id = NEW.booking_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Associated booking record not found.';
  END IF;

  IF v_booking.status != 'completed' THEN
    RAISE EXCEPTION 'Reviews can only be submitted for completed rentals.';
  END IF;

  IF v_booking.renter_id != NEW.renter_id THEN
    RAISE EXCEPTION 'Only the renter who completed this trip may leave a review.';
  END IF;

  -- Ensure car_id and owner_id are authoritative
  NEW.car_id := v_booking.car_id;
  NEW.owner_id := v_booking.owner_id;

  -- Automatically advance booking status to terminal reviewed state
  UPDATE public.bookings
  SET status = 'reviewed'
  WHERE id = NEW.booking_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_handle_review_submitted
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_review_submitted();

-- 13. Disputes Table
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  opened_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,
  description TEXT NOT NULL CHECK (char_length(description) >= 10),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- 14. Dispute Status Workflow Trigger
CREATE OR REPLACE FUNCTION public.handle_dispute_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.bookings
    SET status = 'disputed'
    WHERE id = NEW.booking_id AND status IN ('in_progress', 'completed');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'open' AND NEW.status = 'resolved' THEN
      NEW.resolved_at := now();
      UPDATE public.bookings
      SET status = 'resolved'
      WHERE id = NEW.booking_id AND status = 'disputed';
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_handle_dispute_status
  BEFORE INSERT OR UPDATE ON public.disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_dispute_status();

-- 15. Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 16. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_cars_owner ON public.cars(owner_id);
CREATE INDEX IF NOT EXISTS idx_cars_status_location ON public.cars(status, city, neighbourhood);
CREATE INDEX IF NOT EXISTS idx_cars_price ON public.cars(price_per_day);
CREATE INDEX IF NOT EXISTS idx_bookings_renter ON public.bookings(renter_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_owner ON public.bookings(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_car ON public.bookings(car_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_car ON public.reviews(car_id);
CREATE INDEX IF NOT EXISTS idx_disputes_booking ON public.disputes(booking_id, status);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements(active, created_at DESC);
