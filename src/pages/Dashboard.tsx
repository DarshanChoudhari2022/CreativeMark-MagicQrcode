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
  Bell, Calendar, Sparkles, ArrowRight, Lock, Bot, Smartphone, Gift, Zap, ShieldAlert, CheckCircle2, Loader2
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

  const handleCreateCampaign = () => {
    if (canCreate) {
      navigate("/create-campaign");
    } else {
      toast({
        title: subscription ? t('dashboard.subscription_expired') : t('dashboard.pending_title'),
        description: subscription ? t('dashboard.subscription_expired_desc') : t('dashboard.pending_desc'),
        variant: "destructive",
      });
    }
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
              {t('nav.signin')}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div>
            <h2 className="text-3xl font-black mb-2 text-gray-800 tracking-tight">{t('dashboard.welcome')} 👋</h2>
            <p className="text-muted-foreground font-medium">
              {t('dashboard.subtitle')}
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button variant="outline" onClick={() => navigate("/analytics")} className="flex-1 md:flex-none border-gray-200 shadow-sm">
              <BarChart3 className="h-4 w-4 mr-2 text-blue-500" />
              {t('dashboard.analytics')}
            </Button>
            <Button
              onClick={handleCreateCampaign}
              className={`flex-1 md:flex-none shadow-lg transition-all ${canCreate
                ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600'
                : 'bg-gray-400 cursor-not-allowed hover:bg-gray-500 text-white'
                }`}
            >
              {canCreate ? (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('dashboard.new_campaign')}
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  {t('dashboard.upgrade_to_create')}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Access Pending / Verification Overlay */}
        {!subscription && (
          <Card className="mb-10 border-2 border-orange-200 bg-orange-50 shadow-xl animate-in zoom-in duration-300">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="p-5 bg-orange-100 rounded-2xl">
                  <ShieldAlert className="h-10 w-10 text-orange-600" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-black text-orange-900 mb-2 uppercase tracking-tight">{t('dashboard.pending_title')}</h3>
                  <p className="text-orange-800 font-medium leading-relaxed max-w-2xl">
                    {t('dashboard.pending_desc')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription Expired Warning */}
        {subscription && !subscription.isActive && (
          <Card className="mb-8 border-2 border-red-200 bg-red-50 shadow-lg animate-in shake duration-500">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <Bell className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-red-900 text-lg uppercase tracking-tight">{t('dashboard.subscription_expired')}</h3>
                  <p className="text-red-700 font-medium">{t('dashboard.subscription_expired_desc')}</p>
                </div>
              </div>
              <Button className="bg-red-600 hover:bg-red-700 w-full md:w-auto font-bold shadow-lg shadow-red-200">
                <Calendar className="h-4 w-4 mr-2" />
                {t('dashboard.renew_now')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: t('dashboard.total_scans'), value: totalScans, icon: QrCode, color: "text-blue-600", bg: "bg-blue-100" },
            { label: t('dashboard.total_reviews'), value: totalReviews, icon: Star, color: "text-yellow-600", bg: "bg-yellow-100" },
            { label: t('dashboard.avg_rating'), value: avgRating.toFixed(1), icon: TrendingUp, color: "text-green-600", bg: "bg-green-100" },
            { label: t('dashboard.private_feedback'), value: privateFeedbackCount, icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-100" },
          ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
              <div className={`h-1 w-full ${stat.bg.replace('100', '500')}`}></div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{stat.value}</h3>
                  </div>
                  <div className={`p-3 ${stat.bg} rounded-xl group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Campaigns */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">{t('dashboard.active_campaigns')}</h3>
              <Button variant="ghost" size="sm" className="text-red-600 font-bold hover:bg-red-50">
                {t('dashboard.view_all')} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.length > 0 ? (
                campaigns.map((campaign) => (
                  <Card key={campaign.id} className="border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden cursor-pointer" onClick={() => navigate(`/campaign/${campaign.id}`)}>
                    <CardContent className="p-0">
                      <div className="h-24 bg-gray-100 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-blue-600/10"></div>
                        <div className="absolute top-4 right-4 bg-white/50 backdrop-blur-md p-2 rounded-lg group-hover:scale-110 transition-transform">
                          <QrCode className="h-8 w-8 text-gray-800" />
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-black text-lg text-gray-800 line-clamp-1">{campaign.name}</h4>
                        <p className="text-gray-500 text-sm font-medium">{new Date(campaign.created_at).toLocaleDateString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 py-12 text-center bg-gray-100/50 rounded-2xl border-2 border-dashed border-gray-200">
                  <div className="p-4 bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Plus className="h-8 w-8 text-gray-300" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-400 uppercase tracking-widest">{t('dashboard.no_activity')}</h4>
                  <Button variant="outline" className="mt-4 border-gray-300" onClick={handleCreateCampaign}>
                    Create Your First Campaign
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="text-xl font-black text-gray-800 mb-4 uppercase tracking-tight">{t('dashboard.recent_activity')}</h3>
            <Card className="border-0 shadow-sm overflow-hidden min-h-[400px]">
              <CardContent className="p-0">
                <div className="divide-y divide-gray-50">
                  {recentInteractions.length > 0 ? (
                    recentInteractions.map((interaction) => (
                      <div key={interaction.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${interaction.event_type === 'review_click' ? 'bg-green-100' : interaction.event_type === 'scan' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                          {interaction.event_type === 'review_click' ? <Star className="h-4 w-4 text-green-600" /> : <QrCode className="h-4 w-4 text-blue-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-800">
                            {interaction.event_type === 'review_click' ? 'New Interaction' : 'QR Scan Detected'}
                          </p>
                          <p className="text-xs text-gray-500 font-medium">
                            {new Date(interaction.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center">
                      <Bot className="h-12 w-12 text-gray-200 mx-auto mb-2" />
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">{t('dashboard.no_activity')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="py-12 border-t bg-white">
        <div className="container mx-auto px-4 flex flex-col items-center gap-4">
          <img src="/logo.jpg" alt="Creative Mark" className="h-12 w-auto object-contain rounded-lg shadow-sm" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
            ReviewBoost &bull; Creative Mark AI Systems
          </p>
          <p className="text-[10px] text-gray-400">
            &copy; {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
