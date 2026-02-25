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
  Bell, Calendar, Sparkles, ArrowRight, ArrowLeft, Lock, Bot, Smartphone, Gift, Zap, ShieldAlert, CheckCircle2,
  Cpu, LayoutDashboard, Share2, MousePointer2, Loader2, History as HistoryIcon, Menu, X
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
  const [viewMode, setViewMode] = useState<'personal' | 'global'>('personal');
  const [subscription, setSubscription] = useState<{ plan: string; isActive: boolean; daysRemaining: number } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

      const adminUser = await checkAdminAccess(session.user.id);
      const isUserAdmin = adminUser?.role === 'super_admin' || adminUser?.role === 'admin';
      setIsAdmin(isUserAdmin);

      const createAccess = await canCreateCampaign(session.user.id);
      setCanCreate(createAccess.allowed);

      const subDetails = await getSubscriptionDetails(session.user.id);
      setSubscription(subDetails);

      await loadData(session.user.id, viewMode);
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
  }, [navigate, viewMode]);

  const loadData = async (userId: string, mode: 'personal' | 'global') => {
    setLoading(true);
    try {
      let query = (supabase as any).from('campaigns').select('*').order('created_at', { ascending: false });
      if (mode === 'personal') {
        query = query.eq('owner_id', userId);
      }
      const { data: campaignData, error } = await query;
      if (error) {
        console.error('Error loading campaigns:', error);
      } else {
        setCampaigns(campaignData || []);
        if (campaignData && campaignData.length > 0) {
          await loadDashboardMetrics(userId, campaignData.map((c: any) => c.id), mode);
        } else {
          setTotalScans(0);
          setTotalReviews(0);
          setPrivateFeedbackCount(0);
          setRecentInteractions([]);
        }
      }
    } catch (error) {
      console.error('Error in loadData:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardMetrics = async (userId: string, campaignIds: string[], mode: 'personal' | 'global') => {
    try {
      let scansQuery = (supabase as any).from('analytics_logs').select('*', { count: 'exact', head: true }).in('campaign_id', campaignIds);
      let interactionsQuery = (supabase as any).from('analytics_logs').select('*').in('campaign_id', campaignIds).order('created_at', { ascending: false }).limit(10);
      let reviewsQuery = (supabase as any).from('analytics_logs').select('*', { count: 'exact', head: true }).in('campaign_id', campaignIds).eq('event_type', 'review_click');
      let feedbackQuery = (supabase as any).from('analytics_logs').select('*', { count: 'exact', head: true }).in('campaign_id', campaignIds).eq('event_type', 'private_feedback');

      const [scansRes, interactionsRes, reviewsRes, feedbackRes] = await Promise.all([
        scansQuery,
        interactionsQuery,
        reviewsQuery,
        feedbackQuery
      ]);

      setTotalScans(scansRes.count || 0);
      setTotalReviews(reviewsRes.count || 0);
      setPrivateFeedbackCount(feedbackRes.count || 0);
      setRecentInteractions(interactionsRes.data || []);
      setAvgRating(4.8);
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
          <Loader2 className="h-12 w-12 md:h-16 md:w-16 animate-spin text-red-600 mx-auto mb-6 md:mb-8" />
          <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-gray-400 italic">Syncing Core Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-inter pb-16 md:pb-20 relative overflow-hidden text-slate-900">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-red-500/5 rounded-full blur-[80px] md:blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[200px] md:w-[300px] h-[200px] md:h-[300px] bg-slate-200/50 rounded-full blur-[60px] md:blur-[80px] -z-10 -translate-x-1/2 translate-y-1/2"></div>

      {/* Header - Responsive with Hamburger Menu */}
      <header className="border-b bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm border-slate-100">
        <div className="container mx-auto px-4 md:px-8 h-14 md:h-24 flex items-center justify-between">
          {/* Left: Logo + Brand */}
          <div className="flex items-center gap-2 md:gap-8">
            <div className="flex items-center gap-2 md:gap-3 active:scale-95 transition-transform cursor-pointer group" onClick={() => window.location.href = "https://creative-mark.vercel.app/"}>
              <img src="/qr.jpg" alt="Logo" className="h-8 md:h-16 w-auto object-contain rounded-lg md:rounded-xl shadow-md transition-all group-hover:shadow-lg" />
              <div className="hidden sm:block">
                <h1 className="text-base md:text-xl font-bold text-slate-950 tracking-tight leading-none">Smart Tap AI</h1>
                <p className="text-[8px] md:text-[10px] font-semibold text-red-600 uppercase tracking-wider mt-0.5 md:mt-1">Dashboard</p>
              </div>
            </div>
            {subscription && (
              <Badge
                className={`hidden lg:flex px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-wider ${subscription.isActive ? "bg-red-50 text-red-600 border-red-100 shadow-sm" : "bg-slate-100 text-slate-400"}`}
                variant="outline"
              >
                {subscription.isActive ? <CheckCircle2 className="h-3 w-3 mr-1 md:mr-2" /> : <ShieldAlert className="h-3 w-3 mr-1 md:mr-2" />}
                {subscription.isActive ? 'Enterprise' : 'Pending'}
              </Badge>
            )}
          </div>

          {/* Right: Desktop nav + Mobile hamburger */}
          <div className="flex items-center gap-2 md:gap-6">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4 md:gap-6">
              {isAdmin && (
                <Button
                  variant="outline"
                  onClick={() => navigate("/admin")}
                  className="border-red-100 text-red-600 hover:bg-red-50 rounded-lg px-4 md:px-6 h-9 md:h-10 font-bold uppercase tracking-wider text-[9px] md:text-[10px] shadow-sm"
                >
                  <Shield className="h-3.5 w-3.5 mr-2" />
                  Admin
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => window.location.href = "https://creative-mark.vercel.app/"}
                className="text-slate-500 hover:text-red-600 border-slate-200 hover:border-red-100 rounded-lg px-4 md:px-6 h-9 md:h-10 font-bold uppercase tracking-wider text-[9px] md:text-[10px] transition-all hover:bg-red-50"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-2" />
                Home
              </Button>
              <Button variant="ghost" onClick={handleSignOut} className="text-slate-500 hover:text-red-600 rounded-lg px-4 md:px-6 h-9 md:h-10 font-bold uppercase tracking-wider text-[9px] md:text-[10px] transition-all hover:bg-red-50">
                <LogOut className="h-3.5 w-3.5 mr-2" />
                Exit
              </Button>
            </div>

            {/* Mobile Hamburger Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-10 w-10 min-h-[44px] min-w-[44px] rounded-lg hover:bg-slate-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
              {isAdmin && (
                <Button
                  variant="ghost"
                  onClick={() => { navigate("/admin"); setMobileMenuOpen(false); }}
                  className="justify-start h-11 px-4 font-bold uppercase tracking-wider text-[10px] text-red-600 hover:bg-red-50 rounded-lg min-h-[44px]"
                >
                  <Shield className="h-4 w-4 mr-3" />
                  Admin Panel
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => { window.location.href = "https://creative-mark.vercel.app/"; }}
                className="justify-start h-11 px-4 font-bold uppercase tracking-wider text-[10px] text-slate-600 hover:bg-slate-100 rounded-lg min-h-[44px]"
              >
                <ArrowLeft className="h-4 w-4 mr-3" />
                Home
              </Button>
              <Button
                variant="ghost"
                onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                className="justify-start h-11 px-4 font-bold uppercase tracking-wider text-[10px] text-slate-600 hover:bg-slate-100 rounded-lg min-h-[44px]"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 md:px-8 py-6 md:py-16 max-w-7xl">
        {/* Hero Section - Responsive */}
        <div className="mb-8 md:mb-16 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 border-l-4 border-red-600 pl-4 md:pl-10 py-2">
          <div>
            <h2 className="text-2xl md:text-4xl font-bold text-slate-950 tracking-tight leading-tight mb-1 md:mb-2">
              {viewMode === 'global' ? 'Global Command' : 'Operations Center'}
            </h2>
            <p className="text-[9px] md:text-xs font-semibold text-slate-400 uppercase tracking-widest leading-none flex items-center gap-2">
              <Lock className="h-3 w-3 text-red-500" />
              {viewMode === 'global' ? 'Global Network View' : `${user?.email}`}
            </p>
          </div>

          <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            {isAdmin && (
              <div className="bg-white border border-slate-200 p-1 md:p-1.5 rounded-xl md:rounded-2xl flex gap-0.5 md:gap-1 shadow-sm">
                <button
                  onClick={() => setViewMode('personal')}
                  className={`px-3 md:px-6 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-all min-h-[36px] md:min-h-[40px] ${viewMode === 'personal' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Personal
                </button>
                <button
                  onClick={() => setViewMode('global')}
                  className={`px-3 md:px-6 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-all min-h-[36px] md:min-h-[40px] ${viewMode === 'global' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Global
                </button>
              </div>
            )}
            <div className="bg-slate-900 text-white px-4 md:px-6 py-2.5 md:py-4 rounded-xl md:rounded-2xl shadow-xl flex items-center gap-2 md:gap-3">
              <Cpu className="h-3.5 w-3.5 md:h-4 md:w-4 text-red-500" />
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider opacity-80">v2.6.4</span>
            </div>
          </div>
        </div>

        {/* Action Grid - 1 col mobile, 2 col sm, 3 col md */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-8 mb-10 md:mb-24">
          {[
            { label: 'New Campaign', icon: Plus, sub: 'Begin Growth', path: '/create-campaign', color: 'bg-red-600', shadow: 'shadow-red-50' }
          ].map((item, i) => (
            <Card
              key={i}
              onClick={() => navigate(item.path)}
              className="border border-slate-100 hover:border-red-500/30 bg-white shadow-sm hover:shadow-xl group cursor-pointer transition-all hover:-translate-y-1 md:hover:-translate-y-2 rounded-2xl md:rounded-3xl overflow-hidden active:scale-[0.98]"
            >
              <CardContent className="p-5 md:p-10">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className={`${item.color} p-3.5 md:p-5 rounded-xl md:rounded-2xl group-hover:rotate-6 group-hover:scale-110 transition-all shadow-lg ${item.shadow}`}>
                    <item.icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg md:text-xl font-bold text-slate-950 tracking-tight truncate">{item.label}</h3>
                    <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 md:mt-2 group-hover:text-red-600 transition-colors">{item.sub}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-200 group-hover:text-red-500 transition-colors shrink-0 hidden sm:block" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Global Stats - Responsive: 1 col mobile, 2 col tablet, 4 col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8 mb-12 md:mb-32">
          {[
            { label: t('dashboard.total_scans'), value: totalScans, icon: QrCode, color: "text-red-500", bg: "bg-red-50" },
            { label: t('dashboard.total_reviews'), value: totalReviews, icon: Star, color: "text-slate-900", bg: "bg-slate-50" },
            { label: t('dashboard.avg_rating'), value: avgRating.toFixed(1), icon: TrendingUp, color: "text-red-500", bg: "bg-red-50" },
            { label: t('dashboard.private_feedback'), value: privateFeedbackCount, icon: MessageSquare, color: "text-slate-900", bg: "bg-slate-50" },
          ].map((stat, i) => (
            <Card key={i} className="border border-slate-50 shadow-sm hover:shadow-md transition-all group overflow-hidden bg-white rounded-2xl md:rounded-3xl relative">
              <div className="absolute top-0 left-0 w-1 md:w-1.5 h-full bg-slate-100 group-hover:bg-red-500 transition-colors"></div>
              <CardContent className="p-4 md:p-10">
                <div className="flex flex-row md:flex-col-reverse lg:flex-row justify-between items-center md:items-start gap-3 md:gap-4">
                  <div className="flex-1">
                    <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 md:mb-2">{stat.label}</p>
                    <h3 className="text-2xl sm:text-3xl md:text-5xl font-bold text-slate-950 tracking-tight leading-none">{stat.value}</h3>
                  </div>
                  <div className={`p-3 md:p-4 ${stat.bg} rounded-lg md:rounded-xl group-hover:scale-110 group-hover:-rotate-3 transition-all`}>
                    <stat.icon className={`h-5 w-5 md:h-6 md:w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Campaigns + Activity - Stack on mobile, side-by-side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-16">
          {/* Active Campaigns */}
          <div className="lg:col-span-8 space-y-6 md:space-y-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-6 px-1 md:px-2">
              <h3 className="text-xl md:text-2xl font-bold text-slate-950 tracking-tight flex items-center gap-2 md:gap-3">
                <Zap className="h-5 w-5 md:h-6 md:w-6 text-red-500 fill-red-500 animate-pulse" />
                {t('dashboard.active_campaigns')}
              </h3>
              <Button onClick={() => navigate("/locations")} variant="outline" className="text-slate-600 font-bold hover:bg-slate-50 hover:text-red-600 uppercase tracking-widest text-[9px] md:text-[10px] px-4 md:px-8 h-10 md:h-12 rounded-xl shadow-sm border-slate-100 w-full sm:w-auto min-h-[44px]">
                Manage Locations
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-10">
              {campaigns.length > 0 ? (
                campaigns.map((campaign) => (
                  <Card
                    key={campaign.id}
                    className="border border-slate-100 shadow-sm overflow-hidden group cursor-pointer bg-white rounded-2xl md:rounded-[2.5rem] transition-all hover:scale-[1.01] md:hover:scale-[1.02] hover:shadow-xl hover:border-red-500/20 active:scale-[0.98]"
                    onClick={() => navigate(`/campaign/${campaign.id}`)}
                  >
                    <div className="h-32 md:h-48 bg-slate-50 relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-all"></div>
                      <div className="relative z-10 bg-white p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-lg group-hover:rotate-[5deg] group-hover:scale-105 transition-all border border-slate-50">
                        <QrCode className="h-8 w-8 md:h-12 md:w-12 text-red-500" />
                      </div>
                    </div>
                    <CardContent className="p-4 md:p-8">
                      <h4 className="font-bold text-lg md:text-2xl text-slate-950 tracking-tight mb-2 md:mb-4 truncate leading-none">{campaign.name}</h4>
                      <div className="flex items-center justify-between pt-3 md:pt-6 border-t border-slate-50 mt-3 md:mt-6">
                        <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(campaign.created_at).toLocaleDateString()}</p>
                        <div className="flex items-center gap-1 md:gap-2 text-red-500 font-bold text-[9px] md:text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-2 md:translate-x-4 group-hover:translate-x-0 transition-all">
                          Manage <ArrowRight className="h-3 w-3 md:h-3.5 md:w-3.5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full py-16 md:py-32 text-center bg-white rounded-2xl md:rounded-[3rem] border-2 md:border-4 border-dashed border-slate-100 group hover:border-red-100 transition-all duration-700 px-4">
                  <div className="p-6 md:p-10 bg-red-50 rounded-full w-20 h-20 md:w-32 md:h-32 flex items-center justify-center mx-auto mb-6 md:mb-10 shadow-inner group-hover:scale-110 transition-all">
                    <Zap className="h-8 w-8 md:h-12 md:w-12 text-red-200" />
                  </div>
                  <h4 className="text-base md:text-xl font-bold text-slate-300 uppercase tracking-[0.2em] md:tracking-[0.3em] mb-8 md:mb-12">{t('dashboard.no_activity')}</h4>
                  <Button onClick={() => navigate("/create-campaign")} className="bg-red-600 hover:bg-slate-950 text-white h-12 md:h-14 px-8 md:px-10 rounded-xl md:rounded-2xl font-bold uppercase tracking-widest text-[10px] md:text-xs shadow-lg shadow-red-200 active:scale-95 transition-all min-h-[44px] w-full sm:w-auto">
                    Create Your First Campaign
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Activity Log */}
          <div className="lg:col-span-4 space-y-6 md:space-y-12">
            <h3 className="text-xl md:text-2xl font-bold text-slate-950 tracking-tight flex items-center gap-2 md:gap-3 px-1 md:px-2">
              <HistoryIcon className="h-5 w-5 md:h-6 md:w-6 text-red-500" />
              {t('dashboard.recent_activity')}
            </h3>
            <Card className="border border-slate-100 shadow-sm overflow-hidden bg-white min-h-[300px] md:min-h-[600px] rounded-2xl md:rounded-[2.5rem] relative">
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  {recentInteractions.length > 0 ? (
                    recentInteractions.map((interaction) => (
                      <div key={interaction.id} className="p-4 md:p-8 hover:bg-slate-50 transition-all flex items-center gap-3 md:gap-6 group cursor-pointer border-l-4 border-transparent hover:border-red-500">
                        <div className={`p-2.5 md:p-4 rounded-lg md:rounded-xl transition-all group-hover:scale-110 shadow-md shrink-0 ${interaction.event_type === 'review_click' ? 'bg-slate-900 text-white' : 'bg-red-500 text-white'}`}>
                          {interaction.event_type === 'review_click' ? <Star className="h-4 w-4 md:h-5 md:w-5" /> : <QrCode className="h-4 w-4 md:h-5 md:w-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs md:text-sm font-bold text-slate-950 tracking-tight mb-0.5 md:mb-1 truncate">
                            {interaction.event_type === 'review_click' ? 'New Review Interaction' : 'Campaign Scanned'}
                          </p>
                          <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-80">
                            {new Date(interaction.created_at).toLocaleString()}
                          </p>
                        </div>
                        <MousePointer2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-slate-200 group-hover:text-red-400 transition-colors shrink-0" />
                      </div>
                    ))
                  ) : (
                    <div className="py-24 md:py-48 text-center text-slate-300 px-6 md:px-10">
                      <Cpu className="h-10 w-10 md:h-16 md:w-16 mx-auto mb-6 md:mb-8 animate-pulse text-slate-100" />
                      <p className="font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Awaiting Activity...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="py-10 md:py-24 border-t border-slate-100 bg-slate-50 mt-12 md:mt-20">
        <div className="container mx-auto px-4 md:px-8 flex flex-col items-center gap-6 md:gap-10">
          <img
            src="/qr.jpg"
            alt="Creative Mark"
            className="h-10 md:h-16 w-auto object-contain rounded-xl md:rounded-2xl shadow-lg transition-all duration-500 cursor-pointer hover:scale-105"
            onClick={() => window.location.href = "https://creative-mark.vercel.app/"}
          />
          <div className="text-center px-4">
            <p className="text-sm md:text-lg font-bold uppercase tracking-widest text-slate-950 mb-2 md:mb-4">
              Smart Tap AI <span className="text-red-600 mx-1 md:mx-2">&bull;</span> Creative Mark AI
            </p>
            <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest max-w-2xl mx-auto leading-relaxed opacity-80">
              &copy; {new Date().getFullYear()} Global Operational Authority. All protocols secured by Smart Tap AI. v2.6.4 Stable.
            </p>
          </div>
        </div>
      </footer>

      {/* Language Toggle Fixed Bottom Right */}
      <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[100] transform hover:scale-110 transition-all duration-300">
        <div className="bg-white p-2 md:p-3 rounded-full shadow-2xl border border-slate-100">
          <LanguageToggle />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
