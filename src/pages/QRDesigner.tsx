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
import { ArrowLeft, Download, Upload, Save, Palette } from 'lucide-react';

export default function QRDesigner() {
  const navigate = useNavigate();
  // ... (keep state)

  // ... (keep handleLogoUpload, handleSaveTemplate, downloadQR)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-2 p-0 hover:bg-transparent justify-start">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">QR Code Designer</h1>
          <p className="text-muted-foreground">Create branded QR codes with custom colors and logos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Design Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Design Settings</CardTitle>
            <CardDescription>Customize your QR code appearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={template.name}
                onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                placeholder="Enter template name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    value={template.primary_color}
                    onChange={(e) => setTemplate({ ...template, primary_color: e.target.value })}
                    className="h-10 w-20"
                  />
                  <Input
                    value={template.primary_color}
                    onChange={(e) => setTemplate({ ...template, primary_color: e.target.value })}
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="secondary-color">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary-color"
                    type="color"
                    value={template.secondary_color}
                    onChange={(e) => setTemplate({ ...template, secondary_color: e.target.value })}
                    className="h-10 w-20"
                  />
                  <Input
                    value={template.secondary_color}
                    onChange={(e) => setTemplate({ ...template, secondary_color: e.target.value })}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="frame-style">Frame Style</Label>
              <Select
                value={template.frame_style}
                onValueChange={(value: FrameStyle) => setTemplate({ ...template, frame_style: value })}
              >
                <SelectTrigger>
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

            <div>
              <Label htmlFor="cta-text">Call-to-Action Text</Label>
              <Input
                id="cta-text"
                value={template.cta_text || ''}
                onChange={(e) => setTemplate({ ...template, cta_text: e.target.value })}
                placeholder="Scan to Review"
              />
            </div>

            <div>
              <Label htmlFor="logo-upload">Logo Upload</Label>
              <div className="flex gap-2">
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
                <Button variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              {logoUrl && (
                <img src={logoUrl} alt="Logo preview" className="mt-2 h-16 w-16 object-contain" />
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveTemplate} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                Save Template
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>High-resolution QR code (300 DPI)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center p-8 bg-muted rounded-lg" ref={qrRef}>
              <div style={{
                padding: '20px',
                backgroundColor: template.secondary_color,
                borderRadius: template.frame_style === 'rounded' ? '12px' : template.frame_style === 'circle' ? '50%' : '0',
              }}>
                <QRCodeCanvas value={previewUrl}
                  size={256}
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
                <p className="mt-4 text-lg font-semibold text-center">{template.cta_text}</p>
              )}
            </div>

            <div>
              <Label htmlFor="preview-url">Preview URL</Label>
              <Input
                id="preview-url"
                value={previewUrl}
                onChange={(e) => setPreviewUrl(e.target.value)}
                placeholder="https://example.com/review"
              />
            </div>

            <div className="space-y-2">
              <Label>Download QR Code</Label>
              <div className="flex gap-2">
                <Button onClick={() => downloadQR('png')} variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  PNG
                </Button>
                <Button onClick={() => downloadQR('svg')} variant="outline" className="flex-1" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  SVG
                </Button>
                <Button onClick={() => downloadQR('pdf')} variant="outline" className="flex-1" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">SVG and PDF formats coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
