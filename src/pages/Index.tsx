import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Star, Sparkles, TrendingUp, Zap, BarChart3, Shield,
  QrCode, MessageSquare, Phone, CheckCircle2, ArrowRight,
  Clock, Users, Award, Smartphone, Bot, CreditCard, Gift, XCircle, ChevronRight, Globe, ShieldCheck, Play
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "@/components/LanguageToggle";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const testimonialRef = useRef<HTMLDivElement>(null);

  const clients = [
    { name: t('landing.client1_name'), location: t('landing.client1_loc'), description: t('landing.client1_desc') },
    { name: t('landing.client2_name'), location: t('landing.client2_loc'), description: t('landing.client2_desc') },
    { name: t('landing.client3_name'), location: t('landing.client3_loc'), description: t('landing.client3_desc') },
    { name: t('landing.client4_name'), location: t('landing.client4_loc'), description: t('landing.client4_desc') },
    { name: t('landing.client5_name'), location: t('landing.client5_loc'), description: t('landing.client5_desc') },
  ];

  const testimonials = [
    { rating: 5, text: t('landing.test1_text'), author: t('landing.client1_name'), location: t('landing.client1_loc') },
    { rating: 5, text: t('landing.test2_text'), author: t('landing.client2_name'), location: t('landing.client2_loc') },
    { rating: 5, text: t('landing.test3_text'), author: t('landing.client3_name'), location: t('landing.client3_loc') },
    { rating: 5, text: t('landing.test4_text'), author: t('landing.client4_name'), location: t('landing.client4_loc') },
    { rating: 5, text: t('landing.test5_text'), author: t('landing.client5_name'), location: t('landing.client5_loc') },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (id: string) => {
    setIsMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white font-inter">
      {/* Navigation Header - Strict White/Red */}
      <header className="fixed top-0 left-0 right-0 z-[60] bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Creative Mark Logo" className="h-10 md:h-14 w-auto object-contain rounded-lg" />
            <div className="hidden md:block">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">Creative Mark</p>
              <p className="text-xs font-black uppercase tracking-tight text-gray-900 leading-none">Review Systems</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-8 text-[11px] font-black uppercase tracking-widest text-gray-500">
            <button onClick={() => scrollToSection('overview')} className="hover:text-red-600 transition-colors uppercase">{t('nav.overview')}</button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-red-600 transition-colors uppercase">{t('nav.how_it_works')}</button>
            <button onClick={() => scrollToSection('testimonials')} className="hover:text-red-600 transition-colors uppercase">{t('nav.testimonials')}</button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-red-600 transition-colors uppercase">{t('nav.pricing')}</button>
            <button onClick={() => scrollToSection('faq')} className="hover:text-red-600 transition-colors uppercase">{t('nav.faq')}</button>
          </nav>

          <div className="flex items-center gap-4">
            <LanguageToggle />
            <Button
              variant="ghost"
              onClick={() => navigate("/auth")}
              className="hidden lg:flex text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-600"
            >
              Log In
            </Button>
            <Button
              onClick={() => navigate("/auth")}
              className="bg-red-600 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest px-8 h-12 rounded-full shadow-2xl shadow-red-200 transition-all active:scale-95"
            >
              {t('nav.get_started')}
            </Button>
            {/* Mobile Menu Toggle */}
            <button
              className="xl:hidden p-2 text-gray-900 bg-gray-50 rounded-xl"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <XCircle className="w-6 h-6" /> : <div className="space-y-1.5"><div className="w-6 h-0.5 bg-gray-900"></div><div className="w-6 h-0.5 bg-gray-900"></div><div className="w-4 h-0.5 bg-gray-900"></div></div>}
            </button>
          </div>
        </div>

        {/* Mobile Nav Overlay */}
        {isMenuOpen && (
          <div className="xl:hidden absolute top-full left-0 right-0 bg-white border-b shadow-2xl animate-in slide-in-from-top duration-300">
            <nav className="flex flex-col p-8 gap-6 font-black text-xs uppercase tracking-widest text-gray-900">
              <button onClick={() => scrollToSection('overview')} className="text-left py-2 border-b border-gray-50">Discovery</button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-left py-2 border-b border-gray-50">Process</button>
              <button onClick={() => scrollToSection('testimonials')} className="text-left py-2 border-b border-gray-50">Verification</button>
              <button onClick={() => scrollToSection('pricing')} className="text-left py-2 border-b border-gray-50">Investment</button>
              <Button onClick={() => navigate("/auth")} className="w-full mt-4 bg-red-600 text-white h-14 rounded-2xl font-black uppercase tracking-widest">
                Start Activation
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section - Pure Red & White */}
      <section className="pt-48 pb-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-red-50/30 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-red-50/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col items-center text-center">
              {/* Pro Badge */}
              <div className="inline-flex items-center gap-3 bg-red-600 text-white px-6 py-2 rounded-full mb-10 shadow-xl shadow-red-200">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Enterprise AI Enabled</span>
              </div>

              {/* High Contrast Headline */}
              <h1 className="text-5xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter text-gray-900 uppercase">
                {t('landing.hero_title')} <span className="text-red-600">Growth.</span>
              </h1>

              {/* Modern Subheadline */}
              <p className="text-xl md:text-2xl text-gray-500 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
                <strong>The Smartest way to grow.</strong> {t('landing.hero_subtitle')}
                <span className="block text-red-600 font-black uppercase tracking-[0.3em] text-xs mt-4">{t('landing.price_badge')}</span>
              </p>

              {/* CTA Center */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center w-full max-w-md">
                <Button
                  size="lg"
                  onClick={() => navigate("/auth")}
                  className="bg-red-600 hover:bg-black text-white text-xs font-black uppercase tracking-[0.2em] px-12 h-16 rounded-full shadow-2xl shadow-red-300 transition-all hover:scale-105 active:scale-95 flex-1"
                >
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => scrollToSection('pricing')}
                  className="bg-white border-2 border-gray-100 hover:border-red-600 text-gray-900 hover:text-red-600 text-xs font-black uppercase tracking-[0.2em] px-12 h-16 rounded-full transition-all flex-1"
                >
                  View Pricing
                </Button>
              </div>

              {/* Floating Trust Metrics */}
              <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 w-full border-t border-gray-50 pt-16">
                {[
                  { label: "Active Users", value: "2K+", icon: Users },
                  { label: "AI Replies", value: "50K+", icon: Bot },
                  { label: "QR Scans", value: "1M+", icon: QrCode },
                  { label: "Conversion", value: "48%", icon: TrendingUp }
                ].map((stat, i) => (
                  <div key={i} className="text-center group">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-red-50 rounded-2xl group-hover:bg-red-600 transition-all">
                        <stat.icon className="w-5 h-5 text-red-600 group-hover:text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Overview Section - Luxury Split */}
      <section id="overview" className="py-32 bg-gray-50/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center max-w-6xl mx-auto">
            <div className="space-y-8">
              <div className="inline-block bg-white border border-red-100 px-4 py-1.5 rounded-full">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{t('landing.overview_title')}</p>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight uppercase tracking-tighter">
                {t('landing.what_is_reviewboost')}
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed font-medium">
                {t('landing.reviewboost_desc')}
              </p>
              <ul className="space-y-4">
                {[
                  "1-Tap Smart QR Technology",
                  "AI Guided Customer Reviews",
                  "NFC Hardware Integration",
                  "Automated Response Engine"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-black text-gray-900 uppercase tracking-tight">
                    <div className="bg-red-600 p-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-red-600/5 rounded-[3rem] rotate-3 translate-x-4 translate-y-4"></div>
              <div className="relative bg-white border-8 border-white shadow-2xl rounded-[3rem] overflow-hidden aspect-video flex items-center justify-center">
                <Play className="w-20 h-20 text-red-600 fill-red-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section - Simplified Workflow */}
      <section id="how-it-works" className="py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-24 max-w-3xl mx-auto">
            <h2 className="text-[10px] font-black text-red-600 tracking-[0.3em] uppercase mb-4">{t('landing.how_it_works_title')}</h2>
            <h3 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter">{t('landing.why_businesses_love')}</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-16 max-w-6xl mx-auto relative">
            {/* Step Connectors */}
            <div className="hidden lg:block absolute top-12 left-1/4 right-1/4 h-[2px] bg-red-50"></div>

            {[
              { num: "01", title: t('landing.step1_title'), desc: t('landing.step1_desc'), icon: Smartphone },
              { num: "02", title: t('landing.step2_title'), desc: t('landing.step2_desc'), icon: MessageSquare },
              { num: "03", title: t('landing.step3_title'), desc: t('landing.step3_desc'), icon: TrendingUp }
            ].map((step, i) => (
              <div key={i} className="text-center group relative z-10">
                <div className="w-24 h-24 bg-white border-2 border-red-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-xl group-hover:border-red-600 group-hover:-translate-y-2 transition-all">
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-black">
                    {step.num}
                  </div>
                  <step.icon className="w-10 h-10 text-red-600" />
                </div>
                <h4 className="text-xl font-black mb-4 text-gray-900 uppercase tracking-tight">{step.title}</h4>
                <p className="text-gray-400 font-medium text-sm leading-relaxed px-4">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verification / Testimonials - High Contrast */}
      <section id="testimonials" className="py-32 bg-gray-50/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-[10px] font-black text-red-600 tracking-[0.3em] uppercase mb-4">{t('landing.testimonials_title')}</h2>
            <h3 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter">{t('landing.testimonials_subtitle')}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {testimonials.slice(0, 3).map((test, i) => (
              <Card key={i} className="border-0 shadow-xl rounded-[2.5rem] bg-white overflow-hidden hover:scale-[1.02] transition-all">
                <CardContent className="p-10">
                  <div className="flex gap-1 mb-8">
                    {[...Array(test.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-red-600 text-red-600" />
                    ))}
                  </div>
                  <p className="text-gray-700 font-bold text-lg leading-relaxed italic mb-10">"{test.text}"</p>
                  <div className="flex items-center gap-4 border-t border-gray-50 pt-8">
                    <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                      {test.author.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-gray-900 uppercase tracking-tight text-sm">{test.author}</p>
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{test.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Investment/Pricing - Bold Professionalism */}
      <section id="pricing" className="py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-24">
            <h2 className="text-[10px] font-black text-red-600 tracking-[0.3em] uppercase mb-4">{t('pricing.title')}</h2>
            <h3 className="text-5xl md:text-6xl font-black text-gray-900 uppercase tracking-tighter leading-none mb-6">{t('pricing.choose_plan')}</h3>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">{t('pricing.subtitle')}</p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Card className="border-[12px] border-red-50 rounded-[4rem] relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(220,38,38,0.1)] transition-all bg-white group">
              <div className="absolute top-8 right-8 bg-red-600 text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-red-200">
                LIMITED OFFER 🎁
              </div>
              <CardContent className="p-12 md:p-20">
                <div className="text-center mb-16">
                  <h4 className="text-4xl font-black mb-6 uppercase tracking-tighter text-gray-900 group-hover:text-red-600 transition-colors">PRO ACTIVATION</h4>
                  <div className="flex items-center justify-center gap-4">
                    <span className="text-gray-200 line-through text-2xl font-black italic">₹3,499</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-8xl font-black text-gray-900 tracking-tighter leading-none group-hover:text-red-600 transition-colors">₹999</span>
                      <span className="text-gray-400 font-black uppercase text-xl">/mo</span>
                    </div>
                  </div>
                  <div className="mt-8 inline-block bg-red-50 px-8 py-3 rounded-full border border-red-100">
                    <p className="text-xs font-black text-red-600 uppercase tracking-[0.3em]">Inclusive of all AI Tools</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-16 px-4">
                  {[
                    t('pricing.item1'), t('pricing.item2'),
                    t('pricing.item3'), t('pricing.item4'),
                    t('pricing.item5'), t('pricing.item6'),
                    t('pricing.item7'), t('pricing.item8'),
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-4 group/item">
                      <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-900 font-black uppercase tracking-tight text-[11px] leading-none">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => navigate("/auth")}
                  className="w-full bg-red-600 hover:bg-black text-white h-20 text-xl font-black uppercase tracking-[0.3em] rounded-3xl shadow-2xl shadow-red-200 active:scale-[0.98] transition-all"
                >
                  Activate License Now
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>

                <p className="text-center text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mt-10 flex items-center justify-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-red-600" /> SECURE STRIPE & RAZORPAY SETTLEMENT
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer - Strict Black/White */}
      <footer className="py-24 bg-gray-900 text-white rounded-t-[5rem]">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
            <div className="space-y-8">
              <img src="/logo.jpg" alt="Logo" className="h-16 w-auto object-contain rounded-2xl" />
              <p className="text-gray-400 text-sm font-medium leading-relaxed uppercase tracking-tighter">
                {t('landing.footer_tagline')}
              </p>
            </div>
            <div>
              <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600 mb-8">Solution</h5>
              <ul className="space-y-4 text-xs font-black uppercase tracking-widest text-gray-400">
                <li><button onClick={() => scrollToSection('overview')} className="hover:text-white transition-all">Overview</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-all">Workflow</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-all">Investment</button></li>
              </ul>
            </div>
            <div>
              <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600 mb-8">Contact Agents</h5>
              <ul className="space-y-4 text-xs font-black uppercase tracking-widest text-gray-400">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center"><Phone className="w-4 h-4" /></div>
                  <a href="tel:9890976952" className="hover:text-white transition-all">9890976952</a>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center"><MessageSquare className="w-4 h-4 text-green-500" /></div>
                  <a href="https://wa.me/919890976952" className="hover:text-white transition-all">WHATSAPP AGENT</a>
                </li>
              </ul>
            </div>
            <div className="space-y-8">
              <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600 mb-8">Corporate</h5>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-loose">
                Creative Mark Advertising <br />
                Precision Systems Division <br />
                Email: creativemarkadvertising@gmail.com
              </p>
            </div>
          </div>
          <div className="border-t border-white/5 pt-12 text-center text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">
            &copy; 2026 Creative Mark Advertising &bull; Automated Growth Systems
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
