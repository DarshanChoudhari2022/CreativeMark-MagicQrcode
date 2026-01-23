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
        <Loader2 className="h-10 w-10 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-inter">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.jpg" alt="Creative Mark Logo" className="h-12 w-auto object-contain" />
            </div>
            {subscription && (
              <Badge
                variant={subscription.isActive ? "default" : "destructive"}
                className={subscription.isActive ? "bg-red-50 text-red-600 border-red-100" : ""}
              >
                {subscription.isActive ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <ShieldAlert className="h-3 w-3 mr-1" />}
                {subscription.plan === 'yearly' ? 'PRO ACTIVE' : 'FREE TRIAL'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin")}
                className="border-red-600 text-red-600 hover:bg-red-50 rounded-full px-4 h-9 font-black uppercase tracking-widest text-[10px]"
              >
                <Shield className="h-3.5 w-3.5 mr-2" />
                Admin Panel
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-gray-400 hover:text-red-600 rounded-full px-4 h-9 font-black uppercase tracking-widest text-[10px]">
              <LogOut className="h-3.5 w-3.5 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-7xl">

        {/* Top Feature Bar - Strict Red & White */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card
            onClick={() => navigate("/create-campaign")}
            className="border border-gray-100 hover:border-red-500 bg-white shadow-xl shadow-gray-100/50 group cursor-pointer transition-all hover:-translate-y-1 rounded-[2rem] overflow-hidden"
          >
            <CardContent className="p-8">
              <div className="flex items-center gap-6">
                <div className="bg-red-600 p-5 rounded-2xl group-hover:rotate-6 transition-transform shadow-xl shadow-red-200">
                  <Plus className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">New Campaign</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 group-hover:text-red-600 transition-colors">Start Growth Engine</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            onClick={() => navigate("/nfc-management")}
            className="border border-gray-100 hover:border-red-500 bg-white shadow-xl shadow-gray-100/50 group cursor-pointer transition-all hover:-translate-y-1 rounded-[2rem] overflow-hidden"
          >
            <CardContent className="p-8">
              <div className="flex items-center gap-6">
                <div className="bg-white border-4 border-red-600 p-4 rounded-2xl group-hover:rotate-6 transition-transform shadow-xl shadow-gray-100">
                  <Smartphone className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">NFC Center</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 group-hover:text-red-600 transition-colors">Manage Hardware</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            onClick={() => navigate("/reviews")}
            className="border border-gray-100 hover:border-red-500 bg-white shadow-xl shadow-gray-100/50 group cursor-pointer transition-all hover:-translate-y-1 rounded-[2rem] overflow-hidden"
          >
            <CardContent className="p-8">
              <div className="flex items-center gap-6">
                <div className="bg-red-50 p-5 rounded-2xl group-hover:rotate-6 transition-transform border border-red-100">
                  <Bot className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">AI Autopilot</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 group-hover:text-red-600 transition-colors">Auto Response Hub</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid - High Contrast */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {[
            { label: t('dashboard.total_scans'), value: totalScans, icon: QrCode, color: "text-red-600", bg: "bg-red-50" },
            { label: t('dashboard.total_reviews'), value: totalReviews, icon: Star, color: "text-gray-900", bg: "bg-gray-100" },
            { label: t('dashboard.avg_rating'), value: avgRating.toFixed(1), icon: TrendingUp, color: "text-red-600", bg: "bg-red-50" },
            { label: t('dashboard.private_feedback'), value: privateFeedbackCount, icon: MessageSquare, color: "text-gray-900", bg: "bg-gray-100" },
          ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-sm hover:shadow-xl transition-all group overflow-hidden bg-white rounded-3xl border-b-2 border-transparent hover:border-red-600">
              <CardContent className="p-8">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                    <h3 className="text-5xl font-black text-gray-900 tracking-tighter leading-none">{stat.value}</h3>
                  </div>
                  <div className={`p-4 ${stat.bg} rounded-2xl group-hover:scale-110 transition-transform shadow-sm`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Active Campaigns */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                <Zap className="h-6 w-6 text-red-600" />
                {t('dashboard.active_campaigns')}
              </h3>
              <Button variant="ghost" size="sm" className="text-red-600 font-black hover:bg-red-50 uppercase tracking-widest text-[10px]">
                {t('dashboard.view_all')}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {campaigns.length > 0 ? (
                campaigns.map((campaign) => (
                  <Card
                    key={campaign.id}
                    className="border border-gray-100 shadow-xl overflow-hidden group cursor-pointer bg-white rounded-[2.5rem] transition-all hover:scale-[1.02] hover:shadow-red-500/5 hover:border-red-100"
                    onClick={() => navigate(`/campaign/${campaign.id}`)}
                  >
                    <div className="h-40 bg-gray-50 relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 bg-red-600/5 group-hover:bg-red-600/10 transition-colors"></div>
                      <div className="relative z-10 bg-white p-5 rounded-3xl shadow-xl group-hover:rotate-12 transition-transform border border-gray-100">
                        <QrCode className="h-10 w-10 text-red-600" />
                      </div>
                    </div>
                    <CardContent className="p-8">
                      <h4 className="font-black text-2xl text-gray-900 uppercase tracking-tighter mb-2 truncate leading-none">{campaign.name}</h4>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Since {new Date(campaign.created_at).toLocaleDateString()}</p>
                        <div className="flex items-center gap-1 text-red-600 font-extrabold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                          Config <ArrowRight className="h-3 w-3" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                  <div className="p-8 bg-red-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-8">
                    <Zap className="h-12 w-12 text-red-600/20" />
                  </div>
                  <h4 className="text-lg font-black text-gray-400 uppercase tracking-widest mb-6">{t('dashboard.no_activity')}</h4>
                  <Button variant="outline" className="border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white h-14 px-10 rounded-full font-black uppercase tracking-widest shadow-xl shadow-red-100 transition-all active:scale-95" onClick={() => navigate("/create-campaign")}>
                    Create Your First Campaign
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-widest flex items-center gap-3 px-2">
              <HistoryIcon className="h-6 w-6 text-red-600" />
              {t('dashboard.recent_activity')}
            </h3>
            <Card className="border border-gray-100 shadow-xl overflow-hidden bg-white min-h-[500px] rounded-[2.5rem]">
              <CardContent className="p-0">
                <div className="divide-y divide-gray-50">
                  {recentInteractions.length > 0 ? (
                    recentInteractions.map((interaction) => (
                      <div key={interaction.id} className="p-6 hover:bg-red-50/30 transition-colors flex items-center gap-5 group">
                        <div className={`p-4 rounded-2xl transition-all group-hover:scale-110 shadow-sm ${interaction.event_type === 'review_click' ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-600'}`}>
                          {interaction.event_type === 'review_click' ? <Star className="h-5 w-5" /> : <QrCode className="h-5 w-5" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black text-gray-900 uppercase tracking-tighter">
                            {interaction.event_type === 'review_click' ? 'AI Review Match' : 'New Scan Logged'}
                          </p>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                            {new Date(interaction.created_at).toLocaleString()}
                          </p>
                        </div>
                        <MousePointer2 className="h-4 w-4 text-gray-100 group-hover:text-red-500 transition-colors" />
                      </div>
                    ))
                  ) : (
                    <div className="py-40 text-center">
                      <Cpu className="h-20 w-20 text-gray-100 mx-auto mb-6" />
                      <p className="text-gray-300 font-black uppercase tracking-[0.3em] text-[10px]">{t('dashboard.no_activity')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="py-16 border-t border-gray-100 bg-white mt-20">
        <div className="container mx-auto px-4 flex flex-col items-center gap-6">
          <img src="/logo.jpg" alt="Creative Mark" className="h-16 w-auto object-contain rounded-xl" />
          <div className="space-y-4 text-center">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-gray-900">
              ReviewBoost &bull; Creative Mark AI Systems
            </p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              &copy; {new Date().getFullYear()} Precision Automated Solutions. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
