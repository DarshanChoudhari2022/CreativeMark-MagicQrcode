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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="border-b bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.jpg" alt="Creative Mark Logo" className="h-12 w-auto object-contain" />
            </div>
            {subscription && (
              <Badge
                variant={subscription.isActive ? "default" : "destructive"}
                className={subscription.isActive ? "bg-green-100 text-green-700" : ""}
              >
                {subscription.isActive ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <ShieldAlert className="h-3 w-3 mr-1" />}
                {subscription.plan === 'yearly' ? 'ReviewBoost Pro' : 'Free Trial'}
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
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <Shield className="h-4 w-4 mr-2" />
                Admin Panel
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="hidden md:flex">
              <Building2 className="h-4 w-4 mr-2" />
              {t('nav.overview')}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-gray-600 hover:text-red-600">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl font-inter">

        {/* Top Feature Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card
            onClick={() => navigate("/create-campaign")}
            className="border-2 border-red-50 hover:border-red-200 bg-white shadow-xl shadow-red-500/5 group cursor-pointer transition-all hover:-translate-y-1"
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-5">
                <div className="bg-red-600 p-4 rounded-2xl group-hover:rotate-12 transition-transform shadow-lg shadow-red-200">
                  <Plus className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">New Campaign</h3>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Start Growth</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            onClick={() => navigate("/nfc-management")}
            className="border-2 border-blue-50 hover:border-blue-200 bg-white shadow-xl shadow-blue-500/5 group cursor-pointer transition-all hover:-translate-y-1"
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-5">
                <div className="bg-blue-600 p-4 rounded-2xl group-hover:rotate-12 transition-transform shadow-lg shadow-blue-200">
                  <Smartphone className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">NFC Center</h3>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Manage Devices</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            onClick={() => navigate("/reviews")}
            className="border-2 border-purple-50 hover:border-purple-200 bg-white shadow-xl shadow-purple-500/5 group cursor-pointer transition-all hover:-translate-y-1"
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-5">
                <div className="bg-purple-600 p-4 rounded-2xl group-hover:rotate-12 transition-transform shadow-lg shadow-purple-200">
                  <Bot className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">AI Automation</h3>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Auto Replies</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: t('dashboard.total_scans'), value: totalScans, icon: QrCode, color: "text-red-600", bg: "bg-red-50" },
            { label: t('dashboard.total_reviews'), value: totalReviews, icon: Star, color: "text-amber-600", bg: "bg-amber-50" },
            { label: t('dashboard.avg_rating'), value: avgRating.toFixed(1), icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
            { label: t('dashboard.private_feedback'), value: privateFeedbackCount, icon: MessageSquare, color: "text-indigo-600", bg: "bg-indigo-50" },
          ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow group overflow-hidden bg-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                    <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{stat.value}</h3>
                  </div>
                  <div className={`p-4 ${stat.bg} rounded-2xl group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Campaigns */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                <Zap className="h-5 w-5 text-red-600" />
                {t('dashboard.active_campaigns')}
              </h3>
              <Button variant="ghost" size="sm" className="text-red-600 font-black hover:bg-red-50 uppercase tracking-widest text-xs">
                {t('dashboard.view_all')}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {campaigns.length > 0 ? (
                campaigns.map((campaign) => (
                  <Card
                    key={campaign.id}
                    className="border-0 shadow-xl overflow-hidden group cursor-pointer bg-white"
                    onClick={() => navigate(`/campaign/${campaign.id}`)}
                  >
                    <div className="h-32 bg-gray-100 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-black/5 group-hover:scale-105 transition-transform"></div>
                      <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-3 rounded-2xl group-hover:bg-white group-hover:rotate-12 transition-all">
                        <QrCode className="h-6 w-6 text-gray-800" />
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h4 className="font-black text-xl text-gray-900 uppercase tracking-tight mb-2 truncate">{campaign.name}</h4>
                      <div className="flex items-center justify-between">
                        <p className="text-gray-400 text-xs font-black uppercase tracking-widest">{new Date(campaign.created_at).toLocaleDateString()}</p>
                        <div className="flex items-center gap-1 text-red-600 font-black text-xs uppercase tracking-widest">
                          Manage <ArrowRight className="h-3 w-3" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 py-16 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                  <div className="p-6 bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <Zap className="h-10 w-10 text-red-600 opacity-20" />
                  </div>
                  <h4 className="text-lg font-black text-gray-400 uppercase tracking-widest">{t('dashboard.no_activity')}</h4>
                  <Button variant="outline" className="mt-6 border-red-100 text-red-600 hover:bg-red-50 font-black uppercase tracking-widest" onClick={() => navigate("/create-campaign")}>
                    Create Your First Campaign
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-4">
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2 px-2">
              <HistoryIcon className="h-5 w-5 text-red-600" />
              {t('dashboard.recent_activity')}
            </h3>
            <Card className="border-0 shadow-xl overflow-hidden bg-white min-h-[500px]">
              <CardContent className="p-0">
                <div className="divide-y divide-gray-50 font-inter">
                  {recentInteractions.length > 0 ? (
                    recentInteractions.map((interaction) => (
                      <div key={interaction.id} className="p-5 hover:bg-gray-50/50 transition-colors flex items-center gap-4 group">
                        <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 ${interaction.event_type === 'review_click' ? 'bg-amber-100' : interaction.event_type === 'scan' ? 'bg-red-100' : 'bg-indigo-100'}`}>
                          {interaction.event_type === 'review_click' ? <Star className="h-5 w-5 text-amber-600" /> : <QrCode className="h-5 w-5 text-red-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black text-gray-900 uppercase tracking-tight">
                            {interaction.event_type === 'review_click' ? 'Review Generated' : 'QR Scan Detected'}
                          </p>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                            {new Date(interaction.created_at).toLocaleString()}
                          </p>
                        </div>
                        <MousePointer2 className="h-4 w-4 text-gray-100 group-hover:text-red-500 transition-colors" />
                      </div>
                    ))
                  ) : (
                    <div className="py-32 text-center">
                      <Cpu className="h-16 w-16 text-gray-100 mx-auto mb-4" />
                      <p className="text-gray-300 font-extrabold uppercase tracking-[0.2em] text-[10px]">{t('dashboard.no_activity')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="py-12 border-t bg-white mt-12">
        <div className="container mx-auto px-4 flex flex-col items-center gap-4">
          <img src="/logo.jpg" alt="Creative Mark" className="h-12 w-auto object-contain rounded-lg shadow-sm" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
            ReviewBoost &bull; Creative Mark AI Systems
          </p>
          <p className="text-[10px] text-gray-400 font-bold">
            &copy; {new Date().getFullYear()} All rights reserved. Precision Automated Solutions.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
