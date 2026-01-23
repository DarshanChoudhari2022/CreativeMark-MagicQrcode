import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { NFCCard } from '@/types/database.types';
import { Nfc, Plus, Trash2, ArrowLeft, Loader2, Smartphone, ShieldCheck, Zap, History as HistoryIcon, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '@/components/LanguageToggle';

export default function NFCManagement() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [nfcCards, setNfcCards] = useState<NFCCard[]>([]);
  const [newCardId, setNewCardId] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCampaigns();
    fetchNFCCards();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('review_campaigns')
        .select('id, campaign_name')
        .eq('business_id', user.id);

      setCampaigns(data || []);
      if (data && data.length > 0) {
        setSelectedCampaign(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const fetchNFCCards = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // In this specific schema, nfc_cards might be linked to review_campaigns
      const { data } = await (supabase as any)
        .from('nfc_cards')
        .select('*, review_campaigns(campaign_name)')
        .order('created_at', { ascending: false });

      setNfcCards(data || []);
    } catch (error) {
      console.error('Error fetching NFC cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async () => {
    if (!newCardId.trim()) {
      toast.error('Please enter a valid Card UID');
      return;
    }

    if (!selectedCampaign) {
      toast.error('Please select a campaign to link');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await (supabase as any)
        .from('nfc_cards')
        .insert({
          campaign_id: selectedCampaign,
          card_id: newCardId.trim(),
          taps_count: 0,
        });

      if (error) throw error;

      toast.success('Professional NFC Card Registered!');
      setNewCardId('');
      fetchNFCCards();
    } catch (error: any) {
      console.error('Error adding NFC card:', error);
      toast.error(error.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCard = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('nfc_cards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('NFC Card removed');
      fetchNFCCards();
    } catch (error) {
      console.error('Error deleting NFC card:', error);
      toast.error('Removal failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Premium Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="hover:bg-red-50 text-gray-600 hover:text-red-600">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-red-600 p-2 rounded-lg">
                <Nfc className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">NFC Card Center</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <img src="/logo.jpg" alt="Logo" className="h-10 w-auto object-contain hidden md:block" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Registration Form */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="h-2 bg-red-600"></div>
              <CardHeader>
                <CardTitle className="text-xl font-black text-gray-800 uppercase tracking-tight">Register Card</CardTitle>
                <CardDescription className="font-medium">Link a physical NFC device to your campaign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="card-id" className="text-xs font-bold uppercase tracking-widest text-gray-400">Card UID / Serial</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input
                      id="card-id"
                      placeholder="e.g. NFC-882-012"
                      value={newCardId}
                      onChange={(e) => setNewCardId(e.target.value)}
                      className="pl-10 h-12 bg-gray-50 border-gray-100 focus:border-red-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign" className="text-xs font-bold uppercase tracking-widest text-gray-400">Target Campaign</Label>
                  <div className="relative">
                    <Zap className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <select
                      id="campaign"
                      className="w-full h-12 pl-10 px-3 rounded-md border border-gray-100 bg-gray-50 text-sm font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none"
                      value={selectedCampaign}
                      onChange={(e) => setSelectedCampaign(e.target.value)}
                    >
                      <option value="">Select a Campaign</option>
                      {campaigns.map(c => (
                        <option key={c.id} value={c.id}>{c.campaign_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button
                  onClick={handleAddCard}
                  className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest shadow-lg shadow-red-200"
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <>
                      <Plus className="mr-2 h-5 w-5" />
                      Activate Device
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Tech Info Card */}
            <Card className="bg-gray-900 border-0 text-white shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <ShieldCheck className="h-6 w-6 text-red-500" />
                  </div>
                  <h3 className="font-bold uppercase tracking-tight">Enterprise Security</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed font-medium">
                  All NFC cards are encrypted with Creative Mark technology. Linking a card allows for 1-tap review collection and real-time tap tracking.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right: Active Devices Table */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                <HistoryIcon className="h-6 w-6 text-red-600" />
                Active Devices
              </h2>
              <Badge className="bg-white border-red-100 text-red-600 px-4 py-1.5 shadow-sm">
                {nfcCards.length} Registered
              </Badge>
            </div>

            <Card className="border-0 shadow-xl overflow-hidden bg-white">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow className="border-gray-100 hover:bg-transparent">
                      <TableHead className="font-black text-gray-400 uppercase tracking-widest text-[10px]">Device UID</TableHead>
                      <TableHead className="font-black text-gray-400 uppercase tracking-widest text-[10px]">Campaign</TableHead>
                      <TableHead className="font-black text-gray-400 uppercase tracking-widest text-[10px]">Tap Count</TableHead>
                      <TableHead className="font-black text-gray-400 uppercase tracking-widest text-[10px] text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nfcCards.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-64 text-center">
                          <div className="flex flex-col items-center gap-3 opacity-20">
                            <Smartphone className="h-12 w-12" />
                            <p className="font-black uppercase tracking-widest text-xs">No devices linked</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      nfcCards.map((card) => (
                        <TableRow key={card.id} className="border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <TableCell className="font-mono font-bold text-gray-800">{card.card_id}</TableCell>
                          <TableCell>
                            <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tight">
                              {(card as any).review_campaigns?.campaign_name || 'Active Campaign'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black text-xs">
                                {card.taps_count}
                              </div>
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Taps</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCard(card.id)}
                              className="hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Help Footer */}
            <div className="p-8 bg-white border-2 border-dashed border-gray-100 rounded-3xl text-center">
              <Globe className="h-8 w-8 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest max-w-sm mx-auto">
                Need assistance with NFC programming? Contact Creative Mark Support.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Visual indicator helper (if needed)
const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`text-xs font-black uppercase tracking-widest rounded-full flex items-center justify-center ${className}`}>
    {children}
  </div>
);
