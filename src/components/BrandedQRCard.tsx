import React, { useRef, useEffect, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Theme Definitions ──────────────────────────────────────────
export interface CardTheme {
  id: string;
  name: string;
  description: string;
  cardBg: string;
  accentBar: string[];
  qrFg: string;
  qrBg: string;
  headingColor: string;
  subtextColor: string;
  ctaBg: string;
  ctaText: string;
  ctaBorder: string;
  starColor: string;
  shadowColor: string;
  glowFrom: string;
  glowTo: string;
  qrBorderColor: string;
  footerTextColor: string;
}

const THEMES: CardTheme[] = [
  {
    id: 'google-classic',
    name: 'Classic Google',
    description: 'Clean Google-branded look',
    cardBg: '#ffffff',
    accentBar: ['#4285F4', '#EA4335', '#FBBC05', '#34A853'],
    qrFg: '#202124',
    qrBg: '#ffffff',
    headingColor: '#202124',
    subtextColor: '#5F6368',
    ctaBg: '#202124',
    ctaText: '#ffffff',
    ctaBorder: 'rgba(255,255,255,0.1)',
    starColor: '#F9AB00',
    shadowColor: 'rgba(0,0,0,0.12)',
    glowFrom: 'rgba(66,133,244,0.06)',
    glowTo: 'rgba(234,67,53,0.06)',
    qrBorderColor: '#f1f3f4',
    footerTextColor: '#9AA0A6',
  },
  {
    id: 'midnight-elegance',
    name: 'Midnight Elegance',
    description: 'Premium dark aesthetic',
    cardBg: '#1a1a2e',
    accentBar: ['#e94560', '#0f3460', '#533483', '#e94560'],
    qrFg: '#ffffff',
    qrBg: '#16213e',
    headingColor: '#eaeaea',
    subtextColor: '#a0a0b8',
    ctaBg: '#e94560',
    ctaText: '#ffffff',
    ctaBorder: 'rgba(233,69,96,0.3)',
    starColor: '#FFD700',
    shadowColor: 'rgba(233,69,96,0.15)',
    glowFrom: 'rgba(233,69,96,0.08)',
    glowTo: 'rgba(83,52,131,0.08)',
    qrBorderColor: 'rgba(255,255,255,0.08)',
    footerTextColor: '#6b6b80',
  },
  {
    id: 'ocean-professional',
    name: 'Ocean Professional',
    description: 'Corporate blue gradient',
    cardBg: '#f8fafc',
    accentBar: ['#0369a1', '#0284c7', '#0ea5e9', '#38bdf8'],
    qrFg: '#0c4a6e',
    qrBg: '#ffffff',
    headingColor: '#0c4a6e',
    subtextColor: '#64748b',
    ctaBg: '#0369a1',
    ctaText: '#ffffff',
    ctaBorder: 'rgba(3,105,161,0.2)',
    starColor: '#F59E0B',
    shadowColor: 'rgba(3,105,161,0.12)',
    glowFrom: 'rgba(3,105,161,0.06)',
    glowTo: 'rgba(14,165,233,0.06)',
    qrBorderColor: '#e2e8f0',
    footerTextColor: '#94a3b8',
  },
  {
    id: 'warm-sunset',
    name: 'Warm Sunset',
    description: 'Inviting warm tones',
    cardBg: '#fffbf5',
    accentBar: ['#ea580c', '#f97316', '#fb923c', '#fdba74'],
    qrFg: '#431407',
    qrBg: '#ffffff',
    headingColor: '#431407',
    subtextColor: '#78716c',
    ctaBg: '#ea580c',
    ctaText: '#ffffff',
    ctaBorder: 'rgba(234,88,12,0.2)',
    starColor: '#F59E0B',
    shadowColor: 'rgba(234,88,12,0.12)',
    glowFrom: 'rgba(234,88,12,0.06)',
    glowTo: 'rgba(249,115,22,0.06)',
    qrBorderColor: '#fed7aa',
    footerTextColor: '#a8a29e',
  },
  {
    id: 'forest-premium',
    name: 'Forest Premium',
    description: 'Natural luxury theme',
    cardBg: '#f6faf6',
    accentBar: ['#15803d', '#16a34a', '#22c55e', '#4ade80'],
    qrFg: '#14532d',
    qrBg: '#ffffff',
    headingColor: '#14532d',
    subtextColor: '#6b7280',
    ctaBg: '#15803d',
    ctaText: '#ffffff',
    ctaBorder: 'rgba(21,128,61,0.2)',
    starColor: '#EAB308',
    shadowColor: 'rgba(21,128,61,0.12)',
    glowFrom: 'rgba(21,128,61,0.06)',
    glowTo: 'rgba(34,197,94,0.06)',
    qrBorderColor: '#bbf7d0',
    footerTextColor: '#9ca3af',
  },
];

// Export for external use
export { THEMES };

interface BrandedQRCardProps {
  value: string;
  businessName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  size?: number;
  themeId?: string;
  onThemeChange?: (themeId: string) => void;
}

// Google Star Rating Component
const GoogleStars = ({ color = '#F9AB00' }: { color?: string }) => (
  <div
    style={{
      display: 'block',
      textAlign: 'center' as const,
      width: '100%',
      lineHeight: 0,
    }}
  >
    {[1, 2, 3, 4, 5].map((i) => (
      <svg
        key={i}
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={color}
        style={{ display: 'inline-block', margin: '0 1px', verticalAlign: 'middle' }}
      >
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
    ))}
  </div>
);

// Google Logo Icon
const GoogleG = () => (
  <svg width="32" height="32" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.21.81-.63z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export const BrandedQRCard: React.FC<BrandedQRCardProps> = ({
  value,
  businessName,
  logoUrl,
  size = 280,
  themeId = 'google-classic',
  onThemeChange,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(themeId);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const theme = THEMES.find((t) => t.id === selectedTheme) || THEMES[0];

  // Sync external themeId prop changes
  useEffect(() => {
    setSelectedTheme(themeId);
  }, [themeId]);

  useEffect(() => {
    if (logoUrl) {
      setLogoLoaded(false);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = logoUrl;
      img.onload = () => setLogoLoaded(true);
      img.onerror = () => setLogoLoaded(false);
    } else {
      setLogoLoaded(false);
    }
  }, [logoUrl]);

  const handleThemeSelect = useCallback(
    (id: string) => {
      setSelectedTheme(id);
      onThemeChange?.(id);
      setShowThemePicker(false);
    },
    [onThemeChange]
  );

  const downloadQRCard = () => {
    if (!canvasRef.current) return;

    import('html2canvas').then((module) => {
      const html2canvas = (module.default || module) as any;
      html2canvas(canvasRef.current!, {
        scale: 4,
        useCORS: true,
        allowTaint: false,
        backgroundColor: theme.cardBg,
        logging: false,
      }).then((canvas: HTMLCanvasElement) => {
        const link = document.createElement('a');
        link.download = `${businessName.replace(/\s+/g, '-')}-google-review-card.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
      });
    });
  };

  // Compute sizes
  const logoDisplaySize = Math.max(72, Math.floor(size * 0.32));
  const qrLogoSize = Math.floor(size * 0.22);

  return (
    <div className="flex flex-col items-center gap-5" style={{ width: '100%' }}>
      {/* ── Theme Picker Toggle ── */}
      <div className="flex items-center gap-2 w-full max-w-[400px]">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowThemePicker(!showThemePicker)}
          className="gap-2 text-xs font-semibold rounded-xl"
        >
          <Palette className="h-4 w-4" />
          {showThemePicker ? 'Hide Themes' : 'Change Theme'}
        </Button>
        <span className="text-xs text-muted-foreground">{theme.name}</span>
      </div>

      {/* ── Theme Options ── */}
      {showThemePicker && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-[400px] animate-in fade-in slide-in-from-top-2 duration-200">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => handleThemeSelect(t.id)}
              className={`relative rounded-xl p-3 text-left transition-all duration-200 border-2 ${selectedTheme === t.id
                  ? 'border-blue-500 shadow-lg scale-[1.02]'
                  : 'border-transparent hover:border-gray-200 hover:shadow'
                }`}
              style={{ backgroundColor: t.cardBg }}
            >
              <div className="flex rounded-full overflow-hidden h-1.5 mb-2">
                {t.accentBar.map((c, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                ))}
              </div>
              <p className="text-[10px] font-bold" style={{ color: t.headingColor }}>
                {t.name}
              </p>
              <p className="text-[8px] mt-0.5" style={{ color: t.subtextColor }}>
                {t.description}
              </p>
              {selectedTheme === t.id && (
                <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          THE PRINTABLE CARD AREA
         ══════════════════════════════════════════════ */}
      <div
        ref={canvasRef}
        style={{
          backgroundColor: theme.cardBg,
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          borderRadius: '24px',
          boxShadow: `0 20px 60px -12px ${theme.shadowColor}, 0 8px 24px -8px ${theme.shadowColor}`,
          overflow: 'hidden',
          width: '100%',
          maxWidth: '400px',
          position: 'relative',
          userSelect: 'none',
        }}
      >
        {/* ── Google Accent Bar ── */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '5px',
          }}
        >
          {theme.accentBar.map((color, i) => (
            <div key={i} style={{ flex: 1, backgroundColor: color }} />
          ))}
        </div>

        {/* ── Card Inner Content ── */}
        <div
          style={{
            textAlign: 'center',
            padding: '32px 28px 24px',
          }}
        >
          {/* ── Brand Logo ── */}
          <div
            style={{
              width: `${logoDisplaySize}px`,
              height: `${logoDisplaySize}px`,
              borderRadius: '20px',
              overflow: 'hidden',
              margin: '0 auto 16px auto',
              backgroundColor: logoUrl && logoLoaded ? 'transparent' : theme.qrBg,
              border: logoUrl && logoLoaded ? 'none' : `1px solid ${theme.qrBorderColor}`,
              boxShadow: logoUrl && logoLoaded ? 'none' : `0 2px 8px ${theme.shadowColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {logoUrl && logoLoaded ? (
              <img
                src={logoUrl}
                alt="Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
                crossOrigin="anonymous"
              />
            ) : (
              <GoogleG />
            )}
          </div>

          {/* ── Business Name ── */}
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 900,
              color: theme.headingColor,
              lineHeight: 1.2,
              textAlign: 'center',
              margin: '0 auto 12px auto',
              padding: '0 8px',
              letterSpacing: '-0.01em',
              wordBreak: 'break-word',
            }}
          >
            {businessName}
          </h2>

          {/* ── Stars ── */}
          <div style={{ marginBottom: '6px' }}>
            <GoogleStars color={theme.starColor} />
          </div>

          {/* ── "Review Us On Google" text ── */}
          <p
            style={{
              color: theme.subtextColor,
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              textAlign: 'center',
              margin: '0 auto 24px auto',
            }}
          >
            Review Us On Google
          </p>

          {/* ── QR Code Section ── */}
          {/* 
            IMPORTANT: Logo is NOT embedded via QRCodeSVG imageSettings 
            because html2canvas cannot render SVG <image> elements with 
            cross-origin URLs. Instead, the logo is overlaid as a separate 
            <img> element positioned absolutely over the QR code center.
          */}
          <div
            style={{
              position: 'relative',
              display: 'inline-block',
            }}
          >
            {/* Subtle Glow */}
            <div
              style={{
                position: 'absolute',
                top: '-12px',
                left: '-12px',
                right: '-12px',
                bottom: '-12px',
                borderRadius: '28px',
                background: `linear-gradient(135deg, ${theme.glowFrom}, ${theme.glowTo})`,
                filter: 'blur(16px)',
                opacity: 0.7,
                zIndex: 0,
                pointerEvents: 'none',
              }}
            />

            {/* QR Container */}
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                backgroundColor: theme.qrBg,
                padding: '20px',
                borderRadius: '20px',
                border: `1px solid ${theme.qrBorderColor}`,
                boxShadow: `0 4px 20px -4px ${theme.shadowColor}`,
                lineHeight: 0,
                display: 'inline-block',
              }}
            >
              <QRCodeSVG
                value={value}
                size={size}
                level="H"
                fgColor={theme.qrFg}
                bgColor={theme.qrBg}
              /* NO imageSettings — logo is overlaid separately for html2canvas compatibility */
              />

              {/* Logo overlay on top of QR code center */}
              {logoUrl && logoLoaded && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: `${qrLogoSize}px`,
                    height: `${qrLogoSize}px`,
                    backgroundColor: theme.qrBg,
                    borderRadius: '8px',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                    boxShadow: `0 1px 4px ${theme.shadowColor}`,
                  }}
                >
                  <img
                    src={logoUrl}
                    alt="Logo"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block',
                      borderRadius: '4px',
                    }}
                    crossOrigin="anonymous"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── "SCAN TO REVIEW" CTA Button ── */}
          {/* 
            Using display:block + margin:auto for centering.
            This is the most reliable method for html2canvas.
            Flexbox and inline-flex can cause misalignment in rendered output.
          */}
          <div
            style={{
              marginTop: '24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                backgroundColor: theme.ctaBg,
                borderRadius: '14px',
                padding: '14px 36px',
                color: theme.ctaText,
                boxShadow: `0 6px 20px -4px ${theme.shadowColor}`,
                border: `1px solid ${theme.ctaBorder}`,
                display: 'inline-block',
                textAlign: 'center',
                lineHeight: '1',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={theme.ctaText}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  marginRight: '10px',
                }}
              >
                <path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span
                style={{
                  color: theme.ctaText,
                  fontSize: '12px',
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  whiteSpace: 'nowrap',
                  lineHeight: '1',
                  textTransform: 'uppercase',
                  fontFamily: 'inherit',
                  display: 'inline-block',
                  verticalAlign: 'middle',
                }}
              >
                SCAN TO REVIEW
              </span>
            </div>
          </div>

          {/* ── Footer Branding ── */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '20px',
            }}
          >
            <img
              src="/logo.jpg"
              alt="Creative Mark"
              style={{
                height: '28px',
                width: 'auto',
                display: 'inline-block',
                objectFit: 'contain',
              }}
              crossOrigin="anonymous"
            />
            <p
              style={{
                fontSize: '7px',
                color: theme.footerTextColor,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.16em',
                textAlign: 'center',
                margin: '2px 0 0 0',
                lineHeight: 1.4,
              }}
            >
              ReviewBoost Technology
            </p>
          </div>
        </div>
      </div>

      {/* ── Action Buttons (Outside the printable area) ── */}
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
