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
    <div className="min-h-screen bg-white font-inter pb-32 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-50/50 rounded-full blur-[150px] -z-10 translate-x-1/2 -translate-y-1/2"></div>

      {/* Premium Header - Large Logo */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-8 py-8 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="hover:bg-red-50 text-gray-400 hover:text-red-600 h-16 w-16 rounded-2xl transition-all">
              <ArrowLeft className="h-8 w-8" />
            </Button>
            <div className="flex items-center gap-6 group">
              <div className="bg-red-600 p-5 rounded-[1.5rem] shadow-2xl group-hover:rotate-12 transition-all">
                <Nfc className="h-8 w-8 text-white" />
              </div>
              <div className="hidden lg:block">
                <h1 className="text-3xl font-black text-gray-950 tracking-tighter uppercase italic leading-none">NFC Card Center</h1>
                <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em] mt-2 italic leading-none">Hardware Protocol</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Logo" className="h-20 w-auto object-contain rounded-2xl shadow-2xl transition-all hover:scale-110" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-8 py-20 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

          {/* Left: Registration Form - Large Scale */}
          <div className="lg:col-span-4 space-y-10">
            <Card className="border-0 shadow-4xl overflow-hidden rounded-[4rem] group bg-white">
              <div className="h-4 bg-red-600 w-0 group-hover:w-full transition-all duration-1000"></div>
              <CardHeader className="p-12">
                <CardTitle className="text-3xl font-black text-gray-950 uppercase tracking-tighter italic leading-none">Activate Hardware</CardTitle>
                <CardDescription className="font-black text-[10px] uppercase tracking-[0.3em] text-gray-400 mt-4 italic leading-none">Link a professional NFC device</CardDescription>
              </CardHeader>
              <CardContent className="px-12 pb-12 space-y-10">
                <div className="space-y-4">
                  <Label htmlFor="card-id" className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-400 italic flex items-center gap-3 ml-2">
                    <Smartphone className="h-5 w-5 text-red-600" />
                    Device Unique Identifier (UID)
                  </Label>
                  <Input
                    id="card-id"
                    placeholder="PROTOCOL_SN_882_012"
                    value={newCardId}
                    onChange={(e) => setNewCardId(e.target.value)}
                    className="h-20 bg-gray-50 border-gray-50 text-gray-950 rounded-[1.5rem] focus:border-red-600 focus:ring-0 focus:scale-[1.02] transition-all font-mono font-black text-xl px-10 shadow-inner"
                  />
                </div>

                <div className="space-y-4">
                  <Label htmlFor="campaign" className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-400 italic flex items-center gap-3 ml-2">
                    <Zap className="h-5 w-5 text-red-600" />
                    Target Operational Branch
                  </Label>
                  <select
                    id="campaign"
                    className="w-full h-20 px-10 rounded-[1.5rem] border-2 border-gray-50 bg-gray-50 text-xl font-black tracking-tighter uppercase italic focus:ring-10 focus:ring-red-100 focus:border-red-600 transition-all outline-none shadow-inner"
                    value={selectedCampaign}
                    onChange={(e) => setSelectedCampaign(e.target.value)}
                  >
                    <option value="" className="text-gray-300">SELECT CAMPAIGN</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <Button
                  onClick={handleAddCard}
                  className="w-full h-24 bg-red-600 hover:bg-black text-white font-black uppercase tracking-[0.6em] rounded-[2rem] shadow-[0_30px_60px_-10px_rgba(220,38,38,0.5)] active:scale-95 transition-all mt-10"
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-10 w-10 animate-spin" /> : (
                    <>
                      <Plus className="mr-6 h-8 w-8" />
                      ACTIVATE DEVICE
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* High Impact Tech Card */}
            <Card className="bg-gray-950 border-0 text-white shadow-3xl rounded-[4rem] group relative overflow-hidden scale-95 opacity-80 hover:scale-100 hover:opacity-100 transition-all duration-700">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/20 blur-[60px]"></div>
              <CardContent className="p-16">
                <div className="flex items-center gap-6 mb-8">
                  <div className="p-5 bg-red-600 rounded-[1.5rem] shadow-2xl shadow-red-500/50 group-hover:rotate-6 transition-transform">
                    <ShieldCheck className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-[0.5em] italic">SECURE CORE</h3>
                </div>
                <p className="text-sm text-gray-400 leading-loose font-bold italic uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                  All devices are synchronized with Creative Mark Secure-Core. Taps are monitored in real-time across the global network.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right: Active Devices Table - Massive Fidelity */}
          <div className="lg:col-span-8 space-y-12">
            <div className="flex items-center justify-between px-6 border-b-4 border-gray-50 pb-10">
              <h2 className="text-5xl font-black text-gray-950 uppercase tracking-tighter flex items-center gap-8 italic leading-none">
                <HistoryIcon className="h-12 w-12 text-red-600" />
                Active Fleet
              </h2>
              <div className="bg-red-600 text-white px-10 py-4 rounded-full text-xs font-black uppercase tracking-[0.4em] shadow-2xl shadow-red-200 skew-x-[-10deg] italic">
                {nfcCards.length} UNITS ONLINE
              </div>
            </div>

            <Card className="border-0 shadow-4xl overflow-hidden bg-white rounded-[5rem] min-h-[600px] border-l-[16px] border-l-red-600">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow className="border-gray-50 hover:bg-transparent">
                      <TableHead className="font-black text-gray-400 uppercase tracking-[0.5em] text-[11px] h-24 pl-16 italic">DEVICE_SIGNATURE</TableHead>
                      <TableHead className="font-black text-gray-400 uppercase tracking-[0.5em] text-[11px] h-24 italic">CAMPAIGN_LINK</TableHead>
                      <TableHead className="font-black text-gray-400 uppercase tracking-[0.5em] text-[11px] h-24 italic">SYNC_COUNT</TableHead>
                      <TableHead className="font-black text-gray-400 uppercase tracking-[0.5em] text-[11px] h-24 text-right pr-16 italic">PROTOCOL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nfcCards.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-72 text-center">
                          <div className="flex flex-col items-center gap-10 opacity-10">
                            <Smartphone className="h-32 w-32" />
                            <p className="font-black uppercase tracking-[0.8em] text-xs">No devices linked to satellite</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      nfcCards.map((card) => (
                        <TableRow key={card.id} className="border-gray-50 hover:bg-red-50/30 transition-all duration-500 group">
                          <TableCell className="font-mono font-black text-2xl text-gray-950 pl-16 py-12 italic translate-x-0 group-hover:translate-x-4 transition-transform">{card.card_id}</TableCell>
                          <TableCell>
                            <span className="bg-white text-gray-950 px-8 py-3 rounded-full text-xs font-black uppercase tracking-[0.3em] italic border-2 border-red-100 shadow-sm group-hover:bg-red-600 group-hover:text-white group-hover:border-red-600 transition-all">
                              {(card as any).campaigns?.name || 'SYNCED_UNIT'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-6">
                              <div className="w-16 h-16 bg-gray-950 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-2xl skew-x-[-10deg] group-hover:bg-red-600 transition-colors">
                                {card.taps_count}
                              </div>
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] italic leading-none">TOTAL_TAPS</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-16">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCard(card.id)}
                              className="hover:bg-red-600 group/btn text-gray-200 hover:text-white transition-all w-16 h-16 rounded-3xl"
                            >
                              <Trash2 className="h-8 w-8 group-hover/btn:scale-110 transition-transform" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* High Impact Help Bar */}
            <div className="p-16 bg-white border-8 border-dashed border-gray-50 rounded-[5rem] text-center hover:border-red-100 transition-all group scale-95 hover:scale-100 opacity-60 hover:opacity-100 duration-1000">
              <div className="relative inline-block mb-10">
                <div className="absolute inset-0 bg-red-600 blur-[40px] opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <Globe className="h-20 w-20 text-gray-200 group-hover:text-red-600 transition-colors relative z-10 group-hover:scale-125 duration-700" />
              </div>
              <p className="text-xl font-black text-gray-300 group-hover:text-gray-950 uppercase tracking-[0.5em] max-w-2xl mx-auto italic transition-colors leading-relaxed">
                Need operational assistance with NFC deployment? Reach Satellite Support.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Language Toggle Fixed Bottom Right */}
      <div className="fixed bottom-12 right-12 z-[100] transform hover:scale-125 transition-all duration-500 group">
        <div className="absolute inset-0 bg-red-600 blur-[40px] opacity-0 group-hover:opacity-30 transition-opacity rounded-full"></div>
        <div className="bg-white p-4 rounded-full shadow-[0_50px_100px_rgba(220,38,38,0.4)] border-4 border-red-50 relative z-10 transition-transform">
          <LanguageToggle />
        </div>
      </div>
    </div>
  );
}
