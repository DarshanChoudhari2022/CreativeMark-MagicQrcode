import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Building2, LogOut, Plus, QrCode, TrendingUp, TrendingDown, Star,
  Settings, Shield, BarChart3, Users, MessageSquare, Phone,
  Bell, Calendar, Sparkles, ArrowRight, Lock, Bot, Smartphone, Gift, Zap, ShieldAlert, CheckCircle2,
  Cpu, LayoutDashboard, Share2, MousePointer2, Loader2, History as HistoryIcon
} from "lucide-react";
import { checkAdminAccess, canCreateCampaign, getSubscriptionDetails } from "@/services/adminService";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useTranslation } from "react-i18next";
import type { User } from "@supabase/supabase-js";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [canCreate, setCanCreate] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [subscription, setSubscription] = useState<{ plan: string; isActive: boolean; daysRemaining: number } | null>(null);

  // Dashboard Metrics State
  const [totalScans, setTotalScans] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [recentInteractions, setRecentInteractions] = useState<any[]>([]);
  const [privateFeedbackCount, setPrivateFeedbackCount] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

      // Check admin access
      const adminUser = await checkAdminAccess(session.user.id);
      setIsAdmin(adminUser?.role === 'super_admin' || adminUser?.role === 'admin');

      // Check if can create campaigns
      const createAccess = await canCreateCampaign(session.user.id);
      setCanCreate(createAccess.allowed);

      // Get subscription details
      const subDetails = await getSubscriptionDetails(session.user.id);
      setSubscription(subDetails);

      await loadCampaigns(session.user.id);
    };
    checkAuth();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
    return () => authSub.unsubscribe();
  }, [navigate]);

  const loadCampaigns = async (userId: string) => {
    try {
      const { data: campaignData, error } = await (supabase as any)
        .from('campaigns')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading campaigns:', error);
      } else {
        setCampaigns(campaignData || []);
        if (campaignData && campaignData.length > 0) {
          await loadDashboardMetrics(userId, campaignData.map(c => c.id));
        }
      }
    } catch (error) {
      console.error('Error in loadCampaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardMetrics = async (userId: string, campaignIds: string[]) => {
    try {
      const { count: scansCount } = await (supabase as any)
        .from('analytics_logs')
        .select('*', { count: 'exact', head: true })
        .in('campaign_id', campaignIds);

      const { data: interactions } = await (supabase as any)
        .from('analytics_logs')
        .select('*')
        .in('campaign_id', campaignIds)
        .order('created_at', { ascending: false })
        .limit(10);

      const { count: reviewsCount } = await (supabase as any)
        .from('analytics_logs')
        .select('*', { count: 'exact', head: true })
        .in('campaign_id', campaignIds)
        .eq('event_type', 'review_click');

      const { count: feedbackCount } = await (supabase as any)
        .from('analytics_logs')
        .select('*', { count: 'exact', head: true })
        .in('campaign_id', campaignIds)
        .eq('event_type', 'private_feedback');

      setTotalScans(scansCount || 0);
      setTotalReviews(reviewsCount || 0);
      setPrivateFeedbackCount(feedbackCount || 0);
      setRecentInteractions(interactions || []);
      setAvgRating(4.8); // Mock for now
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white font-inter">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-red-600 mx-auto mb-8" />
          <p className="text-[11px] font-black uppercase tracking-[0.5em] text-gray-400 italic">Syncing Core Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-inter pb-32 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-50/50 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2"></div>

      {/* Header - Large Logo */}
      <header className="border-b bg-white/90 backdrop-blur-xl sticky top-0 z-50 shadow-sm border-gray-50">
        <div className="container mx-auto px-8 py-8 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-4 active:scale-95 transition-transform cursor-pointer group" onClick={() => navigate("/")}>
              <img src="/logo.jpg" alt="Logo" className="h-16 md:h-20 w-auto object-contain rounded-2xl md:rounded-3xl shadow-2xl transition-all group-hover:rotate-6" />
              <div className="hidden lg:block">
                <h1 className="text-2xl font-black text-gray-950 uppercase tracking-tighter italic leading-none">ReviewBoost</h1>
                <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em] mt-1.5 italic">Operational Command</p>
              </div>
            </div>
            {subscription && (
              <Badge
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] italic ${subscription.isActive ? "bg-red-600 text-white shadow-xl shadow-red-200" : "bg-gray-100 text-gray-400"}`}
              >
                {subscription.isActive ? <CheckCircle2 className="h-4 w-4 mr-3" /> : <ShieldAlert className="h-4 w-4 mr-3" />}
                {subscription.isActive ? 'ACTIVE ENTERPRISE' : 'ACCESS PENDING'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-8">
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => navigate("/admin")}
                className="border-red-600 text-red-600 hover:bg-red-50 rounded-full px-10 h-14 font-black uppercase tracking-[0.3em] text-xs shadow-sm"
              >
                <Shield className="h-4 w-4 mr-3" />
                Admin Panel
              </Button>
            )}
            <Button variant="ghost" onClick={handleSignOut} className="text-gray-400 hover:text-red-600 rounded-full px-10 h-14 font-black uppercase tracking-[0.3em] text-xs transition-all hover:bg-red-50">
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-8 py-20 max-w-7xl">
        <div className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-10 border-l-[12px] border-red-600 pl-16 py-4">
          <div>
            <h2 className="text-6xl font-black text-gray-950 uppercase tracking-tighter italic leading-none mb-4">Operations Center</h2>
            <p className="text-sm font-black text-gray-400 uppercase tracking-[0.4em] italic leading-none flex items-center gap-3">
              <Lock className="h-4 w-4 text-red-600" />
              Secure Link: {user?.email}
            </p>
          </div>
          <div className="bg-gray-950 text-white px-10 py-5 rounded-[2.5rem] shadow-2xl skew-x-[-10deg] italic">
            <span className="text-xs font-black uppercase tracking-[0.4em]">Protocol Version 2.6.4</span>
          </div>
        </div>

        {/* Action Grid - Standardized Red & White */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-24">
          {[
            { label: 'New Campaign', icon: Plus, sub: 'Start Growth', path: '/create-campaign', color: 'bg-red-600', shadow: 'shadow-red-200' },
            { label: 'NFC Center', icon: Smartphone, sub: 'Hardware Hub', path: '/nfc-management', color: 'bg-gray-950', shadow: 'shadow-gray-200' },
            { label: 'AI Automation', icon: Bot, sub: 'Auto-Response', path: '/reviews', color: 'bg-red-600', shadow: 'shadow-red-200' }
          ].map((item, i) => (
            <Card
              key={i}
              onClick={() => navigate(item.path)}
              className="border-2 border-gray-50 hover:border-red-600 bg-white shadow-3xl shadow-gray-200/50 group cursor-pointer transition-all hover:-translate-y-4 rounded-[4rem] overflow-hidden"
            >
              <CardContent className="p-12">
                <div className="flex items-center gap-10">
                  <div className={`${item.color} p-8 rounded-[2rem] group-hover:rotate-12 transition-all shadow-2xl ${item.shadow}`}>
                    <item.icon className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-gray-950 uppercase tracking-tighter italic leading-none">{item.label}</h3>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mt-4 group-hover:text-red-600 transition-colors italic">{item.sub}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Global Stats - Massive Impact */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-32">
          {[
            { label: t('dashboard.total_scans'), value: totalScans, icon: QrCode, color: "text-red-600", bg: "bg-red-50" },
            { label: t('dashboard.total_reviews'), value: totalReviews, icon: Star, color: "text-gray-950", bg: "bg-gray-50" },
            { label: t('dashboard.avg_rating'), value: avgRating.toFixed(1), icon: TrendingUp, color: "text-red-600", bg: "bg-red-50" },
            { label: t('dashboard.private_feedback'), value: privateFeedbackCount, icon: MessageSquare, color: "text-gray-950", bg: "bg-gray-50" },
          ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-3xl hover:shadow-red-500/10 transition-all group overflow-hidden bg-white rounded-[4rem] relative">
              <div className="absolute top-0 left-0 w-2 h-full bg-red-600/10 group-hover:bg-red-600 transition-colors"></div>
              <CardContent className="p-12">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-[0.4em] mb-4 italic">{stat.label}</p>
                    <h3 className="text-7xl font-black text-gray-950 tracking-tighter leading-none italic">{stat.value}</h3>
                  </div>
                  <div className={`p-6 ${stat.bg} rounded-3xl group-hover:scale-125 group-hover:-rotate-6 transition-all shadow-inner`}>
                    <stat.icon className={`h-10 w-10 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          {/* Active Campaigns */}
          <div className="lg:col-span-8 space-y-16">
            <div className="flex items-center justify-between px-6 border-b-2 border-gray-50 pb-8">
              <h3 className="text-4xl font-black text-gray-950 uppercase tracking-tighter flex items-center gap-6 italic">
                <Zap className="h-10 w-10 text-red-600 fill-red-600 animate-pulse" />
                {t('dashboard.active_campaigns')}
              </h3>
              <Button onClick={() => navigate("/locations")} variant="ghost" className="text-red-600 font-black hover:bg-red-50 uppercase tracking-[0.3em] text-xs px-10 h-16 rounded-[1.5rem] shadow-sm border border-red-50 italic">
                Manage Branches
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              {campaigns.length > 0 ? (
                campaigns.map((campaign) => (
                  <Card
                    key={campaign.id}
                    className="border border-gray-50 shadow-3xl overflow-hidden group cursor-pointer bg-white rounded-[5rem] transition-all hover:scale-[1.03] hover:shadow-red-500/20 hover:border-red-600"
                    onClick={() => navigate(`/campaign/${campaign.id}`)}
                  >
                    <div className="h-64 bg-gray-50 relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 bg-red-600/[0.03] group-hover:bg-red-600/[0.08] transition-all"></div>
                      <div className="relative z-10 bg-white p-12 rounded-[3.5rem] shadow-3xl group-hover:rotate-[15deg] group-hover:scale-110 transition-all border border-gray-50">
                        <QrCode className="h-20 w-20 text-red-600" />
                      </div>
                    </div>
                    <CardContent className="p-16">
                      <h4 className="font-black text-4xl text-gray-950 uppercase tracking-tighter mb-6 truncate leading-none italic">{campaign.name}</h4>
                      <div className="flex items-center justify-between pt-10 border-t border-gray-50 mt-10">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] italic">{new Date(campaign.created_at).toLocaleDateString()}</p>
                        <div className="flex items-center gap-4 text-red-600 font-black text-xs uppercase tracking-[0.4em] opacity-0 group-hover:opacity-100 translate-x-10 group-hover:translate-x-0 transition-all italic leading-none">
                          System Access <ArrowRight className="h-5 w-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 py-56 text-center bg-white rounded-[6rem] border-8 border-dashed border-gray-50 group hover:border-red-100 transition-all duration-1000">
                  <div className="p-16 bg-red-50 rounded-full w-48 h-48 flex items-center justify-center mx-auto mb-16 shadow-inner group-hover:scale-110 transition-all">
                    <Zap className="h-24 w-24 text-red-600/10" />
                  </div>
                  <h4 className="text-3xl font-black text-gray-300 uppercase tracking-[0.5em] mb-20 italic underline decoration-red-600/20 underline-offset-[30px] decoration-4">{t('dashboard.no_activity')}</h4>
                  <Button onClick={() => navigate("/create-campaign")} className="bg-red-600 hover:bg-black text-white h-24 px-24 rounded-[3rem] font-black uppercase tracking-[0.5em] text-sm shadow-[0_40px_80px_-20px_rgba(220,38,38,0.5)] active:scale-[0.95] transition-all italic">
                    START UNIT ZERO
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Activity Log - Editorial Theme */}
          <div className="lg:col-span-4 space-y-16">
            <h3 className="text-4xl font-black text-gray-950 uppercase tracking-tighter flex items-center gap-6 px-4 italic leading-none">
              <HistoryIcon className="h-10 w-10 text-red-600" />
              {t('dashboard.recent_activity')}
            </h3>
            <Card className="border border-gray-50 shadow-3xl overflow-hidden bg-white min-h-[800px] rounded-[5rem] relative">
              <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent pointer-events-none z-10"></div>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-50">
                  {recentInteractions.length > 0 ? (
                    recentInteractions.map((interaction) => (
                      <div key={interaction.id} className="p-10 hover:bg-red-50/50 transition-all flex items-center gap-8 group cursor-pointer border-l-[12px] border-transparent hover:border-red-600">
                        <div className={`p-6 rounded-[1.5rem] transition-all group-hover:scale-110 shadow-2xl ${interaction.event_type === 'review_click' ? 'bg-gray-950 text-white shadow-gray-200' : 'bg-red-600 text-white shadow-red-200'}`}>
                          {interaction.event_type === 'review_click' ? <Star className="h-8 w-8" /> : <QrCode className="h-8 w-8" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-lg font-black text-gray-950 uppercase tracking-tighter leading-none mb-3 italic">
                            {interaction.event_type === 'review_click' ? 'Review Confirmed' : 'Sync Detected'}
                          </p>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em] italic leading-none opacity-60">
                            {new Date(interaction.created_at).toLocaleString()}
                          </p>
                        </div>
                        <MousePointer2 className="h-6 w-6 text-gray-100 group-hover:text-red-500 transition-colors" />
                      </div>
                    ))
                  ) : (
                    <div className="py-72 text-center">
                      <Cpu className="h-32 w-32 text-gray-100 mx-auto mb-16 animate-pulse" />
                      <p className="text-gray-300 font-black uppercase tracking-[0.6em] text-[10px] italic">Awaiting Satellite Sync...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer Branding - Massive impact */}
      <footer className="py-32 border-t border-gray-50 bg-gray-50/30 mt-48 rounded-t-[8rem]">
        <div className="container mx-auto px-12 flex flex-col items-center gap-16">
          <img src="/logo.jpg" alt="Creative Mark" className="h-28 w-auto object-contain rounded-3xl shadow-3xl grayscale opacity-30 hover:opacity-100 hover:grayscale-0 transition-all duration-1000" />
          <div className="space-y-10 text-center">
            <p className="text-3xl font-black uppercase tracking-[0.6em] text-gray-950 leading-none italic font-bold opacity-80 decoration-red-600 underline underline-offset-[20px] decoration-8">
              ReviewBoost &bull; Creative Mark AI Systems
            </p>
            <p className="text-xs text-gray-400 font-black uppercase tracking-[0.4em] max-w-2xl mx-auto leading-loose italic opacity-60">
              &copy; {new Date().getFullYear()} Global Operational Authority. All protocols encrypted via Creative Mark Secure Core. Version 2.6.4 Stable.
            </p>
          </div>
        </div>
      </footer>

      {/* Language Toggle Fixed Bottom Right */}
      <div className="fixed bottom-12 right-12 z-[100] transform hover:scale-125 transition-all duration-500 group">
        <div className="absolute inset-0 bg-red-600 blur-[40px] opacity-0 group-hover:opacity-30 transition-opacity rounded-full"></div>
        <div className="bg-white p-4 rounded-full shadow-[0_50px_100px_rgba(220,38,38,0.4)] border-4 border-red-50 relative z-10 transition-transform">
          <LanguageToggle />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
