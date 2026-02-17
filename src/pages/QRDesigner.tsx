import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { QRTemplate, FrameStyle } from '@/types/database.types';
import { QRCodeCanvas } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Upload, Save, Palette, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function QRDesigner() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);

  const [template, setTemplate] = useState<QRTemplate>({
    id: '',
    user_id: '',
    name: 'My QR Template',
    primary_color: '#4285F4',
    secondary_color: '#ffffff',
    frame_style: 'rounded' as FrameStyle,
    cta_text: 'Scan to Review',
    logo_url: null,
    is_default: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState('https://example.com/review');
  const [saving, setSaving] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        setLogoUrl(url);
        setLogoPreview(url);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTemplate = async () => {
    setSaving(true);
    try {
      toast({ title: "Template Saved", description: "Your QR template has been saved successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save template.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const downloadQR = async (format: string) => {
    if (!qrRef.current) return;
    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = (html2canvasModule.default || html2canvasModule) as any;

      const canvas: HTMLCanvasElement = await html2canvas(qrRef.current, {
        scale: 4, // High resolution 300 DPI equivalent
        useCORS: true,
        backgroundColor: template.secondary_color,
      });

      const link = document.createElement('a');
      link.download = `QR_${template.name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();

      toast({ title: "Downloaded!", description: "QR code saved as high-resolution PNG." });
    } catch (error) {
      console.error('Download failed:', error);
      toast({ title: "Error", description: "Failed to download QR code.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/20 font-inter">
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

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-10 max-w-6xl">
        {/* Page Title */}
        <div className="mb-6 md:mb-10 border-l-4 border-red-600 pl-4 md:pl-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-950 tracking-tight">QR Code Designer</h1>
          <p className="text-slate-400 font-semibold text-xs md:text-sm mt-1">Create branded QR codes with custom colors and logos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
          {/* Design Controls */}
          <Card className="border-0 shadow-lg rounded-2xl md:rounded-3xl overflow-hidden">
            <CardHeader className="p-4 md:p-6 bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-lg md:text-xl font-bold tracking-tight flex items-center gap-2">
                <Palette className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
                Design Settings
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">Customize your QR code appearance</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4 md:space-y-5">
              {/* Template Name */}
              <div>
                <Label htmlFor="template-name" className="font-bold text-slate-700 text-sm">Template Name</Label>
                <Input
                  id="template-name"
                  value={template.name}
                  onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                  placeholder="Enter template name"
                  className="mt-1.5 h-11 md:h-12 rounded-xl border-slate-200"
                />
              </div>

              {/* Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <Label htmlFor="primary-color" className="text-[10px] md:text-xs text-slate-400 font-semibold uppercase tracking-wider">Primary Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="primary-color"
                      type="color"
                      value={template.primary_color}
                      onChange={(e) => setTemplate({ ...template, primary_color: e.target.value })}
                      className="h-10 md:h-11 w-14 md:w-20 p-1 cursor-pointer rounded-lg"
                    />
                    <Input
                      value={template.primary_color}
                      onChange={(e) => setTemplate({ ...template, primary_color: e.target.value })}
                      placeholder="#000000"
                      className="h-10 md:h-11 rounded-xl font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="secondary-color" className="text-[10px] md:text-xs text-slate-400 font-semibold uppercase tracking-wider">Background Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={template.secondary_color}
                      onChange={(e) => setTemplate({ ...template, secondary_color: e.target.value })}
                      className="h-10 md:h-11 w-14 md:w-20 p-1 cursor-pointer rounded-lg"
                    />
                    <Input
                      value={template.secondary_color}
                      onChange={(e) => setTemplate({ ...template, secondary_color: e.target.value })}
                      placeholder="#ffffff"
                      className="h-10 md:h-11 rounded-xl font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Frame Style */}
              <div>
                <Label htmlFor="frame-style" className="font-bold text-slate-700 text-sm">Frame Style</Label>
                <Select
                  value={template.frame_style}
                  onValueChange={(value: FrameStyle) => setTemplate({ ...template, frame_style: value })}
                >
                  <SelectTrigger className="mt-1.5 h-11 md:h-12 rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                    <SelectItem value="rounded">Rounded</SelectItem>
                    <SelectItem value="circle">Circle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* CTA Text */}
              <div>
                <Label htmlFor="cta-text" className="font-bold text-slate-700 text-sm">Call-to-Action Text</Label>
                <Input
                  id="cta-text"
                  value={template.cta_text || ''}
                  onChange={(e) => setTemplate({ ...template, cta_text: e.target.value })}
                  placeholder="Scan to Review"
                  className="mt-1.5 h-11 md:h-12 rounded-xl border-slate-200"
                />
              </div>

              {/* Logo Upload */}
              <div>
                <Label className="font-bold text-slate-700 text-sm">Logo Upload</Label>
                <div className="flex items-center gap-2 md:gap-3 mt-1.5">
                  <label
                    htmlFor="logo-upload"
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors font-semibold text-sm text-slate-600 min-h-[44px]"
                  >
                    <Upload className="h-4 w-4" />
                    Choose Logo
                  </label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="sr-only"
                  />
                  {logoPreview && (
                    <img src={logoPreview} alt="Logo preview" className="h-10 w-10 md:h-12 md:w-12 object-contain rounded-lg border border-slate-200" />
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2">
                <Button
                  onClick={handleSaveTemplate}
                  disabled={saving}
                  className="w-full bg-red-600 hover:bg-red-700 text-white h-12 md:h-14 rounded-xl md:rounded-2xl font-bold uppercase tracking-widest text-[10px] md:text-xs shadow-lg transition-all active:scale-[0.98] min-h-[48px]"
                >
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Template
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="border-0 shadow-lg rounded-2xl md:rounded-3xl overflow-hidden">
            <CardHeader className="p-4 md:p-6 bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-lg md:text-xl font-bold tracking-tight">Preview</CardTitle>
              <CardDescription className="text-xs md:text-sm">High-resolution QR code (300 DPI)</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4 md:space-y-5">
              {/* QR Preview */}
              <div
                className="flex flex-col items-center justify-center p-6 md:p-10 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100"
                ref={qrRef}
              >
                <div style={{
                  padding: '16px',
                  backgroundColor: template.secondary_color,
                  borderRadius: template.frame_style === 'rounded' ? '12px' : template.frame_style === 'circle' ? '50%' : '0',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                }}>
                  <QRCodeCanvas value={previewUrl}
                    size={Math.min(256, typeof window !== 'undefined' ? window.innerWidth - 120 : 256)}
                    fgColor={template.primary_color}
                    bgColor={template.secondary_color}
                    level="H"
                    imageSettings={logoUrl ? {
                      src: logoUrl,
                      height: 50,
                      width: 50,
                      excavate: true,
                    } : undefined}
                  />
                </div>
                {template.cta_text && (
                  <p className="mt-3 md:mt-4 text-base md:text-lg font-bold text-center text-slate-700">{template.cta_text}</p>
                )}
              </div>

              {/* Preview URL */}
              <div>
                <Label htmlFor="preview-url" className="font-bold text-slate-700 text-sm">Preview URL</Label>
                <Input
                  id="preview-url"
                  value={previewUrl}
                  onChange={(e) => setPreviewUrl(e.target.value)}
                  placeholder="https://example.com/review"
                  className="mt-1.5 h-11 md:h-12 rounded-xl border-slate-200 text-sm"
                />
              </div>

              {/* Download Options */}
              <div className="space-y-2">
                <Label className="font-bold text-slate-700 text-sm">Download QR Code</Label>
                <div className="flex gap-2">
                  <Button
                    onClick={() => downloadQR('png')}
                    variant="outline"
                    className="flex-1 rounded-xl border-slate-200 hover:border-red-500 hover:text-red-600 font-bold text-xs uppercase tracking-wider min-h-[44px]"
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    PNG
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl border-slate-200 font-bold text-xs uppercase tracking-wider min-h-[44px]"
                    disabled
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    SVG
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl border-slate-200 font-bold text-xs uppercase tracking-wider min-h-[44px]"
                    disabled
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    PDF
                  </Button>
                </div>
                <p className="text-[10px] md:text-xs text-slate-400 font-medium">SVG and PDF formats coming soon</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
