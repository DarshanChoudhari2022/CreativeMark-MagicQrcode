-- Store optional combined services selected during QR campaign creation.
CREATE TABLE IF NOT EXISTS public.campaign_service_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_services TEXT[] NOT NULL DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'requested',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.campaign_service_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own service bundles"
  ON public.campaign_service_bundles
  FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create own service bundles"
  ON public.campaign_service_bundles
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own service bundles"
  ON public.campaign_service_bundles
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_campaign_service_bundles_campaign_id
  ON public.campaign_service_bundles(campaign_id);

CREATE INDEX IF NOT EXISTS idx_campaign_service_bundles_owner_id
  ON public.campaign_service_bundles(owner_id);
