import React, { useRef, useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Star, ShieldCheck, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BrandedQRCardProps {
  value: string;
  businessName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string; // Background color
  size?: number;
  category?: string;
}

// Custom Premium Stars
const RedStars = () => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} className="w-5 h-5 text-red-600 fill-red-600" />
    ))}
  </div>
);

export const BrandedQRCard: React.FC<BrandedQRCardProps> = ({
  value,
  businessName,
  logoUrl,
  primaryColor = '#dc2626',
  secondaryColor = '#ffffff',
  size = 280,
  category = 'Business'
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [logoLoaded, setLogoLoaded] = useState(false);

  useEffect(() => {
    if (logoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = logoUrl;
      img.onload = () => setLogoLoaded(true);
      img.onerror = () => setLogoLoaded(false);
    }
  }, [logoUrl]);

  const downloadQRCard = () => {
    if (!canvasRef.current) return;
    import('html2canvas').then((module) => {
      const html2canvas = (module.default || module) as any;
      html2canvas(canvasRef.current!, {
        scale: 4,
        useCORS: true,
        allowTaint: false,
        backgroundColor: secondaryColor,
        logging: false,
      }).then((canvas: HTMLCanvasElement) => {
        const link = document.createElement('a');
        link.download = `${businessName.replace(/\s+/g, '-')}-pro-review-card.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
      });
    });
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {/* The Printable Card Area - High Fidelity Red & White */}
      <div
        ref={canvasRef}
        className="relative overflow-hidden rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(220,38,38,0.15)] bg-white flex flex-col items-center p-12 select-none w-full max-w-[420px] border border-gray-100"
        style={{
          fontFamily: "'Inter', sans-serif"
        }}
      >
        {/* Professional Red Accent */}
        <div className="absolute top-0 left-0 w-full h-3 bg-red-600 shadow-sm"></div>

        {/* Brand Identity */}
        <div className="mt-8 flex flex-col items-center text-center space-y-4 w-full">
          {logoUrl && logoLoaded ? (
            <div className="w-20 h-20 bg-white rounded-2xl shadow-xl border border-gray-50 p-2 overflow-hidden mb-2">
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-red-600 rounded-2xl shadow-xl flex items-center justify-center mb-2">
              <Star className="text-white h-10 w-10 fill-white" />
            </div>
          )}

          <div className="space-y-2 px-4">
            <h2 className="text-3xl font-black text-gray-900 leading-none uppercase tracking-tighter">
              {businessName}
            </h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{category} Specialist</p>
            <div className="flex flex-col items-center gap-3 pt-2">
              <RedStars />
              <p className="text-red-600 font-black text-xs tracking-[0.2em] uppercase mt-1">
                Official Feedback Partner
              </p>
            </div>
          </div>
        </div>

        {/* QR Core */}
        <div className="relative mt-8 group">
          <div className="absolute -inset-6 bg-red-500/5 rounded-[3rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative bg-white p-8 rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.05)] border border-gray-50 transition-all group-hover:scale-105">
            <QRCodeCanvas
              value={value}
              size={size}
              level="H"
              fgColor="#111111"
              bgColor="#ffffff"
              includeMargin={false}
              imageSettings={logoUrl && logoLoaded ? {
                src: logoUrl,
                height: Math.floor(size * 0.22),
                width: Math.floor(size * 0.22),
                excavate: true,
              } : undefined}
            />
          </div>
        </div>

        {/* Action Call */}
        <div className="mt-10 flex flex-col items-center space-y-6 w-full">
          <div className="bg-gray-900 text-white w-full py-5 rounded-[1.5rem] font-black tracking-[0.2em] text-xs shadow-2xl flex items-center justify-center gap-3">
            <QrCode className="w-4 h-4 text-red-600" />
            SCAN TO ACCELERATE
          </div>

          <div className="flex items-center gap-2 pt-2 grayscale opacity-40">
            <img src="/logo.jpg" alt="Creative Mark" className="h-5 w-auto" />
            <p className="text-[10px] text-gray-900 font-black uppercase tracking-widest">
              Precision AI Systems
            </p>
          </div>
        </div>
      </div>

      <Button
        onClick={downloadQRCard}
        className="w-full max-w-sm bg-red-600 hover:bg-black text-white font-black uppercase tracking-widest h-16 rounded-2xl shadow-xl shadow-red-100 transition-all duration-300 gap-3 text-xs"
      >
        <Download className="h-4 w-4" />
        Export Production Assets
      </Button>
    </div>
  );
};
