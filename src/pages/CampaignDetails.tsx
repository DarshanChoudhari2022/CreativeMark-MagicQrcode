import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, QrCode, TrendingUp, Eye, MousePointerClick, Sparkles, ExternalLink, Menu, X, Edit2, Save, Upload, Loader2, Trash2 } from "lucide-react";
import { Input } from '@/components/ui/input';
import { BrandedQRCard } from '@/components/BrandedQRCard';
import { v4 as uuidv4 } from "uuid";


const CampaignDetails = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>({
    scans: 0,
    views: 0,
    ai_suggestions: 0,
    click_review: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [logoInput, setLogoInput] = useState('');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [googleUrlInput, setGoogleUrlInput] = useState('');
  const [isEditingGoogleUrl, setIsEditingGoogleUrl] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    const loadCampaignData = async () => {
      try {
        // Load campaign
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', campaignId)
          .single();

        if (campaignError) throw campaignError;
        setCampaign(campaignData);
        setNewName(campaignData.name);

        // Load location
        if (campaignData?.location_id) {
          const { data: locationData } = await supabase
            .from('locations')
            .select('*')
            .eq('id', campaignData.location_id)
            .single();
          if (locationData) {
            setLocation(locationData);
            setLogoInput(locationData.logo_url || '');
            setLocationName(locationData.name || '');
            setLocationAddress(locationData.address || '');
            setGoogleUrlInput(locationData.google_review_url || '');
          } else {
            setGoogleUrlInput(campaignData.google_review_url || '');
          }
        }

        // Load analytics from analytics_logs
        const { count: scanCount } = await (supabase as any)
          .from('analytics_logs')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaignId)
          .eq('event_type', 'scan');

        const { count: reviewClickCount } = await (supabase as any)
          .from('analytics_logs')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaignId)
          .eq('event_type', 'review_click');

        const { count: aiSuggestionCount } = await (supabase as any)
          .from('analytics_logs')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaignId)
          .eq('event_type', 'ai_suggestion');

        setAnalytics({
          scans: scanCount || 0,
          views: scanCount || 0,
          ai_suggestions: aiSuggestionCount || 0,
          click_review: reviewClickCount || 0,
        });
      } catch (error) {
        console.error('Error loading campaign:', error);
        toast({
          title: "Error",
          description: "Failed to load campaign details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadCampaignData();
  }, [campaignId, toast]);

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ name: newName })
        .eq('id', campaignId);

      if (error) throw error;

      setCampaign(prev => prev ? { ...prev, name: newName } : null);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Campaign name updated successfully",
      });
    } catch (error) {
      console.error('Error updating name:', error);
      toast({
        title: "Error",
        description: "Failed to update campaign name",
        variant: "destructive",
      });
    }
  };

  const handleUpdateLogo = async () => {
    if (!location?.id) return;
    try {
      const { error } = await supabase
        .from('locations')
        .update({ logo_url: logoInput })
        .eq('id', location.id);

      if (error) throw error;

      setLocation(prev => prev ? { ...prev, logo_url: logoInput } : null);
      toast({
        title: "Success",
        description: "Logo updated successfully",
      });
    } catch (error) {
      console.error('Error updating logo:', error);
      toast({
        title: "Error",
        description: "Failed to update logo",
        variant: "destructive",
      });
    }
  };


  const handleUpdateLocation = async () => {
    if (!location?.id) return;
    try {
      const { error } = await supabase
        .from('locations')
        .update({
          name: locationName,
          address: locationAddress
        })
        .eq('id', location.id);

      if (error) throw error;

      setLocation(prev => prev ? { ...prev, name: locationName, address: locationAddress } : null);
      setIsEditingLocation(false);
      toast({
        title: "Success",
        description: "Location details updated successfully",
      });
    } catch (error) {
      console.error('Error updating location:', error);
      toast({
        title: "Error",
        description: "Failed to update location details",
        variant: "destructive",
      });
    }
  };

  const handleUpdateGoogleUrl = async () => {
    try {
      if (location?.id) {
        // Update location if it exists
        const { error } = await supabase
          .from('locations')
          .update({ google_review_url: googleUrlInput })
          .eq('id', location.id);
        if (error) throw error;
        setLocation(prev => prev ? { ...prev, google_review_url: googleUrlInput } : null);
      } else {
        // Update campaign if no location
        const { error } = await supabase
          .from('campaigns')
          .update({ google_review_url: googleUrlInput })
          .eq('id', campaignId);
        if (error) throw error;
        setCampaign(prev => prev ? { ...prev, google_review_url: googleUrlInput } : null);
      }

      setIsEditingGoogleUrl(false);
      toast({
        title: "Success",
        description: "Google Review Link updated successfully",
      });
    } catch (error) {
      console.error('Error updating Google URL:', error);
      toast({
        title: "Error",
        description: "Failed to update Google Review Link",
        variant: "destructive",
      });
    }
  };

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
    try {
      const resizedBlob = await resizeImage(file, 500, 0.8);
      const resizedFile = new File([resizedBlob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
      const fileName = `logo-${uuidv4()}.jpg`;
      const filePath = fileName; // Simplified path - just filename in root of bucket

      const { error: uploadError } = await supabase.storage
        .from('qr-logos')
        .upload(filePath, resizedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('qr-logos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Logo upload detailed error:', error);
      toast({
        title: "Upload Failed",
        description: error?.message || "Could not upload image. Ensure you have added 'Insert' policies to your 'qr-logos' bucket in Supabase.",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !location?.id) return;
    setUploadingLogo(true);
    try {
      const url = await uploadLogoToStorage(e.target.files[0]);
      if (url) {
        const { error } = await supabase
          .from('locations')
          .update({ logo_url: url })
          .eq('id', location.id);
        if (error) throw error;
        setLogoInput(url);
        setLocation(prev => prev ? { ...prev, logo_url: url } : null);
        toast({ title: "Success", description: "Logo uploaded and updated" });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!location?.id) return;
    try {
      const { error } = await supabase
        .from('locations')
        .update({ logo_url: null })
        .eq('id', location.id);
      if (error) throw error;
      setLogoInput('');
      setLocation(prev => prev ? { ...prev, logo_url: null } : null);
      toast({ title: "Success", description: "Logo removed successfully" });
    } catch (error) {
      console.error('Error removing logo:', error);
      toast({ title: "Error", description: "Failed to remove logo", variant: "destructive" });
    }
  };

  const handleDeleteCampaign = async () => {
    if (!campaignId) return;
    if (!confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) return;

    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      toast({ title: "Success", description: "Campaign deleted successfully" });
      navigate("/dashboard");
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({ title: "Error", description: "Failed to delete campaign", variant: "destructive" });
    }
  };

  const baseUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
  const reviewUrl = `${baseUrl}/review/${campaignId}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl md:text-2xl font-bold text-red-600 mb-4">Campaign Not Found</h1>
          <Button onClick={() => navigate("/dashboard")} className="min-h-[44px]">Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  const businessName = campaign?.name || location?.name || 'Business';
  const googleReviewUrl = location?.google_review_url || campaign?.google_review_url;
  const logoUrl = location?.logo_url;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Responsive Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="font-bold uppercase tracking-widest text-[9px] md:text-xs min-h-[44px] min-w-[44px]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
          {/* Campaign Title with Edit */}
          <div>
            {isEditing ? (
              <div className="flex items-center gap-2 mb-2 max-w-2xl">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="text-xl md:text-3xl font-bold h-12 md:h-14 bg-white shadow-sm"
                  autoFocus
                />
                <Button onClick={handleUpdateName} size="icon" className="h-12 w-12 bg-green-600 hover:bg-green-700 min-w-[48px]">
                  <Save className="h-5 w-5" />
                </Button>
                <Button onClick={() => setIsEditing(false)} size="icon" variant="outline" className="h-12 w-12 min-w-[48px]">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-start gap-3 group mb-1 md:mb-2">
                <h1 className="text-2xl md:text-3xl font-bold break-words leading-tight">{campaign?.name}</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="opacity-50 group-hover:opacity-100 transition-opacity h-8 w-8 hover:bg-slate-100 rounded-full"
                >
                  <Edit2 className="h-4 w-4 text-slate-400" />
                </Button>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-muted-foreground text-sm md:text-base">
                Status: <span className="capitalize font-medium">{campaign?.status}</span>
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteCampaign}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 font-bold uppercase tracking-widest text-[9px] md:text-[10px]"
              >
                <Trash2 className="h-3 w-3 mr-1.5" />
                Delete Campaign
              </Button>
            </div>
          </div>

          {/* Analytics Cards - Responsive Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
            {[
              { label: 'QR Scans', value: analytics.scans, icon: QrCode },
              { label: 'Page Views', value: analytics.views, icon: Eye },
              { label: 'AI Suggestions', value: analytics.ai_suggestions, icon: Sparkles },
              { label: 'Review Clicks', value: analytics.click_review, icon: MousePointerClick }
            ].map((stat, i) => (
              <Card key={i} className="border-slate-100 shadow-sm overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-3 md:p-6">
                  <CardTitle className="text-[8px] md:text-sm font-bold uppercase tracking-widest text-slate-400 truncate pr-2">{stat.label}</CardTitle>
                  <stat.icon className="h-3 w-3 md:h-4 md:w-4 text-red-600 shrink-0" />
                </CardHeader>
                <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                  <div className="text-xl md:text-3xl font-black italic">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* QR Code Card + Configuration - Responsive */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* QR Center */}
            <Card className="border-0 shadow-xl rounded-2xl md:rounded-[2rem] overflow-hidden">
              <CardHeader className="p-4 md:p-8">
                <CardTitle className="text-lg md:text-xl font-bold tracking-tight">QR Center</CardTitle>
                <CardDescription className="text-[9px] md:text-xs font-bold uppercase tracking-wider text-slate-400">
                  Deploy to physical locations
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4 md:space-y-8 p-4 md:p-10 pt-0 md:pt-0">
                {/* CRITICAL: Uses existing QR URL — never regenerates */}
                <div className="w-full flex justify-center">
                  <BrandedQRCard
                    value={reviewUrl}
                    businessName={businessName}
                    logoUrl={logoUrl}
                    primaryColor="#4285F4"
                    secondaryColor="#ffffff"
                    size={220}
                  />
                </div>
                <Button onClick={() => window.open(reviewUrl, '_blank')} variant="outline"
                  className="w-full h-12 md:h-14 rounded-xl font-bold uppercase tracking-widest text-[9px] md:text-[10px] border-slate-100 min-h-[44px]">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Live Preview Landing
                </Button>
              </CardContent>
            </Card>

            {/* Configuration Panel */}
            <Card className="border-0 shadow-xl rounded-2xl md:rounded-[2rem] overflow-hidden">
              <CardHeader className="p-4 md:p-8">
                <CardTitle className="text-lg md:text-xl font-bold tracking-tight">Configuration</CardTitle>
                <CardDescription className="text-[9px] md:text-xs font-bold uppercase tracking-wider text-slate-400">
                  Target assets and links
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6 p-4 md:p-8 pt-0 md:pt-0">
                <div>
                  <div className="flex justify-between items-center mb-1 md:mb-2 text-[9px] md:text-[10px] uppercase font-bold tracking-widest text-slate-400">
                    <h4>Google Direct Link</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => isEditingGoogleUrl ? handleUpdateGoogleUrl() : setIsEditingGoogleUrl(true)}
                      className="h-6 w-auto px-2 hover:bg-slate-100"
                    >
                      {isEditingGoogleUrl ? <Save className="h-3 w-3 text-green-600" /> : <Edit2 className="h-3 w-3" />}
                    </Button>
                  </div>
                  {isEditingGoogleUrl ? (
                    <div className="flex gap-2">
                      <Input
                        value={googleUrlInput}
                        onChange={(e) => setGoogleUrlInput(e.target.value)}
                        className="text-xs"
                        placeholder="https://g.page/r/..."
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsEditingGoogleUrl(false)}
                        className="h-9 w-9"
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ) : (googleReviewUrl ? (
                    <a
                      href={googleReviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs md:text-sm text-red-600 font-bold hover:underline break-all block"
                    >
                      {googleReviewUrl}
                    </a>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No link configured</p>
                  ))}
                </div>
                <div>
                  <h4 className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 md:mb-2">Review Booster URL</h4>
                  <p className="text-xs md:text-sm font-bold text-slate-900 break-all">{reviewUrl}</p>
                </div>
                {location && (
                  <div className="bg-slate-50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-100 group relative">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400">Linked Location</h4>
                      {!isEditingLocation ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setIsEditingLocation(true)}
                        >
                          <Edit2 className="h-3 w-3 text-slate-400" />
                        </Button>
                      ) : (
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            className="h-6 w-6 bg-green-600 hover:bg-green-700"
                            onClick={handleUpdateLocation}
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-6 w-6"
                            onClick={() => setIsEditingLocation(false)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {!isEditingLocation ? (
                      <>
                        <p className="text-sm md:text-base font-black text-slate-900 uppercase italic mb-1">{location.name}</p>
                        {location.address && <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wide">{location.address}</p>}
                      </>
                    ) : (
                      <div className="space-y-2">
                        <Input
                          value={locationName}
                          onChange={(e) => setLocationName(e.target.value)}
                          placeholder="Location Name"
                          className="font-bold text-sm"
                        />
                        <Input
                          value={locationAddress}
                          onChange={(e) => setLocationAddress(e.target.value)}
                          placeholder="Address / Description"
                          className="text-xs"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <h4 className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 md:mb-2">Brand Logo</h4>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={logoInput}
                        onChange={(e) => setLogoInput(e.target.value)}
                        placeholder="Paste Logo URL here"
                        className="text-xs"
                      />
                      <Button size="sm" onClick={handleUpdateLogo} disabled={logoInput === (location?.logo_url || '')}>
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                    {location?.logo_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveLogo}
                        className="h-7 w-auto px-2 text-red-500 hover:text-red-600 hover:bg-red-50 font-bold uppercase tracking-widest text-[9px]"
                      >
                        <Trash2 className="h-3 w-3 mr-1.5" />
                        Remove Logo
                      </Button>
                    )}

                    <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 hover:border-red-200 transition-all group flex flex-col items-center justify-center gap-2">
                      <input
                        type="file"
                        id="logo-upload"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                      />
                      {uploadingLogo ? (
                        <Loader2 className="h-6 w-6 text-red-600 animate-spin" />
                      ) : (
                        <Upload className="h-6 w-6 text-slate-400 group-hover:text-red-500 transition-colors" />
                      )}
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-red-600 transition-colors">
                        {uploadingLogo ? "Uploading..." : "Drag & Drop or Click to Upload"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* QR Code Preservation Notice */}
                <div className="bg-amber-50 border border-amber-200 p-3 md:p-4 rounded-xl">
                  <div className="flex items-start gap-2">
                    <QrCode className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[9px] md:text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">QR Code Protected</p>
                      <p className="text-[8px] md:text-[9px] text-amber-600 leading-relaxed">This QR code is actively used on printed materials. It will never be regenerated to prevent breaking existing cards in circulation.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Stats */}
          <Card className="rounded-2xl md:rounded-[2rem] overflow-hidden">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl">Campaign Stats</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Overview of campaign performance
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm font-medium">Total Scans</span>
                  <span className="text-base md:text-lg font-bold">{analytics.scans}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm font-medium">Review Clicks</span>
                  <span className="text-base md:text-lg font-bold">{analytics.click_review}</span>
                </div>
                {analytics.scans > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm font-medium">Conversion Rate</span>
                    <span className="text-base md:text-lg font-bold">
                      {((analytics.click_review / analytics.scans) * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CampaignDetails;
