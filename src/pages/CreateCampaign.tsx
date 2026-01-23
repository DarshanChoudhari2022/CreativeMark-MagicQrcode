import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, QrCode } from "lucide-react";
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
  const [theme, setTheme] = useState("lightBlue"); // Keeping for backward compatibility or removing if fully replaced
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [targetUserId, setTargetUserId] = useState<string>("");

  const generateAITheme = async () => {
    // Simple heuristic-based generation for now to ensure speed/reliability
    // In production, this call an AI endpoint
    const cat = businessCategory === 'Other' ? customCategory : businessCategory;

    // Default fallback
    let p = "#4285F4";
    let s = "#ffffff";

    const normalized = cat.toLowerCase();

    if (normalized.includes('food') || normalized.includes('restaurant') || normalized.includes('pizza') || normalized.includes('burger')) {
      p = "#EA4335"; // Red for food
      s = "#FFF5F5";
    } else if (normalized.includes('health') || normalized.includes('medical') || normalized.includes('gym') || normalized.includes('fitness')) {
      p = "#34A853"; // Green for health
      s = "#F0FFF4";
    } else if (normalized.includes('tech') || normalized.includes('auto') || normalized.includes('service')) {
      p = "#4285F4"; // Blue for trust
      s = "#F5F8FF";
    } else if (normalized.includes('luxury') || normalized.includes('real estate') || normalized.includes('jewel') || normalized.includes('black')) {
      p = "#1A1A1A"; // Black/Gold for luxury
      s = "#FAFAFA";
    } else if (normalized.includes('native') || normalized.includes('berry') || normalized.includes('farm')) {
      p = "#D32F2F"; // Berry red
      s = "#FFF0F5";
    }

    setPrimaryColor(p);
    setSecondaryColor(s);

    toast({
      title: "Theme Generated!",
      description: `Applied colors optimized for ${cat}`,
    });
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          setUser(currentUser);
          setTargetUserId(currentUser.id);

          // Check admin access
          const { data: adminData } = await (supabase as any)
            .from('admin_users')
            .select('role')
            .eq('user_id', currentUser.id)
            .single();

          if (adminData?.role === 'super_admin' || adminData?.role === 'admin') {
            setIsAdmin(true);
            // Fetch potential target users and their profiles
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

  // Helper: Resize image before upload
  const resizeImage = (file: File, maxSize: number = 500, quality: number = 0.8): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale down proportionally
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
      // Resize the image first
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
      toast({
        title: "Error",
        description: "Failed to process image. Please try a different one.",
        variant: "destructive",
      });
      return null;
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

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Upload logo if provided
      let logoUrl: string | null = null;
      if (logoFile) {
        logoUrl = await uploadLogoToStorage(logoFile);
      }

      // Generate location ID client-side to avoid schema cache issues
      const locationId = uuidv4();
      const shortCode = uuidv4().substring(0, 8).toUpperCase();

      // Create location first without trying to get the response
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

      if (locationError) {
        console.error('Location creation error:', locationError);
        throw locationError;
      }

      // Create campaign with the location ID
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

      if (campaignError) {
        console.error('Campaign creation error:', campaignError);
        throw campaignError;
      }

      if (!campaignData || !campaignData.id) {
        throw new Error('Failed to create campaign');
      }

      console.log('Campaign created successfully:', campaignData.id);
      toast({
        title: "Success!",
        description: "Campaign created successfully.",
        variant: "default",
      });

      setTimeout(() => {
        navigate(`/campaign/${campaignData.id}`);
      }, 1000);
    } catch (error: any) {
      console.error('Complete error object:', error);
      console.error('Error message:', error?.message);
      console.error('Error code:', error?.code);
      toast({
        title: "Error",
        description: `Failed to create campaign: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-red-500">{error}</p>
          <Button onClick={() => navigate('/auth')} className="mt-4">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="border-b bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="hover:bg-blue-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <QrCode className="h-6 w-6" />
              <div>
                <CardTitle className="text-2xl">Create QR Campaign</CardTitle>
                <CardDescription className="text-blue-100">
                  Set up your AI-powered Google review collection campaign
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {isAdmin && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                  <Label htmlFor="targetUser" className="text-slate-900 font-bold uppercase tracking-widest text-[10px] mb-2 block">Assign to Account</Label>
                  <select
                    id="targetUser"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                    required
                  >
                    <option value={user?.id}>Personal Account ({user?.email})</option>
                    {availableUsers.filter(u => u.user_id !== user?.id).map((u) => (
                      <option key={u.user_id} value={u.user_id}>
                        Client: {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <Label htmlFor="campaignName">Campaign Name</Label>
                <Input
                  id="campaignName"
                  placeholder="e.g., Surajit Auto Garage - Counter 1"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="businessCategory">Business Category</Label>
                <select
                  id="businessCategory"
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select your business type...</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="Other">Other (Custom)</option>
                </select>
                {businessCategory === 'Other' && (
                  <Input
                    className="mt-2"
                    placeholder="Enter your specific business category (e.g. Strawberry Farm)"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    required
                  />
                )}
              </div>
              <div className="border border-dashed border-blue-300 rounded-lg p-6 bg-blue-50">
                <Label htmlFor="logoFile">Business Logo (Optional)</Label>
                <div className="mt-4">
                  <Input
                    id="logoFile"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setLogoFile(e.target.files[0]);
                      }
                    }}
                    disabled={uploadingLogo}
                  />
                  <p className="text-sm text-gray-600 mt-2">Max file size: 5MB</p>
                </div>
              </div>
              <div>
                <Label>QR Card Theme Colors</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label htmlFor="primaryColor" className="text-xs text-gray-500">Primary Color (Buttons/Accents)</Label>
                    <div className="flex gap-2 items-center mt-1">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-10 w-16 p-1 cursor-pointer"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="font-mono uppercase"
                        maxLength={7}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor" className="text-xs text-gray-500">Background Color (Card)</Label>
                    <div className="flex gap-2 items-center mt-1">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="h-10 w-16 p-1 cursor-pointer"
                      />
                      <Input
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="font-mono uppercase"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateAITheme}
                    disabled={!businessCategory}
                  >
                    <Sparkles className="h-3 w-3 mr-2" />
                    Auto-Generate Theme
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="googleReviewUrl">Google Review Link *</Label>
                <Input
                  id="googleReviewUrl"
                  type="url"
                  placeholder="https://g.page/business-name/review"
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="customMessage">Custom Message (Optional)</Label>
                <Textarea
                  id="customMessage"
                  placeholder="Add a custom message to appear on the QR card..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  maxLength={500}
                />
                <p className="text-sm text-gray-500 mt-2">
                  {customMessage.length}/500 characters
                </p>
              </div>
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {loading ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
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
    </div >
  );
};

export default CreateCampaign;
