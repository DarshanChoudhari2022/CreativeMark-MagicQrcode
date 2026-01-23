import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Star, Loader2, ExternalLink, CheckCircle2,
  Sparkles, MessageSquare, ThumbsUp, Copy, ArrowRight,
  Heart, Zap, Award, Smartphone, Globe, ShieldCheck, Languages
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
  const [selectedRating, setSelectedRating] = useState(5);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionLanguage, setSuggestionLanguage] = useState(i18n.language);
  const [step, setStep] = useState<'rating' | 'category' | 'suggestion' | 'redirect'>('rating');

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

  useEffect(() => {
    if (step === 'suggestion' && selectedCategory) {
      fetchAISuggestions(selectedCategory, suggestionLanguage);
    }
  }, [suggestionLanguage]);

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

      await (supabase as any)
        .from('analytics_logs')
        .insert({
          campaign_id: campaignId,
          event_type: 'review_click',
          metadata: {
            suggestion: text,
            rating: selectedRating,
            category: selectedCategory
          }
        });

      toast({
        title: t('review.copied'),
        description: t('review.redirecting'),
      });

      setTimeout(() => {
        window.location.href = location?.google_review_url || campaign?.google_review_url || '#';
      }, 1500);
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  const handlePrivateFeedback = async (feedback: string) => {
    try {
      await (supabase as any)
        .from('analytics_logs')
        .insert({
          campaign_id: campaignId,
          event_type: 'private_feedback',
          metadata: {
            feedback,
            rating: selectedRating
          }
        });

      setStep('redirect');
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-red-600" />
      </div>
    );
  }

  const primaryColor = campaign?.theme_color || '#dc2626';

  return (
    <div className="min-h-screen bg-white font-inter">
      {/* Premium Header */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 px-4 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            {location?.logo_url ? (
              <img src={location.logo_url} alt="Logo" className="h-10 w-auto rounded-lg shadow-sm" />
            ) : (
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-200">
                <Star className="text-white h-5 w-5 fill-white" />
              </div>
            )}
            <div>
              <h1 className="text-sm font-black text-gray-900 uppercase tracking-tight leading-none">{location?.name || campaign?.name}</h1>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Managed Review System</p>
            </div>
          </div>
          <LanguageToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-xl">
        <div className="space-y-8">

          {/* Step 1: Rating */}
          {step === 'rating' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-10">
                <div className="inline-block bg-red-50 px-4 py-1.5 rounded-full mb-6">
                  <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Feedback Portal</p>
                </div>
                <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-4 leading-none">{t('review.how_was_experience')}</h2>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] px-8">{t('review.tap_stars')}</p>
              </div>

              <Card className="border-0 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.08)] rounded-[2.5rem] bg-white overflow-hidden">
                <CardContent className="p-12 text-center">
                  <div className="flex justify-center gap-2 mb-10">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onMouseEnter={() => setSelectedRating(star)}
                        onClick={() => {
                          setSelectedRating(star);
                          handleRatingSubmit();
                        }}
                        className="transition-all transform hover:scale-125"
                      >
                        <Star
                          className={`h-12 w-12 ${star <= selectedRating
                              ? "fill-red-600 text-red-600"
                              : "text-gray-100"
                            }`}
                        />
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={handleRatingSubmit}
                    className="w-full h-16 bg-red-600 hover:bg-black text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-red-200"
                  >
                    {t('common.continue')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Category */}
          {step === 'category' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-10">
                <div className="inline-block bg-red-50 px-4 py-1.5 rounded-full mb-6">
                  <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Service Breakdown</p>
                </div>
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-3 leading-none">{t('review.select_what_stood_out')}</h2>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">{t('review.pick_category')}</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {reviewCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className="p-6 bg-white hover:bg-red-600 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-white transition-colors">
                        {cat.emoji}
                      </div>
                      <span className="font-black text-gray-900 group-hover:text-white text-lg uppercase tracking-tight">{cat.name}</span>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-white" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Suggestion */}
          {step === 'suggestion' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-8">
                <div className="inline-block bg-red-50 px-4 py-1.5 rounded-full mb-6">
                  <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">AI Content Generation</p>
                </div>
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-3 leading-none">{t('review.choose_review_line')}</h2>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-8">{t('review.select_and_post')}</p>

                {/* AI Review Language Toggle - Professional Style */}
                <div className="flex justify-center mb-8">
                  <div className="bg-gray-100 p-1 rounded-2xl flex gap-1">
                    <button
                      onClick={() => setSuggestionLanguage('en')}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${suggestionLanguage === 'en'
                          ? 'bg-red-600 text-white shadow-xl'
                          : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                      ENG
                    </button>
                    <button
                      onClick={() => setSuggestionLanguage('mr')}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${suggestionLanguage === 'mr'
                          ? 'bg-red-600 text-white shadow-xl'
                          : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                      मराठी
                    </button>
                  </div>
                </div>
              </div>

              {loadingSuggestions ? (
                <div className="py-24 text-center">
                  <div className="relative inline-block">
                    <div className="absolute -inset-4 bg-red-600/10 rounded-full blur-xl animate-pulse"></div>
                    <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto mb-6 relative z-10" />
                  </div>
                  <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">{t('review.ai_crafting')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleCopyAndPost(suggestion)}
                      className="w-full p-8 text-left bg-white hover:bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-200">
                          <ThumbsUp className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <p className="text-gray-900 font-bold leading-relaxed pr-8">
                        "{suggestion}"
                      </p>
                    </button>
                  ))}

                  <div className="pt-8 text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                      <ShieldCheck className="h-3 w-3 text-red-600" />
                      AI Verified Professional Review Content
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Simple Thank You / Redirect */}
          {step === 'redirect' && (
            <div className="animate-in fade-in zoom-in duration-500 text-center py-20">
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-10 shadow-xl shadow-red-200/50">
                <CheckCircle2 className="h-12 w-12 text-red-600" />
              </div>
              <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-4 leading-none">{t('review.thank_you')}</h2>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-12">
                {selectedRating < 4 ? t('review.feedback_received') : t('review.redirecting')}
              </p>
              <Button
                onClick={() => window.location.href = location?.google_review_url || '/'}
                className="bg-red-600 hover:bg-black text-white h-14 px-10 rounded-full font-black uppercase tracking-widest shadow-xl shadow-red-100"
              >
                Return to Profile
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Corporate Footer */}
      <footer className="py-20 border-t border-gray-50 text-center bg-gray-50/50">
        <div className="container mx-auto px-4 flex flex-col items-center gap-6">
          <img src="/logo.jpg" alt="Creative Mark" className="h-10 w-auto object-contain grayscale opacity-50" />
          <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em]">
              Review Management Intelligence &bull; Creative Mark
            </p>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest max-w-xs mx-auto leading-loose">
              Automating reputation growth for businesses across Maharashtra through precision AI systems.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ReviewLanding;
