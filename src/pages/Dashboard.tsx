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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-12 w-12 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-inter">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm border-gray-100">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 active:scale-95 transition-transform cursor-pointer" onClick={() => navigate("/")}>
              <img src="/logo.jpg" alt="Creative Mark Logo" className="h-14 w-auto object-contain rounded-xl shadow-sm" />
            </div>
            {subscription && (
              <Badge
                variant={subscription.isActive ? "default" : "destructive"}
                className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${subscription.isActive ? "bg-red-50 text-red-600 border-red-100 shadow-sm" : ""}`}
              >
                {subscription.isActive ? <CheckCircle2 className="h-3 w-3 mr-2" /> : <ShieldAlert className="h-3 w-3 mr-2" />}
                {subscription.plan === 'yearly' ? 'ENTERPRISE ACTIVE' : 'SYSTEM TRIAL'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-6">
            <LanguageToggle />
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => navigate("/admin")}
                className="border-red-600 text-red-600 hover:bg-red-50 rounded-full px-8 h-12 font-black uppercase tracking-widest text-xs shadow-xl shadow-red-50"
              >
                <Shield className="h-4 w-4 mr-2" />
                Admin Panel
              </Button>
            )}
            <Button variant="ghost" onClick={handleSignOut} className="text-gray-400 hover:text-red-600 rounded-full px-8 h-12 font-black uppercase tracking-widest text-xs transition-colors">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16 max-w-7xl">
        <div className="mb-12">
          <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic">Operational HUB</h2>
          <p className="text-sm font-black text-gray-400 uppercase tracking-widest mt-2">{user?.email}</p>
        </div>

        {/* Top Feature Bar - Strict Red & White */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
          <Card
            onClick={() => navigate("/create-campaign")}
            className="border border-gray-100 hover:border-red-600 bg-white shadow-2xl shadow-gray-100/40 group cursor-pointer transition-all hover:-translate-y-2 rounded-[2.5rem] overflow-hidden"
          >
            <CardContent className="p-10">
              <div className="flex items-center gap-8">
                <div className="bg-red-600 p-6 rounded-3xl group-hover:rotate-6 transition-transform shadow-2xl shadow-red-200">
                  <Plus className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">New Campaign</h3>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-3 group-hover:text-red-600 transition-colors">Start Growth Engine</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            onClick={() => navigate("/nfc-management")}
            className="border border-gray-100 hover:border-red-600 bg-white shadow-2xl shadow-gray-100/40 group cursor-pointer transition-all hover:-translate-y-2 rounded-[2.5rem] overflow-hidden"
          >
            <CardContent className="p-10">
              <div className="flex items-center gap-8">
                <div className="bg-white border-[6px] border-red-600 p-5 rounded-3xl group-hover:rotate-6 transition-transform shadow-2xl shadow-gray-50">
                  <Smartphone className="h-10 w-10 text-red-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">NFC Center</h3>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-3 group-hover:text-red-600 transition-colors">Manage Hardware</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            onClick={() => navigate("/reviews")}
            className="border border-gray-100 hover:border-red-600 bg-white shadow-2xl shadow-gray-100/40 group cursor-pointer transition-all hover:-translate-y-2 rounded-[2.5rem] overflow-hidden"
          >
            <CardContent className="p-10">
              <div className="flex items-center gap-8">
                <div className="bg-gray-900 p-6 rounded-3xl group-hover:rotate-6 transition-transform shadow-2xl">
                  <Bot className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">AI Autopilot</h3>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-3 group-hover:text-red-600 transition-colors">Auto Response Hub</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid - High Contrast */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-20">
          {[
            { label: t('dashboard.total_scans'), value: totalScans, icon: QrCode, color: "text-red-600", bg: "bg-red-50" },
            { label: t('dashboard.total_reviews'), value: totalReviews, icon: Star, color: "text-gray-900", bg: "bg-gray-100" },
            { label: t('dashboard.avg_rating'), value: avgRating.toFixed(1), icon: TrendingUp, color: "text-red-600", bg: "bg-red-50" },
            { label: t('dashboard.private_feedback'), value: privateFeedbackCount, icon: MessageSquare, color: "text-gray-900", bg: "bg-gray-100" },
          ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-xl hover:shadow-2xl transition-all group overflow-hidden bg-white rounded-[3rem] border-b-4 border-transparent hover:border-red-600">
              <CardContent className="p-10">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-3">{stat.label}</p>
                    <h3 className="text-6xl font-black text-gray-900 tracking-tighter leading-none">{stat.value}</h3>
                  </div>
                  <div className={`p-5 ${stat.bg} rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-all shadow-sm`}>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Active Campaigns */}
          <div className="lg:col-span-8 space-y-10">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-4 italic font-bold">
                <Zap className="h-8 w-8 text-red-600 fill-red-600" />
                {t('dashboard.active_campaigns')}
              </h3>
              <Button onClick={() => navigate("/locations")} variant="ghost" className="text-red-600 font-black hover:bg-red-50 uppercase tracking-widest text-xs px-6 h-12 rounded-2xl shadow-sm border border-red-50">
                Manage Branches
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {campaigns.length > 0 ? (
                campaigns.map((campaign) => (
                  <Card
                    key={campaign.id}
                    className="border border-gray-100 shadow-2xl overflow-hidden group cursor-pointer bg-white rounded-[3.5rem] transition-all hover:scale-[1.02] hover:shadow-red-500/10 hover:border-red-200"
                    onClick={() => navigate(`/campaign/${campaign.id}`)}
                  >
                    <div className="h-56 bg-gray-50 relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 bg-red-600/5 group-hover:bg-red-600/10 transition-colors"></div>
                      <div className="relative z-10 bg-white p-8 rounded-[2rem] shadow-2xl group-hover:rotate-12 transition-transform border border-gray-100">
                        <QrCode className="h-16 w-16 text-red-600" />
                      </div>
                    </div>
                    <CardContent className="p-10">
                      <h4 className="font-black text-3xl text-gray-900 uppercase tracking-tighter mb-4 truncate leading-none">{campaign.name}</h4>
                      <div className="flex items-center justify-between pt-8 border-t border-gray-50 mt-4">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Commissioned {new Date(campaign.created_at).toLocaleDateString()}</p>
                        <div className="flex items-center gap-2 text-red-600 font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                          Audit <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 py-40 text-center bg-white rounded-[5rem] border-4 border-dashed border-gray-50 group hover:border-red-100 transition-colors">
                  <div className="p-12 bg-red-50 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-10 shadow-inner group-hover:scale-110 transition-transform">
                    <Zap className="h-16 w-16 text-red-600/20" />
                  </div>
                  <h4 className="text-2xl font-black text-gray-300 uppercase tracking-[0.4em] mb-12 italic">{t('dashboard.no_activity')}</h4>
                  <Button onClick={() => navigate("/create-campaign")} className="bg-red-600 hover:bg-black text-white h-20 px-16 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-sm shadow-2xl shadow-red-200 active:scale-[0.97] transition-all">
                    Initialize Deployment
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-4 space-y-10">
            <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-4 px-4 italic font-bold">
              <HistoryIcon className="h-8 w-8 text-red-600" />
              {t('dashboard.recent_activity')}
            </h3>
            <Card className="border border-gray-100 shadow-2xl overflow-hidden bg-white min-h-[600px] rounded-[3.5rem]">
              <CardContent className="p-0">
                <div className="divide-y divide-gray-50">
                  {recentInteractions.length > 0 ? (
                    recentInteractions.map((interaction) => (
                      <div key={interaction.id} className="p-8 hover:bg-red-50/50 transition-all flex items-center gap-6 group cursor-pointer border-l-8 border-transparent hover:border-red-600">
                        <div className={`p-5 rounded-2xl transition-all group-hover:scale-110 shadow-sm ${interaction.event_type === 'review_click' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}`}>
                          {interaction.event_type === 'review_click' ? <Star className="h-6 w-6" /> : <QrCode className="h-6 w-6" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-base font-black text-gray-900 uppercase tracking-tighter">
                            {interaction.event_type === 'review_click' ? 'AI Review Match' : 'New Scan Logged'}
                          </p>
                          <p className="text-xs text-gray-400 font-black uppercase tracking-widest mt-2 italic">
                            {new Date(interaction.created_at).toLocaleString()}
                          </p>
                        </div>
                        <MousePointer2 className="h-5 w-5 text-gray-100 group-hover:text-red-500 transition-colors" />
                      </div>
                    ))
                  ) : (
                    <div className="py-56 text-center opacity-40">
                      <Cpu className="h-24 w-24 text-gray-200 mx-auto mb-10 animate-pulse" />
                      <p className="text-gray-300 font-black uppercase tracking-[0.4em] text-xs">Awaiting Global Signals...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="py-24 border-t border-gray-50 bg-gray-50/30 mt-32 rounded-t-[5rem]">
        <div className="container mx-auto px-10 flex flex-col items-center gap-10">
          <img src="/logo.jpg" alt="Creative Mark" className="h-20 w-auto object-contain rounded-2xl shadow-sm grayscale opacity-60" />
          <div className="space-y-6 text-center">
            <p className="text-xl font-black uppercase tracking-[0.4em] text-gray-900 leading-none">
              Intelligence &bull; Creative Mark Systems
            </p>
            <p className="text-xs text-gray-400 font-black uppercase tracking-widest max-w-lg mx-auto leading-loose italic">
              &copy; {new Date().getFullYear()} Precision Automated Global Solutions. All records encrypted and synchronized via Creative Mark Secure Core.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
