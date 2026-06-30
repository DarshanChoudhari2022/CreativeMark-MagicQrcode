-- Production hardening for Smart Tap Rewards.
-- Staff PIN hashes live in an owner-only table. Customer stamp cards are written only by Edge Functions.

CREATE TABLE IF NOT EXISTS public.smart_tap_reward_settings (
  campaign_id UUID PRIMARY KEY REFERENCES public.campaigns(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_title TEXT NOT NULL DEFAULT '10% off on your next visit',
  stamps_required INTEGER NOT NULL DEFAULT 10 CHECK (stamps_required BETWEEN 1 AND 20),
  staff_pin_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.smart_tap_reward_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reward settings" ON public.smart_tap_reward_settings;
DROP POLICY IF EXISTS "Users can insert own reward settings" ON public.smart_tap_reward_settings;
DROP POLICY IF EXISTS "Users can update own reward settings" ON public.smart_tap_reward_settings;

CREATE POLICY "Users can view own reward settings"
  ON public.smart_tap_reward_settings
  FOR SELECT
  USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1
      FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can insert own reward settings"
  ON public.smart_tap_reward_settings
  FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1
      FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can update own reward settings"
  ON public.smart_tap_reward_settings
  FOR UPDATE
  USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1
      FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1
      FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('admin', 'super_admin')
    )
  );

-- Lock down older permissive policies from the first draft migration.
DROP POLICY IF EXISTS "Public can load stamp cards by campaign" ON public.smart_tap_loyalty_cards;
DROP POLICY IF EXISTS "Public can create stamp cards" ON public.smart_tap_loyalty_cards;
DROP POLICY IF EXISTS "Public can update stamp cards" ON public.smart_tap_loyalty_cards;

DROP POLICY IF EXISTS "Campaign owners can view loyalty cards" ON public.smart_tap_loyalty_cards;

CREATE POLICY "Campaign owners can view loyalty cards"
  ON public.smart_tap_loyalty_cards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.campaigns
      WHERE campaigns.id = smart_tap_loyalty_cards.campaign_id
      AND (
        campaigns.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.admin_users
          WHERE admin_users.user_id = auth.uid()
          AND admin_users.role IN ('admin', 'super_admin')
        )
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_smart_tap_reward_settings_owner_id
  ON public.smart_tap_reward_settings(owner_id);
