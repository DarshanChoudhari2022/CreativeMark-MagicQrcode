import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Star, Loader2, ExternalLink, CheckCircle2,
  Sparkles, Copy, RefreshCw, ArrowRight,
  Award, ArrowLeft, HandMetal, Pencil, Check,
  Camera, ImagePlus, Gift, MapPin, Navigation, Trophy
} from "lucide-react";
import { generateReviewSuggestions } from "@/services/gemini";
import { useTranslation } from "react-i18next";
import { COMBINED_SERVICES, normalizeCombinedServices, type CombinedServiceId } from "@/lib/combined-services";


interface Campaign {
  id: string;
  name: string;
  headline: string;
  subheadline: string;
  footer_text: string;
  theme_color: string;
  google_review_url?: string;
  location_id?: string;
  design_metadata?: {
    combinedServices?: string[];
    smartTapRewards?: {
      programName?: string;
      rewardTitle?: string;
      stampsRequired?: number;
      staffPin?: string;
    };
  } | null;
}

interface Location {
  id: string;
  name: string;
  google_review_url: string;
  category: string;
  logo_url: string;
  address: string;
}

const BHAIRAVEE_CAMPAIGN_ID = 'fa6c7c65-777c-4b11-8fb2-113452279fc1';
const BHAIRAVEE_HEADER_LOGO_SRC = '/logo.jpg';

const BHAIRAVEE_MENU_ITEMS = [
  'Patavadi Rassa', 'Fanas Bhaji', 'Kaju Usal', 'Masala Vange', 'Shev Bhaji',
  'Matki Usal', 'Lajit Paneer Biryani', 'Kothimbir Biryani', 'Chaap Biryani',
  'Ambur Biryani', 'Sarangi Ghee Roast Chaap Biryani', 'Malika Dum Biryani',
  'Lucknowi Dum Biryani', 'Bhairavee Special Platter', 'Tender Coconut Tikka',
  'Lemon Paneer Tikka', 'Paneer Cheese Seekh Kebab', 'Paneer Multani',
  'Chef Special Tikka Paneer', 'Paneer Shole Kebab', 'Paneer Rowdy Tikka',
  'Bhairavee Special Veg', 'Tender Coconut and Broccoli Miloni',
  'Veg Seekh Kebab Masala', 'Sag Buruta Masala', 'Cheese Palak Kofta',
  'Paneer Ghee Roast Masala', 'Stuffed Palak Paneer', 'Vilayati Subzi Sagwala',
  'Paneer Tikka', 'Veg Kolhapuri', 'Dal Tadka', 'Butter Roti', 'Jeera Rice'
];

const shuffleTake = <T,>(items: T[], count: number): T[] => {
  return [...items].sort(() => Math.random() - 0.5).slice(0, count);
};

const generateBhairaveeReviewIdeas = (
  businessName: string,
  rating: number,
  count = 8,
  address?: string
): string[] => {
  const loc = address ? ` near ${address}` : "";
  const picked = shuffleTake(BHAIRAVEE_MENU_ITEMS, 8);

  const fourStarIdeas = [
    `Good pure veg food overall. ${picked[0]} tasted nice, though service could be a little quicker during rush time.`,
    `Liked the clean seating and family-friendly feel at ${businessName}. The ${picked[1]} was good, but parking can be a bit tight.`,
    `Nice meal with family at ${businessName}. The taste was good and portions were fair, though the wait felt slightly long.`,
    `${picked[2]} was tasty and fresh. Overall good visit, just wish the service was a little faster when crowded.`,
    `Good vegetarian food and polite staff. The place was comfortable, though a bit crowded when we visited.`,
    `The food quality was nice and the menu has good pure veg options. A little faster billing would make it even better.`,
    `Visited for dinner and enjoyed the taste. ${picked[3]} stood out, while service speed can improve during peak hours.`,
    `Good option for vegetarian food${loc}. The seating was clean, and the food was satisfying overall.`
  ];

  const fiveStarIdeas = [
    `Had a lovely pure veg meal at ${businessName}. The ${picked[0]} was flavourful, fresh, and perfect for a family dinner.`,
    `${businessName} has a warm family restaurant feel. I liked the clean seating, polite staff, and the taste of ${picked[1]}.`,
    `Tried ${picked[2]} and ${picked[3]} here. Both were well prepared, and the overall dining experience felt comfortable.`,
    `A good place for pure veg food${loc}. The food tasted fresh, service was smooth, and the ambience was relaxed.`,
    `Enjoyed the variety on the menu at ${businessName}. ${picked[4]} had a nice flavour, and the staff handled the order well.`,
    `The restaurant felt clean and welcoming. I liked the pure veg options, especially ${picked[5]}, and would visit again.`,
    `Visited with family and had a satisfying meal. The food was tasty, portions were good, and the service was polite.`,
    `${picked[6]} was served nicely and tasted fresh. ${businessName} is a good choice when you want a reliable veg meal.`,
    `The starters and main course both tasted good. ${picked[7]} was memorable, and the restaurant felt comfortable for families.`,
    `Great pure veg restaurant with decent ambience, clean tables, and a menu that has enough variety for everyone.`,
    `Had a smooth dining experience at ${businessName}. The staff were helpful, food arrived properly, and everything tasted fresh.`,
    `Liked the balance of taste and comfort here. It is a nice place for lunch or dinner with family and friends.`
  ];

  return shuffleTake(rating < 5 ? fourStarIdeas : fiveStarIdeas, count);
};

// ─── Component ────────────────────────────────────────────────
const ReviewLanding = () => {
  const { campaignId } = useParams();
  const { toast } = useToast();
  const { t } = useTranslation();
  const isBhairaveeCampaign = campaignId === BHAIRAVEE_CAMPAIGN_ID;

  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [selectedServices, setSelectedServices] = useState<CombinedServiceId[]>([]);
  const [stampCount, setStampCount] = useState(0);
  const [scratchReward, setScratchReward] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string>("Ready to detect branch");
  const [customerPhone, setCustomerPhone] = useState("");
  const [staffPinInput, setStaffPinInput] = useState("");
  const [stampStatus, setStampStatus] = useState("Enter your mobile number to load your stamp card.");
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState<string>("");

  // Star rating selection (customer picks their rating)
  const [selectedRating, setSelectedRating] = useState<number>(5);
  // Photo tip visibility
  const [showPhotoTip, setShowPhotoTip] = useState(false);

  // Prevent double-fetch race conditions
  const fetchIdRef = useRef(0);

  // ─── Load Campaign + Location ───────────────────────────────
  useEffect(() => {
    if (!campaignId) return;

    const load = async () => {
      try {
        const { data: campaignData, error } = await (supabase as any)
          .from('campaigns')
          .select('*')
          .eq('id', campaignId)
          .single();

        if (error) throw error;
        setCampaign(campaignData);

        const metadataServices = normalizeCombinedServices(campaignData?.design_metadata?.combinedServices);
        let activeServices = metadataServices;

        try {
          const { data: bundleData, error: bundleError } = await (supabase as any)
            .from('campaign_service_bundles')
            .select('selected_services')
            .eq('campaign_id', campaignData.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (!bundleError && bundleData?.selected_services) {
            const bundleServices = normalizeCombinedServices(bundleData.selected_services);
            if (bundleServices.length > 0) activeServices = bundleServices;
          }
        } catch (bundleErr) {
          console.warn('Combined services table unavailable, using campaign metadata only.', bundleErr);
        }

        setSelectedServices(activeServices);

        if (campaignData?.location_id) {
          const { data: locationData } = await (supabase as any)
            .from('locations')
            .select('*')
            .eq('id', campaignData.location_id)
            .single();

          if (locationData) setLocation(locationData);
        }
      } catch (err) {
        console.error('Error loading campaign:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
    recordEvent('scan');
  }, [campaignId]);

  useEffect(() => {
    if (!campaignId) return;

    const savedReward = window.localStorage.getItem(`scratch:${campaignId}`);
    setScratchReward(savedReward);
  }, [campaignId]);

  // ─── Fetch AI Suggestions on data ready ─────────────────────
  useEffect(() => {
    const businessName = location?.name || campaign?.name;
    if (businessName) {
      fetchSuggestions(businessName);
    }
  }, [location, campaign]);

  // ─── Fetch compliant review ideas (with timeout + race guard) ──
  const fetchSuggestions = useCallback(async (businessName: string, ratingOverride?: number) => {
    const id = ++fetchIdRef.current;
    const ratingForRequest = ratingOverride ?? selectedRating;
    setLoadingSuggestions(true);
    setSelectedSuggestion(null);
    setCopied(false);
    setEditingIndex(null);

    try {
      const category = location?.category || 'service';

      if (isBhairaveeCampaign) {
        const ideas = generateBhairaveeReviewIdeas(
          businessName,
          ratingForRequest,
          8,
          location?.address
        );

        if (id === fetchIdRef.current) {
          setSuggestions(ideas);
          recordEvent('ai_suggestion', { count: ideas.length, source: 'bhairavee_curated' });
        }
        return;
      }

      const result = await Promise.race([
        generateReviewSuggestions(
          businessName,
          ratingForRequest,
          'en',
          category,
          location?.address || '',
          location?.google_review_url || campaign?.google_review_url || ''
        ),
        // 8-second timeout — if AI is slow, bail out
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI_TIMEOUT')), 8000)
        ),
      ]);

      // Only apply if this is still the latest fetch
      if (id === fetchIdRef.current && result.length > 0) {
        setSuggestions(result.map(s => s.text));
        const source = result.some(s => s.source === 'fallback') ? 'fallback' : 'ai';
        recordEvent('ai_suggestion', { count: result.length, source });
      }
    } catch (err: any) {
      console.warn('AI suggestion failed, using smart defaults:', err.message);

      // Smart fallback — category-specific, no invented claims
      if (id === fetchIdRef.current) {
        const fallbacks = generateLocalFallbacks(businessName, ratingForRequest);
        setSuggestions(fallbacks);
        recordEvent('ai_suggestion', { count: fallbacks.length, source: 'fallback' });
      }
    } finally {
      if (id === fetchIdRef.current) {
        setLoadingSuggestions(false);
      }
    }
  }, [location, campaign, isBhairaveeCampaign]);

  // ─── Local Fallback Generator (zero API, instant, category-aware) ───
  const generateLocalFallbacks = (businessName: string, rating = selectedRating): string[] => {
    const loc = location?.address ? ` near ${location.address}` : "";
    const cat = (location?.category || "").toLowerCase();
    const bhairaveeMenu = [
      'Patavadi Rassa', 'Fanas Bhaji', 'Kaju Usal', 'Masala Vange', 'Shev Bhaji',
      'Matki Usal', 'Lajit Paneer Biryani', 'Kothimbir Biryani', 'Chaap Biryani',
      'Ambur Biryani', 'Sarangi Ghee Roast Chaap Biryani', 'Malika Dum Biryani',
      'Lucknowi Dum Biryani', 'Bhairavee Special Platter', 'Tender Coconut Tikka',
      'Lemon Paneer Tikka', 'Paneer Cheese Seekh Kebab', 'Paneer Multani',
      'Chef Special Tikka Paneer', 'Paneer Shole Kebab', 'Paneer Rowdy Tikka',
      'Bhairavee Special Veg', 'Tender Coconut and Broccoli Miloni',
      'Veg Seekh Kebab Masala', 'Sag Buruta Masala', 'Cheese Palak Kofta',
      'Paneer Ghee Roast Masala', 'Stuffed Palak Paneer', 'Vilayati Subzi Sagwala'
    ];

    if (`${businessName} ${cat}`.toLowerCase().includes('bhairavee')) {
      const picked = bhairaveeMenu.sort(() => Math.random() - 0.5).slice(0, 5);
      if (rating === 4) {
        return [
          `Good pure veg food overall. ${picked[0]} tasted nice, though service could be a little quicker during rush time.`,
          `Liked the food and clean seating at ${businessName}. The ${picked[1]} was good, but parking can be a bit tight.`,
          `Nice meal with family. The taste was good and portions were fair, though the wait felt slightly long.`,
          `${picked[2]} was tasty and fresh. Overall good visit, just wish the service was a little faster.`,
          `Good vegetarian food and polite staff. The place was comfortable, though a bit crowded when we visited.`,
        ].sort(() => Math.random() - 0.5).slice(0, 5);
      }
      return [
        `Good food and clean place. The service was polite, and the overall experience at ${businessName} felt comfortable.`,
        `Tried ${picked[0]} here and liked the taste. The food felt fresh and the visit was pleasant overall.`,
        `${businessName} is nice for a pure veg meal. Simple, tasty food and a comfortable family-friendly atmosphere.`,
        `The ${picked[1]} was good, and the portion felt satisfying. Service was smooth during my visit.`,
        `Nice place for vegetarian food${loc}. I liked the taste, seating, and the way the staff handled the order.`,
        `Had a good meal here with family. The food was tasty, the place was clean, and the service was decent.`,
        `Tried ${picked[2]} and enjoyed the flavour. Good option when you want pure veg food.`,
        `The starters were served well and tasted fresh. ${picked[3]} stood out for me.`,
        `Comfortable place for lunch or dinner. The food was flavourful without feeling too heavy.`,
        `${picked[4]} had a nice taste, and the staff handled the order properly.`,
        `Good pure veg restaurant with decent service. I liked the food quality and overall cleanliness.`,
        `Visited for a quick meal and had a smooth experience. Food came nicely prepared and tasted good.`,
      ].sort(() => Math.random() - 0.5).slice(0, 5);
    }

    // Category-specific review ideas. Customers should edit these in their own words.
    const categoryReviews: Record<string, string[]> = {
      restaurant: [
        ...(rating === 4 ? [
          `Good food overall. The place was clean and comfortable, though service could be a little quicker during rush time.`,
          `Taste and portions were nice. A small improvement in waiting time would make the experience even better.`,
          `Had a good meal here with family. Food was tasty, but the place felt slightly crowded when we visited.`,
          `Nice restaurant for a casual meal. Staff were polite, though the order took a little time.`,
          `Good experience overall. Food was fresh and seating was comfortable, with a little room to improve speed.`,
        ] : [
          `Good food and polite service. The place felt clean, and the overall meal experience was comfortable.`,
          `Visited ${businessName}${loc} for a meal. Taste was good, portions felt fair, and service was smooth.`,
          `Nice place for a casual meal. The food was fresh, seating was comfortable, and staff were helpful.`,
          `Had food here with family. The taste was good and the place felt comfortable for a relaxed meal.`,
          `Decent food, clean place, and quick service. A good option when you want a simple meal outside.`,
        ]),
      ],
      salon: [
        `Got a haircut at ${businessName} yesterday. The stylist actually listened to what I wanted instead of doing their own thing. Really happy with how it turned out.`,
        `Clean salon, good products, and the staff doesn't rush you. Prices are fair for the quality${loc}.`,
        `Been going to ${businessName} for about 6 months now. Consistent quality every time. My go-to place for grooming.`,
        `The facial I got here was really relaxing. Skin felt great the next day too. Will def book again.`,
        `Walked in without appointment and they still took me in. Friendly team, neat work. Took maybe 30 mins total.`,
        `${businessName}${loc} does good work. I was nervous about trying a new salon but the stylist was skilled and patient.`,
        `Brought my mom here for a hair treatment. She loved it. The place is well-maintained and hygienic.`,
      ],
      clinic: [
        `Dr. at ${businessName} was very thorough with the checkup. Didn't rush at all, explained everything clearly.`,
        `Clean clinic, minimal wait time. The receptionist was helpful with the appointment booking${loc}.`,
        `Visited ${businessName} for a dental issue. Treatment was painless and the doctor was very reassuring. Good experience overall.`,
        `The staff here is genuinely caring. Follow-up calls after the visit was a nice touch.`,
        `${businessName}${loc} is well-equipped and the doctors take time with each patient. Not like those rushed 2-min consultations elsewhere.`,
        `Brought my kid here for a checkup. The doc was great with children, made the whole experience stress-free.`,
        `Reasonable consultation fee for the quality of care. The pharmacy inside is convenient too.`,
      ],
      gym: [
        `Joined ${businessName} two months ago. Good equipment, trainers actually correct your form. Worth the membership.`,
        `Clean gym with proper ventilation${loc}. Not too crowded in the mornings which I appreciate.`,
        `The trainer at ${businessName} made a custom plan for me based on my goals. Lost 4 kgs in the first month. Solid place.`,
        `Been trying different gyms and this one has the best vibe. People are friendly, no ego lifting nonsense.`,
        `${businessName} has everything I need — good machines, clean washrooms, and flexible timings. No complaints.`,
        `Started going here after a friend recommended it. The trial session convinced me to sign up.`,
      ],
      pet: [
        ...(rating === 4 ? [
          `Good pet care experience overall. The place felt safe and clean, though updates could be a little more frequent.`,
          `My pet seemed comfortable here. Staff were polite, but the drop-off process could be slightly quicker.`,
          `Nice daycare setup and caring staff. A little more communication during the stay would make it even better.`,
          `Good option for boarding or daycare. The space looked maintained, though pickup timing could be smoother.`,
          `Overall good care and a clean setup. I would just like slightly clearer updates during longer stays.`,
        ] : [
          `Good place for pet care. The staff seemed attentive, and the space felt clean and safe.`,
          `Left my pet here and the experience was smooth. The team handled things calmly and responsibly.`,
          `${businessName} felt comfortable for pet daycare. Clean setup, polite staff, and good overall care.`,
          `Nice experience with the pet boarding service. The place looked maintained and the staff were responsive.`,
          `My pet seemed comfortable after the visit. The team was polite and the process was simple.`,
          `Good option for daycare or boarding when you need someone reliable to look after your pet.`,
        ]),
      ],
      dog: [
        ...(rating === 4 ? [
          `Good pet care experience overall. The place felt safe and clean, though updates could be a little more frequent.`,
          `My pet seemed comfortable here. Staff were polite, but the drop-off process could be slightly quicker.`,
          `Nice daycare setup and caring staff. A little more communication during the stay would make it even better.`,
          `Good option for boarding or daycare. The space looked maintained, though pickup timing could be smoother.`,
          `Overall good care and a clean setup. I would just like slightly clearer updates during longer stays.`,
        ] : [
          `Good place for pet care. The staff seemed attentive, and the space felt clean and safe.`,
          `Left my pet here and the experience was smooth. The team handled things calmly and responsibly.`,
          `${businessName} felt comfortable for pet daycare. Clean setup, polite staff, and good overall care.`,
          `Nice experience with the pet boarding service. The place looked maintained and the staff were responsive.`,
          `My pet seemed comfortable after the visit. The team was polite and the process was simple.`,
          `Good option for daycare or boarding when you need someone reliable to look after your pet.`,
        ]),
      ],
      daycare: [
        ...(rating === 4 ? [
          `Good pet care experience overall. The place felt safe and clean, though updates could be a little more frequent.`,
          `My pet seemed comfortable here. Staff were polite, but the drop-off process could be slightly quicker.`,
          `Nice daycare setup and caring staff. A little more communication during the stay would make it even better.`,
          `Good option for boarding or daycare. The space looked maintained, though pickup timing could be smoother.`,
          `Overall good care and a clean setup. I would just like slightly clearer updates during longer stays.`,
        ] : [
          `Good place for pet care. The staff seemed attentive, and the space felt clean and safe.`,
          `Left my pet here and the experience was smooth. The team handled things calmly and responsibly.`,
          `${businessName} felt comfortable for pet daycare. Clean setup, polite staff, and good overall care.`,
          `Nice experience with the pet boarding service. The place looked maintained and the staff were responsive.`,
          `My pet seemed comfortable after the visit. The team was polite and the process was simple.`,
          `Good option for daycare or boarding when you need someone reliable to look after your pet.`,
        ]),
      ],
      garage: [
        ...(rating === 4 ? [
          `Good service overall. The repair work was handled properly, though the waiting time could be improved.`,
          `The issue was explained clearly and the work was neat. A little faster delivery would make it better.`,
          `Helpful team and fair service. The process was smooth, though updates during the job could improve.`,
          `Good garage experience. Staff handled the vehicle carefully, but timing could be a bit more predictable.`,
          `The service quality was good. A clearer estimate of completion time would make the experience smoother.`,
        ] : [
          `Good service experience. The issue was explained clearly, and the work was handled properly.`,
          `Visited ${businessName}${loc} for vehicle service. Staff were polite and the process was smooth.`,
          `The repair work was done neatly, and the pricing felt fair for the service provided.`,
          `Good garage experience overall. They checked the problem properly and explained what needed to be done.`,
          `Service was completed on time, and the staff handled the vehicle carefully.`,
          `Helpful team and clear communication. The visit felt straightforward without unnecessary confusion.`,
        ]),
      ],
      shop: [
        `Good selection and fair prices at ${businessName}${loc}. The owner helped me pick the right product for my budget.`,
        `Bought a few things from here last week. Quality was good and they even offered home delivery.`,
        `${businessName} has become my regular shop. They stock genuine products and don't overprice anything.`,
        `Went in just to browse but the staff was so helpful I ended up buying. No pushy sales tactics.`,
        `Decent shop with good variety. The billing was quick and they packed everything neatly.`,
        `Compared prices with online and ${businessName} was actually cheaper for the same brand. Plus you can see the product before buying.`,
      ],
    };

    // Generic pool — used when category doesn't match or is empty
    const genericReviews = [
      `Good overall experience at ${businessName}. The staff were polite and the visit went smoothly.`,
      `Visited ${businessName}${loc} recently. Clean place, decent service, and everything was handled properly.`,
      `The team was helpful and the experience felt smooth. I liked that they did not rush the process.`,
      `Nice experience overall. The place was clean, pricing felt fair, and the staff were easy to talk to.`,
      `${businessName} handled my visit well. I would come back based on the service and overall experience.`,
    ];

    // Pick the right pool based on category keywords
    let pool = genericReviews;
    for (const [key, reviews] of Object.entries(categoryReviews)) {
      if (cat.includes(key)) {
        pool = reviews;
        break;
      }
    }

    // Shuffle and pick 5
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 5);
  };

  // ─── Handle Tap on a Suggestion ─────────────────────────────
  const handleSelectReview = async (text: string) => {
    if (redirecting) return; // Prevent double-tap

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setSelectedSuggestion(text);
      setRedirecting(true);

      // Record the event
      recordEvent('review_click', {
        rating: selectedRating,
        suggestion: text,
      });

      // Show photo tip before redirecting
      setShowPhotoTip(true);

      toast({
        title: "✅ Review copied!",
        description: "Opening Google Reviews. Please edit this in your own words before posting.",
      });

      // Redirect after delay — give time to see tips
      setTimeout(() => {
        const url = location?.google_review_url || campaign?.google_review_url;
        if (url) {
          window.location.assign(url);
        }
      }, 650);
    } catch (err) {
      console.error('Clipboard failed:', err);
      toast({
        title: "Copy manually",
        description: "Long-press the review text above to copy it.",
        variant: "destructive",
      });
    }
  };

  // ─── Refresh (get new set) ──────────────────────────────────
  const handleRefresh = () => {
    const businessName = location?.name || campaign?.name || 'this business';
    fetchSuggestions(businessName);
  };

  const hasService = (serviceId: CombinedServiceId) => selectedServices.includes(serviceId);

  const getRewardSettings = () => campaign?.design_metadata?.smartTapRewards || {};
  const getRewardTitle = () => getRewardSettings().rewardTitle || "10% off on your next visit";
  const getRequiredStamps = () => Math.max(1, Math.min(20, Number(getRewardSettings().stampsRequired) || 10));

  const getCustomerKey = () => customerPhone.replace(/\D/g, "").slice(-10);

  const loadCustomerStampCard = async () => {
    if (!campaignId) return;
    const customerKey = getCustomerKey();

    if (customerKey.length < 6) {
      setStampStatus("Enter a valid mobile number to load your card.");
      return;
    }

    setLoyaltyLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('smart-tap-loyalty', {
        body: {
          action: 'load',
          campaignId,
          customerPhone,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setStampCount(Number(data?.stampCount || 0));
      setStampStatus(data?.rewardClaimed ? "Reward already claimed for this card." : "Stamp card loaded from Smart Tap Rewards.");
    } catch (error) {
      setStampStatus(error instanceof Error ? error.message : "Secure stamp card service is unavailable.");
    } finally {
      setLoyaltyLoading(false);
    }
  };

  const handleCollectStamp = async () => {
    if (!campaignId) return;
    const customerKey = getCustomerKey();
    const requiredStamps = getRequiredStamps();

    if (customerKey.length < 6) {
      setStampStatus("Customer mobile number is required before adding a stamp.");
      return;
    }

    setLoyaltyLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('smart-tap-loyalty', {
        body: {
          action: 'add_stamp',
          campaignId,
          customerPhone,
          staffPin: staffPinInput,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const nextCount = Number(data?.stampCount || 0);
      setStampCount(nextCount);
      setStampStatus(nextCount >= requiredStamps ? `Reward unlocked: ${data?.rewardTitle || getRewardTitle()}` : `${requiredStamps - nextCount} stamps left for your reward.`);
      setStaffPinInput("");
      recordEvent('loyalty_stamp', { stamps: nextCount, customer_key_last4: customerKey.slice(-4) });
      toast({
        title: nextCount >= requiredStamps ? "Reward unlocked!" : "Verified stamp added",
        description: nextCount >= requiredStamps ? (data?.rewardTitle || getRewardTitle()) : `${requiredStamps - nextCount} stamps left for your reward.`,
      });
    } catch (error) {
      setStampStatus(error instanceof Error ? error.message : "Secure stamp verification failed.");
    } finally {
      setLoyaltyLoading(false);
    }
  };

  const handleScratchReward = () => {
    if (!campaignId) return;
    const rewards = [
      "5% off your next visit",
      "Free add-on on your next purchase",
      "Priority service on your next visit",
      "Surprise staff-approved reward",
    ];
    const reward = scratchReward || rewards[Math.floor(Math.random() * rewards.length)];
    setScratchReward(reward);
    window.localStorage.setItem(`scratch:${campaignId}`, reward);
    recordEvent('scratch_reward', { reward });
  };

  const handleDetectBranch = () => {
    setGpsStatus("Detecting branch...");
    if (!navigator.geolocation) {
      setGpsStatus("GPS is not available on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        setGpsStatus(location?.address ? `Checked in near ${location.address}` : "Nearest branch detected");
        recordEvent('branch_detected', { location_id: location?.id });
      },
      () => setGpsStatus("Location permission was not granted. Staff can still confirm your branch."),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const getMenuItems = () => {
    const category = `${location?.category || campaign?.name || ""}`.toLowerCase();

    if (category.includes("restaurant") || category.includes("cafe") || category.includes("food")) {
      return ["Today special", "Popular starter", "Signature main", "Dessert pick"];
    }
    if (category.includes("salon") || category.includes("beauty") || category.includes("spa")) {
      return ["Hair service", "Facial care", "Grooming package", "Membership offer"];
    }
    if (category.includes("fitness") || category.includes("gym")) {
      return ["Day pass", "Personal training", "Monthly plan", "Body assessment"];
    }
    return ["Featured service", "Customer favorite", "New offer", "Membership plan"];
  };

  // ─── Analytics Helper ───────────────────────────────────────
  const recordEvent = async (eventType: string, metadata: Record<string, any> = {}) => {
    if (!campaignId) return;
    try {
      await (supabase as any)
        .from('analytics_logs')
        .insert({
          campaign_id: campaignId,
          event_type: eventType,
          metadata: {
            ...metadata,
            user_agent: navigator.userAgent,
            language: navigator.language,
            timestamp: new Date().toISOString(),
          }
        });
    } catch (e) {
      // Silent fail — analytics should never block the user
    }
  };

  // ─── Loading State ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <div className="relative mx-auto w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Loading your review page...</p>
        </div>
      </div>
    );
  }

  const businessName = location?.name || campaign?.name || 'Business';
  const googleUrl = location?.google_review_url || campaign?.google_review_url;
  const headerLogoSrc = isBhairaveeCampaign
    ? (location?.logo_url || BHAIRAVEE_HEADER_LOGO_SRC)
    : location?.logo_url;
  const headerLogoClassName = isBhairaveeCampaign
    ? "w-44 h-20 object-contain rounded-xl shadow-lg border-2 border-white bg-white p-2"
    : "w-20 h-20 object-contain rounded-2xl shadow-lg border-2 border-white bg-white";

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-slate-50 font-inter">
      {/* Top bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <div className="bg-blue-600 p-1 rounded-md">
              <Star className="h-3 w-3 text-white fill-white" />
            </div>
            Google Review
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* ─── Business Header ────────────────────────────── */}
        <div className="text-center mb-8" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
          <div className="inline-block mb-4">
            {headerLogoSrc ? (
              <img
                src={headerLogoSrc}
                alt={businessName}
                className={headerLogoClassName}
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg flex items-center justify-center">
                <Award className="w-10 h-10 text-white" />
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">{businessName}</h1>
          <p className="text-slate-500 text-sm">
            {campaign?.headline || "How was your experience?"}
          </p>

          {/* ─── Star Rating Picker ────────────────────────── */}
          <div className="mt-5 flex flex-col items-center gap-2">
            <p className="text-slate-400 text-xs font-medium">Your rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => {
                    setSelectedRating(star);
                    // Refresh suggestions when rating changes significantly
                    if (Math.abs(star - selectedRating) >= 1) {
                      const bName = location?.name || campaign?.name;
                      if (bName) fetchSuggestions(bName, star);
                    }
                  }}
                  className="transition-all duration-200 active:scale-90"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= selectedRating
                        ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                        : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-slate-400 text-[11px]">
              {selectedRating === 5 ? 'Excellent!' : selectedRating === 4 ? 'Great!' : selectedRating === 3 ? 'Good' : selectedRating === 2 ? 'Fair' : 'Poor'}
            </p>
          </div>
        </div>

        {selectedServices.length > 0 && (
          <div className="space-y-4 mb-6" style={{ animation: 'fadeInUp 0.7s ease-out' }}>
            <Card className="border border-slate-200 shadow-lg rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Smart Tap Rewards</p>
                    <h2 className="text-lg font-bold text-slate-900">Choose what you need today</h2>
                  </div>
                  <div className="rounded-full bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 text-[10px] font-bold">
                    {selectedServices.length} Active
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {selectedServices.map((serviceId) => {
                    const service = COMBINED_SERVICES.find((item) => item.id === serviceId);
                    if (!service) return null;
                    const Icon = service.icon;

                    return (
                      <div key={service.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <Icon className="h-4 w-4 text-blue-600 mb-2" />
                        <p className="text-xs font-bold text-slate-900 leading-tight">{service.name}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {hasService("digital_stamp_cards") && (
              <Card className="border border-amber-200 shadow-lg rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Gift className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Smart Tap Stamp Card</h3>
                      <p className="text-amber-50 text-[11px]">Collect {getRequiredStamps()} verified stamps to unlock {getRewardTitle()}</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-2">How to use</p>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-amber-800">
                        <p><strong>1.</strong> Scan this QR at the store.</p>
                        <p><strong>2.</strong> Enter your mobile number.</p>
                        <p><strong>3.</strong> Staff verifies your visit with PIN.</p>
                        <p><strong>4.</strong> Collect stamps and claim reward.</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Customer Mobile Number</p>
                        <div className="flex gap-2">
                          <Input
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value.replace(/[^\d+\-\s]/g, ""))}
                            placeholder="Enter mobile number"
                            className="h-10 rounded-xl text-sm"
                          />
                          <Button
                            onClick={loadCustomerStampCard}
                            disabled={loyaltyLoading}
                            variant="outline"
                            className="h-10 rounded-xl border-amber-200 text-amber-700 font-bold"
                          >
                            Load
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Staff PIN</p>
                        <Input
                          value={staffPinInput}
                          onChange={(e) => setStaffPinInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="Staff enters PIN after visit"
                          className="h-10 rounded-xl text-sm"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {stampStatus}
                      </p>
                    </div>

                    <div className="grid grid-cols-5 gap-2 mb-4">
                      {Array.from({ length: getRequiredStamps() }).map((_, index) => (
                        <div
                          key={index}
                          className={`aspect-square rounded-full flex items-center justify-center border-2 text-xs font-black ${
                            index < stampCount
                              ? "bg-amber-500 border-amber-500 text-white"
                              : "bg-amber-50 border-amber-100 text-amber-200"
                          }`}
                        >
                          {index < stampCount ? "✓" : index + 1}
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl bg-white border border-amber-100 p-3 mb-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Reward</p>
                      <p className="text-sm font-black text-slate-900 mt-1">{getRewardTitle()}</p>
                    </div>
                    <Button
                      onClick={handleCollectStamp}
                      disabled={loyaltyLoading}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-11 font-bold"
                    >
                      {stampCount >= getRequiredStamps() ? "Reward Ready" : "Staff Verify & Add Stamp"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {hasService("ai_digital_menu") && (
              <Card className="border border-emerald-200 shadow-lg rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4">
                    <h3 className="text-sm font-bold">AI Digital Menu</h3>
                    <p className="text-emerald-50 text-[11px]">Quick picks connected to this QR</p>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {getMenuItems().map((item) => (
                      <div key={item} className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                        <p className="text-sm font-bold text-emerald-900">{item}</p>
                        <p className="text-[10px] text-emerald-700 mt-1">Ask staff for details</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {hasService("scratch_cards") && (
              <Card className="border border-purple-200 shadow-lg rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Trophy className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Scratch Card</h3>
                      <p className="text-[11px] text-slate-500">Reveal one surprise reward per QR</p>
                    </div>
                  </div>
                  <button
                    onClick={handleScratchReward}
                    className="w-full rounded-xl border-2 border-dashed border-purple-200 bg-purple-50 p-5 text-center active:scale-[0.98] transition-all"
                  >
                    {scratchReward ? (
                      <>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-purple-500 mb-1">You unlocked</p>
                        <p className="text-lg font-black text-purple-900">{scratchReward}</p>
                      </>
                    ) : (
                      <p className="text-sm font-bold text-purple-700">Tap to reveal reward</p>
                    )}
                  </button>
                </CardContent>
              </Card>
            )}

            {(hasService("multi_branch_gps") || hasService("branch_analytics") || hasService("qr_stand_request")) && (
              <Card className="border border-slate-200 shadow-lg rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-4 space-y-3">
                  {hasService("multi_branch_gps") && (
                    <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <p className="text-sm font-bold text-blue-900">Branch Check-In</p>
                      </div>
                      <p className="text-xs text-blue-700 mb-3">{gpsStatus}</p>
                      <Button onClick={handleDetectBranch} variant="outline" className="w-full h-10 rounded-xl border-blue-200 text-blue-700">
                        <Navigation className="h-4 w-4 mr-2" />
                        Detect Branch
                      </Button>
                    </div>
                  )}

                  {hasService("branch_analytics") && (
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <p className="text-sm font-bold text-slate-900">Branch Analytics Active</p>
                      <p className="text-xs text-slate-500 mt-1">This scan is counted for campaign performance and service engagement.</p>
                    </div>
                  )}

                  {hasService("qr_stand_request") && (
                    <div className="rounded-xl bg-red-50 border border-red-100 p-3">
                      <p className="text-sm font-bold text-red-900">QR Stand Enabled</p>
                      <p className="text-xs text-red-700 mt-1">Show this screen to staff if you need the counter QR stand or table card.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ─── Main Card: Review Suggestions ───────────────── */}
        <Card className="border border-slate-200 shadow-xl rounded-2xl overflow-hidden bg-white" style={{ animation: 'fadeInUp 0.8s ease-out' }}>
          <CardContent className="p-0">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white text-center">
              <h2 className="text-lg font-bold mb-1">Choose a review idea</h2>
              <p className="text-blue-100 text-xs">
                Make it your own with details from your real visit
              </p>
            </div>

            {/* Instruction Banner with Animated Hand */}
            {!selectedSuggestion && !loadingSuggestions && (
              <div className="bg-amber-50 border-b border-amber-100 px-5 py-3 flex items-center gap-3">
                <div className="animate-bounce">
                  <span className="text-2xl">👇</span>
                </div>
                <p className="text-amber-800 text-sm font-medium">
                  <strong>Step 1:</strong> Pick or edit an idea so it reflects your visit
                </p>
              </div>
            )}

            {/* Selected State — Personalize Tip + Photo Tip + Redirect */}
            {selectedSuggestion && (
              <div className="border-b border-green-100" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                {/* Copied confirmation */}
                <div className="bg-green-50 px-5 py-3 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <div>
                    <p className="text-green-800 text-sm font-bold">Review copied! ✅</p>
                    <p className="text-green-600 text-xs">Redirecting to Google Reviews...</p>
                  </div>
                </div>
                {/* Personalize + Photo tip */}
                {showPhotoTip && (
                  <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
                    <div className="bg-amber-50 px-5 py-3 flex items-start gap-3 border-b border-amber-100">
                      <div className="bg-amber-100 p-2 rounded-lg shrink-0">
                        <Pencil className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-amber-800 text-sm font-bold">✍️ Quick tip: Change a few words!</p>
                        <p className="text-amber-600 text-xs leading-relaxed mt-0.5">
                          Before posting, <strong>use your own words</strong> and include only what you actually experienced.
                        </p>
                      </div>
                    </div>
                    <div className="bg-blue-50 px-5 py-3 flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg shrink-0">
                        <Camera className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-blue-800 text-sm font-bold">Add a photo if it helps</p>
                        <p className="text-blue-600 text-xs leading-relaxed mt-0.5">
                          A real photo from your visit can make your review more useful for other customers.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Suggestions List */}
            <div className="p-4 space-y-3">
              {loadingSuggestions ? (
                <div className="py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm font-medium">Preparing review ideas...</p>
                  <p className="text-slate-400 text-xs mt-1">Use only if it matches your visit</p>
                </div>
              ) : (
                <>
                  {suggestions.map((text, index) => (
                    <div
                      key={`${text.substring(0, 20)}-${index}`}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 group relative min-h-[60px] ${selectedSuggestion === text
                        ? 'bg-green-50 border-green-500 shadow-lg shadow-green-100 scale-[1.02]'
                        : redirecting
                          ? 'opacity-40 border-slate-100 bg-slate-50'
                          : 'bg-white hover:bg-blue-50 border-slate-100 hover:border-blue-300 shadow-sm hover:shadow-md cursor-pointer'
                        }`}
                      style={{ animation: `fadeInUp ${0.4 + index * 0.1}s ease-out` }}
                      onClick={() => {
                        if (editingIndex !== index && !redirecting && !selectedSuggestion) {
                          handleSelectReview(text);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Review Number / Status */}
                        <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${selectedSuggestion === text
                          ? 'bg-green-500 text-white'
                          : 'bg-blue-100 text-blue-600 ' + (editingIndex !== index ? 'group-hover:bg-blue-600 group-hover:text-white' : '')
                          } transition-colors`}>
                          {selectedSuggestion === text ? '✓' : index + 1}
                        </div>

                        {/* Review Text / Editor */}
                        <div className="flex-1 min-w-0">
                          {editingIndex === index ? (
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full text-sm leading-relaxed text-slate-700 bg-white border border-blue-300 rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                            />
                          ) : (
                            <p className={`text-sm leading-relaxed ${selectedSuggestion === text ? 'text-green-800 font-semibold' : 'text-slate-700'
                              }`}>
                              {text}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className={`flex-shrink-0 mt-1 flex gap-2 transition-opacity ${selectedSuggestion === text || editingIndex === index ? 'opacity-100' : 'opacity-100 lg:opacity-0 group-hover:opacity-100'
                          }`}>
                          {editingIndex === index ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const newSuggestions = [...suggestions];
                                newSuggestions[index] = editText;
                                setSuggestions(newSuggestions);
                                setEditingIndex(null);
                              }}
                              className="p-1.5 bg-blue-100 rounded-md text-blue-600 hover:bg-blue-200 shadow-sm transition-colors"
                              title="Save Edit"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          ) : selectedSuggestion === text ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingIndex(index);
                                  setEditText(text);
                                }}
                                className="p-1.5 bg-slate-100 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Edit Review"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!redirecting && !selectedSuggestion) {
                                    handleSelectReview(text);
                                  }
                                }}
                                className="p-1.5 bg-slate-100 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Copy & Post"
                              >
                                <Copy className="h-4 w-4 text-blue-400" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Refresh Button */}
                  {!redirecting && (
                    <div className="pt-2 text-center">
                      <button
                        onClick={handleRefresh}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-xs font-semibold py-2 px-4 rounded-full hover:bg-blue-50 transition-colors"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Show different ideas
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Direct Google Link (always visible) */}
            {googleUrl && (
              <div className="border-t border-slate-100 p-4">
                <Button
                  onClick={() => { window.location.href = googleUrl; }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 font-semibold text-sm shadow-lg transition-all active:scale-[0.98] min-h-[48px]"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Write your own review on Google
                </Button>
                <p className="text-center text-slate-400 text-[11px] mt-2">
                  Or write your own review directly
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Photo Tips Card ─────────────────────────────── */}
        {!redirecting && !isBhairaveeCampaign && (
          <Card className="border border-slate-200 shadow-lg rounded-2xl overflow-hidden bg-white mt-4" style={{ animation: 'fadeInUp 1s ease-out' }}>
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-4 text-white flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <ImagePlus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Add a real photo if useful</h3>
                  <p className="text-emerald-100 text-[11px]">Photos should be from your own visit</p>
                </div>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                {[
                  { emoji: '📍', label: 'Photo of the place', desc: 'Entrance, interior, or signboard' },
                  { emoji: '🛍️', label: 'Your purchase', desc: 'Product, bill, or packaging' },
                  { emoji: '✨', label: 'Before & After', desc: 'Show the results you got' },
                  { emoji: '👥', label: 'The team', desc: 'Staff who helped you' },
                ].map((tip, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-3 text-center">
                    <span className="text-xl">{tip.emoji}</span>
                    <p className="text-slate-700 text-xs font-semibold mt-1">{tip.label}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">{tip.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Footer ──────────────────────────────────────── */}
        <footer className="mt-10 text-center pb-8 border-t border-slate-100 pt-8 mt-12 bg-white">
          <div className="flex flex-col items-center gap-4">
            {/* Simple selection toggle (for demo/choice since we don't save to DB yet) */}
            <div className="flex flex-col items-center gap-3">
              <img
                src={campaign?.theme_color === 'pramod' ? '/PR.png' : '/qr.jpg'}
                alt="Branding"
                className={`${campaign?.theme_color === 'pramod' ? 'h-24' : 'h-12'} w-auto object-contain rounded-lg transition-all`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/qr.jpg';
                }}
              />
              <div className="space-y-1">
                <p className="text-slate-400 text-[11px] font-medium tracking-widest uppercase">
                  Powered by {campaign?.theme_color === 'pramod' ? 'Pramod Digital Marketing' : 'Creative Mark'}
                </p>
                {campaign?.theme_color === 'pramod' ? (
                  <a href="https://buszyhub.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold text-sm hover:underline">
                    Buszyhub.in
                  </a>
                ) : (
                  <p className="text-slate-300 text-[10px]">
                    &copy; {new Date().getFullYear()} Review Helper
                  </p>
                )}
              </div>
            </div>
            
            <p className="text-[9px] text-slate-300 italic px-6 mt-4 opacity-10">
              Review ideas for inspiration only. Customers write their own reviews.
            </p>
          </div>
        </footer>
      </div>

      {/* ─── CSS Animations (inline keyframes) ────────────── */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ReviewLanding;
