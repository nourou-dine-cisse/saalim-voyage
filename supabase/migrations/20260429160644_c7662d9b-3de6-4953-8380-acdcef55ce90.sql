
-- 1. Rôles admin (pattern sécurisé)
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Demandes de visa
CREATE TABLE public.visa_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  passport_path TEXT,
  passport_valid_6_months BOOLEAN NOT NULL DEFAULT false,
  desired_departure_date DATE NOT NULL,
  notes TEXT,
  language TEXT NOT NULL DEFAULT 'fr',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  payment_method TEXT,
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.visa_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a visa request"
ON public.visa_requests FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view all visa requests"
ON public.visa_requests FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update visa requests"
ON public.visa_requests FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Paiements liés aux inscriptions
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES public.registrations(id) ON DELETE SET NULL,
  visa_request_id UUID REFERENCES public.visa_requests(id) ON DELETE SET NULL,
  payer_name TEXT NOT NULL,
  payer_phone TEXT NOT NULL,
  amount NUMERIC(12,2),
  currency TEXT NOT NULL DEFAULT 'XOF',
  method TEXT NOT NULL, -- 'wave', 'orange_money', 'cash', 'other'
  installment_type TEXT NOT NULL DEFAULT 'full', -- 'full' or 'installment'
  reference TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, rejected
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can declare a payment"
ON public.payments FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view all payments"
ON public.payments FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update payments"
ON public.payments FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Étendre registrations : passeport + paiement + admin SELECT/UPDATE
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS passport_path TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid';

CREATE POLICY "Admins can view registrations"
ON public.registrations FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update registrations"
ON public.registrations FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Étendre reviews : période voyage + lecture admin (en plus des approuvés)
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS travel_period TEXT,
  ADD COLUMN IF NOT EXISTS service_type TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;

CREATE POLICY "Admins can view all reviews"
ON public.reviews FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reviews"
ON public.reviews FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete reviews"
ON public.reviews FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Contact messages : permettre admin SELECT
CREATE POLICY "Admins can view contact messages"
ON public.contact_messages FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Storage bucket privé pour passeports
INSERT INTO storage.buckets (id, name, public)
VALUES ('passports', 'passports', false)
ON CONFLICT (id) DO NOTHING;

-- Anyone can upload a passport (file must be in path with random uuid)
CREATE POLICY "Anyone can upload a passport"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'passports');

-- Only admins can read passports
CREATE POLICY "Admins can view passports"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'passports' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete passports"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'passports' AND public.has_role(auth.uid(), 'admin'));
