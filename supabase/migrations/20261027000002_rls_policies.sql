-- Sheggar Wheels Migration 002: Row Level Security (RLS) & Authorization
-- Enforces zero-trust database security policies across all tables

-- 1. Helper Security Functions (SECURITY DEFINER to avoid recursion)

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND 'admin' = ANY(roles)
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND required_role = ANY(roles)
      AND status = 'active'
  );
$$;

-- 2. Supabase Auth Trigger for New User Signup
-- Enforces that public signups can never self-assign admin roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
  v_phone TEXT;
  v_role TEXT;
  v_roles TEXT[];
BEGIN
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  v_phone := NEW.raw_user_meta_data->>'phone';
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'renter');

  -- Strict Guardrail: Public signups can NEVER be admin
  IF v_role = 'admin' THEN
    v_role := 'renter';
  END IF;

  IF v_role = 'owner' THEN
    v_roles := ARRAY['renter', 'owner'];
  ELSE
    v_roles := ARRAY['renter'];
  END IF;

  INSERT INTO public.profiles (id, name, phone, roles, status)
  VALUES (NEW.id, v_name, v_phone, v_roles, 'active')
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users if running in a managed Supabase environment
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- 3. Enable RLS on All Tables

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 4. PROFILES Policies

-- Anyone can view active public profile names (needed for catalogue & vehicle detail)
CREATE POLICY "profiles_select_active"
  ON public.profiles
  FOR SELECT
  USING (status = 'active' OR id = auth.uid() OR public.is_admin());

-- Users can update only their own profile (trigger blocks changing roles/status)
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid() AND public.is_active_user())
  WITH CHECK (id = auth.uid() AND public.is_active_user());

-- Only admins can delete profiles
CREATE POLICY "profiles_delete_admin"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 5. CARS Policies

-- Public catalogue can only view approved cars from active owners
CREATE POLICY "cars_select_public"
  ON public.cars
  FOR SELECT
  USING (
    status = 'approved'
    OR owner_id = auth.uid()
    OR public.is_admin()
  );

-- Active users with 'owner' role can create car listings (starts as 'pending')
CREATE POLICY "cars_insert_owner"
  ON public.cars
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND public.is_active_user()
    AND public.user_has_role('owner')
  );

-- Owners can update their own listings; admins can update all
CREATE POLICY "cars_update_owner_or_admin"
  ON public.cars
  FOR UPDATE
  TO authenticated
  USING (
    (owner_id = auth.uid() AND public.is_active_user())
    OR public.is_admin()
  )
  WITH CHECK (
    (owner_id = auth.uid() AND public.is_active_user())
    OR public.is_admin()
  );

-- Owners can delete unbooked cars; admins can delete any car
CREATE POLICY "cars_delete_owner_or_admin"
  ON public.cars
  FOR DELETE
  TO authenticated
  USING (
    (owner_id = auth.uid() AND public.is_active_user() AND NOT EXISTS (
      SELECT 1 FROM public.bookings WHERE car_id = cars.id
    ))
    OR public.is_admin()
  );

-- 6. BOOKINGS Policies

-- Renters see their bookings; owners see bookings for their cars; admins see all
CREATE POLICY "bookings_select_parties_or_admin"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    renter_id = auth.uid()
    OR owner_id = auth.uid()
    OR public.is_admin()
  );

-- Active renters can create booking requests (status must start as requested)
CREATE POLICY "bookings_insert_renter"
  ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    renter_id = auth.uid()
    AND public.is_active_user()
    AND status = 'requested'
    AND payment_status = 'unpaid'
  );

-- Renters can cancel their own eligible bookings; owners can update status; admins can update all
CREATE POLICY "bookings_update_parties_or_admin"
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    (renter_id = auth.uid() AND public.is_active_user())
    OR (owner_id = auth.uid() AND public.is_active_user())
    OR public.is_admin()
  )
  WITH CHECK (
    (renter_id = auth.uid() AND public.is_active_user())
    OR (owner_id = auth.uid() AND public.is_active_user())
    OR public.is_admin()
  );

-- Bookings cannot be deleted by normal users (audit trail); admins only
CREATE POLICY "bookings_delete_admin"
  ON public.bookings
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 7. REVIEWS Policies

-- Reviews are publicly readable
CREATE POLICY "reviews_select_all"
  ON public.reviews
  FOR SELECT
  USING (true);

-- Eligible renters can insert a review (enforced by trigger handle_review_submitted)
CREATE POLICY "reviews_insert_renter"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    renter_id = auth.uid()
    AND public.is_active_user()
  );

-- Owners can update only to reply to reviews; admins can moderate
CREATE POLICY "reviews_update_owner_or_admin"
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING (
    (owner_id = auth.uid() AND public.is_active_user())
    OR public.is_admin()
  )
  WITH CHECK (
    (owner_id = auth.uid() AND public.is_active_user())
    OR public.is_admin()
  );

-- Only admins can delete reviews
CREATE POLICY "reviews_delete_admin"
  ON public.reviews
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 8. DISPUTES Policies

-- Involved parties and admins can view disputes
CREATE POLICY "disputes_select_parties_or_admin"
  ON public.disputes
  FOR SELECT
  TO authenticated
  USING (
    opened_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = disputes.booking_id
        AND (b.owner_id = auth.uid() OR b.renter_id = auth.uid())
    )
    OR public.is_admin()
  );

-- Renters or owners involved in a booking can open a dispute
CREATE POLICY "disputes_insert_involved_party"
  ON public.disputes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    opened_by = auth.uid()
    AND public.is_active_user()
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = disputes.booking_id
        AND (b.owner_id = auth.uid() OR b.renter_id = auth.uid())
    )
  );

-- Only admins can resolve and update disputes
CREATE POLICY "disputes_update_admin"
  ON public.disputes
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 9. ANNOUNCEMENTS Policies

-- Active announcements are visible to everyone; admins can see all
CREATE POLICY "announcements_select_active"
  ON public.announcements
  FOR SELECT
  USING (active = true OR public.is_admin());

-- Admin-only write access for announcements
CREATE POLICY "announcements_insert_admin"
  ON public.announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "announcements_update_admin"
  ON public.announcements
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "announcements_delete_admin"
  ON public.announcements
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
