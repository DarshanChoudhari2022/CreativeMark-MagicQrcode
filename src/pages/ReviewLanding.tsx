'use client';

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Star, Sparkles, ExternalLink, Loader2, Copy, Check, ChevronRight, RefreshCw, MessageSquare } from 'lucide-react';
import { generateReviewSuggestions } from '@/services/gemini';
import confetti from 'canvas-confetti';
import { Textarea } from '@/components/ui/textarea';

const ReviewLanding = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [selectedTone, setSelectedTone] = useState<string>('Professional');
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // New State for Sentiment Flow
  const [step, setStep] = useState<'rating' | 'positive' | 'negative' | 'submitted'>('rating');
  const [userRating, setUserRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const tones = ['Professional', 'Casual', 'Enthusiastic', 'Short'];

  const suggestionsMap: Record<string, string[]> = {
    'Restaurant/Cafe': [
      'Amazing food quality and exceptional service! The ambiance is perfect for dining. Highly recommended!',
      'Fresh ingredients, delicious flavors, and friendly staff. Best dining experience in town!',
    ],
    'Retail Store': [
      'Great product selection and competitive prices. Excellent customer service experience!',
      'Wide variety of products with helpful staff. Will definitely come back again!',
    ],
    'Healthcare': [
      'Professional doctors and caring staff. Clean facility with excellent patient care!',
      'Highly experienced team with modern facilities. Great healthcare experience!',
    ],
    'Automotive': [
      'Expert technicians with quality service. Fair pricing and quick turnaround time!',
      'Professional workmanship and reliable service. Best mechanic shop in the area!',
    ],
    'Beauty Salon': [
      'Talented stylists and modern techniques. Relaxing atmosphere with excellent results!',
      'Professional beauty services with attention to detail. Highly recommend!',
    ],
    'Fitness': [
      'State-of-the-art equipment with friendly trainers. Great fitness community!',
      'Professional staff and clean facility. Best gym in the neighborhood!',
    ],
    'Real Estate': [
      'Professional agents with excellent market knowledge. Smooth buying experience!',
      'Expert guidance throughout the process. Highly trustworthy and reliable!',
    ],
    'Professional Services': [
      'Expert service with attention to detail. Excellent communication and results!',
      'Professional approach with timely delivery. Highly satisfied with the service!',
    ],
  };

  const getRandomSuggestion = (category: string): string => {
    const suggestionsList = suggestionsMap[category] || suggestionsMap['Professional Services'];
    const randomIndex = Math.floor(Math.random() * suggestionsList.length);
    return suggestionsList[randomIndex];
  };

  const handleNextSuggestion = () => {
    if (suggestions.length > 0) {
      setCurrentSuggestionIndex((prev) => (prev + 1) % suggestions.length);
    }
  };

  useEffect(() => {
    const loadCampaign = async () => {
      try {
        setLoading(true);
        if (!campaignId) {
          toast({ title: 'Error', description: 'Campaign ID not found', variant: 'destructive' });
          setLoading(false);
          return;
        }

        const { data: campaignData, error: campaignError } = await (supabase as any)
          .from('campaigns')
          .select('*')
          .eq('id', campaignId)
          .single();

        if (campaignError || !campaignData) {
          console.error('Error loading campaign:', campaignError);
          toast({ title: 'Campaign Not Found', description: 'This review campaign is no longer available', variant: 'destructive' });
          setLoading(false);
          return;
        }

        console.log('Campaign loaded:', campaignData);
        setCampaign(campaignData);

        let fetchedSuggestions: string[] = [];

        // Try to generate AI suggestions first
        try {
          const aiSuggestions = await generateReviewSuggestions(
            campaignData.name || 'Our Business',
            5,
            'en',
            campaignData.category
          );
          if (aiSuggestions && aiSuggestions.length > 0) {
            fetchedSuggestions = aiSuggestions.map(s => s.text);
          }
        } catch (err) {
          console.error("Failed to generate AI suggestions, falling back to static", err);
        }

        // If AI fails or returns empty, use static fallback
        if (fetchedSuggestions.length === 0) {
          const category = campaignData.category || 'Professional Services';
          fetchedSuggestions = suggestionsMap[category] || suggestionsMap['Professional Services'];
        }

        setSuggestions(fetchedSuggestions);
        setCurrentSuggestionIndex(0);

        if (campaignData.location_id) {
          const { data: locationData } = await (supabase as any)
            .from('locations')
            .select('*')
            .eq('id', campaignData.location_id)
            .single();
          if (locationData) {
            setLocation(locationData);
          }
        }

        (supabase as any).from('scan_events').insert([
          {
            campaign_id: campaignId,
            event_type: 'scan',
            device_type: /Mobile|Android|iPhone/.test(navigator.userAgent) ? 'mobile' : 'desktop',
            timestamp: new Date().toISOString(),
          },
        ]).then(() => {
          console.log('Scan event recorded');
        }).catch(err => {
          console.error('Error recording scan:', err);
        });

        setLoading(false);
      } catch (error) {
        console.error('Error in loadCampaign:', error);
        toast({ title: 'Error', description: 'Failed to load campaign details', variant: 'destructive' });
        setLoading(false);
      }
    };

    loadCampaign();
  }, [campaignId, toast]);

  // Effect to reload suggestions when tone changes
  useEffect(() => {
    if (!campaign || !campaign.name) return;

    const fetchToneSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
        console.log("Generating suggestions for:", campaign.name, selectedTone);
        const aiSuggestions = await generateReviewSuggestions(
          campaign.name || 'Our Business',
          5,
          'en',
          campaign.category,
          selectedTone
        );

        if (aiSuggestions && aiSuggestions.length > 0) {
          console.log("Received AI suggestions:", aiSuggestions);
          setSuggestions(aiSuggestions.map(s => s.text));
          setCurrentSuggestionIndex(0);
        } else {
          console.warn("AI returned empty, falling back to static.");
          // If AI fails, maybe we can at least shuffle the static ones or show a toast
          // For now, let's just toast so the user knows
          toast({
            title: "AI Response Delayed",
            description: "Using standard suggestions due to high traffic.",
            variant: "default"
          });
        }
      } catch (err) {
        console.error("Failed to generate tone suggestions", err);
        toast({ title: "AI Error", description: "Could not generate new reviews.", variant: "destructive" });
      } finally {
        setLoadingSuggestions(false);
      }
    };
    fetchToneSuggestions();

  }, [selectedTone, campaign]);

  /* Sentiment Analysis Flow Handler */
  const handleRatingSelect = (rating: number) => {
    setUserRating(rating);
    if (rating >= 4) {
      setStep('positive');
      triggerConfetti();
    } else {
      setStep('negative');
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      toast({ title: "Please enter feedback", variant: "destructive" });
      return;
    }
    setSubmittingFeedback(true);

    try {
      // Saving to 'reviews' or 'scan_events' - Using scan_events metadata for now to be safe with existing schema
      // Or if 'reviews' table is accessible (from previous steps context), use that.
      // Let's use 'reviews' table as it was referenced in aiAutoReply.ts and seems available.

      await (supabase as any).from('reviews').insert([
        {
          location_id: campaign?.location_id,
          rating: userRating,
          review_text: feedbackText,
          campaign_id: campaignId,
          sentiment: 'negative', // Explicitly marking as internal feedback
          status: 'private_feedback' // Custom status if column exists, or just rely on it not being in google_reviews
        }
      ]);

      // Fallback to scan_events if reviews fails or just to track the event
      await (supabase as any).from('scan_events').insert([
        {
          campaign_id: campaignId,
          event_type: 'feedback_submitted',
          device_type: /Mobile|Android|iPhone/.test(navigator.userAgent) ? 'mobile' : 'desktop',
          timestamp: new Date().toISOString(),
        },
      ]);

      setStep('submitted');
      toast({ title: "Feedback Sent", description: "Thank you for helping us improve!" });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({ title: "Error", description: "Could not send feedback. Please try again." });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleCopyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      toast({ title: 'Copied!', description: 'Review suggestion copied to clipboard' });
      setTimeout(() => setCopiedIndex(null), 2000);
    }).catch(err => {
      console.error('Copy failed:', err);
      toast({ title: 'Error', description: 'Failed to copy', variant: 'destructive' });
    });
  };

  const handleOpenGoogleReview = async () => {
    if (!campaign) {
      toast({ title: 'Error', description: 'Campaign data not loaded', variant: 'destructive' });
      return;
    }

    const googleReviewUrl = location?.google_review_url || campaign?.google_review_url;
    console.log('Campaign object:', campaign);
    console.log('Google review URL:', googleReviewUrl);

    if (!googleReviewUrl) {
      toast({ title: 'Error', description: 'Review URL not available. Please contact support.', variant: 'destructive' });
      return;
    }

    try {
      setGenerating(true);
      (supabase as any).from('conversion_events').insert([
        {
          campaign_id: campaignId,
          converted: true,
          timestamp: new Date().toISOString(),
        },
      ]).then(() => {
        console.log('Conversion event recorded');
      }).catch(err => {
        console.error('Error recording conversion:', err);
      });

      const url = googleReviewUrl;
      console.log('Opening URL:', url);
      window.open(url, '_blank');
      toast({ title: 'Success', description: 'Opening Google review page...' });
    } catch (error) {
      console.error('Error in handleOpenGoogleReview:', error);
      toast({ title: 'Error', description: 'Failed to open review page', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Campaign Not Found</CardTitle>
            <CardDescription>This review campaign is no longer available.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">Return Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const businessName = campaign?.name || location?.name || 'Our Business';
  const logoUrl = location?.logo_url;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-indigo-50 to-purple-50 py-8 px-4 flex flex-col items-center">
      <div className="max-w-md w-full">

        {/* Header Section */}
        <div className="text-center mb-8">
          {logoUrl && (
            <div className="flex justify-center mb-4">
              <img src={logoUrl} alt={businessName} className="h-24 w-24 rounded-full object-cover shadow-lg border-4 border-white animate-in zoom-in duration-500" />
            </div>
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{step === 'submitted' ? 'Thank You!' : 'Help Us Improve!'}</h1>
          <p className="text-lg text-gray-600 mb-1"><strong>{businessName}</strong></p>
          <p className="text-sm text-gray-500">
            {step === 'rating' && "How was your experience?"}
            {step === 'positive' && "Awesome! Share your experience on Google"}
            {step === 'negative' && "We're sorry! How can we do better?"}
            {step === 'submitted' && "Your feedback has been received."}
          </p>
        </div>

        {/* Step 1: Star Rating */}
        {step === 'rating' && (
          <Card className="shadow-lg border-2 border-indigo-100 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <CardContent className="pt-8 pb-8 flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRatingSelect(star)}
                  className="transform transition-transform hover:scale-125 focus:outline-none"
                >
                  <Star
                    className={`w-10 h-10 ${userRating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`}
                    onMouseEnter={() => setUserRating(star)}
                    onMouseLeave={() => setUserRating(0)}
                  />
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Step 2A: Negative Feedback Form */}
        {step === 'negative' && (
          <Card className="shadow-lg border-red-100 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <CardHeader className="bg-red-50 rounded-t-lg">
              <CardTitle className="text-red-700 text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Private Feedback
              </CardTitle>
              <CardDescription className="text-red-600/80">
                Please let us know what went wrong so we can fix it. This stays private.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <Textarea
                placeholder="Tell us about your experience..."
                className="min-h-[120px] resize-none"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
              />
              <Button
                onClick={handleSubmitFeedback}
                disabled={submittingFeedback}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {submittingFeedback ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Send Private Feedback
              </Button>
              <Button
                variant="ghost"
                onClick={() => setStep('rating')}
                className="w-full text-gray-400 hover:text-gray-600"
              >
                Back
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2B: Positive Flow (Suggestions + Google) */}
        {step === 'positive' && (
          <div className="animate-in fade-in slide-in-from-bottom-5 duration-500 space-y-6">

            {/* Review Suggestions Card */}
            <Card className="shadow-lg border-2 border-indigo-200 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                  <CardTitle className="text-white">AI Review Assistant</CardTitle>
                </div>
                <CardDescription className="text-indigo-100">Tap a suggestion to copy it!</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">

                {/* Tone Selector */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                  {tones.map((tone) => (
                    <button
                      key={tone}
                      onClick={() => setSelectedTone(tone)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${selectedTone === tone
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
                        }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>

                {loadingSuggestions ? (
                  <div className="flex flex-col items-center justify-center py-8 min-h-[120px]">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-2" />
                    <p className="text-xs text-muted-foreground">Creating {selectedTone.toLowerCase()} reviews...</p>
                  </div>
                ) : (
                  suggestions.length > 0 && (
                    <div className="space-y-4">
                      <div
                        className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 cursor-pointer hover:border-indigo-400 transition-all min-h-[100px] flex items-start gap-3 relative group"
                        onClick={() => handleCopyToClipboard(suggestions[currentSuggestionIndex], currentSuggestionIndex)}
                      >
                        <Star className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-gray-800 text-sm leading-relaxed animate-in fade-in duration-300">
                            {suggestions[currentSuggestionIndex]}
                          </p>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Copy className="w-4 h-4 text-indigo-400" />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleNextSuggestion}
                          className="flex-1 py-3 px-4 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-medium rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Show Another
                        </button>

                        <button
                          onClick={() => handleCopyToClipboard(suggestions[currentSuggestionIndex], currentSuggestionIndex)}
                          className={`flex-1 py-3 px-4 font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg ${copiedIndex === currentSuggestionIndex
                            ? 'bg-green-600 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                        >
                          {copiedIndex === currentSuggestionIndex ? (
                            <>
                              <Check className="w-4 h-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy Text
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            <Button
              onClick={handleOpenGoogleReview}
              disabled={generating}
              className="w-full h-16 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xl font-bold rounded-xl shadow-xl flex items-center justify-center gap-3 transform transition-transform hover:scale-[1.02]"
            >
              {generating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <ExternalLink className="w-6 h-6" />
                  Leave Review on Google
                </>
              )}
            </Button>

            <div className="text-center">
              <button onClick={() => setStep('rating')} className="text-sm text-gray-400 hover:text-gray-600 underline">
                Start Over
              </button>
            </div>

          </div>
        )}

        {/* Step: Submitted */}
        {step === 'submitted' && (
          <Card className="shadow-lg border-green-100 animate-in fade-in zoom-in duration-500 text-center">
            <CardContent className="pt-12 pb-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Feedback Received</h3>
              <p className="text-gray-600">
                Thank you for your honesty. We will review this internally to improve our service.
              </p>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};

export default ReviewLanding;

