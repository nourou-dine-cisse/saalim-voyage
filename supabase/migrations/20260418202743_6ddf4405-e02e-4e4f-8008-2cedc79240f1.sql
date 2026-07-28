
CREATE TYPE public.service_type AS ENUM ('omra_full', 'hajj_full', 'visa_only', 'flight_only', 'tontine', 'custom');
CREATE TYPE public.registration_status AS ENUM ('new', 'contacted', 'confirmed', 'cancelled');

CREATE TABLE public.registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  country text,
  city text,
  service_type public.service_type NOT NULL DEFAULT 'omra_full',
  preferred_month text,
  departure_date date,
  passport_valid_6_months boolean NOT NULL DEFAULT false,
  notes text,
  language text NOT NULL DEFAULT 'fr',
  status public.registration_status NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a registration"
  ON public.registrations FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text,
  message text NOT NULL,
  language text NOT NULL DEFAULT 'fr',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a contact message"
  ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a review"
  ON public.reviews FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can read approved reviews"
  ON public.reviews FOR SELECT TO anon, authenticated USING (approved = true);

CREATE INDEX idx_registrations_created_at ON public.registrations(created_at DESC);
CREATE INDEX idx_contact_messages_created_at ON public.contact_messages(created_at DESC);
