import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { AnalyticsStats, Review } from '@/types/database.types';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Users, Star, Clock, Filter, ArrowLeft } from 'lucide-react';

const COLORS = ['#0088FE', '#00C499', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch campaigns for the user (using 'campaigns' table)
      const { data: campaigns } = await (supabase as any)
        .from('campaigns')
        .select('id')
        .eq('owner_id', user.id);

      if (!campaigns || campaigns.length === 0) {
        setLoading(false);
        return;
      }

      const campaignIds = campaigns.map((c: any) => c.id);

      // 2. Fetch reviews (using 'collected_reviews' table)
      let reviewsQuery = (supabase as any)
        .from('collected_reviews')
        .select('*')
        .in('campaign_id', campaignIds)
        .order('created_at', { ascending: false });

      if (dateRange?.from) {
        reviewsQuery = reviewsQuery.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        reviewsQuery = reviewsQuery.lte('created_at', dateRange.to.toISOString());
      }

      const { data: reviewsData } = await reviewsQuery;
      setReviews(reviewsData || []);

      // 3. Fetch Scans (using 'analytics_logs' table)
      let scansQuery = (supabase as any)
        .from('analytics_logs')
        .select('*', { count: 'exact' })
        .in('campaign_id', campaignIds)
        .eq('event_type', 'scan');

      if (dateRange?.from) {
        scansQuery = scansQuery.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        scansQuery = scansQuery.lte('created_at', dateRange.to.toISOString());
      }

      const { count: totalScansCount } = await scansQuery;
      const totalScans = totalScansCount || 0;

      // 4. Calculate analytics stats
      const totalReviews = reviewsData?.length || 0;
      const qrReviews = reviewsData?.filter((r: any) => r.source === 'qr').length || 0;
      const nfcReviews = reviewsData?.filter((r: any) => r.source === 'nfc').length || 0;

      // Simple conversion rate calculation
      const conversionRate = totalScans > 0 ? (totalReviews / totalScans) * 100 : 0;

      const avgRating = reviewsData && reviewsData.length > 0
        ? reviewsData.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewsData.length
        : 0;

      // Note: time_to_review_seconds and drop_off_stage columns do not exist in schema.
      // Defaulting these stats to 0 or empty.

      const dropOffArray: any[] = []; // Not tracked currently

      setStats({
        totalScans: totalScans, // Count from analytics_logs
        totalReviews,
        conversionRate,
        averageRating: avgRating,
        qrScans: qrReviews, // We treat source='qr' reviews as proxy if scan events not distinguished by source
        nfcTaps: nfcReviews,
        averageTimeToReview: 0, // Not available
        dropOffStages: dropOffArray,
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const sourceData = [
    { name: 'QR Code', value: stats?.qrScans || 0 },
    { name: 'NFC Card', value: stats?.nfcTaps || 0 },
  ];

  const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
    rating: `${rating} Star`,
    count: reviews.filter(r => r.rating === rating).length,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="border-l-8 border-red-600 pl-6 py-2">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-2 p-0 hover:bg-transparent justify-start text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-red-600">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight">Enhanced Analytics</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Track your review performance and insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-slate-900 text-white overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-4 md:p-6">
            <CardTitle className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-red-500 transition-colors">Total Scans</CardTitle>
            <Users className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <div className="text-2xl md:text-4xl font-black italic">{stats?.totalScans || 0}</div>
            <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">
              Interactions
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-4 md:p-6">
            <CardTitle className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">Conv. Rate</CardTitle>
            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <div className="text-2xl md:text-4xl font-black italic text-slate-950">{stats?.conversionRate.toFixed(1) || 0}%</div>
            <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
              {stats?.totalReviews || 0} / {stats?.totalScans || 0} Scans
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-4 md:p-6">
            <CardTitle className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">Avg Rating</CardTitle>
            <Star className="h-3 w-3 md:h-4 md:w-4 text-yellow-500 fill-yellow-500" />
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <div className="text-2xl md:text-4xl font-black italic text-slate-950">{stats?.averageRating.toFixed(1) || 0}</div>
            <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Out of 5.0</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-red-600 text-white overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-4 md:p-6">
            <CardTitle className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-red-100">Reviews</CardTitle>
            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-white" />
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <div className="text-2xl md:text-4xl font-black italic">{stats?.totalReviews || 0}</div>
            <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-red-200 mt-1">Total Collected</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Review Source Distribution</CardTitle>
            <CardDescription>QR Code vs NFC Card</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>Breakdown of review ratings</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ratingDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Drop-off chart removed as data is not available */}
    </div>
  );
}
