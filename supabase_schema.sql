-- ====================================================================
-- SUPABASE POSTGRESQL SCHEMA FOR BAYZID TELECOM
-- Place this code in your Supabase SQL Editor and execute it.
-- ====================================================================

-- 1. Create Profile Table linked to Supabase Auth Users
CREATE TABLE IF NOT EXISTS public.users_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    balance NUMERIC NOT NULL DEFAULT 0,
    level TEXT NOT NULL DEFAULT 'Retailer', -- Distributor, Dealer, Retailer
    pin TEXT NOT NULL DEFAULT '1234',
    password TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    role TEXT NOT NULL DEFAULT 'user', -- user, admin
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create Drive Offers Table
CREATE TABLE IF NOT EXISTS public.drive_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator TEXT NOT NULL, -- GP, Robi, Airtel, Banglalink, Teletalk
    title TEXT NOT NULL,
    offer_price NUMERIC NOT NULL,
    regular_price NUMERIC NOT NULL,
    validity TEXT NOT NULL,
    is_live BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create Deposits/Add Balance Table
CREATE TABLE IF NOT EXISTS public.deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL, -- bKash, Nagad, Rocket
    amount NUMERIC NOT NULL,
    sender_number TEXT NOT NULL,
    transaction_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Approved, Rejected
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
    offer_id UUID NOT NULL REFERENCES public.drive_offers(id) ON DELETE CASCADE,
    target_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Successful, Refunded
    amount_paid NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create App Settings Table
CREATE TABLE IF NOT EXISTS public.app_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    telecom_name TEXT NOT NULL DEFAULT 'Bayzid Telecom',
    running_notice TEXT NOT NULL DEFAULT 'বিসমিল্লাহির রহমানির রহিম। আল্লাহ ভরসা। বায়জিদ টেলিকম-এ আপনাকে স্বাগতম! সততা আমাদের পথ, সেবা আমাদের লক্ষ্য। আমাদের সকল ড্রাইভ প্যাক চালু আছে। যেকোনো প্রয়োজনে সরাসরি আমাদের হোয়াটসঅ্যাপ হেল্পলাইনে যোগাযোগ করুন।',
    bkash_no TEXT NOT NULL DEFAULT '01601202721',
    nagad_no TEXT NOT NULL DEFAULT '01601202721',
    rocket_no TEXT NOT NULL DEFAULT '01601202721',
    whatsapp_link TEXT NOT NULL DEFAULT 'https://wa.me/8801601202721',
    telegram_link TEXT NOT NULL DEFAULT 'https://t.me/bayzidtelecom_bd',
    facebook_link TEXT NOT NULL DEFAULT 'https://facebook.com/bayzidtelecom',
    youtube_link TEXT NOT NULL DEFAULT 'https://youtube.com/c/bayzidtelecom'
);

-- Seed Initial App Settings
INSERT INTO public.app_settings (id, telecom_name)
VALUES (1, 'Bayzid Telecom')
ON CONFLICT (id) DO NOTHING;

-- Seed default offers for test
INSERT INTO public.drive_offers (operator, title, offer_price, regular_price, validity, is_live)
VALUES 
('GP', 'GP 40GB + 800 Minute (30 Days) - Direct Pack', 499, 799, '30 Days', true),
('Robi', 'Robi 50GB Internet (30 Days) - Full BD', 360, 549, '30 Days', true),
('Airtel', 'Airtel 35GB + 700 Min Family Pack', 315, 499, '30 Days', true),
('Banglalink', 'BL 25GB + 500 Min Unlimited Validity', 285, 399, '30 Days', true)
ON CONFLICT DO NOTHING;


-- ====================================================================
-- AUTOMATIC AUTH PROFILE TRIGGER
-- Creates a users_profile when a user registers in Supabase Auth
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users_profile (id, email, balance, level, pin, password, status, role)
    VALUES (
        new.id,
        new.email,
        0,
        'Retailer',
        '1234',
        COALESCE(new.raw_user_meta_data->>'password', 'Bayzid@#2023'),
        'Active',
        CASE WHEN new.email = 'bayzidtelecom1@gmail.com' THEN 'admin' ELSE 'user' END
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ====================================================================
-- TRANSACTIONAL DATABASE RPC FUNCTIONS
-- ====================================================================

-- 1. Atomic Offer Purchase
CREATE OR REPLACE FUNCTION public.purchase_offer(
    p_user_id UUID,
    p_offer_id UUID,
    p_target_number TEXT,
    p_price NUMERIC
)
RETURNS UUID AS $$
DECLARE
    v_balance NUMERIC;
    v_order_id UUID;
BEGIN
    -- Select user profile for update to lock the row
    SELECT balance INTO v_balance FROM public.users_profile WHERE id = p_user_id FOR UPDATE;
    
    IF v_balance IS NULL THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;
    
    IF v_balance < p_price THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;
    
    -- Deduct balance
    UPDATE public.users_profile
    SET balance = balance - p_price
    WHERE id = p_user_id;
    
    -- Create order
    INSERT INTO public.orders (user_id, offer_id, target_number, status, amount_paid)
    VALUES (p_user_id, p_offer_id, p_target_number, 'Pending', p_price)
    RETURNING id INTO v_order_id;
    
    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Atomic Order Refund
CREATE OR REPLACE FUNCTION public.refund_order(
    p_order_id UUID,
    p_refund_amount NUMERIC
)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_status TEXT;
BEGIN
    -- Select order details for update
    SELECT user_id, status INTO v_user_id, v_status FROM public.orders WHERE id = p_order_id FOR UPDATE;
    
    IF v_status <> 'Pending' THEN
        RAISE EXCEPTION 'Order is not in pending status';
    END IF;
    
    -- Update order status to refunded
    UPDATE public.orders
    SET status = 'Refunded'
    WHERE id = p_order_id;
    
    -- Refund user balance
    UPDATE public.users_profile
    SET balance = balance + p_refund_amount
    WHERE id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Atomic Deposit Approval
CREATE OR REPLACE FUNCTION public.approve_deposit(
    p_deposit_id UUID,
    p_amount NUMERIC
)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_status TEXT;
BEGIN
    -- Select deposit details for update
    SELECT user_id, status INTO v_user_id, v_status FROM public.deposits WHERE id = p_deposit_id FOR UPDATE;
    
    IF v_status <> 'Pending' THEN
        RAISE EXCEPTION 'Deposit is not in pending status';
    END IF;
    
    -- Update status to approved
    UPDATE public.deposits
    SET status = 'Approved'
    WHERE id = p_deposit_id;
    
    -- Increment user balance
    UPDATE public.users_profile
    SET balance = balance + p_amount
    WHERE id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drive_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 1. App Settings Policies
CREATE POLICY "Allow public read access to app settings" 
    ON public.app_settings FOR SELECT USING (true);

CREATE POLICY "Allow admins full control on app settings" 
    ON public.app_settings FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.users_profile WHERE id = auth.uid() AND role = 'admin'));

-- 2. Drive Offers Policies
CREATE POLICY "Allow public read access to drive offers" 
    ON public.drive_offers FOR SELECT USING (true);

CREATE POLICY "Allow admins full control on drive offers" 
    ON public.drive_offers FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.users_profile WHERE id = auth.uid() AND role = 'admin'));

-- 3. Users Profile Policies
CREATE POLICY "Allow users to view their own profile" 
    ON public.users_profile FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile" 
    ON public.users_profile FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow admins full control on profiles" 
    ON public.users_profile FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.users_profile WHERE id = auth.uid() AND role = 'admin'));

-- 4. Deposits Policies
CREATE POLICY "Allow users to view their own deposits" 
    ON public.deposits FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own deposits" 
    ON public.deposits FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow admins full control on deposits" 
    ON public.deposits FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.users_profile WHERE id = auth.uid() AND role = 'admin'));

-- 5. Orders Policies
CREATE POLICY "Allow users to view their own orders" 
    ON public.orders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own orders" 
    ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow admins full control on orders" 
    ON public.orders FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.users_profile WHERE id = auth.uid() AND role = 'admin'));
