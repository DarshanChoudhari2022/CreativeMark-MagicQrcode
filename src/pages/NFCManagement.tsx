import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { NFCCard } from '@/types/database.types';
import { Nfc, Plus, Trash2, ArrowLeft, Loader2, Smartphone, ShieldCheck, Zap, History as HistoryIcon, Globe, MapPin, CheckCircle2 } from 'lucide-react';
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

      const { data } = await (supabase as any)
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
      toast.error('Card UID required');
      return;
    }

    if (!selectedCampaign) {
      toast.error('Campaign linkage required');
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
      toast.success('Hardware asset decommissioned');
      fetchNFCCards();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-12 w-12 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-inter">
      {/* Premium Header */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm border-gray-50">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-gray-400 hover:text-red-600 rounded-full h-12 px-8 font-black uppercase tracking-widest text-xs">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Exit Hub
            </Button>
            <div className="flex items-center gap-3">
              <div className="bg-red-600 p-3 rounded-[1.2rem] shadow-2xl shadow-red-200">
                <Nfc className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">NFC Fleet Control</h1>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <LanguageToggle />
            <div className="h-10 w-px bg-gray-100 mx-2"></div>
            <img src="/logo.jpg" alt="Logo" className="h-12 w-auto object-contain hidden md:block rounded-md" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-20 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

          {/* Left: Input & Strategy */}
          <div className="lg:col-span-4 space-y-10 animate-in fade-in slide-in-from-left-8 duration-700">
            <Card className="border-0 shadow-[0_80px_160px_-40px_rgba(0,0,0,0.1)] rounded-[4rem] overflow-hidden bg-white group hover:scale-[1.01] transition-all">
              <div className="h-3 bg-red-600"></div>
              <CardHeader className="p-12 pb-8">
                <CardTitle className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">Onboard Device</CardTitle>
                <CardDescription className="text-xs font-black text-gray-400 uppercase tracking-widest mt-2">Initialize Hardware Assets</CardDescription>
              </CardHeader>
              <CardContent className="p-12 pt-0 space-y-10">
                <div className="space-y-4">
                  <Label htmlFor="card-id" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1 italic">Hardware UID / Serial *</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-6 top-6 h-6 w-6 text-gray-200 group-hover:text-red-600 transition-colors" />
                    <Input
                      id="card-id"
                      placeholder="e.g. NFC-X8802"
                      value={newCardId}
                      onChange={(e) => setNewCardId(e.target.value)}
                      className="pl-16 h-18 py-6 bg-gray-50/50 border-gray-100 rounded-3xl focus:border-red-600 focus:ring-red-100 font-mono font-black text-lg"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="campaign" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1 italic">Campaign Linkage</Label>
                  <div className="relative">
                    <Zap className="absolute left-6 top-6 h-6 w-6 text-gray-200 group-hover:text-red-600 transition-colors" />
                    <select
                      id="campaign"
                      className="w-full h-18 pl-16 px-6 bg-gray-50/50 border border-gray-100 rounded-3xl text-sm font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-red-50 focus:border-red-600 transition-all appearance-none"
                      value={selectedCampaign}
                      onChange={(e) => setSelectedCampaign(e.target.value)}
                    >
                      <option value="">Select Target...</option>
                      {campaigns.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button
                  onClick={handleAddCard}
                  className="w-full h-20 bg-red-600 hover:bg-black text-white font-black uppercase tracking-[0.3em] text-sm rounded-[2rem] shadow-2xl shadow-red-200 transition-all active:scale-[0.98]"
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                    <div className="flex items-center gap-3">
                      <Plus className="h-6 w-6" />
                      Initialize Unit
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-950 border-0 text-white rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-red-600/5 group-hover:bg-red-600/10 transition-colors"></div>
              <CardContent className="p-12 relative z-10">
                <div className="flex items-center gap-6 mb-8">
                  <div className="p-4 bg-red-600 rounded-2xl shadow-2xl shadow-red-500/20">
                    <ShieldCheck className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-widest italic">Encrypted Asset</h3>
                </div>
                <p className="text-xs text-gray-400 leading-loose font-black uppercase tracking-[0.2em] italic opacity-80">
                  Secure Creative Mark hardware pairing enabled. 1-Tap review technology synchronized across active Maharashtra clusters with AES-256 Bit Encryption verification.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right: Asset Management */}
          <div className="lg:col-span-8 space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="flex items-center justify-between px-6">
              <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-6 italic">
                <HistoryIcon className="h-8 w-8 text-red-600" />
                Fleet Deployment status
              </h2>
              <div className="bg-red-50 text-red-600 px-6 py-3 rounded-full border border-red-100 text-xs font-black uppercase tracking-[0.2em]">
                {nfcCards.length} Units Active
              </div>
            </div>

            <Card className="border-0 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] rounded-[4rem] overflow-hidden bg-white border border-gray-50/50">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-gray-50/30">
                    <TableRow className="border-gray-50 hover:bg-transparent h-20">
                      <TableHead className="font-black text-gray-400 uppercase tracking-[0.3em] text-[11px] pl-12 italic">Unit Signature</TableHead>
                      <TableHead className="font-black text-gray-400 uppercase tracking-[0.3em] text-[11px] italic">Campaign Link</TableHead>
                      <TableHead className="font-black text-gray-400 uppercase tracking-[0.3em] text-[11px] italic">Tap Velocity</TableHead>
                      <TableHead className="font-black text-gray-400 uppercase tracking-[0.3em] text-[11px] text-right pr-12 italic">Control</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nfcCards.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-[400px] text-center">
                          <div className="flex flex-col items-center gap-10 opacity-30 grayscale">
                            <Smartphone className="h-24 w-24 text-gray-400 animate-pulse" />
                            <p className="font-black uppercase tracking-[0.5em] text-xs text-gray-400">Zero deployment records detected</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      nfcCards.map((card) => (
                        <TableRow key={card.id} className="border-gray-50 hover:bg-red-50/20 transition-all h-32 group">
                          <TableCell className="font-mono font-black text-gray-900 text-lg pl-12 uppercase">{card.card_id}</TableCell>
                          <TableCell>
                            <div className="bg-white border border-gray-100 px-6 py-3 rounded-2xl inline-flex items-center gap-3 shadow-xl shadow-gray-100/50">
                              <CheckCircle2 className="h-4 w-4 text-red-600" />
                              <span className="text-xs font-black uppercase text-gray-900 tracking-widest italic">
                                {(card as any).campaigns?.name || 'Active Operational Unit'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-gray-900 text-white rounded-[1.2rem] flex items-center justify-center font-black text-xl shadow-2xl group-hover:rotate-6 transition-transform">
                                {card.taps_count}
                              </div>
                              <span className="text-xs font-black text-gray-400 uppercase tracking-widest italic opacity-60">Total Signal Taps</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-12">
                            <Button
                              variant="ghost"
                              onClick={() => handleDeleteCard(card.id)}
                              className="h-16 w-16 rounded-2xl text-gray-200 hover:text-red-600 hover:bg-red-50 transition-all transform hover:rotate-12 active:scale-95"
                            >
                              <Trash2 className="h-6 w-6" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="p-16 bg-gray-50/50 border-4 border-dashed border-gray-100 rounded-[4rem] text-center group transition-all hover:bg-red-50/30 hover:border-red-200">
              <Globe className="h-14 w-14 text-gray-200 mx-auto mb-6 group-hover:text-red-600 transition-all transform group-hover:rotate-12" />
              <p className="text-xs font-black text-gray-400 uppercase tracking-[0.4em] max-w-md mx-auto group-hover:text-gray-900 transition-colors italic leading-loose">
                Global hardware procurement assistance available via Creative Mark Strategic Precision Team.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-24 border-t border-gray-50 text-center bg-gray-50/30">
        <img src="/logo.jpg" alt="Logo" className="h-16 w-auto mx-auto mb-6 grayscale opacity-40 rounded-xl shadow-sm" />
        <p className="text-xs font-black text-gray-400 uppercase tracking-[0.4em] italic leading-none">© 2026 Creative Mark Precision Global Systems</p>
      </footer>
    </div>
  );
}
