import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignId, businessName, customPrompt, businessCategory, rating = 5 } = await req.json();
    console.log("Generating review ideas for campaign:", campaignId);
    const uniquenessSeed = `${Date.now()}-${crypto.randomUUID()}`;
    const ratingTone = rating >= 5
      ? "5-star: clearly positive but not exaggerated."
      : rating === 4
        ? "4-star: mostly positive with one small constructive caveat."
        : rating === 3
          ? "3-star: mixed and fair, with one good point and one improvement."
          : rating === 2
            ? "2-star: disappointed but respectful and constructive."
            : "1-star: negative but calm, factual, and respectful.";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You help customers create short editable Google Maps review ideas for ${businessName}${businessCategory ? `, a ${businessCategory}` : ""}.

Unique request seed: ${uniquenessSeed}
Customer selected rating: ${rating}/5
Rating tone: ${ratingTone}

Guidelines:
- The customer must edit the idea in their own words before posting.
- The idea must be based only on a genuine customer experience.
- Do not invent facts, menu items, staff names, offers, prices, or visit details.
- Do not ask for a specific rating or only positive content.
- Do not include incentives, discounts, rewards, links, hashtags, or promotional language.
- Keep each idea between 12 and 35 words.
- Mix generic experience angles with allowed specific details when context is provided.
- Avoid repetitive content: every line must use a different opening, sentence structure, topic angle, and wording.
- Do not reuse common template phrases across lines such as "good overall experience", "nice experience overall", or "staff were polite" more than once.
- Create this batch as if it is for a new customer session. Do not copy or closely paraphrase examples from previous generations.
- Avoid SEO language and exaggerated phrases like "highly recommended", "must visit", "top-notch", "hidden gem", or "best ever".
${customPrompt ? `\nAdditional context: ${customPrompt}` : ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }],
        temperature: 0.75,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const suggestion = data.choices[0].message.content;

    console.log("Review idea generated successfully");

    return new Response(
      JSON.stringify({ suggestion }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-review-suggestion:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate review suggestion" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
