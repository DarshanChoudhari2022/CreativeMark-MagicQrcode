import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Star, Loader2, ExternalLink, CheckCircle2,
  Sparkles, MessageSquare, ThumbsUp, Copy, ArrowRight,
  Heart, Zap, Award, Smartphone
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

  const handleCategorySelect = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setStep('suggestion');
    setLoadingSuggestions(true);

    try {
      const categoryName = reviewCategories.find(c => c.id === categoryId)?.name || 'service';
      const aiSuggestions = await generateReviewSuggestions(
        location?.name || 'this business',
        selectedRating,
        i18n.language,
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
            rating: selectedRating,
            category: selectedCategory,
            suggestion: text
          }
        });

      toast({
        title: t('review.copied'),
        description: t('review.copied_desc'),
      });

      setTimeout(() => {
        const url = location?.google_review_url || campaign?.google_review_url;
        if (url) {
          window.location.href = url;
        }
      }, 1500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">{t('review.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-inter pb-12">
      {/* Premium Gradient Background */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-gray-900 via-gray-800 to-black z-0"></div>

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-12">
        {/* Header Branding */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="bg-white p-3 rounded-2xl inline-block shadow-2xl mb-4 border-2 border-white/20 overflow-hidden w-24 h-24">
            {location?.logo_url ? (
              <img
                src={location.logo_url}
                alt={location.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <Award className="w-full h-full text-red-600" />
            )}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">
            {location?.name || campaign?.name || t('review.we_love_to_hear')}
          </h1>
          <p className="text-gray-400 font-medium mt-1">
            {campaign?.headline || t('review.how_was_experience')}
          </p>
        </div>

        {/* Floating Language Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-1">
            <LanguageToggle />
          </div>
        </div>

        {/* Step-based Progress */}
        <div className="flex justify-center gap-2 mb-8">
          {['rating', 'category', 'suggestion'].map((s, index) => {
            const currentStepIndex = ['rating', 'category', 'suggestion', 'redirect'].indexOf(step);
            return (
              <div
                key={s}
                className={`h-1.5 w-16 rounded-full transition-all duration-500 ${currentStepIndex >= index
                  ? 'bg-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)]'
                  : 'bg-gray-300'
                  }`}
              />
            );
          })}
        </div>

        <main className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          {/* Step 1: Rating */}
          {step === 'rating' && (
            <Card className="border-0 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-3xl overflow-hidden hover:shadow-2xl transition-shadow bg-white">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-8 w-8 text-red-500 fill-red-500/20" />
                </div>
                <h2 className="text-2xl font-black mb-2 text-gray-900 tracking-tight">{t('review.how_was_experience')}</h2>
                <p className="text-gray-500 font-medium mb-8 uppercase tracking-widest text-[10px]">{t('review.tap_to_select')}</p>

                <div className="flex justify-between gap-1 mb-10">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setSelectedRating(rating)}
                      className={`flex-1 aspect-square rounded-2xl transition-all duration-300 flex items-center justify-center border-2 ${selectedRating >= rating
                        ? 'bg-yellow-400 border-yellow-400 shadow-lg shadow-yellow-400/30'
                        : 'bg-white border-gray-100 hover:border-gray-200'
                        }`}
                    >
                      <Star
                        className={`w-full h-full p-2 ${selectedRating >= rating
                          ? 'text-white fill-white'
                          : 'text-gray-200'
                          }`}
                      />
                    </button>
                  ))}
                </div>

                <div className="bg-gray-50 py-4 px-6 rounded-2xl mb-8">
                  <p className="text-xl font-black text-gray-800 italic">
                    {selectedRating === 5 && t('review.rating_5')}
                    {selectedRating === 4 && t('review.rating_4')}
                    {selectedRating === 3 && t('review.rating_3')}
                    {selectedRating === 2 && t('review.rating_2')}
                    {selectedRating === 1 && t('review.rating_1')}
                  </p>
                </div>

                <Button
                  onClick={handleRatingSubmit}
                  className="w-full h-16 bg-gray-900 border-b-4 border-black hover:bg-black text-white text-xl font-black rounded-2xl transition-all shadow-xl hover:translate-y-0.5 active:translate-y-1"
                >
                  {t('review.continue')}
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Category */}
          {step === 'category' && (
            <Card className="border-0 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-3xl overflow-hidden bg-white">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="h-8 w-8 text-blue-500 fill-blue-500/20" />
                </div>
                <h2 className="text-2xl font-black mb-2 text-gray-900 tracking-tight">{t('review.select_what_stood_out')}</h2>
                <p className="text-gray-500 font-medium mb-8 uppercase tracking-widest text-[10px]">{t('review.pick_category')}</p>

                <div className="grid grid-cols-1 gap-3 mb-8">
                  {reviewCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.id)}
                      className="p-5 bg-gray-50 hover:bg-red-50 rounded-2xl border-2 border-transparent hover:border-red-200 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl group-hover:scale-125 transition-transform">{cat.emoji}</span>
                        <span className="font-black text-gray-800 text-lg uppercase tracking-tight">{cat.name}</span>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-red-500" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Suggestion */}
          {step === 'suggestion' && (
            <Card className="border-0 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-3xl bg-white overflow-hidden">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-8 w-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-black mb-2 text-gray-900 tracking-tight">{t('review.choose_review_line')}</h2>
                <p className="text-gray-500 font-medium mb-8 uppercase tracking-widest text-[10px]">{t('review.select_and_post')}</p>

                {loadingSuggestions ? (
                  <div className="py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-red-600 mx-auto mb-4" />
                    <p className="text-gray-400 font-black text-xs uppercase animate-pulse">{t('review.ai_crafting')}</p>
                  </div>
                ) : (
                  <div className="space-y-4 mb-8">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleCopyAndPost(suggestion)}
                        className="w-full p-6 text-left bg-gray-50 hover:bg-white rounded-2xl border-2 border-transparent hover:border-red-500/30 hover:shadow-xl transition-all group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Copy className="h-4 w-4 text-red-500" />
                        </div>
                        <p className="text-gray-700 font-bold leading-relaxed line-clamp-3">"{suggestion}"</p>
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-4">
                  AI-Powered Review Generation
                </p>
              </CardContent>
            </Card>
          )}

          {/* Fallback Redirect */}
          {step === 'redirect' && (
            <Card className="border-0 shadow-xl rounded-3xl bg-white">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <Smartphone className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-black mb-4 text-gray-900">{t('review.almost_done')}</h2>
                <div className="bg-red-50 p-6 rounded-2xl text-left mb-8 border border-red-100">
                  <p className="text-red-900 font-bold leading-relaxed whitespace-pre-line">
                    {t('review.instructions')}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    const url = location?.google_review_url || campaign?.google_review_url;
                    if (url) window.location.href = url;
                  }}
                  className="w-full h-16 bg-red-600 hover:bg-red-700 text-white text-xl font-black rounded-2xl shadow-xl hover:shadow-red-500/40 transition-all border-b-4 border-red-900"
                >
                  {t('review.open_google')}
                  <ExternalLink className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          )}
        </main>

        <footer className="mt-12 text-center">
          <div className="flex items-center justify-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-[9px] mb-4">
            <CheckCircle2 className="h-3 w-3" />
            {t('common.powered_by')}
          </div>
          <p className="text-gray-400 text-xs">
            &copy; {new Date().getFullYear()} ReviewBoost AI
          </p>
        </footer>
      </div>
    </div>
  );
};

export default ReviewLanding;
