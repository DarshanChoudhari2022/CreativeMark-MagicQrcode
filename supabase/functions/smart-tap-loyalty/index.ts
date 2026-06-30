import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type LoyaltyRequest = {
  action: "load" | "add_stamp";
  campaignId: string;
  customerPhone: string;
  staffPin?: string;
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const sha256 = async (value: string) => {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const normalizePhone = (value: string) => value.replace(/\D/g, "").slice(-10);
const normalizePin = (value: string) => value.replace(/\D/g, "").slice(0, 6);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = (await req.json()) as LoyaltyRequest;
    const campaignId = String(body.campaignId || "");
    const customerPhone = normalizePhone(String(body.customerPhone || ""));

    if (!crypto.randomUUID || !campaignId) {
      return jsonResponse({ error: "Missing campaign id" }, 400);
    }

    if (customerPhone.length < 6) {
      return jsonResponse({ error: "Valid customer mobile number is required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Server is not configured for loyalty verification" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("id, status")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign || campaign.status !== "active") {
      return jsonResponse({ error: "Campaign is not active" }, 404);
    }

    const { data: settings, error: settingsError } = await supabase
      .from("smart_tap_reward_settings")
      .select("reward_title, stamps_required, staff_pin_hash")
      .eq("campaign_id", campaignId)
      .single();

    if (settingsError || !settings) {
      return jsonResponse({ error: "Smart Tap Rewards is not configured for this campaign" }, 404);
    }

    const customerKey = await sha256(`${campaignId}:${customerPhone}`);
    const { data: existingCard, error: cardLoadError } = await supabase
      .from("smart_tap_loyalty_cards")
      .select("id, stamp_count, reward_claimed, last_stamp_at")
      .eq("campaign_id", campaignId)
      .eq("customer_key", customerKey)
      .maybeSingle();

    if (cardLoadError) throw cardLoadError;

    if (body.action === "load") {
      return jsonResponse({
        stampCount: existingCard?.stamp_count || 0,
        rewardClaimed: Boolean(existingCard?.reward_claimed),
        rewardTitle: settings.reward_title,
        stampsRequired: settings.stamps_required,
        customerLast4: customerPhone.slice(-4),
      });
    }

    if (body.action !== "add_stamp") {
      return jsonResponse({ error: "Unsupported loyalty action" }, 400);
    }

    const staffPin = normalizePin(String(body.staffPin || ""));
    if (staffPin.length < 4) {
      return jsonResponse({ error: "Staff PIN is required" }, 400);
    }

    const submittedPinHash = await sha256(`${campaignId}:${staffPin}`);
    if (submittedPinHash !== settings.staff_pin_hash) {
      return jsonResponse({ error: "Staff PIN did not match. Stamp was not added." }, 403);
    }

    const previousStampCount = Number(existingCard?.stamp_count || 0);
    const nextStampCount = Math.min(previousStampCount + 1, Number(settings.stamps_required));
    const now = new Date().toISOString();

    if (existingCard?.id) {
      const { error: updateError } = await supabase
        .from("smart_tap_loyalty_cards")
        .update({
          stamp_count: nextStampCount,
          last_stamp_at: now,
          reward_claimed: existingCard.reward_claimed,
          updated_at: now,
        })
        .eq("id", existingCard.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from("smart_tap_loyalty_cards")
        .insert([{
          campaign_id: campaignId,
          customer_key: customerKey,
          stamp_count: nextStampCount,
          reward_claimed: false,
          last_stamp_at: now,
          updated_at: now,
        }]);
      if (insertError) throw insertError;
    }

    await supabase
      .from("analytics_logs")
      .insert([{
        campaign_id: campaignId,
        event_type: "loyalty_stamp",
        metadata: {
          customerLast4: customerPhone.slice(-4),
          stamps: nextStampCount,
        },
      }])
      .then(() => undefined);

    return jsonResponse({
      stampCount: nextStampCount,
      rewardClaimed: false,
      rewardReady: nextStampCount >= Number(settings.stamps_required),
      rewardTitle: settings.reward_title,
      stampsRequired: settings.stamps_required,
      customerLast4: customerPhone.slice(-4),
    });
  } catch (error) {
    console.error("smart-tap-loyalty error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Loyalty verification failed" },
      500,
    );
  }
});
