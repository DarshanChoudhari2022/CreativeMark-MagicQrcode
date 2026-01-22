import React, { useRef, useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BrandedQRCardProps {
  value: string;
  businessName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string; // Background or accent
  size?: number;
}

export const BrandedQRCard: React.FC<BrandedQRCardProps> = ({
  value,
  businessName,
  logoUrl,
  primaryColor = '#4285F4', // Default Google Blue
  secondaryColor = '#ffffff',
  size = 250
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [logoLoaded, setLogoLoaded] = useState(false);

  // Preload logo to ensure it renders in the canvas
  useEffect(() => {
    if (logoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Critical for canvas export
      img.src = logoUrl;
      img.onload = () => setLogoLoaded(true);
      img.onerror = () => setLogoLoaded(false);
    }
  }, [logoUrl]);

  const downloadQRCard = () => {
    if (!canvasRef.current) return;

    // Dynamically import html2canvas to avoid build issues
    import('html2canvas').then((module) => {
      const html2canvas = (module.default || module) as any;
      html2canvas(canvasRef.current!, {
        scale: 3, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: secondaryColor,
        scrollY: -window.scrollY, // Fix potential capture offsets
      }).then((canvas: HTMLCanvasElement) => {
        const link = document.createElement('a');
        link.download = `${businessName.replace(/\s+/g, '-')}-review-card.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
      });
    });
  };

  // Google Brand Colors for accents if needed
  // Blue: #4285F4, Red: #EA4335, Yellow: #FBBC05, Green: #34A853

  return (
    <div className="space-y-6">
      {/* The Printable Card Area */}
      <div
        ref={canvasRef}
        className="relative overflow-hidden rounded-xl shadow-2xl mx-auto flex flex-col items-center justify-center p-8 transition-transform hover:scale-[1.02] duration-300"
        style={{
          width: '380px',
          backgroundColor: secondaryColor,
          fontFamily: "'Inter', 'Roboto', sans-serif"
        }}
      >
        {/* Top Decoration Bar */}
        <div className="absolute top-0 left-0 w-full h-2 flex">
          <div className="h-full w-1/4 bg-[#4285F4]"></div>
          <div className="h-full w-1/4 bg-[#EA4335]"></div>
          <div className="h-full w-1/4 bg-[#FBBC05]"></div>
          <div className="h-full w-1/4 bg-[#34A853]"></div>
        </div>

        {/* Header Section */}
        <div className="mt-4 text-center space-y-2 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight" style={{ color: primaryColor === '#ffffff' ? '#333' : '#333' }}>
            {businessName}
          </h2>
          <div className="flex items-center justify-center gap-1">
            <div className="flex text-[#FBBC05]">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className="w-5 h-5 fill-current" />
              ))}
            </div>
          </div>
          <p className="text-gray-500 font-medium text-sm uppercase tracking-wide">
            Review us on Google
          </p>
        </div>

        {/* QR Code Container */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
          <QRCodeCanvas
            value={value}
            size={size}
            level="H" // High error correction level for logos
            fgColor={primaryColor === '#ffffff' ? '#000000' : primaryColor} // Ensure contrast
            bgColor="#ffffff" // Always white background for QR readability
            includeMargin={true}
            imageSettings={logoUrl && logoLoaded ? {
              src: logoUrl,
              height: size * 0.2, // 20% of QR size
              width: size * 0.2,
              excavate: true, // Digs a hole for the logo so it doesn't overlap dots
            } : undefined}
          />
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center gap-2 bg-gray-100 px-4 py-2 rounded-full mb-2">
            <span className="text-2xl">📱</span>
            <span className="text-sm font-bold text-gray-700">SCAN ME</span>
          </div>

          <div className="flex items-center justify-center gap-2 mt-4 opacity-80">
            <span className="text-xs text-gray-400 font-medium">Powered by Google Reviews</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center">
        <Button
          onClick={downloadQRCard}
          className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-8 py-2 rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          <Download className="mr-2 h-4 w-4" />
          Download Printable Card
        </Button>
      </div>
    </div>
  );
};
