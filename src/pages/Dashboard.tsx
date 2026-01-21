import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building2, LogOut, Plus, QrCode, TrendingUp, TrendingDown, Star } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      await loadCampaigns(session.user.id);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load campaigns from campaigns table for logged-in user
  const loadCampaigns = async (userId: string) => {
    try {
      // Fetch campaigns for the logged-in user
      const { data: campaignData, error } = await (supabase as any)
        .from('campaigns')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading campaigns:', error);
        toast({
          title: "Error",
          description: "Failed to load campaigns",
          variant: "destructive",
        });
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
    // 1. Get Total Scans
    const { count: scansCount } = await (supabase as any)
      .from('scan_events')
      .select('*', { count: 'exact', head: true })
      .in('campaign_id', campaignIds);

    setTotalScans(scansCount || 0);

    // 2. Get Reviews & Ratings
    const { data: reviews } = await (supabase as any)
      .from('reviews')
      .select('*')
      .in('campaign_id', campaignIds)
      .order('created_at', { ascending: false });

    if (reviews) {
      setTotalReviews(reviews.length);
      const ratingSum = reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0);
      setAvgRating(reviews.length > 0 ? (ratingSum / reviews.length) : 0);

      // Filter for private feedback (negative sentiment)
      const privateCount = reviews.filter((r: any) => r.sentiment === 'negative' || r.status === 'private_feedback').length;
      setPrivateFeedbackCount(privateCount);

      // Prepare recent activity
      setRecentInteractions(reviews.slice(0, 5));
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="border-b bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">ReviewBoost AI</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              My Business
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2 text-gray-800">Welcome back!</h2>
            <p className="text-muted-foreground">
              Here is what's happening with your reviews today.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/analytics")}>
              <TrendingUp className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
            <Button onClick={() => navigate("/create-campaign")} className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all">
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>

        {/* Quick Stats Row */}
        {campaigns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-none shadow-lg">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-indigo-100 text-sm font-medium mb-1">Total Scans</p>
                    <h3 className="text-3xl font-bold">{totalScans}</h3>
                  </div>
                  <div className="p-2 bg-white/20 rounded-lg">
                    <QrCode className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-indigo-100 shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium mb-1">Total Reviews</p>
                    <h3 className="text-3xl font-bold text-gray-900">{totalReviews}</h3>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-indigo-100 shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium mb-1">Avg. Rating</p>
                    <h3 className="text-3xl font-bold text-gray-900">{avgRating.toFixed(1)}</h3>
                  </div>
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-red-100 shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-red-500 text-sm font-medium mb-1">Private Feedback</p>
                    <h3 className="text-3xl font-bold text-red-600">{privateFeedbackCount}</h3>
                  </div>
                  <div className="p-2 bg-red-50 rounded-lg">
                    <Building2 className="h-5 w-5 text-red-500" />
                  </div>
                </div>
                {privateFeedbackCount > 0 && (
                  <p className="text-xs text-red-400 mt-2">Needs attention</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {campaigns.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <QrCode className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Create your first AI-powered review collection campaign to start gathering Google reviews
              </p>
              <Button onClick={() => navigate("/create-campaign")} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/campaign/${campaign.id}`)}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    {campaign.name || 'Campaign'}
                  </CardTitle>
                  <CardDescription>
                    Status: {campaign.status || 'active'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>View analytics →</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Recent Activity Section */}
        {recentInteractions.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Recent Activity</h3>
            <Card>
              <CardContent className="p-0">
                {recentInteractions.map((interaction, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${interaction.sentiment === 'negative' ? 'bg-red-100' : 'bg-green-100'}`}>
                        {interaction.sentiment === 'negative' ? (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        ) : (
                          <Star className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {interaction.rating} Star {interaction.sentiment === 'negative' ? 'Feedback' : 'Review'}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {interaction.review_text || "No text provided"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {new Date(interaction.created_at).toLocaleDateString()}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${interaction.sentiment === 'negative' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {interaction.sentiment === 'negative' ? 'Private' : 'Public'}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
