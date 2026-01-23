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
    <div className="min-h-screen bg-white font-inter pb-32 relative overflow-hidden">
      {/* Immersive Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[60%] bg-gradient-to-b from-red-50 to-white z-0 opacity-50"></div>
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-red-100 rounded-full blur-[200px] opacity-10"></div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 pt-16">
        {/* Header Branding - Large Logo */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-10 duration-1000">
          <div className="bg-white p-6 rounded-[2.5rem] inline-block shadow-[0_40px_100px_-30px_rgba(0,0,0,0.1)] mb-8 border border-gray-50 overflow-hidden w-32 h-32 md:w-40 md:h-40 transform hover:scale-105 transition-all duration-700">
            {location?.logo_url ? (
              <img
                src={location.logo_url}
                alt={location.name}
                className="w-full h-full object-contain rounded-2xl"
              />
            ) : (
              <Award className="w-full h-full text-red-600 drop-shadow-2xl" />
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-950 tracking-tight uppercase leading-none mb-4">
            {location?.name || campaign?.name || t('review.we_love_to_hear')}
          </h1>
          <div className="inline-block relative">
            <p className="text-red-600 font-bold uppercase tracking-widest text-xs opacity-90 px-6 py-2 bg-white shadow-xl shadow-red-200/20 rounded-full border border-red-50">
              {campaign?.headline || t('review.how_was_experience')}
            </p>
          </div>
        </div>

        <main className="animate-in fade-in slide-in-from-bottom-12 duration-1000">

          {/* Main Suggestions Card */}
          <Card className="border-0 shadow-2xl rounded-[3rem] bg-white overflow-hidden">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Sparkles className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-3xl font-bold mb-4 text-gray-900 tracking-tight uppercase leading-none">Copy a review you love</h2>
              <p className="text-gray-400 font-bold mb-10 uppercase tracking-widest text-[10px] leading-none">Press any button below to copy & review</p>

              {/* AI Review Language Toggle - Red Only */}
              <div className="flex justify-center mb-10">
                <div className="bg-gray-50 p-1.5 rounded-[1.5rem] flex gap-2 border border-gray-100 shadow-inner">
                  <button
                    onClick={() => setSuggestionLanguage('en')}
                    className={`px-8 py-3 rounded-[1rem] text-xs font-bold uppercase tracking-widest transition-all ${suggestionLanguage === 'en'
                      ? 'bg-white text-red-600 shadow-md transform scale-105'
                      : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setSuggestionLanguage('mr')}
                    className={`px-8 py-3 rounded-[1rem] text-xs font-bold uppercase tracking-widest transition-all ${suggestionLanguage === 'mr'
                      ? 'bg-white text-red-600 shadow-md transform scale-105'
                      : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    मराठी
                  </button>
                </div>
              </div>

              {loadingSuggestions ? (
                <div className="py-24">
                  <Loader2 className="h-16 w-16 animate-spin text-red-600 mx-auto mb-6" />
                  <p className="text-red-950 font-bold text-xs uppercase tracking-widest animate-pulse">Generating Reviews...</p>
                </div>
              ) : (
                <div className="space-y-6 mb-12 px-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleCopyAndPost(suggestion)}
                      className={`w-full p-6 text-left rounded-[2rem] border-2 transition-all group relative overflow-hidden active:scale-[0.98] ${selectedSuggestion === suggestion
                          ? 'bg-red-600 border-red-600 text-white shadow-xl scale-[1.02]'
                          : 'bg-white hover:bg-gray-50 border-gray-100 hover:border-red-200'
                        }`}
                    >
                      <div className={`absolute top-0 right-0 p-6 transition-opacity ${selectedSuggestion === suggestion ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}>
                        {selectedSuggestion === suggestion ? (
                          <CheckCircle2 className="h-6 w-6 text-white animate-bounce" />
                        ) : (
                          <Copy className="h-6 w-6 text-red-400" />
                        )}
                      </div>
                      <p className={`font-bold leading-tight text-lg md:text-xl pr-10 ${selectedSuggestion === suggestion ? 'text-white' : 'text-gray-800'
                        }`}>"{suggestion}"</p>
                      {selectedSuggestion === suggestion && (
                        <p className="text-[10px] uppercase tracking-widest mt-2 text-white/80 animate-pulse font-bold">Copied! Redirecting...</p>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <div className="pt-8 border-t border-gray-100">
                <Button
                  onClick={handleManualRedirect}
                  variant="outline"
                  className="w-full py-8 rounded-[2rem] border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-600 font-bold uppercase tracking-widest text-xs flex gap-2 items-center justify-center transition-all"
                >
                  Skip & Write My Own Review
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>

        <footer className="mt-16 text-center pb-24">
          <div className="flex flex-col items-center justify-center gap-8">
            <img src="/logo.jpg" alt="Creative Mark" className="h-16 w-auto object-contain rounded-[1.5rem] shadow-xl grayscale opacity-30 hover:opacity-100 hover:grayscale-0 transition-all duration-1000" />
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="flex items-center gap-3 text-red-600 font-bold uppercase tracking-widest text-[10px]">
                <CheckCircle2 className="h-4 w-4" />
                {t('common.powered_by')}
              </div>
              <p className="text-gray-300 text-[10px] font-bold uppercase tracking-widest leading-none opacity-50">
                &copy; {new Date().getFullYear()} Creative Mark AI Corps
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Language Toggle Fixed Bottom Right */}
      <div className="fixed bottom-10 right-10 z-[100] transform hover:scale-110 transition-transform">
        <div className="bg-white/80 backdrop-blur-xl border border-gray-100 p-2 rounded-full shadow-[0_40px_80px_rgba(220,38,38,0.25)]">
          <LanguageToggle />
        </div>
      </div>
    </div>
  );
};

export default ReviewLanding;
