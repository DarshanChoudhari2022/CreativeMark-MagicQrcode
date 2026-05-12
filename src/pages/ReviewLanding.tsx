import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Star, Loader2, ExternalLink, CheckCircle2,
  Sparkles, RefreshCw, ArrowRight,
  Award, ArrowLeft, HandMetal, Pencil, Check,
  Camera, ImagePlus
} from "lucide-react";
import { generateReviewSuggestions } from "@/services/gemini";
import { useTranslation } from "react-i18next";


interface Campaign {
  id: string;
  name: string;
  headline: string;
  subheadline: string;
  footer_text: string;
  theme_color: string;
  google_review_url?: string;
  location_id?: string;
}

interface Location {
  id: string;
  name: string;
  google_review_url: string;
  category: string;
  logo_url: string;
  address: string;
}

// ─── Component ────────────────────────────────────────────────
const ReviewLanding = () => {
  const { campaignId } = useParams();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [location, setLocation] = useState<Location | null>(null);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
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

  // ─── Fetch AI Suggestions on data ready ─────────────────────
  useEffect(() => {
    const businessName = location?.name || campaign?.name;
    if (businessName) {
      fetchSuggestions(businessName);
    }
  }, [location, campaign]);

  // ─── Fetch AI-Generated Suggestions (with timeout + race guard) ──
  const fetchSuggestions = useCallback(async (businessName: string) => {
    const id = ++fetchIdRef.current;
    setLoadingSuggestions(true);
    setSelectedSuggestion(null);
    setEditingIndex(null);

    try {
      const category = location?.category || 'service';

      const result = await Promise.race([
        generateReviewSuggestions(
          businessName,
          selectedRating,
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
        recordEvent('ai_suggestion', { count: result.length, source: 'ai' });
      }
    } catch (err: any) {
      console.warn('AI suggestion failed, using smart defaults:', err.message);

      // Smart fallback — business-specific defaults
      if (id === fetchIdRef.current) {
        const fallbacks = generateLocalFallbacks(businessName);
        setSuggestions(fallbacks);
        recordEvent('ai_suggestion', { count: fallbacks.length, source: 'fallback' });
      }
    } finally {
      if (id === fetchIdRef.current) {
        setLoadingSuggestions(false);
      }
    }
  }, [location, campaign]);

  // ─── Local Fallback Generator (zero API, instant, category-aware) ───
  const generateLocalFallbacks = (businessName: string): string[] => {
    const loc = location?.address ? ` near ${location.address}` : "";
    const cat = (location?.category || "").toLowerCase();

    // Category-specific review pools — sound like real customers
    const categoryReviews: Record<string, string[]> = {
      restaurant: [
        `Finally tried ${businessName}${loc} and the food was genuinely good. The paneer dish was probably the best I've had in a while.`,
        `Went here for lunch with colleagues. Quick service, tasty food, reasonable prices. The staff remembered our order from last time which was nice.`,
        `Good food, clean place. Waited about 10 mins for a table on a Saturday but worth it. The thali was filling and fresh.`,
        `My family's been coming to ${businessName} for months now. Kids love it, portions are generous. Only thing - parking is a bit tight.`,
        `Ordered delivery from here twice this week. Food arrived hot both times. The biryani is legit.`,
        `Decent place for a quick meal${loc}. Nothing too fancy but the taste is consistent every time.`,
        `Tried ${businessName} on a friend's suggestion. The starters were amazing, mains were okay. Will come back to try more items.`,
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
      `Really happy with ${businessName}${loc}. The team was professional and got everything done on time.`,
      `Visited for the first time based on a friend's recommendation. Wasn't disappointed at all. Good service, friendly people.`,
      `${businessName} does solid work. I compared with other options before choosing and glad I went with them.`,
      `Third time coming here and the quality has been consistent. That says a lot about how they run things.`,
      `The person who helped me at ${businessName} was patient and explained everything clearly. Will come back for sure.`,
      `Good experience overall${loc}. Clean place, reasonable pricing, and they actually care about doing a good job.`,
      `${businessName} is my go-to now. Tried a couple other places before but this one is consistently better.`,
      `Went here last week and had a smooth experience. No unnecessary upselling, just honest service.`,
      `A friend dragged me here saying it was good${loc}. She was right. The attention to detail is impressive.`,
      `Decent place, fair pricing. Nothing fancy but they get the job done well. The staff is polite.`,
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

  // ─── Handle Tap on a Suggestion (Google-Compliant: NO clipboard copy) ───
  const handleSelectReview = async (text: string) => {
    if (redirecting) return; // Prevent double-tap

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
      title: "✅ Great choice!",
      description: "Opening Google — type your review in your own words!",
    });

    // Redirect after delay — give time to read the idea
    setTimeout(() => {
      const url = location?.google_review_url || campaign?.google_review_url;
      if (url) {
        window.location.href = url;
      }
    }, 6000);
  };

  // ─── Refresh (get new set) ──────────────────────────────────
  const handleRefresh = () => {
    const businessName = location?.name || campaign?.name || 'this business';
    fetchSuggestions(businessName);
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
            {location?.logo_url ? (
              <img
                src={location.logo_url}
                alt={businessName}
                className="w-20 h-20 object-contain rounded-2xl shadow-lg border-2 border-white bg-white"
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
                      if (bName) fetchSuggestions(bName);
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

        {/* ─── Main Card: Review Inspiration (Google-Compliant) ── */}
        <Card className="border border-slate-200 shadow-xl rounded-2xl overflow-hidden bg-white" style={{ animation: 'fadeInUp 0.8s ease-out' }}>
          <CardContent className="p-0">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white text-center">
              <h2 className="text-lg font-bold mb-1">What would you like to mention?</h2>
              <p className="text-blue-100 text-xs">
                Pick an idea below, then write your review in your own words on Google
              </p>
            </div>

            {/* Instruction Banner */}
            {!selectedSuggestion && !loadingSuggestions && (
              <div className="bg-amber-50 border-b border-amber-100 px-5 py-3 flex items-center gap-3">
                <div className="animate-bounce">
                  <span className="text-2xl">💡</span>
                </div>
                <p className="text-amber-800 text-sm font-medium">
                  <strong>Step 1:</strong> Tap an idea that matches your experience
                </p>
              </div>
            )}

            {/* Selected State — Photo Tip + Redirect */}
            {selectedSuggestion && (
              <div className="border-b border-green-100" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                {/* Selection confirmation */}
                <div className="bg-green-50 px-5 py-3 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <div>
                    <p className="text-green-800 text-sm font-bold">Great choice! ✅</p>
                    <p className="text-green-600 text-xs">Opening Google — write this in your own words!</p>
                  </div>
                </div>
                {/* Typing guidance + Photo tip */}
                {showPhotoTip && (
                  <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
                    <div className="bg-amber-50 px-5 py-3 flex items-start gap-3 border-b border-amber-100">
                      <div className="bg-amber-100 p-2 rounded-lg shrink-0">
                        <Pencil className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-amber-800 text-sm font-bold">✍️ Type it in your own words</p>
                        <p className="text-amber-600 text-xs leading-relaxed mt-0.5">
                          Use the idea above as inspiration — Google values <strong>genuine, unique reviews</strong> written by you!
                        </p>
                      </div>
                    </div>
                    <div className="bg-blue-50 px-5 py-3 flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg shrink-0">
                        <Camera className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-blue-800 text-sm font-bold">📸 Add a photo for more impact!</p>
                        <p className="text-blue-600 text-xs leading-relaxed mt-0.5">
                          Reviews with photos are <strong>more trusted</strong> on Google.
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
                  <p className="text-slate-500 text-sm font-medium">Finding review ideas...</p>
                  <p className="text-slate-400 text-xs mt-1">Based on your experience ✨</p>
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
                                  if (!redirecting && !selectedSuggestion) {
                                    handleSelectReview(text);
                                  }
                                }}
                                className="p-1.5 bg-blue-100 rounded-md text-blue-600 hover:bg-blue-200 transition-colors"
                                title="Use this idea"
                              >
                                <ArrowRight className="h-4 w-4" />
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
        {!redirecting && (
          <Card className="border border-slate-200 shadow-lg rounded-2xl overflow-hidden bg-white mt-4" style={{ animation: 'fadeInUp 1s ease-out' }}>
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-4 text-white flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <ImagePlus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Add a photo for extra impact!</h3>
                  <p className="text-emerald-100 text-[11px]">Reviews with photos get noticed more on Google</p>
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
                    &copy; {new Date().getFullYear()} AI Review Systems
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
