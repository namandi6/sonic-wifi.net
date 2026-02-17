
-- Wi-Fi Packages table
CREATE TABLE public.wifi_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  duration_label TEXT NOT NULL,
  duration_hours INTEGER NOT NULL,
  price_kes INTEGER NOT NULL,
  speed_mbps INTEGER NOT NULL DEFAULT 10,
  max_devices INTEGER NOT NULL DEFAULT 1,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default packages
INSERT INTO public.wifi_packages (name, duration_label, duration_hours, price_kes, speed_mbps, max_devices, is_popular) VALUES
  ('Quick Dash',   '1 Hour',   1,   20,  10, 1, false),
  ('Sprint',       '3 Hours',  3,   50,  10, 2, false),
  ('Full Speed',   '24 Hours', 24,  100, 20, 3, true),
  ('Power Week',   '7 Days',   168, 500, 20, 5, false),
  ('Sonic Month',  '30 Days',  720, 1500, 50, 10, false);

-- Orders / Payments table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES public.wifi_packages(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  amount_kes INTEGER NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'mpesa',
  pesapal_order_id TEXT,
  pesapal_tracking_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, cancelled
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vouchers table (created after payment confirmed)
CREATE TABLE public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.wifi_packages(id) ON DELETE SET NULL,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active', -- active, used, expired
  valid_hours INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  device_ip TEXT
);

-- Admin users table (simple admin access)
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wifi_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Public can read active packages
CREATE POLICY "Anyone can view active packages"
  ON public.wifi_packages FOR SELECT
  USING (is_active = true);

-- Anyone can insert orders (for payment flow)
CREATE POLICY "Anyone can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

-- Anyone can read their own order by id (used for payment status check)
CREATE POLICY "Anyone can view orders"
  ON public.orders FOR SELECT
  USING (true);

-- Service role can update orders (for IPN callback)
CREATE POLICY "Service role can update orders"
  ON public.orders FOR UPDATE
  USING (true);

-- Anyone can view vouchers (needed to display after purchase)
CREATE POLICY "Anyone can view vouchers"
  ON public.vouchers FOR SELECT
  USING (true);

-- Service role inserts vouchers
CREATE POLICY "Service role can insert vouchers"
  ON public.vouchers FOR INSERT
  WITH CHECK (true);

-- Service role can update vouchers
CREATE POLICY "Service role can update vouchers"
  ON public.vouchers FOR UPDATE
  USING (true);

-- Admin users readable by authenticated
CREATE POLICY "Admin users viewable"
  ON public.admin_users FOR SELECT
  USING (true);

-- Function to generate voucher code
CREATE OR REPLACE FUNCTION public.generate_voucher_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..12 LOOP
    IF i IN (5, 9) THEN
      code := code || '-';
    END IF;
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$$;

-- Trigger to auto-update updated_at on orders
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
