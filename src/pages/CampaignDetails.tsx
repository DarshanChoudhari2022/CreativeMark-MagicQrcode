import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, QrCode, TrendingUp, Eye, MousePointerClick, Sparkles, ExternalLink, ShieldCheck, Download, Share2, Globe, CheckCircle2, Loader2 } from "lucide-react";
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

        const { data: analyticsData } = await (supabase as any)
          .from('analytics_logs')
          .select('*')
          .eq('campaign_id', campaignId);

        if (analyticsData) {
          setAnalytics({
            scans: analyticsData.filter((l: any) => l.event_type === 'scan').length,
            click_review: analyticsData.filter((l: any) => l.event_type === 'review_click').length,
            private_feedback: analyticsData.filter((l: any) => l.event_type === 'private_feedback').length,
          });
        }
      } catch (error) {
        console.error('Error loading campaign:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCampaignData();
  }, [campaignId]);

  const baseUrl = window.location.origin;
  const reviewUrl = `${baseUrl}/review/${campaignId}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-inter">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="text-gray-400 hover:text-red-600 rounded-full h-10 px-6 font-black uppercase tracking-widest text-[10px]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Logo" className="h-8 w-auto rounded-md" />
            <div className="bg-red-50 px-3 py-1 rounded-full border border-red-100">
              <span className="text-[9px] font-black uppercase tracking-widest text-red-600 leading-none">Campaign Details</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-12">

          {/* Left Column: QR Card & Actions */}
          <div className="lg:w-1/2 space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8">
                <div className="bg-red-600 p-4 rounded-2xl shadow-xl shadow-red-200">
                  <QrCode className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="mb-12">
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none">{campaign?.name}</h1>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-3 flex items-center gap-2">
                  <Globe className="h-3 w-3 text-red-600" /> ID: {campaign?.id?.substring(0, 8)} &bull; ACTIVE
                </p>
              </div>

              <div className="bg-gray-50 rounded-[2.5rem] p-1 shadow-inner overflow-hidden border border-gray-100">
                <BrandedQRCard
                  campaignName={campaign?.name}
                  reviewUrl={reviewUrl}
                  primaryColor={campaign?.theme_color || '#dc2626'}
                  logoUrl={location?.logo_url}
                  category={campaign?.category}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-12">
                <Button className="h-16 rounded-2xl bg-red-600 hover:bg-black text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-red-100">
                  <Download className="h-4 w-4 mr-2" />
                  Download Assets
                </Button>
                <Button variant="outline" className="h-16 rounded-2xl border-gray-200 text-gray-900 font-black uppercase tracking-widest text-[10px]" onClick={() => {
                  navigator.clipboard.writeText(reviewUrl);
                  toast({ title: "Copied!", description: "Review link copied to clipboard." });
                }}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            </div>

            <div className="bg-gray-900 p-10 rounded-[2.5rem] text-white flex items-center justify-between group overflow-hidden relative">
              <div className="absolute inset-0 bg-red-600/5 group-hover:bg-red-600/10 transition-colors"></div>
              <div className="relative z-10">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] mb-2">Automated Landing Page</p>
                <h3 className="text-2xl font-black uppercase tracking-tighter">View Live Site</h3>
              </div>
              <Button
                onClick={() => window.open(reviewUrl, '_blank')}
                className="relative z-10 w-16 h-16 rounded-2xl bg-white text-gray-900 hover:bg-red-600 hover:text-white transition-all shadow-2xl"
              >
                <ExternalLink className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Right Column: Analytics & Stats */}
          <div className="lg:w-1/2 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: "Total Scans", value: analytics.scans, icon: TrendingUp, color: "text-red-600", bg: "bg-red-50" },
                { label: "Google Conversions", value: analytics.click_review, icon: MousePointerClick, color: "text-gray-900", bg: "bg-gray-100" },
                { label: "Private Reports", value: analytics.private_feedback || 0, icon: ShieldCheck, color: "text-red-600", bg: "bg-red-50" },
                { label: "Growth Index", value: "98%", icon: Sparkles, color: "text-gray-900", bg: "bg-gray-100" }
              ].map((stat, i) => (
                <Card key={i} className="border-0 shadow-lg rounded-[2rem] bg-white group hover:scale-[1.02] transition-all overflow-hidden border-b-4 border-transparent hover:border-red-600">
                  <CardContent className="p-8">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <h4 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">{stat.value}</h4>
                      </div>
                      <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} shadow-sm group-hover:rotate-6 transition-transform`}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-0 shadow-xl rounded-[3rem] bg-white overflow-hidden p-10 space-y-8">
              <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Campaign Strategy</h3>
                <div className="bg-red-50 px-4 py-1.5 rounded-full border border-red-100">
                  <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Enterprise Edition</span>
                </div>
              </div>

              <div className="space-y-6">
                {[
                  { title: "Smart Content Generation", status: "Active", desc: "AI currently generating English & Marathi review suggestions." },
                  { title: "NFC Pulse Verification", status: "Online", desc: "Real-time verification enabled for paired physical devices." },
                  { title: "Spam Immunity System", status: "Enabled", desc: "Autonomous filtering of duplicate or bot interactions." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="bg-red-50 p-3 h-fit rounded-xl group-hover:bg-red-600 transition-colors">
                      <CheckCircle2 className="h-4 w-4 text-red-600 group-hover:text-white" />
                    </div>
                    <div className="border-b border-gray-50 pb-6 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-black text-gray-900 uppercase tracking-tight text-sm">{item.title}</p>
                        <span className="text-[9px] font-black uppercase text-green-600">{item.status}</span>
                      </div>
                      <p className="text-xs text-gray-400 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="ghost" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all">
                Modify Deployment configuration
              </Button>
            </Card>
          </div>
        </div>
      </main>

      <footer className="py-20 border-t border-gray-50 text-center">
        <img src="/logo.jpg" alt="Logo" className="h-10 w-auto mx-auto mb-4" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">© 2026 Creative Mark Precision Systems</p>
      </footer>
    </div>
  );
};

export default CampaignDetails;
