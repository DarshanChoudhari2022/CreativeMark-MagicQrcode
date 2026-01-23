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
        <Loader2 className="h-10 w-10 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-inter">
      {/* Premium Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-gray-400 hover:text-red-600 rounded-full h-10 px-6 font-black uppercase tracking-widest text-[10px]">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Exit Hub
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-200">
                <Nfc className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-black text-gray-900 tracking-tighter uppercase">NFC Fleet Control</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <div className="h-8 w-px bg-gray-100 mx-2"></div>
            <img src="/logo.jpg" alt="Logo" className="h-10 w-auto object-contain hidden md:block" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Left: Input & Strategy */}
          <div className="lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <Card className="border-0 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.08)] rounded-[3rem] overflow-hidden bg-white">
              <div className="h-2 bg-red-600"></div>
              <CardHeader className="p-10">
                <CardTitle className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Onboard Device</CardTitle>
                <CardDescription className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Register hardware to campaign</CardDescription>
              </CardHeader>
              <CardContent className="p-10 pt-0 space-y-8">
                <div className="space-y-3">
                  <Label htmlFor="card-id" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Card UID / Serial *</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-4 h-5 w-5 text-gray-100" />
                    <Input
                      id="card-id"
                      placeholder="e.g. NFC-X8802"
                      value={newCardId}
                      onChange={(e) => setNewCardId(e.target.value)}
                      className="pl-14 h-14 bg-gray-50/50 border-gray-100 rounded-2xl focus:border-red-600 focus:ring-red-100 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="campaign" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Parent Campaign</Label>
                  <div className="relative">
                    <Zap className="absolute left-4 top-4 h-5 w-5 text-gray-100" />
                    <select
                      id="campaign"
                      className="w-full h-14 pl-14 px-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-black uppercase tracking-tight focus:outline-none focus:ring-4 focus:ring-red-50 focus:border-red-600 transition-all appearance-none"
                      value={selectedCampaign}
                      onChange={(e) => setSelectedCampaign(e.target.value)}
                    >
                      <option value="">Link Campaign...</option>
                      {campaigns.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button
                  onClick={handleAddCard}
                  className="w-full h-16 bg-red-600 hover:bg-black text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-red-200 transition-all active:scale-95"
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                    <div className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Initialize Hardware
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-0 text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-red-600/5 group-hover:bg-red-600/10 transition-colors"></div>
              <CardContent className="p-10 relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-red-600 rounded-2xl">
                    <ShieldCheck className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tighter">Encrypted Link</h3>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed font-black uppercase tracking-widest">
                  Secure Creative Mark hardware pairing enabled. 1-Tap review technology synchronized across active Maharashtra clusters.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right: Asset Management */}
          <div className="lg:col-span-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between px-4">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-4">
                <HistoryIcon className="h-6 w-6 text-red-600" />
                Fleet Status
              </h2>
              <div className="bg-red-50 text-red-600 px-4 py-1.5 rounded-full border border-red-100 text-[9px] font-black uppercase tracking-widest">
                {nfcCards.length} Registered Units
              </div>
            </div>

            <Card className="border-0 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] rounded-[3rem] overflow-hidden bg-white">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow className="border-gray-100 hover:bg-transparent h-16">
                      <TableHead className="font-black text-gray-400 uppercase tracking-[0.2em] text-[10px] pl-10">Unit Identifier</TableHead>
                      <TableHead className="font-black text-gray-400 uppercase tracking-[0.2em] text-[10px]">Campaign Link</TableHead>
                      <TableHead className="font-black text-gray-400 uppercase tracking-[0.2em] text-[10px]">Tap Index</TableHead>
                      <TableHead className="font-black text-gray-400 uppercase tracking-[0.2em] text-[10px] text-right pr-10">Control</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nfcCards.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-96 text-center">
                          <div className="flex flex-col items-center gap-6 opacity-40 grayscale">
                            <Smartphone className="h-20 w-20 text-gray-200" />
                            <p className="font-black uppercase tracking-[0.4em] text-[10px] text-gray-300">No active assets in fleet</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      nfcCards.map((card) => (
                        <TableRow key={card.id} className="border-gray-50 hover:bg-red-50/30 transition-colors h-24 group">
                          <TableCell className="font-mono font-black text-gray-900 text-sm pl-10">{card.card_id}</TableCell>
                          <TableCell>
                            <div className="bg-white border border-gray-100 px-4 py-2 rounded-full inline-flex items-center gap-2 shadow-sm">
                              <CheckCircle2 className="h-3 w-3 text-red-600" />
                              <span className="text-[10px] font-black uppercase text-gray-900 tracking-tight">
                                {(card as any).campaigns?.name || 'Active Operational Unit'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-lg">
                                {card.taps_count}
                              </div>
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Taps</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-10">
                            <Button
                              variant="ghost"
                              onClick={() => handleDeleteCard(card.id)}
                              className="h-12 w-12 rounded-xl text-gray-100 hover:text-red-600 hover:bg-red-50 transition-all"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="p-10 bg-white border-2 border-dashed border-gray-100 rounded-[3rem] text-center group transition-all hover:bg-red-50/20 hover:border-red-200">
              <Globe className="h-10 w-10 text-gray-100 mx-auto mb-4 group-hover:text-red-600 transition-colors" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] max-w-sm mx-auto group-hover:text-gray-900 transition-colors">
                Hardware procurement assistance available via Creative Mark Precision Team
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-20 border-t border-gray-50 text-center">
        <img src="/logo.jpg" alt="Logo" className="h-10 w-auto mx-auto mb-4" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">© 2026 Creative Mark Precision Systems</p>
      </footer>
    </div>
  );
}

const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`text-xs font-black uppercase tracking-widest rounded-full flex items-center justify-center ${className}`}>
    {children}
  </div>
);
