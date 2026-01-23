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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-inter">
      {/* Premium Header */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 px-6 py-6 transition-all">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-5">
            {location?.logo_url ? (
              <img src={location.logo_url} alt="Logo" className="h-14 w-auto rounded-xl shadow-md border border-gray-50 bg-white" />
            ) : (
              <div className="w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center shadow-xl shadow-red-200 transition-transform hover:scale-105">
                <Star className="text-white h-7 w-7 fill-white" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none">{location?.name || campaign?.name}</h1>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-2">Verified Feedback Portal</p>
            </div>
          </div>
          <LanguageToggle />
        </div>
      </header>

      <main className="container mx-auto px-6 py-20 max-w-2xl">
        <div className="space-y-12">

          {/* Step 1: Rating */}
          {step === 'rating' && (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="text-center mb-16">
                <div className="inline-block bg-red-600 text-white px-6 py-2 rounded-full mb-10 shadow-xl shadow-red-200">
                  <p className="text-xs font-black uppercase tracking-widest">Growth Engine Active</p>
                </div>
                <h2 className="text-5xl md:text-6xl font-black text-gray-900 uppercase tracking-tighter mb-6 leading-none italic">{t('review.how_was_experience')}</h2>
                <p className="text-gray-400 font-black uppercase tracking-widest text-sm px-12">{t('review.tap_stars')}</p>
              </div>

              <Card className="border-0 shadow-[0_80px_160px_-40px_rgba(0,0,0,0.1)] rounded-[3.5rem] bg-white overflow-hidden transition-all hover:scale-[1.01]">
                <CardContent className="p-16 text-center">
                  <div className="flex justify-center gap-4 mb-14">
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
                          className={`h-16 w-16 transition-all ${star <= selectedRating
                            ? "fill-red-600 text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                            : "text-gray-100"
                            }`}
                        />
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={handleRatingSubmit}
                    className="w-full h-20 bg-red-600 hover:bg-black text-white font-black uppercase tracking-widest text-lg rounded-3xl shadow-2xl shadow-red-300 active:scale-[0.98] transition-all"
                  >
                    {t('common.continue')}
                    <ArrowRight className="ml-3 h-6 w-6" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Category */}
          {step === 'category' && (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="text-center mb-16">
                <div className="inline-block bg-white border border-red-100 px-6 py-2 rounded-full mb-10 shadow-sm">
                  <p className="text-xs font-black text-red-600 uppercase tracking-widest">Precision Audit</p>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter mb-6 leading-none italic">{t('review.select_what_stood_out')}</h2>
                <p className="text-gray-400 font-black uppercase tracking-widest text-sm italic">{t('review.pick_category')}</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {reviewCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className="p-10 bg-white hover:bg-red-600 rounded-[3rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-between group overflow-hidden relative"
                  >
                    <div className="flex items-center gap-8 relative z-10">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-white transition-all shadow-inner">
                        {cat.emoji}
                      </div>
                      <span className="font-black text-gray-900 group-hover:text-white text-2xl uppercase tracking-tight transition-colors">{cat.name}</span>
                    </div>
                    <ArrowRight className="h-8 w-8 text-red-600 group-hover:text-white transition-all transform group-hover:translate-x-2 relative z-10" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Suggestion */}
          {step === 'suggestion' && (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="text-center mb-12">
                <div className="inline-block bg-red-600 text-white px-6 py-2 rounded-full mb-10 shadow-xl shadow-red-100">
                  <p className="text-xs font-black uppercase tracking-widest">AI Intelligence Link</p>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter mb-6 leading-none italic">{t('review.choose_review_line')}</h2>
                <p className="text-gray-400 font-black uppercase tracking-widest text-sm mb-12 italic">{t('review.select_and_post')}</p>

                <div className="flex justify-center mb-12">
                  <div className="bg-gray-100 p-2 rounded-3xl flex gap-1 shadow-inner">
                    <button
                      onClick={() => setSuggestionLanguage('en')}
                      className={`px-10 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${suggestionLanguage === 'en'
                        ? 'bg-red-600 text-white shadow-2xl'
                        : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                      ENG
                    </button>
                    <button
                      onClick={() => setSuggestionLanguage('mr')}
                      className={`px-10 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${suggestionLanguage === 'mr'
                        ? 'bg-red-600 text-white shadow-2xl'
                        : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                      मराठी
                    </button>
                  </div>
                </div>
              </div>

              {loadingSuggestions ? (
                <div className="py-32 text-center">
                  <div className="relative inline-block mb-10">
                    <div className="absolute -inset-8 bg-red-600/10 rounded-full blur-2xl animate-pulse"></div>
                    <Loader2 className="h-20 w-20 animate-spin text-red-600 mx-auto relative z-10" />
                  </div>
                  <p className="text-red-600 font-black text-sm uppercase tracking-[0.4em] animate-pulse italic">{t('review.ai_crafting')}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleCopyAndPost(suggestion)}
                      className="w-full p-12 text-left bg-white hover:bg-gray-50 rounded-[3.5rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-500 group relative overflow-hidden active:scale-[0.98]"
                    >
                      <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                        <div className="bg-red-600 p-3 rounded-2xl shadow-2xl shadow-red-200">
                          <ThumbsUp className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <p className="text-gray-900 font-bold text-xl md:text-2xl leading-relaxed pr-12 italic">
                        "{suggestion}"
                      </p>
                    </button>
                  ))}

                  <div className="pt-12 text-center">
                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center justify-center gap-3 italic">
                      <ShieldCheck className="h-5 w-5 text-red-600" />
                      AI Verified Professional Content
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Simple Thank You / Redirect */}
          {step === 'redirect' && (
            <div className="animate-in fade-in zoom-in duration-700 text-center py-32">
              <div className="w-32 h-32 bg-red-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-12 shadow-2xl shadow-red-100/50">
                <CheckCircle2 className="h-16 w-16 text-red-600" />
              </div>
              <h2 className="text-5xl font-black text-gray-900 uppercase tracking-tighter mb-8 leading-none italic">{t('review.thank_you')}</h2>
              <p className="text-gray-400 font-black uppercase tracking-widest text-sm mb-16 italic font-medium max-w-sm mx-auto">
                {selectedRating < 4 ? t('review.feedback_received') : t('review.redirecting')}
              </p>
              <Button
                onClick={() => window.location.href = location?.google_review_url || '/'}
                className="bg-red-600 hover:bg-black text-white h-20 px-16 rounded-full font-black uppercase tracking-widest text-lg shadow-2xl shadow-red-200"
              >
                Return to Profile
              </Button>
            </div>
          )}
        </div>
      </main>

      <footer className="py-24 border-t border-gray-100 text-center bg-gray-50/30">
        <div className="container mx-auto px-10 flex flex-col items-center gap-10">
          <img src="/logo.jpg" alt="Creative Mark" className="h-14 w-auto object-contain grayscale opacity-60" />
          <div className="flex flex-col items-center gap-4">
            <p className="text-xs font-black text-gray-900 uppercase tracking-[0.4em] italic leading-none">
              Intelligence &bull; Creative Mark Systems
            </p>
            <p className="text-xs text-gray-400 font-black uppercase tracking-widest max-w-md mx-auto leading-loose italic">
              Automating reputation growth for businesses across Maharashtra through precision AI strategies.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ReviewLanding;
