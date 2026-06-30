-- Smart Tap Rewards stamp cards.
-- Customers identify a card by mobile number; staff PIN verification happens in the QR landing flow.
CREATE TABLE IF NOT EXISTS public.smart_tap_loyalty_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  customer_key TEXT NOT NULL,
  stamp_count INTEGER NOT NULL DEFAULT 0,
  reward_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  last_stamp_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(campaign_id, customer_key)
);

ALTER TABLE public.smart_tap_loyalty_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can load stamp cards by campaign"
  ON public.smart_tap_loyalty_cards
  FOR SELECT
  USING (true);

CREATE POLICY "Public can create stamp cards"
  ON public.smart_tap_loyalty_cards
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update stamp cards"
  ON public.smart_tap_loyalty_cards
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_smart_tap_loyalty_cards_campaign_id
  ON public.smart_tap_loyalty_cards(campaign_id);

CREATE INDEX IF NOT EXISTS idx_smart_tap_loyalty_cards_customer_key
  ON public.smart_tap_loyalty_cards(customer_key);
