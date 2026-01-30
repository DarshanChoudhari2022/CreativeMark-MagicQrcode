import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, QrCode, TrendingUp, Eye, MousePointerClick, Sparkles, ExternalLink } from "lucide-react";
import { BrandedQRCard } from '@/components/BrandedQRCard';

const CampaignDetails = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>({
    scans: 0,
    views: 0,
    ai_suggestions: 0,
    click_review: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCampaignData = async () => {
      try {
        // Load campaign
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', campaignId)
          .single();

        if (campaignError) throw campaignError;
        setCampaign(campaignData);

        // Load location
        if (campaignData?.location_id) {
          const { data: locationData } = await supabase
            .from('locations')
            .select('*')
            .eq('id', campaignData.location_id)
            .single();
          if (locationData) {
            setLocation(locationData);
          }
        }

        // Load analytics from analytics_events
        const { count: scanCount } = await (supabase as any)
          .from('analytics_events')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaignId)
          .eq('event_type', 'scan');

        const { count: reviewClickCount } = await (supabase as any)
          .from('analytics_events')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaignId)
          .eq('event_type', 'review_click');

        const { count: aiSuggestionCount } = await (supabase as any)
          .from('analytics_events')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaignId)
          .eq('event_type', 'ai_suggestion');

        setAnalytics({
          scans: scanCount || 0,
          views: scanCount || 0, // Assuming 1 scan = 1 view for now
          ai_suggestions: aiSuggestionCount || 0,
          click_review: reviewClickCount || 0,
        });
      } catch (error) {
        console.error('Error loading campaign:', error);
        toast({
          title: "Error",
          description: "Failed to load campaign details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadCampaignData();
  }, [campaignId, toast]);

  const baseUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
  const reviewUrl = `${baseUrl}/review/${campaignId}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Campaign Not Found</h1>
          <Button onClick={() => navigate("/dashboard")}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  const businessName = campaign?.name || location?.name || 'Business';
  const googleReviewUrl = location?.google_review_url || campaign?.google_review_url;
  const logoUrl = location?.logo_url;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="font-bold uppercase tracking-widest text-[10px] md:text-xs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{campaign?.name}</h1>
            <p className="text-muted-foreground">
              Status: <span className="capitalize font-medium">{campaign?.status}</span>
            </p>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[
              { label: 'QR Scans', value: analytics.scans, icon: QrCode },
              { label: 'Page Views', value: analytics.views, icon: Eye },
              { label: 'AI Suggestions', value: analytics.ai_suggestions, icon: Sparkles },
              { label: 'Review Clicks', value: analytics.click_review, icon: MousePointerClick }
            ].map((stat, i) => (
              <Card key={i} className="border-slate-100 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-3 md:p-6">
                  <CardTitle className="text-[9px] md:text-sm font-bold uppercase tracking-widest text-slate-400">{stat.label}</CardTitle>
                  <stat.icon className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
                </CardHeader>
                <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                  <div className="text-xl md:text-3xl font-black italic">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* QR Code Card */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl rounded-[2rem] overflow-hidden">
              <CardHeader className="p-6 md:p-8">
                <CardTitle className="text-xl font-bold tracking-tight">QR Center</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Deploy to physical locations
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-6 md:space-y-8 p-6 md:p-10 pt-0 md:pt-0">
                <div className="scale-[0.85] sm:scale-100 transition-transform">
                  <BrandedQRCard
                    value={reviewUrl}
                    businessName={businessName}
                    logoUrl={logoUrl}
                    primaryColor="#4285F4"
                    secondaryColor="#ffffff"
                    size={240}
                  />
                </div>
                <Button onClick={() => window.open(reviewUrl, '_blank')} variant="outline"
                  className="w-full h-14 rounded-xl font-bold uppercase tracking-widest text-[10px] border-slate-100">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Live Preview Landing
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl rounded-[2rem] overflow-hidden">
              <CardHeader className="p-6 md:p-8">
                <CardTitle className="text-xl font-bold tracking-tight">Configuration</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Target assets and links
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6 md:p-8 pt-0 md:pt-0">
                {googleReviewUrl && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Google Direct Link</h4>
                    <a
                      href={googleReviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-red-600 font-bold hover:underline break-all block"
                    >
                      {googleReviewUrl}
                    </a>
                  </div>
                )}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Review Booster URL</h4>
                  <p className="text-sm font-bold text-slate-900 break-all">{reviewUrl}</p>
                </div>
                {location && (
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Linked Location</h4>
                    <p className="text-base font-black text-slate-900 uppercase italic mb-1">{location.name}</p>
                    {location.address && <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{location.address}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Stats</CardTitle>
              <CardDescription>
                Overview of campaign performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Scans</span>
                  <span className="text-lg font-bold">{analytics.scans}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Review Clicks</span>
                  <span className="text-lg font-bold">{analytics.click_review}</span>
                </div>
                {analytics.scans > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Conversion Rate</span>
                    <span className="text-lg font-bold">
                      {((analytics.click_review / analytics.scans) * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CampaignDetails;
