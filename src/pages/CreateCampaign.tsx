import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, QrCode, Loader2, Upload } from "lucide-react";
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
  theme: z.enum(['lightBlue', 'darkNavy', 'blackGold', 'whiteBlue']).default('lightBlue'),
  logoUrl: z.string().optional(),
});

const CreateCampaign = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#4285F4");
  const [secondaryColor, setSecondaryColor] = useState("#ffffff");
  const [theme, setTheme] = useState("lightBlue");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [targetUserId, setTargetUserId] = useState<string>("");

  const generateAITheme = async () => {
    const cat = businessCategory === 'Other' ? customCategory : businessCategory;
    let p = "#4285F4";
    let s = "#ffffff";
    const normalized = cat.toLowerCase();

    if (normalized.includes('food') || normalized.includes('restaurant') || normalized.includes('pizza') || normalized.includes('burger') || normalized.includes('cafe')) {
      p = "#EA4335"; s = "#FFF5F5";
    } else if (normalized.includes('health') || normalized.includes('medical') || normalized.includes('gym') || normalized.includes('fitness')) {
      p = "#34A853"; s = "#F0FFF4";
    } else if (normalized.includes('tech') || normalized.includes('auto') || normalized.includes('service')) {
      p = "#4285F4"; s = "#F5F8FF";
    } else if (normalized.includes('luxury') || normalized.includes('real estate') || normalized.includes('jewel')) {
      p = "#1A1A1A"; s = "#FAFAFA";
    } else if (normalized.includes('beauty') || normalized.includes('salon') || normalized.includes('spa')) {
      p = "#D32F2F"; s = "#FFF0F5";
    }

    setPrimaryColor(p);
    setSecondaryColor(s);
    toast({ title: "Theme Generated!", description: `Applied colors optimized for ${cat}` });
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          setUser(currentUser);
          setTargetUserId(currentUser.id);

          const { data: adminData } = await (supabase as any)
            .from('admin_users')
            .select('role')
            .eq('user_id', currentUser.id)
            .single();

          if (adminData?.role === 'super_admin' || adminData?.role === 'admin') {
            setIsAdmin(true);
            const { data: usersData } = await (supabase as any)
              .from('admin_users')
              .select('user_id');

            const { data: profilesData } = await (supabase as any)
              .from('business_profiles')
              .select('user_id, business_name, email');

            const usersWithProfiles = (usersData || []).map((u: any) => {
              const profile = (profilesData || []).find((p: any) => p.user_id === u.user_id);
              return {
                user_id: u.user_id,
                name: profile?.business_name || profile?.email || `User: ${u.user_id.substring(0, 8)}...`
              };
            });
            setAvailableUsers(usersWithProfiles);
          }
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

  const resizeImage = (file: File, maxSize: number = 500, quality: number = 0.8): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSize) { height = Math.round(height * maxSize / width); width = maxSize; }
        } else {
          if (height > maxSize) { width = Math.round(width * maxSize / height); height = maxSize; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        }, 'image/jpeg', quality);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadLogoToStorage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    try {
      const resizedBlob = await resizeImage(file, 500, 0.8);
      const resizedFile = new File([resizedBlob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
      const fileName = `${uuidv4()}.jpg`;
      const filePath = `${user.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('qr-logos')
        .upload(filePath, resizedFile);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('qr-logos')
        .getPublicUrl(filePath);
      return publicUrl;
    } catch (error) {
      console.error('Logo upload error:', error);
      toast({ title: "Error", description: "Failed to process image. Please try a different one.", variant: "destructive" });
      return null;
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const validated = campaignSchema.parse({
        campaignName,
        googleReviewUrl,
        customMessage: customMessage || undefined,
        businessCategory: businessCategory === 'Other' ? customCategory : businessCategory,
        theme,
      });

      if (!user) throw new Error("User not authenticated");

      let logoUrl: string | null = null;
      if (logoFile) {
        logoUrl = await uploadLogoToStorage(logoFile);
      }

      const locationId = uuidv4();
      const shortCode = uuidv4().substring(0, 8).toUpperCase();

      const { error: locationError } = await supabase
        .from('locations')
        .insert([{
          id: locationId,
          owner_id: targetUserId,
          name: validated.campaignName,
          category: validated.businessCategory,
          google_review_url: validated.googleReviewUrl,
          logo_url: logoUrl,
        }]);

      if (locationError) throw locationError;

      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .insert([{
          location_id: locationId,
          owner_id: targetUserId,
          name: validated.campaignName,
          short_code: shortCode,
          status: 'active',
          category: validated.businessCategory,
          theme_color: primaryColor,
        }])
        .select('id')
        .single();

      if (campaignError) throw campaignError;
      if (!campaignData || !campaignData.id) throw new Error('Failed to create campaign');

      toast({ title: "Success!", description: "Campaign created successfully." });
      setTimeout(() => { navigate(`/campaign/${campaignData.id}`); }, 1000);
    } catch (error: any) {
      console.error('Error:', error);
      toast({ title: "Error", description: `Failed: ${error?.message || 'Unknown error'}`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 px-4">
        <div className="text-center">
          <h1 className="text-xl md:text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-red-500 text-sm md:text-base">{error}</p>
          <Button onClick={() => navigate('/auth')} className="mt-4 min-h-[44px]">Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30 font-inter">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-xl shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="hover:bg-red-50 text-slate-500 hover:text-red-600 font-bold uppercase tracking-widest text-[9px] md:text-[10px] min-h-[44px] min-w-[44px]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-10">
        <Card className="max-w-2xl mx-auto border-0 shadow-xl rounded-2xl md:rounded-3xl overflow-hidden">
          {/* Card Header */}
          <CardHeader className="bg-gradient-to-r from-red-600 to-red-500 text-white p-5 md:p-8">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="bg-white/20 p-2.5 md:p-3 rounded-xl md:rounded-2xl backdrop-blur-sm">
                <QrCode className="h-5 w-5 md:h-7 md:w-7" />
              </div>
              <div>
                <CardTitle className="text-xl md:text-2xl font-bold tracking-tight">Create QR Campaign</CardTitle>
                <CardDescription className="text-white/80 text-xs md:text-sm mt-1">
                  Set up your AI-powered Google review collection campaign
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 md:p-8 pt-6 md:pt-10">
            <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
              {/* Admin: Assign to Account */}
              {isAdmin && (
                <div className="p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100">
                  <Label htmlFor="targetUser" className="text-slate-900 font-bold uppercase tracking-widest text-[9px] md:text-[10px] mb-2 block">
                    Assign to Account
                  </Label>
                  <select
                    id="targetUser"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-sm md:text-base min-h-[44px]"
                    required
                  >
                    <option value={user?.id}>Personal Account ({user?.email})</option>
                    {availableUsers.filter(u => u.user_id !== user?.id).map((u) => (
                      <option key={u.user_id} value={u.user_id}>Client: {u.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Campaign Name */}
              <div>
                <Label htmlFor="campaignName" className="font-bold text-slate-700 text-sm md:text-base">Campaign Name</Label>
                <Input
                  id="campaignName"
                  placeholder="e.g., Surajit Auto Garage - Counter 1"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  required
                  className="mt-1.5 h-11 md:h-12 rounded-xl border-slate-200 focus:border-red-500 focus:ring-red-500 text-sm md:text-base"
                />
              </div>

              {/* Business Category */}
              <div>
                <Label htmlFor="businessCategory" className="font-bold text-slate-700 text-sm md:text-base">Business Category</Label>
                <select
                  id="businessCategory"
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  className="w-full mt-1.5 px-3 md:px-4 py-2.5 md:py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm md:text-base min-h-[44px] bg-white"
                  required
                >
                  <option value="">Select your business type...</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Other">Other (Custom)</option>
                </select>
                {businessCategory === 'Other' && (
                  <Input
                    className="mt-2 h-11 md:h-12 rounded-xl"
                    placeholder="Enter your specific business category"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    required
                  />
                )}
              </div>

              {/* Logo Upload */}
              <div className="border-2 border-dashed border-red-200 rounded-xl md:rounded-2xl p-4 md:p-6 bg-red-50/30 transition-colors hover:border-red-300">
                <Label htmlFor="logoFile" className="font-bold text-slate-700 text-sm md:text-base">Business Logo (Optional)</Label>
                <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
                  <label
                    htmlFor="logoFile"
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors font-semibold text-sm text-slate-600 min-h-[44px]"
                  >
                    <Upload className="h-4 w-4" />
                    Choose File
                  </label>
                  <input
                    id="logoFile"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    disabled={uploadingLogo}
                    className="sr-only"
                  />
                  {logoPreview && (
                    <img src={logoPreview} alt="Logo preview" className="h-12 w-12 md:h-16 md:w-16 object-contain rounded-xl border border-slate-200 shadow-sm" />
                  )}
                  {!logoPreview && <p className="text-[10px] md:text-xs text-slate-400">Max file size: 5MB • JPG, PNG, SVG</p>}
                </div>
              </div>

              {/* Theme Colors */}
              <div>
                <Label className="font-bold text-slate-700 text-sm md:text-base">QR Card Theme Colors</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mt-2">
                  <div>
                    <Label htmlFor="primaryColor" className="text-[10px] md:text-xs text-slate-400 font-semibold uppercase tracking-wider">Primary Color</Label>
                    <div className="flex gap-2 items-center mt-1">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-10 md:h-11 w-14 md:w-16 p-1 cursor-pointer rounded-lg border-slate-200"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="font-mono uppercase h-10 md:h-11 rounded-xl border-slate-200 text-sm"
                        maxLength={7}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor" className="text-[10px] md:text-xs text-slate-400 font-semibold uppercase tracking-wider">Background Color</Label>
                    <div className="flex gap-2 items-center mt-1">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="h-10 md:h-11 w-14 md:w-16 p-1 cursor-pointer rounded-lg border-slate-200"
                      />
                      <Input
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="font-mono uppercase h-10 md:h-11 rounded-xl border-slate-200 text-sm"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateAITheme}
                    disabled={!businessCategory}
                    className="rounded-xl border-slate-200 hover:border-red-500 hover:text-red-600 font-bold text-[10px] md:text-xs uppercase tracking-wider min-h-[44px] px-4"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-2" />
                    Auto-Generate Theme
                  </Button>
                </div>
              </div>

              {/* Google Review URL */}
              <div>
                <Label htmlFor="googleReviewUrl" className="font-bold text-slate-700 text-sm md:text-base">Google Review Link *</Label>
                <Input
                  id="googleReviewUrl"
                  type="url"
                  placeholder="https://g.page/business-name/review"
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  required
                  className="mt-1.5 h-11 md:h-12 rounded-xl border-slate-200 focus:border-red-500 focus:ring-red-500 text-sm md:text-base"
                />
              </div>

              {/* Custom Message */}
              <div>
                <Label htmlFor="customMessage" className="font-bold text-slate-700 text-sm md:text-base">Custom Message (Optional)</Label>
                <Textarea
                  id="customMessage"
                  placeholder="Add a custom message to appear on the QR card..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  maxLength={500}
                  className="mt-1.5 rounded-xl border-slate-200 focus:border-red-500 focus:ring-red-500 text-sm md:text-base min-h-[80px]"
                />
                <p className="text-[10px] md:text-xs text-slate-400 mt-1.5 font-medium">
                  {customMessage.length}/500 characters
                </p>
              </div>

              {/* Submit */}
              <div className="flex gap-3 md:gap-4 pt-2 md:pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white h-12 md:h-14 rounded-xl md:rounded-2xl font-bold uppercase tracking-widest text-[10px] md:text-xs shadow-lg shadow-red-200 transition-all active:scale-[0.98] min-h-[48px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Campaign...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Create Campaign
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateCampaign;
