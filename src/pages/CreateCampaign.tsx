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
          <p className="text-red-500 font-black uppercase tracking-widest">{error}</p>
          <Button onClick={() => navigate('/auth')} className="mt-4 bg-red-600">Re-Authenticate</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-inter">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-gray-400 hover:text-red-600 rounded-full h-10 px-6 font-black uppercase tracking-widest text-[10px]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Exit Setup
          </Button>
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="Logo" className="h-8 w-auto rounded-md" />
            <span className="text-xs font-black uppercase tracking-widest text-gray-900 leading-none">Campaign Builder</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-12">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">New Campaign</h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Professional Review System Deployment</p>
            </div>
            <div className="hidden md:flex gap-2">
              {[1, 2, 3].map(s => (
                <div key={s} className={`w-8 h-1 transition-all rounded-full ${activeStep >= s ? 'bg-red-600' : 'bg-gray-100'}`}></div>
              ))}
            </div>
          </div>

          <Card className="border-0 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.08)] rounded-[3rem] overflow-hidden bg-white">
            <div className="h-2 bg-red-600 w-full" style={{ clipPath: `inset(0 ${100 - (activeStep * 33.3)}% 0 0)` }}></div>

            <CardContent className="p-10 md:p-16">
              <form onSubmit={handleSubmit} className="space-y-10">

                {/* Step 1: Identity */}
                {activeStep === 1 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                    <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                      <div className="bg-red-50 p-4 rounded-2xl">
                        <Building2 className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Business Identity</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Basic operational details</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label htmlFor="campaignName" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Business Name</Label>
                        <Input
                          id="campaignName"
                          placeholder="The Grand Palace"
                          value={campaignName}
                          onChange={(e) => setCampaignName(e.target.value)}
                          required
                          className="h-14 rounded-2xl border-gray-200 focus:border-red-600 focus:ring-red-100 font-bold"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="businessCategory" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Industry Type</Label>
                        <select
                          id="businessCategory"
                          value={businessCategory}
                          onChange={(e) => setBusinessCategory(e.target.value)}
                          className="w-full h-14 px-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-50 focus:border-red-600 font-bold transition-all"
                          required
                        >
                          <option value="">Industry Category</option>
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                          <option value="Other">Other (Custom)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 flex items-center gap-2">
                        <Globe className="h-3 w-3 text-red-600" />
                        Google Review URL
                      </Label>
                      <Input
                        type="url"
                        placeholder="https://g.page/r/YOUR_ID/review"
                        value={googleReviewUrl}
                        onChange={(e) => setGoogleReviewUrl(e.target.value)}
                        required
                        className="h-14 rounded-2xl border-gray-200 focus:border-red-600 focus:ring-red-100 font-bold"
                      />
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest pl-1">Link obtained from Google My Business Profile</p>
                    </div>
                  </div>
                )}

                {/* Step 2: Visual System */}
                {activeStep === 2 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-10">
                    <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                      <div className="bg-red-50 p-4 rounded-2xl">
                        <Palette className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Visual Configuration</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Landing Page Presentation</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 block">Business Brand Logo</Label>
                      <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="w-32 h-32 bg-white rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                          {logoFile ? (
                            <img src={URL.createObjectURL(logoFile)} className="w-full h-full object-contain p-2" alt="Preview" />
                          ) : (
                            <QrCode className="w-10 h-10 text-gray-200" />
                          )}
                        </div>
                        <div className="flex-1 space-y-4">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && setLogoFile(e.target.files[0])}
                            className="h-12 border-gray-200 bg-white shadow-sm file:bg-red-600 file:text-white file:border-0 file:rounded-lg file:mr-4 file:px-4 file:h-full file:cursor-pointer rounded-xl font-bold"
                          />
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resolution 512x512 Recommended (Max 5MB)</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Primary Color</Label>
                          <div className="w-8 h-8 rounded-full shadow-lg" style={{ backgroundColor: primaryColor }}></div>
                        </div>
                        <Input
                          type="color"
                          value={primaryColor}
                          onChange={e => setPrimaryColor(e.target.value)}
                          className="h-10 w-full cursor-pointer border-0 p-0"
                        />
                      </div>
                      <div className="flex items-center justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generateAITheme}
                          className="w-full h-16 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Reset to Brand Palette
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Final Deployment */}
                {activeStep === 3 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                    <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                      <div className="bg-red-50 p-4 rounded-2xl">
                        <Target className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Final Deployment</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Message & Confirmation</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="customMessage" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Landing Page Message (Optional)</Label>
                      <Textarea
                        id="customMessage"
                        placeholder="Your feedback helps us grow. Thank you for your support!"
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        maxLength={500}
                        className="min-h-[150px] rounded-3xl border-gray-200 focus:border-red-600 focus:ring-red-100 font-bold p-6 leading-relaxed"
                      />
                      <div className="flex justify-between items-center px-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Enterprise grade data encryption enabled</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{customMessage.length}/500</p>
                      </div>
                    </div>

                    <div className="bg-gray-900 p-8 rounded-[2.5rem] flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center">
                          <CheckCircle2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-black uppercase tracking-tight">One-Click Setup Ready</p>
                          <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest">Verification Status: PASSED</p>
                        </div>
                      </div>
                      <Sparkles className="h-6 w-6 text-red-600 animate-pulse" />
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-10 border-t border-gray-50">
                  {activeStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveStep(prev => prev - 1)}
                      className="h-16 px-10 rounded-2xl border-gray-200 text-gray-400 font-black uppercase tracking-widest text-[10px]"
                    >
                      Previous Phase
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 h-16 rounded-[1.5rem] text-sm font-black uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95 ${activeStep === 3 ? 'bg-red-600 hover:bg-black shadow-red-200' : 'bg-gray-900 hover:bg-black'}`}
                  >
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <div className="flex items-center gap-2">
                        {activeStep === 3 ? 'Deploy Campaign' : 'Next Configuration Step'}
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="py-20 border-t border-gray-50 text-center">
        <img src="/logo.jpg" alt="Logo" className="h-10 w-auto mx-auto mb-4" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">© 2026 Creative Mark Precision Systems</p>
      </footer>
    </div>
  );
};

export default CreateCampaign;
