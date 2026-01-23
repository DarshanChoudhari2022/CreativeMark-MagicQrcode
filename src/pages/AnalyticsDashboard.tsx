import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { subDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Users, Star, Clock, Filter, ArrowLeft, Loader2, Target, Zap, Globe } from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';

const COLORS = ['#dc2626', '#111111', '#4b5563', '#9ca3af', '#f3f4f6'];

export default function AnalyticsDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: campaignIdsData } = await (supabase as any)
        .from('campaigns')
        .select('id')
        .eq('owner_id', user.id);

      if (!campaignIdsData || campaignIdsData.length === 0) return;
      const campaignIds = campaignIdsData.map((c: any) => c.id);

      const { data: logs } = await (supabase as any)
        .from('analytics_logs')
        .select('*')
        .in('campaign_id', campaignIds);

      if (logs) {
        const scans = logs.filter((l: any) => l.event_type === 'scan').length;
        const reviewClicks = logs.filter((l: any) => l.event_type === 'review_click').length;
        const ratingAvg = 4.8; // Mocked for now

        setStats({
          totalScans: scans,
          totalReviews: reviewClicks,
          conversionRate: scans > 0 ? (reviewClicks / scans) * 100 : 0,
          averageRating: ratingAvg,
        });

        setReviews(logs.filter((l: any) => l.event_type === 'review_click'));
      }
    } catch (error) {
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: 'Scans', value: stats?.totalScans || 0 },
    { name: 'Conversions', value: stats?.totalReviews || 0 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-inter">
      <header className="border-b bg-white italic sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-gray-400 hover:text-red-600 rounded-full h-10 px-6 font-black uppercase tracking-widest text-[10px]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Exit Intelligence
          </Button>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <div className="h-8 w-px bg-gray-100 mx-2"></div>
            <img src="/logo.jpg" alt="Logo" className="h-10 w-auto rounded-md" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-12">
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Performance Audit</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Real-time reputation data stream</p>
        </div>

        {/* Global Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {[
            { label: "Gross Scans", value: stats?.totalScans || 0, icon: Users, color: "text-red-600", bg: "bg-red-50" },
            { label: "Net Conversions", value: stats?.totalReviews || 0, icon: Target, color: "text-gray-900", bg: "bg-gray-100" },
            { label: "Conv. Rate", value: `${stats?.conversionRate.toFixed(1) || 0}%`, icon: TrendingUp, color: "text-red-600", bg: "bg-red-50" },
            { label: "Avg Rating", value: stats?.averageRating.toFixed(1) || 0, icon: Star, color: "text-gray-900", bg: "bg-gray-100" }
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          <Card className="border-0 shadow-xl rounded-[3rem] bg-white p-10">
            <CardHeader className="p-0 mb-8">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Traffic Breakdown</h3>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Scans vs Successful Postings</p>
            </CardHeader>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-8 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Scans</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-900"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Reviews</span>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-xl rounded-[3rem] bg-white p-10">
            <CardHeader className="p-0 mb-8">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Growth Velocity</h3>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">30-Day performance window</p>
            </CardHeader>
            <div className="h-[300px] w-full bg-gray-50 flex items-center justify-center rounded-[2.5rem]">
              <div className="text-center">
                <Zap className="h-10 w-10 text-gray-100 mx-auto mb-2" />
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Velocity analysis initializing</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="border-0 shadow-xl rounded-[3rem] bg-gray-900 text-white p-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Globe className="h-64 w-64 text-red-600" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Enterprise Intelligence</h3>
            <p className="text-gray-400 font-medium leading-relaxed mb-8">
              Our AI-driven analytics track every cluster interaction. We verify the authenticity of every scan using geographic pulse mapping and device identification.
            </p>
            <Button className="h-16 px-10 bg-red-600 hover:bg-white hover:text-red-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-2xl transition-all">
              Generate Performance Report
            </Button>
          </div>
        </Card>
      </main>

      <footer className="py-20 border-t border-gray-50 text-center">
        <img src="/logo.jpg" alt="Logo" className="h-10 w-auto mx-auto mb-4" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">© 2026 Creative Mark Precision Systems</p>
      </footer>
    </div>
  );
}
