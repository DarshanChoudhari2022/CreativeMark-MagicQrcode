import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
        .from('campaigns')
        .select('id, name')
        .eq('owner_id', user.id);

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

      const { data } = await (supabase as any)
        .from('nfc_cards')
        .select('*, campaigns(name)')
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
      <div className="min-h-screen flex items-center justify-center bg-white font-inter">
        <Loader2 className="h-16 w-16 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-inter pb-20 relative overflow-hidden text-slate-900">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-500/5 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-slate-200/50 rounded-full blur-[80px] -z-10 -translate-x-1/2 translate-y-1/2"></div>

      {/* Header - Professional & Compact */}
      <header className="border-b bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm border-slate-100">
        <div className="container mx-auto px-4 md:px-8 h-20 md:h-24 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="hover:bg-red-50 text-slate-400 hover:text-red-600 h-9 w-9 md:h-10 md:w-10 rounded-xl transition-all"
            >
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <div className="flex items-center gap-3 md:gap-4">
              <div className="bg-red-600 p-2 md:p-2.5 rounded-lg md:rounded-xl shadow-lg">
                <Nfc className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
              <div className="block">
                <h1 className="text-lg md:text-xl font-bold text-slate-950 tracking-tight leading-none">NFC Center</h1>
                <p className="text-[9px] md:text-[10px] font-bold text-red-600 uppercase tracking-widest mt-1">Hardware</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Logo" className="h-10 md:h-16 w-auto object-contain rounded-lg md:rounded-xl shadow-md" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-8 py-8 md:py-16 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">

          {/* Left Side: Setup & Guide */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-white">
              <CardHeader className="p-6 md:p-8">
                <CardTitle className="text-xl font-bold text-slate-950 tracking-tight">Activate Hardware</CardTitle>
                <CardDescription className="font-bold text-[10px] uppercase tracking-wider text-slate-400 mt-2">Link a physical NFC device to your digital campaign</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8 pt-0 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="card-id" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-red-600" />
                    NFC Device UID
                  </Label>
                  <Input
                    id="card-id"
                    placeholder="Enter Card ID (e.g. 04:A1:B2...)"
                    value={newCardId}
                    onChange={(e) => setNewCardId(e.target.value)}
                    className="h-14 bg-slate-50 border-slate-100 text-slate-950 rounded-2xl focus:border-red-600 focus:ring-0 transition-all font-mono font-bold px-6 shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-red-600" />
                    Target Campaign
                  </Label>
                  <select
                    id="campaign"
                    className="w-full h-14 px-6 rounded-2xl border border-slate-100 bg-slate-50 text-sm font-bold text-slate-900 tracking-tight focus:border-red-600 transition-all outline-none shadow-inner"
                    value={selectedCampaign}
                    onChange={(e) => setSelectedCampaign(e.target.value)}
                  >
                    <option value="">Select a Campaign</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <Button
                  onClick={handleAddCard}
                  className="w-full h-16 bg-red-600 hover:bg-slate-950 text-white font-bold uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-red-100 active:scale-95 transition-all"
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                    <>
                      <Plus className="mr-3 h-5 w-5" />
                      Activate Card
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Usefulness Guide */}
            <Card className="bg-slate-900 border-0 text-white shadow-xl rounded-3xl relative overflow-hidden group">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-red-600 rounded-xl">
                    <ShieldCheck className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest">NFC Advantage</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="h-6 w-6 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-medium uppercase tracking-wide">
                      <strong className="text-white">Zero Friction:</strong> Customers just tap their phone. No camera apps, no scanning logic required.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="h-6 w-6 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-medium uppercase tracking-wide">
                      <strong className="text-white">Premium Feel:</strong> Metal or high-grade PVC cards look much more professional than paper QR codes.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="h-6 w-6 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-medium uppercase tracking-wide">
                      <strong className="text-white">Instant Sync:</strong> Change your Google review link anytime from this dashboard without replacing the card.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side: Deployment Table */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2">
              <h2 className="text-xl md:text-2xl font-bold text-slate-950 tracking-tight flex items-center gap-3">
                <HistoryIcon className="h-5 w-5 md:h-6 md:w-6 text-red-500" />
                Active Fleet
              </h2>
              <div className="bg-white border border-slate-100 text-slate-600 px-4 md:px-6 py-2 md:py-2.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest shadow-sm">
                <span className="text-red-600 mr-1 md:mr-2">{nfcCards.length}</span> Devices Online
              </div>
            </div>

            <Card className="border-0 shadow-xl overflow-hidden bg-white rounded-3xl min-h-[500px] border-l-4 border-l-red-600">
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-slate-50">
                      <TableHead className="font-bold text-slate-400 uppercase tracking-widest text-[9px] h-16 pl-8">Device UID</TableHead>
                      <TableHead className="font-bold text-slate-400 uppercase tracking-widest text-[9px] h-16">Link Status</TableHead>
                      <TableHead className="font-bold text-slate-400 uppercase tracking-widest text-[9px] h-16">Total Taps</TableHead>
                      <TableHead className="font-bold text-slate-400 uppercase tracking-widest text-[9px] h-16 text-right pr-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nfcCards.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-40 text-center">
                          <div className="flex flex-col items-center gap-6 opacity-20">
                            <Smartphone className="h-16 w-16" />
                            <p className="font-bold uppercase tracking-widest text-[10px]">No active devices found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      nfcCards.map((card) => (
                        <TableRow key={card.id} className="border-slate-50 hover:bg-slate-50/80 transition-all group">
                          <TableCell className="font-mono font-bold text-sm text-slate-900 pl-8 py-6">{card.card_id}</TableCell>
                          <TableCell>
                            <Badge className="bg-red-50 text-red-600 hover:bg-red-100 border-red-100 text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg shadow-none">
                              {(card as any).campaigns?.name || 'Linked'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 md:gap-3">
                              <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-900 text-white rounded-lg md:rounded-xl flex items-center justify-center font-bold text-xs md:text-sm shadow-md transition-colors">
                                {card.taps_count}
                              </div>
                              <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-wider">Taps</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCard(card.id)}
                              className="hover:bg-red-50 text-slate-300 hover:text-red-600 transition-all rounded-xl"
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

            {/* Assistance Bar */}
            <div className="p-10 bg-white border-2 border-dashed border-slate-100 rounded-3xl text-center hover:border-red-100 transition-all group opacity-80 hover:opacity-100">
              <Globe className="h-10 w-10 text-slate-200 group-hover:text-red-600 transition-colors mx-auto mb-6" />
              <p className="text-[10px] font-bold text-slate-400 group-hover:text-slate-900 uppercase tracking-widest max-w-lg mx-auto transition-colors leading-relaxed">
                Need help with NFC card writing or mass deployment? Visit our hardware documentation or contact satellite support.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Language Toggle Fixed */}
      <div className="fixed bottom-6 right-6 z-[100] transform hover:scale-110 transition-all duration-300">
        <div className="bg-white/80 backdrop-blur-xl border border-slate-100 p-2 rounded-full shadow-2xl">
          <LanguageToggle />
        </div>
      </div>
    </div>
  );
}
