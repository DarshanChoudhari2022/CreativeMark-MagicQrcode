import React, { useRef, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BrandedQRCardProps {
  value: string;
  businessName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string; // Background color
  size?: number;
}

// Google Star Rating Component (Maps Style)
const GoogleStars = () => (
  <div className="flex items-center justify-center mx-auto" style={{ width: 'fit-content' }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <svg key={i} className={`w-6 h-6 text-[#F9AB00] ${i !== 5 ? 'mr-0.5' : ''}`} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
    ))}
  </div>
);

// Google Logo Icon
const GoogleG = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.21.81-.63z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335" />
  </svg>
);

export const BrandedQRCard: React.FC<BrandedQRCardProps> = ({
  value,
  businessName,
  logoUrl,
  primaryColor = '#4285F4',
  secondaryColor = '#ffffff',
  size = 280
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [logoLoaded, setLogoLoaded] = useState(false);

  useEffect(() => {
    if (logoUrl) {
      console.log("Preloading logo:", logoUrl);
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Important for canvas
      img.src = logoUrl;
      img.onload = () => {
        console.log("Logo loaded successfully");
        setLogoLoaded(true);
      };
      img.onerror = (e) => {
        console.error("Logo failed to load:", e);
        setLogoLoaded(false);
      };
    }
  }, [logoUrl]);

  const downloadQRCard = () => {
    if (!canvasRef.current) return;

    import('html2canvas').then((module) => {
      const html2canvas = (module.default || module) as any;
      html2canvas(canvasRef.current!, {
        scale: 4, // High resolution for printing
        useCORS: true,
        allowTaint: false,
        backgroundColor: secondaryColor,
        logging: false,
      }).then((canvas: HTMLCanvasElement) => {
        const link = document.createElement('a');
        link.download = `${businessName.replace(/\s+/g, '-')}-google-review-card.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
      });
    });
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* The Printable Card Area */}
      <div
        ref={canvasRef}
        className="relative overflow-hidden rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-white flex flex-col items-center p-6 md:p-10 select-none w-full max-w-[400px]"
        style={{
          backgroundColor: secondaryColor,
          fontFamily: "'Inter', sans-serif"
        }}
      >
        {/* Modern Google Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 flex shadow-sm">
          <div className="h-full w-1/4 bg-[#4285F4]"></div>
          <div className="h-full w-1/4 bg-[#EA4335]"></div>
          <div className="h-full w-1/4 bg-[#FBBC05]"></div>
          <div className="h-full w-1/4 bg-[#34A853]"></div>
        </div>

        {/* Brand Header */}
        <div className="mt-8 flex flex-col items-center justify-center text-center space-y-4 w-full">
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-50 mb-2 min-w-[80px] min-h-[80px] flex items-center justify-center overflow-hidden">
            {logoUrl && logoLoaded ? (
              <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain mx-auto" style={{ display: 'block', maxWidth: '64px', maxHeight: '64px' }} />
            ) : (
              <div className="scale-125"><GoogleG /></div>
            )}
          </div>

          <div className="space-y-1 px-4 w-full flex flex-col items-center justify-center">
            <h2 className="text-2xl font-black text-[#202124] leading-tight text-center w-full block" style={{ textAlign: 'center', fontWeight: '900' }}>
              {businessName}
            </h2>
            <div className="w-full text-center">
              <div className="inline-block mt-3 mb-1">
                <GoogleStars />
              </div>
              <p className="text-[#5F6368] font-bold text-sm tracking-widest uppercase mt-1 text-center w-full block" style={{ textAlign: 'center' }}>
                Review Us On Google
              </p>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="relative mt-8 group w-full flex justify-center">
          {/* Subtle Glow Background */}
          <div className="absolute -inset-4 bg-gradient-to-tr from-[#4285F410] to-[#EA433510] rounded-[2rem] blur-xl opacity-50"></div>

          <div className="relative bg-white p-6 rounded-[2rem] shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-gray-100">
            <QRCodeSVG
              value={value}
              size={size}
              level="H"
              imageSettings={logoUrl && logoLoaded ? {
                src: logoUrl,
                height: Math.floor(size * 0.25),
                width: Math.floor(size * 0.25),
                excavate: true,
                crossOrigin: 'anonymous',
              } : undefined}
            />
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-8 w-full" style={{ textAlign: 'center', width: '100%' }}>
          <div
            style={{
              backgroundColor: '#202124',
              borderRadius: '16px',
              display: 'inline-block',
              padding: '12px 32px',
              color: '#ffffff',
              boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
              minWidth: '240px',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: '10' }}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: '12px', display: 'inline-block', verticalAlign: 'middle' }}
              >
                <path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span
                style={{
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '900',
                  letterSpacing: '0.15em',
                  whiteSpace: 'nowrap',
                  lineHeight: '1',
                  display: 'inline-block',
                  verticalAlign: 'middle'
                }}
              >
                SCAN TO REVIEW
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center w-full">
            <img src="/logo.jpg" alt="Creative Mark" className="h-8 w-auto mx-auto" />
            <p className="text-[8px] text-[#70757A] font-bold uppercase tracking-widest -mt-2 text-center w-full">
              ReviewBoost Technology
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <Button
        onClick={downloadQRCard}
        className="w-full max-w-sm bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold py-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 gap-3 text-lg"
      >
        <Download className="h-6 w-6" />
        Download Printable Card
      </Button>
    </div>
  );
};

