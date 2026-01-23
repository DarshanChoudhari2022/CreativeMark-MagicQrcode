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
  <div className="flex items-center gap-1.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} className="w-6 h-6 text-red-600 fill-red-600 drop-shadow-sm" />
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
    <div className="flex flex-col items-center gap-10">
      {/* The Printable Card Area - High Fidelity Red & White */}
      <div
        ref={canvasRef}
        className="relative overflow-hidden rounded-[4rem] shadow-[0_60px_120px_-30px_rgba(220,38,38,0.2)] bg-white flex flex-col items-center p-14 select-none w-full max-w-[480px] border border-gray-100 transition-all duration-700 hover:scale-[1.02]"
        style={{
          fontFamily: "'Inter', sans-serif"
        }}
      >
        {/* Professional Red Accent */}
        <div className="absolute top-0 left-0 w-full h-4 bg-red-600 shadow-lg"></div>

        {/* Brand Identity */}
        <div className="mt-10 flex flex-col items-center text-center space-y-6 w-full">
          {logoUrl && logoLoaded ? (
            <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl border border-gray-50 p-3 overflow-hidden mb-2 transition-transform hover:rotate-3">
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-24 h-24 bg-red-600 rounded-3xl shadow-2xl flex items-center justify-center mb-2 transition-transform hover:rotate-3">
              <Star className="text-white h-12 w-12 fill-white italic" />
            </div>
          )}

          <div className="space-y-3 px-6">
            <h2 className="text-4xl font-black text-gray-900 leading-none uppercase tracking-tighter italic">
              {businessName}
            </h2>
            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.4em] mt-2 italic">{category} Specialist</p>
            <div className="flex flex-col items-center gap-4 pt-4">
              <RedStars />
              <p className="text-red-600 font-extrabold text-sm tracking-[0.3em] uppercase mt-1 italic">
                Official Feedback Partner
              </p>
            </div>
          </div>
        </div>

        {/* QR Core */}
        <div className="relative mt-12 group">
          <div className="absolute -inset-8 bg-red-500/10 rounded-[4rem] blur-2xl opacity-60 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative bg-white p-10 rounded-[3.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.08)] border border-gray-50 transition-all group-hover:scale-105 duration-500">
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
        <div className="mt-14 flex flex-col items-center space-y-8 w-full">
          <div className="bg-gray-950 text-white w-full py-6 rounded-[2.5rem] font-black tracking-[0.4em] text-sm shadow-2xl flex items-center justify-center gap-4 transition-all hover:bg-red-600">
            <QrCode className="w-5 h-5 text-red-600 group-hover:text-white" />
            SCAN TO ACCELERATE
          </div>

          <div className="flex items-center gap-4 pt-4 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all cursor-crosshair">
            <img src="/logo.jpg" alt="Creative Mark" className="h-8 w-auto rounded-lg" />
            <p className="text-xs text-gray-900 font-black uppercase tracking-[0.3em] italic">
              Precision AI Systems
            </p>
          </div>
        </div>
      </div>

      <Button
        onClick={downloadQRCard}
        className="w-full max-w-md bg-red-600 hover:bg-black text-white font-black uppercase tracking-[0.4em] h-20 rounded-[2rem] shadow-2xl shadow-red-200 transition-all duration-500 gap-4 text-sm active:scale-95"
      >
        <Download className="h-6 w-6" />
        Export Production Assets
      </Button>
    </div>
  );
};
