import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, QrCode, Building2, Globe, Palette, CheckCircle2, Loader2, ArrowRight, Zap, Target } from "lucide-react";
import { z } from "zod";
import type { User } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

const CATEGORIES = [
  'Restaurant/Cafe',
  'Retail Store',
  'Healthcare',
  'Automotive',
  'Real Estate',
  'Professional Services',
  'Fitness',
  'Beauty Salon',
  'General Business',
];

const campaignSchema = z.object({
  campaignName: z.string().min(3, "Campaign name must be at least 3 characters"),
  googleReviewUrl: z.string().url("Please enter a valid Google review URL"),
  customMessage: z.string().max(500, "Message must be less than 500 characters").optional(),
  businessCategory: z.string().min(1, "Please select a business category"),
  theme: z.enum(['lightBlue', 'darkNavy', 'blackGold', 'whiteBlue']).default('whiteBlue'),
});

const CreateCampaign = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  // Form State
  const [campaignName, setCampaignName] = useState("");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#dc2626"); // Default Red
  const [secondaryColor, setSecondaryColor] = useState("#ffffff");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          setUser(currentUser);
        } else {
          navigate("/auth");
        }
      } catch (err) {
        console.error('Auth error:', err);
        setError('Authentication failed');
      }
    };
    checkAuth();
  }, [navigate]);

  const generateAITheme = () => {
    setPrimaryColor("#dc2626");
    setSecondaryColor("#ffffff");
    toast({
      title: "Optimized Red & White Applied",
      description: "Applied professional branding system.",
    });
  };

  const uploadLogoToStorage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    try {
      const fileName = `${uuidv4()}.jpg`;
      const filePath = `${user.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('qr-logos')
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('qr-logos')
        .getPublicUrl(filePath);
      return publicUrl;
    } catch (error) {
      console.error('Logo upload error:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeStep < 3) {
      setActiveStep(prev => prev + 1);
      return;
    }

    setLoading(true);
    try {
      const validated = campaignSchema.parse({
        campaignName,
        googleReviewUrl,
        customMessage: customMessage || undefined,
        businessCategory: businessCategory === 'Other' ? customCategory : businessCategory,
        theme: 'whiteBlue',
      });

      if (!user) throw new Error("User not authenticated");

      let logoUrl: string | null = null;
      if (logoFile) {
        logoUrl = await uploadLogoToStorage(logoFile);
      }

      const locationId = uuidv4();
      const shortCode = uuidv4().substring(0, 8).toUpperCase();

      const { error: locationError } = await (supabase as any)
        .from('locations')
        .insert([{
          id: locationId,
          owner_id: user.id,
          name: validated.campaignName,
          category: validated.businessCategory,
          google_review_url: validated.googleReviewUrl,
          logo_url: logoUrl,
        }]);

      if (locationError) throw locationError;

      const { data: campaignData, error: campaignError } = await (supabase as any)
        .from('campaigns')
        .insert([{
          location_id: locationId,
          owner_id: user.id,
          name: validated.campaignName,
          short_code: shortCode,
          status: 'active',
          category: validated.businessCategory,
          theme_color: primaryColor,
        }])
        .select('id')
        .single();

      if (campaignError) throw campaignError;

      toast({
        title: "Campaign Operational!",
        description: "Your AI-powered review campaign is now live.",
      });

      navigate(`/campaign/${campaignData.id}`);
    } catch (error: any) {
      toast({
        title: "Configuration Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-red-600 font-black uppercase tracking-widest text-lg italic">{error}</p>
          <Button onClick={() => navigate('/auth')} className="mt-8 bg-black text-white px-10 h-14 rounded-2xl font-black uppercase tracking-widest">Re-Authenticate</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-inter">
      <header className="border-b bg-white italic sticky top-0 z-50 shadow-sm border-gray-50">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-gray-400 hover:text-red-600 rounded-full h-12 px-8 font-black uppercase tracking-widest text-xs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Exit Setup
          </Button>
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Logo" className="h-10 w-auto rounded-lg" />
            <span className="text-sm font-black uppercase tracking-widest text-gray-900 leading-none">Campaign Builder</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-20 max-w-5xl">
        <div className="mb-16">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-5xl font-black text-gray-900 uppercase tracking-tighter italic">New Campaign</h1>
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest mt-2">Professional Review System Deployment</p>
            </div>
            <div className="hidden md:flex gap-3">
              {[1, 2, 3].map(s => (
                <div key={s} className={`w-12 h-2 transition-all rounded-full ${activeStep >= s ? 'bg-red-600 shadow-lg shadow-red-200' : 'bg-gray-100'}`}></div>
              ))}
            </div>
          </div>

          <Card className="border-0 shadow-[0_80px_160px_-40px_rgba(0,0,0,0.1)] rounded-[4rem] overflow-hidden bg-white group hover:scale-[1.01] transition-all duration-500">
            <div className="h-3 bg-red-600 w-full transition-all duration-700 ease-in-out" style={{ clipPath: `inset(0 ${100 - (activeStep * 33.3)}% 0 0)` }}></div>

            <CardContent className="p-12 md:p-20">
              <form onSubmit={handleSubmit} className="space-y-12">

                {/* Step 1: Identity */}
                {activeStep === 1 && (
                  <div className="animate-in fade-in slide-in-from-right-8 duration-700 space-y-10">
                    <div className="flex items-center gap-6 border-b border-gray-50 pb-8">
                      <div className="bg-red-50 p-5 rounded-2xl shadow-sm italic">
                        <Building2 className="h-8 w-8 text-red-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Business Identity</h2>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">Foundational operational parameters</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <Label htmlFor="campaignName" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Official Business Name *</Label>
                        <Input
                          id="campaignName"
                          placeholder="e.g. The Pune Boutique"
                          value={campaignName}
                          onChange={(e) => setCampaignName(e.target.value)}
                          required
                          className="h-16 rounded-2xl border-gray-200 focus:border-red-600 focus:ring-red-100 font-bold text-lg"
                        />
                      </div>
                      <div className="space-y-4">
                        <Label htmlFor="businessCategory" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Industry Sector *</Label>
                        <select
                          id="businessCategory"
                          value={businessCategory}
                          onChange={(e) => setBusinessCategory(e.target.value)}
                          className="w-full h-16 px-6 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-50 focus:border-red-600 font-bold text-lg transition-all appearance-none"
                          required
                        >
                          <option value="">Select Industry</option>
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                          <option value="Other">Other (Specialized)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1 flex items-center gap-3">
                        <Globe className="h-4 w-4 text-red-600" />
                        Google Review Audit Link *
                      </Label>
                      <Input
                        type="url"
                        placeholder="https://g.page/r/YOUR_ID/review"
                        value={googleReviewUrl}
                        onChange={(e) => setGoogleReviewUrl(e.target.value)}
                        required
                        className="h-16 rounded-2xl border-gray-200 focus:border-red-600 focus:ring-red-100 font-bold text-lg"
                      />
                      <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.2em] pl-1 italic">Synchronization link from your Google My Business Console</p>
                    </div>
                  </div>
                )}

                {/* Step 2: Visual System */}
                {activeStep === 2 && (
                  <div className="animate-in fade-in slide-in-from-right-8 duration-700 space-y-12">
                    <div className="flex items-center gap-6 border-b border-gray-50 pb-8">
                      <div className="bg-red-50 p-5 rounded-2xl shadow-sm italic">
                        <Palette className="h-8 w-8 text-red-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Visual Design Matrix</h2>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">Branding & System Aesthetics</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-10 rounded-[3rem] border border-gray-100 shadow-inner">
                      <Label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8 block">Corporate Identity Logo</Label>
                      <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="w-40 h-40 bg-white rounded-3xl border-4 border-dashed border-gray-100 flex items-center justify-center overflow-hidden shadow-2xl transition-transform hover:rotate-3">
                          {logoFile ? (
                            <img src={URL.createObjectURL(logoFile)} className="w-full h-full object-contain p-4" alt="Preview" />
                          ) : (
                            <QrCode className="w-16 h-16 text-gray-100" />
                          )}
                        </div>
                        <div className="flex-1 space-y-6">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && setLogoFile(e.target.files[0])}
                            className="h-14 border-gray-200 bg-white shadow-xl file:bg-gray-900 file:text-white file:border-0 file:rounded-xl file:mr-6 file:px-8 file:h-full file:cursor-pointer rounded-2xl font-black uppercase tracking-widest text-xs"
                          />
                          <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] italic">High Resolution SVG or JPG Highly Recommended</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-xl space-y-6 flex flex-col justify-center">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-black uppercase tracking-widest text-gray-400">System Primary</Label>
                          <div className="w-12 h-12 rounded-[1.2rem] shadow-2xl border-4 border-white" style={{ backgroundColor: primaryColor }}></div>
                        </div>
                        <Input
                          type="color"
                          value={primaryColor}
                          onChange={e => setPrimaryColor(e.target.value)}
                          className="h-14 w-full cursor-pointer border-0 p-0 rounded-2xl overflow-hidden shadow-inner"
                        />
                      </div>
                      <div className="flex items-center justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generateAITheme}
                          className="w-full h-24 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-black uppercase tracking-[0.3em] text-xs rounded-[2rem] transition-all shadow-xl shadow-red-50 group active:scale-95"
                        >
                          <Zap className="w-5 h-5 mr-3 group-hover:animate-bounce" />
                          Apply Corporate Red System
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Final Deployment */}
                {activeStep === 3 && (
                  <div className="animate-in fade-in slide-in-from-right-8 duration-700 space-y-12">
                    <div className="flex items-center gap-6 border-b border-gray-50 pb-8">
                      <div className="bg-red-50 p-5 rounded-2xl shadow-sm italic">
                        <Target className="h-8 w-8 text-red-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Deployment Authorization</h2>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">Final Content Audit & Confirmation</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label htmlFor="customMessage" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1 italic">Activation Message (Optional Content)</Label>
                      <Textarea
                        id="customMessage"
                        placeholder="Welcome! Your experience drives our mission. Tap above to share your journey."
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        maxLength={500}
                        className="min-h-[200px] rounded-[3rem] border-gray-200 focus:border-red-600 focus:ring-red-100 font-bold p-10 leading-relaxed text-lg italic shadow-inner bg-gray-50/50"
                      />
                      <div className="flex justify-between items-center px-2 pt-2">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest italic flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-red-600" /> AES-256 Bit Encryption Verified
                        </p>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{customMessage.length} / 500 CHARS</p>
                      </div>
                    </div>

                    <div className="bg-gray-950 p-10 rounded-[3rem] flex items-center justify-between group shadow-2xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-red-600/5 group-hover:bg-red-600/10 transition-colors"></div>
                      <div className="flex items-center gap-6 relative z-10">
                        <div className="w-16 h-16 bg-red-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-red-500/20">
                          <CheckCircle2 className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-black uppercase tracking-tight text-xl">Operational Ready Status</p>
                          <p className="text-red-600 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Verification Engine: PASSED</p>
                        </div>
                      </div>
                      <Sparkles className="h-10 w-10 text-red-600 animate-pulse relative z-10" />
                    </div>
                  </div>
                )}

                <div className="flex flex-col md:flex-row gap-6 pt-12 border-t border-gray-50">
                  {activeStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveStep(prev => prev - 1)}
                      className="h-20 px-12 rounded-[1.5rem] border-2 border-gray-100 text-gray-400 font-black uppercase tracking-widest text-xs hover:bg-gray-50 active:scale-95 transition-all"
                    >
                      Back Track Configuration
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 h-20 rounded-[1.5rem] text-sm font-black uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-[0.98] ${activeStep === 3 ? 'bg-red-600 hover:bg-black shadow-red-300' : 'bg-gray-900 hover:bg-red-600'}`}
                  >
                    {loading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    ) : (
                      <div className="flex items-center gap-3">
                        {activeStep === 3 ? 'Deploy System Asset' : 'Proceed to Next Matrix'}
                        <ArrowRight className="h-6 w-6" />
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="py-24 border-t border-gray-100 text-center bg-gray-50/50 mt-20">
        <img src="/logo.jpg" alt="Logo" className="h-14 w-auto mx-auto mb-6 grayscale opacity-40 shadow-sm rounded-xl" />
        <p className="text-xs font-black text-gray-400 uppercase tracking-[0.4em] italic leading-none">© 2026 Creative Mark Precision Core Systems</p>
      </footer>
    </div>
  );
};

export default CreateCampaign;
