-- CREATIVE MARK SMART CONNECT QR - Enhanced Production Schema
-- Complete database structure for admin-controlled QR campaign management

-- =====================================================
-- ADMIN USERS TABLE - Control who can create campaigns
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'user', -- 'super_admin', 'admin', 'user'
  can_create_campaigns BOOLEAN DEFAULT FALSE,
  can_manage_users BOOLEAN DEFAULT FALSE,
  max_campaigns INTEGER DEFAULT 0,
  subscription_plan VARCHAR(50) DEFAULT 'free', -- 'free', 'yearly', 'three_year'
  subscription_start DATE,
  subscription_end DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- BUSINESS PROFILES TABLE - Business owner details
-- =====================================================
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  business_category VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  email VARCHAR(255),
  google_review_url TEXT,
  google_place_id VARCHAR(255),
  logo_url TEXT,
  nfc_card_assigned BOOLEAN DEFAULT FALSE,
  nfc_card_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- REVIEW CATEGORIES TABLE - 5 Review Categories
-- =====================================================
CREATE TABLE IF NOT EXISTS public.review_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  category_name VARCHAR(100) NOT NULL,
  category_emoji VARCHAR(10),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- AI REVIEW SUGGESTIONS TABLE - SEO-friendly review lines
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ai_review_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.review_categories(id) ON DELETE SET NULL,
  suggestion_text TEXT NOT NULL,
  seo_keywords TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- COLLECTED REVIEWS TABLE - Track all collected reviews
-- =====================================================
CREATE TABLE IF NOT EXISTS public.collected_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  customer_name VARCHAR(255),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  suggestion_used_id UUID REFERENCES public.ai_review_suggestions(id),
  source VARCHAR(50) DEFAULT 'qr', -- 'qr', 'nfc', 'link'
  google_review_id VARCHAR(255),
  is_posted_to_google BOOLEAN DEFAULT FALSE,
  device_info JSONB,
  ip_hash VARCHAR(64),
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- AI AUTO REPLIES TABLE - Professional auto-responses
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ai_auto_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.collected_reviews(id) ON DELETE CASCADE,
  reply_text TEXT NOT NULL,
  tone VARCHAR(50), -- 'grateful', 'helpful', 'apologetic'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'posted'
  posted_to_google BOOLEAN DEFAULT FALSE,
  posted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- NFC CARDS TABLE - Track NFC card assignments
-- =====================================================
CREATE TABLE IF NOT EXISTS public.nfc_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_uid VARCHAR(100) UNIQUE NOT NULL,
  assigned_to UUID REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  assigned_campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'unassigned', -- 'unassigned', 'assigned', 'shipped', 'active'
  shipping_address TEXT,
  shipped_at TIMESTAMP,
  activated_at TIMESTAMP,
  tap_count INTEGER DEFAULT 0,
  last_tap_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- SUBSCRIPTION ORDERS TABLE - Payment tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subscription_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL, -- 'yearly', 'three_year'
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
  payment_gateway VARCHAR(50),
  payment_id VARCHAR(255),
  payment_date TIMESTAMP,
  includes_nfc_card BOOLEAN DEFAULT TRUE,
  nfc_card_id UUID REFERENCES public.nfc_cards(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- SUPPORT TICKETS TABLE - Call and WhatsApp support
-- =====================================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_method VARCHAR(50), -- 'call', 'whatsapp', 'email'
  contact_number VARCHAR(20),
  subject VARCHAR(255),
  message TEXT,
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  assigned_to UUID REFERENCES public.admin_users(id),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ANALYTICS EVENTS TABLE - Detailed tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'scan', 'tap', 'view', 'click', 'review_started', 'review_posted'
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  city VARCHAR(100),
  country VARCHAR(100),
  referrer TEXT,
  session_id VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- RLS POLICIES - Row Level Security
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_review_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collected_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_auto_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfc_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Admin users policies
CREATE POLICY "Super admins can view all admin_users" ON public.admin_users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Users can view own admin profile" ON public.admin_users
  FOR SELECT USING (user_id = auth.uid());

-- Business profiles policies
CREATE POLICY "Users can view own business profile" ON public.business_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own business profile" ON public.business_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own business profile" ON public.business_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Review categories policies (accessible by business owner)
CREATE POLICY "Users can manage own review categories" ON public.review_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.business_profiles WHERE id = business_id AND user_id = auth.uid())
  );

-- AI suggestions policies
CREATE POLICY "Users can view own AI suggestions" ON public.ai_review_suggestions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.business_profiles WHERE id = business_id AND user_id = auth.uid())
  );

-- Public access for review landing pages (anonymous users can insert reviews)
CREATE POLICY "Anyone can create reviews" ON public.collected_reviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Business owners can view their reviews" ON public.collected_reviews
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.business_profiles WHERE id = business_id AND user_id = auth.uid())
  );

-- Analytics events (public insert for tracking, owner can view)
CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Business owners can view their analytics" ON public.analytics_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.business_profiles WHERE id = business_id AND user_id = auth.uid())
  );

-- =====================================================
-- INDEXES for Performance
-- =====================================================
CREATE INDEX idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX idx_admin_users_role ON public.admin_users(role);
CREATE INDEX idx_business_profiles_user_id ON public.business_profiles(user_id);
CREATE INDEX idx_review_categories_business_id ON public.review_categories(business_id);
CREATE INDEX idx_ai_suggestions_business_id ON public.ai_review_suggestions(business_id);
CREATE INDEX idx_collected_reviews_business_id ON public.collected_reviews(business_id);
CREATE INDEX idx_collected_reviews_campaign_id ON public.collected_reviews(campaign_id);
CREATE INDEX idx_collected_reviews_created_at ON public.collected_reviews(created_at);
CREATE INDEX idx_nfc_cards_card_uid ON public.nfc_cards(card_uid);
CREATE INDEX idx_analytics_events_business_id ON public.analytics_events(business_id);
CREATE INDEX idx_analytics_events_campaign_id ON public.analytics_events(campaign_id);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at);

-- =====================================================
-- FUNCTIONS - Helper functions
-- =====================================================

-- Function to check if user can create campaigns
CREATE OR REPLACE FUNCTION public.can_create_campaign(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = user_uuid
    AND can_create_campaigns = TRUE
    AND (subscription_end IS NULL OR subscription_end >= CURRENT_DATE)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's remaining campaign quota
CREATE OR REPLACE FUNCTION public.get_campaign_quota(user_uuid UUID)
RETURNS TABLE(max_allowed INTEGER, current_count INTEGER, remaining INTEGER) AS $$
DECLARE
  max_campaigns_allowed INTEGER;
  current_campaign_count INTEGER;
BEGIN
  SELECT COALESCE(au.max_campaigns, 0) INTO max_campaigns_allowed
  FROM public.admin_users au
  WHERE au.user_id = user_uuid;
  
  SELECT COUNT(*) INTO current_campaign_count
  FROM public.campaigns
  WHERE owner_id = user_uuid;
  
  RETURN QUERY SELECT 
    max_campaigns_allowed, 
    current_campaign_count, 
    (max_campaigns_allowed - current_campaign_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert default review categories template
INSERT INTO public.review_categories (id, business_id, category_name, category_emoji, display_order)
VALUES 
  (gen_random_uuid(), NULL, 'Service Quality', '⭐', 1),
  (gen_random_uuid(), NULL, 'Staff Behavior', '😊', 2),
  (gen_random_uuid(), NULL, 'Ambiance', '✨', 3),
  (gen_random_uuid(), NULL, 'Value for Money', '💰', 4),
  (gen_random_uuid(), NULL, 'Overall Experience', '🎯', 5)
ON CONFLICT DO NOTHING;
