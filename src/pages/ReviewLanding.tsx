import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Star, Loader2, ExternalLink, CheckCircle2,
  Sparkles, Copy, RefreshCw, ArrowRight,
  Award, ArrowLeft, HandMetal
} from "lucide-react";
import { generateReviewSuggestions } from "@/services/gemini";
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "@/components/LanguageToggle";

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
  const [copied, setCopied] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

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
    setCopied(false);

    try {
      const category = location?.category || 'service';

      const result = await Promise.race([
        generateReviewSuggestions(
          businessName,
          5,
          'en',
          category
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

  // ─── Local Fallback Generator (zero API, instant) ───────────
  const generateLocalFallbacks = (businessName: string): string[] => {
    const templates = [
      `Excellent experience at ${businessName}! Professional team and great quality service. Highly recommended!`,
      `Very impressed with the service at ${businessName}. Friendly staff and outstanding results. Will definitely visit again!`,
      `Top-notch quality! ${businessName} delivers on every promise. Great value for money and wonderful customer care.`,
      `Had a fantastic time at ${businessName}. Everything was well-organized and the staff was very helpful. Five stars!`,
      `Best service I've experienced in a long time! ${businessName} truly cares about their customers. Highly recommend!`,
    ];
    // Shuffle so it's different each time
    for (let i = templates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [templates[i], templates[j]] = [templates[j], templates[i]];
    }
    return templates;
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
        rating: 5,
        suggestion: text,
      });

      toast({
        title: "✅ Review copied!",
        description: "Opening Google Reviews — just paste & post!",
      });

      // Redirect after a short delay so user sees the confirmation
      setTimeout(() => {
        const url = location?.google_review_url || campaign?.google_review_url;
        if (url) {
          window.location.href = url;
        }
      }, 2500);
    } catch (err) {
      // Clipboard failed (rare on HTTPS) — show manual copy fallback
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
          <LanguageToggle />
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

          {/* 5-Star Visual */}
          <div className="flex items-center justify-center gap-1 mt-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className="h-7 w-7 fill-amber-400 text-amber-400 drop-shadow-sm" />
            ))}
          </div>
        </div>

        {/* ─── Main Card: Review Suggestions ───────────────── */}
        <Card className="border border-slate-200 shadow-xl rounded-2xl overflow-hidden bg-white" style={{ animation: 'fadeInUp 0.8s ease-out' }}>
          <CardContent className="p-0">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white text-center">
              <h2 className="text-lg font-bold mb-1">Tap a review to copy & post</h2>
              <p className="text-blue-100 text-xs">
                Select any review below — it will be copied automatically
              </p>
            </div>

            {/* Instruction Banner with Animated Hand */}
            {!selectedSuggestion && !loadingSuggestions && (
              <div className="bg-amber-50 border-b border-amber-100 px-5 py-3 flex items-center gap-3">
                <div className="animate-bounce">
                  <span className="text-2xl">👇</span>
                </div>
                <p className="text-amber-800 text-sm font-medium">
                  <strong>Step 1:</strong> Tap any review below to copy it
                </p>
              </div>
            )}

            {/* Selected State Banner */}
            {selectedSuggestion && (
              <div className="bg-green-50 border-b border-green-100 px-5 py-3 flex items-center gap-3" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-green-800 text-sm font-bold">Review copied! ✅</p>
                  <p className="text-green-600 text-xs">Redirecting to Google Reviews... just paste & post!</p>
                </div>
              </div>
            )}

            {/* Suggestions List */}
            <div className="p-4 space-y-3">
              {loadingSuggestions ? (
                <div className="py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm font-medium">Writing fresh reviews...</p>
                  <p className="text-slate-400 text-xs mt-1">Powered by AI ✨</p>
                </div>
              ) : (
                <>
                  {suggestions.map((text, index) => (
                    <button
                      key={`${text.substring(0, 20)}-${index}`}
                      onClick={() => handleSelectReview(text)}
                      disabled={redirecting}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 group relative min-h-[60px] ${selectedSuggestion === text
                          ? 'bg-green-50 border-green-500 shadow-lg shadow-green-100 scale-[1.02]'
                          : redirecting
                            ? 'opacity-40 cursor-not-allowed border-slate-100 bg-slate-50'
                            : 'bg-white hover:bg-blue-50 border-slate-100 hover:border-blue-300 shadow-sm hover:shadow-md active:scale-[0.98]'
                        }`}
                      style={{ animation: `fadeInUp ${0.4 + index * 0.1}s ease-out` }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Review Number */}
                        <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${selectedSuggestion === text
                            ? 'bg-green-500 text-white'
                            : 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                          } transition-colors`}>
                          {selectedSuggestion === text ? '✓' : index + 1}
                        </div>

                        {/* Review Text */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-relaxed ${selectedSuggestion === text ? 'text-green-800 font-semibold' : 'text-slate-700'
                            }`}>
                            {text}
                          </p>
                        </div>

                        {/* Copy Icon */}
                        <div className={`flex-shrink-0 mt-1 transition-opacity ${selectedSuggestion === text ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}>
                          {selectedSuggestion === text ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4 text-blue-400" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}

                  {/* Refresh Button */}
                  {!redirecting && (
                    <div className="pt-2 text-center">
                      <button
                        onClick={handleRefresh}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-xs font-semibold py-2 px-4 rounded-full hover:bg-blue-50 transition-colors"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Show different reviews
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

        {/* ─── Footer ──────────────────────────────────────── */}
        <footer className="mt-10 text-center pb-8">
          <div className="flex flex-col items-center gap-3">
            <img
              src="/logo.jpg"
              alt="Powered by"
              className="h-10 w-auto object-contain rounded-lg shadow-sm"
            />
            <div className="space-y-1">
              <p className="text-slate-400 text-[11px] font-medium">
                Powered by Creative Mark
              </p>
              <p className="text-slate-300 text-[10px]">
                &copy; {new Date().getFullYear()} AI Review Systems
              </p>
            </div>
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
