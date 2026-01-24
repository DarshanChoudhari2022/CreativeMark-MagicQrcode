import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Star, Loader2, ExternalLink, CheckCircle2,
  Sparkles, MessageSquare, ThumbsUp, Copy, ArrowRight,
  Heart, Zap, Award, Smartphone, ArrowLeft
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

const defaultSuggestions = [
  "Excellent service and friendly staff! Highly recommended for everyone.",
  "Amazing experience! The team was professional and helpful throughout.",
  "Best in the area! Quality service and great value for money.",
  "Outstanding quality! Will definitely visit again and recommend to friends.",
  "Very impressed with the service. Quick, efficient, and professional!",
];

const getReviewCategories = (t: any) => [
  { id: 'service', name: t('review.service_quality'), emoji: '⭐' },
  { id: 'staff', name: t('review.staff_behavior'), emoji: '😊' },
  { id: 'ambiance', name: t('review.ambiance'), emoji: '✨' },
  { id: 'value', name: t('review.value_for_money'), emoji: '💰' },
  { id: 'overall', name: t('review.overall_experience'), emoji: '🎯' },
];

const ReviewLanding = () => {
  const { campaignId } = useParams();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const reviewCategories = getReviewCategories(t);

  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>(defaultSuggestions);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

  // Set defaults to skip steps
  const [selectedRating, setSelectedRating] = useState(5);
  const [selectedCategory, setSelectedCategory] = useState<string | null>('service');
  const [copied, setCopied] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionLanguage, setSuggestionLanguage] = useState(i18n.language);

  // Start directly at suggestion
  const [step, setStep] = useState<'rating' | 'category' | 'suggestion' | 'redirect'>('suggestion');

  useEffect(() => {
    loadCampaignData();
    recordScanEvent();
  }, [campaignId]);

  const loadCampaignData = async () => {
    if (!campaignId) return;
    try {
      const { data: campaignData, error: campaignError } = await (supabase as any)
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;
      setCampaign(campaignData);

      if (campaignData?.location_id) {
        const { data: locationData } = await (supabase as any)
          .from('locations')
          .select('*')
          .eq('id', campaignData.location_id)
          .single();

        if (locationData) {
          setLocation(locationData);
        }
      }
    } catch (error: any) {
      console.error('Error loading campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordScanEvent = async () => {
    if (!campaignId) return;
    try {
      await (supabase as any)
        .from('analytics_logs')
        .insert({
          campaign_id: campaignId,
          event_type: 'scan',
          metadata: {
            user_agent: navigator.userAgent,
            language: navigator.language
          }
        });
    } catch (error) {
      console.error('Error recording scan:', error);
    }
  };

  const handleRatingSubmit = () => {
    if (selectedRating >= 4) {
      setStep('category');
    } else {
      setStep('redirect');
    }
  };

  // Fetch suggestions when language changes OR when location is loaded (initial load)
  useEffect(() => {
    if (step === 'suggestion' && selectedCategory && (location || campaign?.name)) {
      fetchAISuggestions(selectedCategory, suggestionLanguage);
    }
  }, [suggestionLanguage, location, campaign]);

  const fetchAISuggestions = async (categoryId: string, lang: string) => {
    setLoadingSuggestions(true);
    try {
      const categoryName = reviewCategories.find(c => c.id === categoryId)?.name || 'service';
      const aiSuggestions = await generateReviewSuggestions(
        location?.name || 'this business',
        selectedRating,
        lang,
        `${location?.category || 'service'} - focusing on ${categoryName}`
      );
      if (aiSuggestions && aiSuggestions.length > 0) {
        setSuggestions(aiSuggestions.map(s => s.text));
      }
    } catch (error) {
      console.error('AI Suggestion error:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleCategorySelect = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setStep('suggestion');
    await fetchAISuggestions(categoryId, suggestionLanguage);
  };

  const handleCopyAndPost = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setSelectedSuggestion(text); // Track which one was selected

      await (supabase as any)
        .from('analytics_logs')
        .insert({
          campaign_id: campaignId,
          event_type: 'review_click',
          metadata: {
            rating: selectedRating,
            category: selectedCategory,
            suggestion: text
          }
        });

      toast({
        title: t('review.copied'),
        description: "Redirecting to Google Reviews...",
      });

      // Animate before redirect
      setTimeout(() => {
        const url = location?.google_review_url || campaign?.google_review_url;
        if (url) {
          window.location.href = url;
        }
      }, 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleManualRedirect = () => {
    const url = location?.google_review_url || campaign?.google_review_url;
    if (url) {
      window.location.href = url;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white font-inter">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-red-600 mx-auto mb-10" />
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Synchronizing Review Gateway...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-inter pb-20 relative overflow-hidden">
      {/* Immersive Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[50%] bg-gradient-to-b from-red-50 to-transparent z-0"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-100/30 rounded-full blur-[120px] -z-10"></div>

      <div className="fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.location.href = "https://creative-mark.vercel.app/"}
          className="h-10 w-10 bg-white/50 backdrop-blur-md text-slate-400 hover:text-red-600 rounded-full shadow-sm hover:bg-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="relative z-10 max-w-xl mx-auto px-4 pt-12 md:pt-20">
        {/* Header Branding - Clean & Focused */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="bg-white p-2 md:p-4 rounded-2xl md:rounded-3xl inline-block shadow-lg md:shadow-xl mb-4 md:mb-6 border border-slate-100 overflow-hidden w-24 h-24 md:w-32 md:h-32 transform transition-all duration-500 hover:shadow-2xl">
            {location?.logo_url ? (
              <img
                src={location.logo_url}
                alt={location.name}
                className="w-full h-full object-contain rounded-lg md:rounded-xl"
              />
            ) : (
              <Award className="w-full h-full text-red-500" />
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight leading-tight mb-3">
            {location?.name || campaign?.name || t('review.we_love_to_hear')}
          </h1>
          <div className="inline-block">
            <p className="text-red-600 font-bold uppercase tracking-wider text-[10px] px-5 py-2 bg-white shadow-sm rounded-full border border-red-50">
              {campaign?.headline || t('review.how_was_experience')}
            </p>
          </div>
        </div>

        <main className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {/* Main Suggestions Card */}
          <Card className="border-0 shadow-xl rounded-[1.5rem] md:rounded-[2.5rem] bg-white overflow-hidden">
            <CardContent className="p-5 md:p-10 text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-red-50 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-inner">
                <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-red-500" />
              </div>
              <h2 className="text-lg md:text-2xl font-bold mb-2 text-slate-900 tracking-tight">Select a review to copy</h2>
              <p className="text-slate-400 font-bold mb-6 md:mb-8 uppercase tracking-widest text-[9px] md:text-[10px]">Tapping a card will copy & redirect you</p>

              {/* AI Review Language Toggle */}
              <div className="flex justify-center mb-8">
                <div className="bg-slate-50 p-1 rounded-2xl flex gap-1 border border-slate-100">
                  <button
                    onClick={() => setSuggestionLanguage('en')}
                    className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${suggestionLanguage === 'en'
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setSuggestionLanguage('mr')}
                    className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${suggestionLanguage === 'mr'
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    मराठी
                  </button>
                </div>
              </div>

              {loadingSuggestions ? (
                <div className="py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-red-500 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">Crafting reviews...</p>
                </div>
              ) : (
                <div className="space-y-4 mb-8">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleCopyAndPost(suggestion)}
                      className={`w-full p-4 md:p-6 text-left rounded-xl md:rounded-2xl border transition-all group relative overflow-hidden active:scale-[0.98] ${selectedSuggestion === suggestion
                        ? 'bg-red-600 border-red-600 text-white shadow-lg'
                        : 'bg-white hover:bg-slate-50 border-slate-100 hover:border-red-200 shadow-sm'
                        }`}
                    >
                      <div className={`absolute top-4 right-4 transition-opacity ${selectedSuggestion === suggestion ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}>
                        {selectedSuggestion === suggestion ? (
                          <CheckCircle2 className="h-5 w-5 text-white animate-bounce" />
                        ) : (
                          <Copy className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                      <p className={`font-semibold leading-relaxed text-base md:text-lg pr-8 ${selectedSuggestion === suggestion ? 'text-white' : 'text-slate-800'
                        }`}>"{suggestion}"</p>
                      {selectedSuggestion === suggestion && (
                        <p className="text-[10px] uppercase tracking-widest mt-2 text-white/80 font-bold">Copied! Opening Google Reviews...</p>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Enhanced Backup Redirect Button */}
              <div className="pt-8 border-t border-slate-50 space-y-4">
                <Button
                  onClick={handleManualRedirect}
                  className="w-full py-7 rounded-2xl bg-slate-900 border-0 hover:bg-slate-950 text-white font-bold uppercase tracking-widest text-[10px] flex gap-3 items-center justify-center transition-all shadow-lg hover:shadow-slate-200"
                >
                  <ExternalLink className="h-4 w-4" />
                  Leave a Review on Google Maps
                </Button>

                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Use the black button above if redirect fails
                </p>
              </div>
            </CardContent>
          </Card>
        </main>

        <footer className="mt-12 text-center pb-12">
          <div className="flex flex-col items-center gap-6">
            <img src="/logo.jpg" alt="Creative Mark" className="h-16 w-auto object-contain rounded-xl shadow-lg transition-all duration-500" />
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-red-600 font-bold uppercase tracking-widest text-[9px]">
                <CheckCircle2 className="h-3 w-3" />
                {t('common.powered_by')}
              </div>
              <p className="text-slate-300 text-[9px] font-bold uppercase tracking-widest">
                &copy; {new Date().getFullYear()} Creative Mark AI Systems
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Language Toggle Fixed */}
      <div className="fixed bottom-6 right-6 z-[100] transform hover:scale-110 transition-transform">
        <div className="bg-white/80 backdrop-blur-xl border border-slate-100 p-2 rounded-full shadow-2xl">
          <LanguageToggle />
        </div>
      </div>
    </div>
  );
};

export default ReviewLanding;
