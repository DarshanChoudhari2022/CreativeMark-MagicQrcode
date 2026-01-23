import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Star, Sparkles, TrendingUp, Zap, BarChart3, Shield,
  QrCode, MessageSquare, Phone, CheckCircle2, ArrowRight,
  Clock, Users, Award, Smartphone, Bot, CreditCard, Gift, XCircle, ChevronRight, Globe, ShieldCheck, Search, Activity, Layers
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
      <header className="fixed top-0 left-0 right-0 z-[60] bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Creative Mark Logo" className="h-12 md:h-16 w-auto object-contain rounded-lg" />
            <div className="hidden md:block">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">Creative Mark</p>
              <p className="text-sm font-black uppercase tracking-tight text-gray-900 leading-none">Review Systems</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-10 text-xs font-black uppercase tracking-widest text-gray-500">
            <button onClick={() => scrollToSection('overview')} className="hover:text-red-600 transition-colors uppercase">{t('nav.overview')}</button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-red-600 transition-colors uppercase">{t('nav.how_it_works')}</button>
            <button onClick={() => scrollToSection('testimonials')} className="hover:text-red-600 transition-colors uppercase">{t('nav.testimonials')}</button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-red-600 transition-colors uppercase">{t('nav.pricing')}</button>
            <button onClick={() => scrollToSection('faq')} className="hover:text-red-600 transition-colors uppercase">{t('nav.faq')}</button>
          </nav>

          <div className="flex items-center gap-6">
            <LanguageToggle />
            <Button
              variant="ghost"
              onClick={() => navigate("/auth")}
              className="hidden lg:flex text-xs font-black uppercase tracking-widest text-gray-400 hover:text-red-600"
            >
              Log In
            </Button>
            <Button
              onClick={() => navigate("/auth")}
              className="bg-red-600 hover:bg-black text-white text-xs font-black uppercase tracking-widest px-10 h-14 rounded-full shadow-2xl shadow-red-200 transition-all active:scale-95"
            >
              {t('nav.get_started')}
            </Button>
            {/* Mobile Menu Toggle */}
            <button
              className="xl:hidden p-3 text-gray-900 bg-gray-50 rounded-2xl"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <XCircle className="w-8 h-8" /> : <div className="space-y-2"><div className="w-8 h-1 bg-gray-900"></div><div className="w-8 h-1 bg-gray-900"></div><div className="w-6 h-1 bg-gray-900"></div></div>}
            </button>
          </div>
        </div>

        {/* Mobile Nav Overlay */}
        {isMenuOpen && (
          <div className="xl:hidden absolute top-full left-0 right-0 bg-white border-b shadow-2xl animate-in fade-in slide-in-from-top duration-300">
            <nav className="flex flex-col p-10 gap-8 font-black text-sm uppercase tracking-widest text-gray-900">
              <button onClick={() => scrollToSection('overview')} className="text-left py-3 border-b border-gray-50">Discovery</button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-left py-3 border-b border-gray-50">Process</button>
              <button onClick={() => scrollToSection('testimonials')} className="text-left py-3 border-b border-gray-50">Verification</button>
              <button onClick={() => scrollToSection('pricing')} className="text-left py-3 border-b border-gray-50">Investment</button>
              <Button onClick={() => navigate("/auth")} className="w-full mt-6 bg-red-600 text-white h-16 rounded-3xl font-black uppercase tracking-widest text-sm">
                Start Activation
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section - Pure Red & White */}
      <section className="pt-56 pb-32 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-red-50/30 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-red-50/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col items-center text-center">
              {/* Pro Badge */}
              <div className="inline-flex items-center gap-4 bg-red-600 text-white px-8 py-3 rounded-full mb-12 shadow-2xl shadow-red-200 transition-transform hover:scale-105">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">Enterprise AI Enabled</span>
              </div>

              {/* High Contrast Headline */}
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-10 leading-[0.85] tracking-tighter text-gray-900 uppercase">
                {t('landing.hero_title')} <span className="text-red-600">Growth.</span>
              </h1>

              {/* Modern Subheadline */}
              <p className="text-2xl md:text-3xl text-gray-500 mb-16 max-w-4xl mx-auto leading-relaxed font-medium">
                <strong className="text-gray-900">The Smartest way to grow.</strong> {t('landing.hero_subtitle')}
                <span className="block text-red-600 font-black uppercase tracking-[0.3em] text-sm mt-6">{t('landing.price_badge')}</span>
              </p>

              {/* CTA Center */}
              <div className="flex flex-col sm:flex-row gap-8 justify-center w-full max-w-xl">
                <Button
                  size="lg"
                  onClick={() => navigate("/auth")}
                  className="bg-red-600 hover:bg-black text-white text-sm font-black uppercase tracking-[0.2em] px-16 h-20 rounded-full shadow-2xl shadow-red-300 transition-all hover:scale-105 active:scale-95 flex-1"
                >
                  Get Started Now
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => scrollToSection('pricing')}
                  className="bg-white border-2 border-gray-100 hover:border-red-600 text-gray-900 hover:text-red-600 text-sm font-black uppercase tracking-[0.2em] px-16 h-20 rounded-full transition-all flex-1"
                >
                  View Pricing
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Overview Section - Luxury Split */}
      <section id="overview" className="py-40 bg-gray-50/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center max-w-7xl mx-auto">
            <div className="space-y-12">
              <div className="inline-block bg-white border border-red-100 px-6 py-2 rounded-full shadow-sm">
                <p className="text-xs font-black text-red-600 uppercase tracking-widest">{t('landing.overview_title')}</p>
              </div>
              <h2 className="text-5xl md:text-7xl font-black text-gray-900 leading-[0.9] uppercase tracking-tighter">
                {t('landing.what_is_reviewboost')}
              </h2>
              <p className="text-2xl text-gray-500 leading-relaxed font-medium">
                {t('landing.reviewboost_desc')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { title: "Smart QR", desc: "1-Tap connectivity for instant reviews", icon: QrCode },
                  { title: "AI Guided", desc: "Intelligent suggestions for customers", icon: Bot },
                  { title: "NFC Ready", desc: "Hardware integration for physical stores", icon: Smartphone },
                  { title: "Automated", desc: "Response engine for reputation growth", icon: Zap }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col gap-4 p-8 bg-white rounded-[2rem] border border-gray-50 shadow-sm hover:shadow-xl transition-all group">
                    <div className="p-3 bg-red-50 rounded-2xl w-fit group-hover:bg-red-600 transition-colors">
                      <item.icon className="w-6 h-6 text-red-600 group-hover:text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-400 font-bold uppercase tracking-wide leading-tight">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-red-600/5 rounded-[4rem] rotate-3 translate-x-6 translate-y-6"></div>
              <Card className="relative border-0 shadow-2xl rounded-[4rem] overflow-hidden bg-white aspect-square flex flex-col p-12 lg:p-16 space-y-10 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-xl shadow-red-200">
                      <Activity className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-black text-gray-900 uppercase">Live Intelligence</p>
                      <p className="text-xs font-black text-red-600 uppercase tracking-widest">System Status: Active</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="w-3 h-3 bg-gray-100 rounded-full"></div>
                    <div className="w-3 h-3 bg-gray-100 rounded-full"></div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center space-y-8">
                  {[
                    { label: "Data Extraction", val: "99.2%", icon: Search },
                    { label: "Semantic Analysis", val: "Verified", icon: MessageSquare },
                    { label: "Growth Velocity", val: "Optimized", icon: TrendingUp }
                  ].map((log, i) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl group-hover:bg-red-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                          <log.icon className="w-5 h-5 text-red-600" />
                        </div>
                        <p className="font-black text-gray-900 uppercase tracking-tight text-sm">{log.label}</p>
                      </div>
                      <p className="font-black text-red-600 uppercase tracking-tighter text-lg">{log.val}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <Layers className="w-5 h-5 text-gray-400" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Precision Infrastructure Division</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section - Simplified Workflow */}
      <section id="how-it-works" className="py-40 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-32 max-w-4xl mx-auto">
            <h2 className="text-xs font-black text-red-600 tracking-[0.4em] uppercase mb-6">{t('landing.how_it_works_title')}</h2>
            <h3 className="text-5xl md:text-7xl font-black text-gray-900 uppercase tracking-tighter leading-none">{t('landing.why_businesses_love')}</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-20 max-w-7xl mx-auto relative">
            {/* Step Connectors */}
            <div className="hidden lg:block absolute top-16 left-1/4 right-1/4 h-[4px] bg-red-50"></div>

            {[
              { title: t('landing.step1_title'), desc: t('landing.step1_desc'), icon: Smartphone },
              { title: t('landing.step2_title'), desc: t('landing.step2_desc'), icon: MessageSquare },
              { title: t('landing.step3_title'), desc: t('landing.step3_desc'), icon: TrendingUp }
            ].map((step, i) => (
              <div key={i} className="text-center group relative z-10">
                <div className="w-32 h-32 bg-white border-2 border-red-50 rounded-[3rem] flex items-center justify-center mx-auto mb-12 shadow-2xl group-hover:border-red-600 group-hover:-translate-y-4 transition-all duration-500">
                  <step.icon className="w-12 h-12 text-red-600" />
                </div>
                <h4 className="text-2xl font-black mb-6 text-gray-900 uppercase tracking-tight">{step.title}</h4>
                <p className="text-gray-400 font-bold text-base leading-relaxed px-6 uppercase tracking-wide">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verification / Testimonials - High Contrast */}
      <section id="testimonials" className="py-40 bg-gray-50/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-xs font-black text-red-600 tracking-[0.4em] uppercase mb-6">{t('landing.testimonials_title')}</h2>
            <h3 className="text-5xl md:text-7xl font-black text-gray-900 uppercase tracking-tighter leading-none">{t('landing.testimonials_subtitle')}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-7xl mx-auto">
            {testimonials.slice(0, 3).map((test, i) => (
              <Card key={i} className="border-0 shadow-2xl rounded-[3.5rem] bg-white overflow-hidden hover:scale-[1.03] transition-all duration-500">
                <CardContent className="p-12 md:p-16">
                  <div className="flex gap-2 mb-10">
                    {[...Array(test.rating)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 fill-red-600 text-red-600" />
                    ))}
                  </div>
                  <p className="text-gray-900 font-bold text-xl md:text-2xl leading-relaxed italic mb-12">"{test.text}"</p>
                  <div className="flex items-center gap-6 border-t border-gray-50 pt-10">
                    <div className="w-16 h-16 bg-red-600 rounded-[1.5rem] flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-red-200">
                      {test.author.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-gray-900 uppercase tracking-tight text-lg">{test.author}</p>
                      <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em]">{test.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Investment/Pricing - Bold Professionalism */}
      <section id="pricing" className="py-40 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-32">
            <h2 className="text-xs font-black text-red-600 tracking-[0.4em] uppercase mb-6">{t('pricing.title')}</h2>
            <h3 className="text-6xl md:text-8xl font-black text-gray-900 uppercase tracking-tighter leading-[0.85] mb-8">{t('pricing.choose_plan')}</h3>
            <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-sm">{t('pricing.subtitle')}</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="border-[16px] border-red-50 rounded-[5rem] relative overflow-hidden shadow-[0_80px_160px_-40px_rgba(220,38,38,0.15)] transition-all duration-700 bg-white group hover:scale-[1.02]">
              <div className="absolute top-12 right-12 bg-red-600 text-white text-xs font-black px-8 py-3 rounded-full uppercase tracking-[0.3em] shadow-2xl shadow-red-300 animate-pulse">
                LIMITED OFFER 🎁
              </div>
              <CardContent className="p-16 md:p-24">
                <div className="text-center mb-20 text-balance">
                  <h4 className="text-5xl font-black mb-8 uppercase tracking-tighter text-gray-900 group-hover:text-red-600 transition-colors">PRO ACTIVATION</h4>
                  <div className="flex items-center justify-center gap-6">
                    <span className="text-gray-200 line-through text-4xl font-black italic">₹3,499</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-9xl font-black text-gray-900 tracking-tighter leading-none group-hover:text-red-600 transition-colors">₹999</span>
                      <span className="text-gray-400 font-black uppercase text-2xl">/mo</span>
                    </div>
                  </div>
                  <div className="mt-12 inline-block bg-red-50 px-10 py-4 rounded-full border border-red-100">
                    <p className="text-sm font-black text-red-600 uppercase tracking-[0.3em]">Inclusive of all AI Tools</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-10 mb-20 px-4">
                  {[
                    t('pricing.item1'), t('pricing.item2'),
                    t('pricing.item3'), t('pricing.item4'),
                    t('pricing.item5'), t('pricing.item6'),
                    t('pricing.item7'), t('pricing.item8'),
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-6 group/item">
                      <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shrink-0 shadow-lg shadow-red-200">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-gray-900 font-black uppercase tracking-tight text-sm leading-none">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => navigate("/auth")}
                  className="w-full bg-red-600 hover:bg-black text-white h-24 text-2xl font-black uppercase tracking-[0.3em] rounded-[3rem] shadow-2xl shadow-red-300 active:scale-[0.97] transition-all duration-500"
                >
                  Activate License Now
                  <ArrowRight className="ml-4 h-8 w-8" />
                </Button>

                <p className="text-center text-gray-400 text-xs font-black uppercase tracking-[0.3em] mt-12 flex items-center justify-center gap-4">
                  <ShieldCheck className="h-6 w-6 text-red-600" /> SECURE STRIPE & RAZORPAY SETTLEMENT
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer - Strict Black/White */}
      <footer className="py-32 bg-gray-900 text-white rounded-t-[6rem]">
        <div className="container mx-auto px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-24">
            <div className="space-y-10">
              <img src="/logo.jpg" alt="Logo" className="h-20 w-auto object-contain rounded-3xl" />
              <p className="text-gray-400 text-base font-medium leading-loose uppercase tracking-tighter">
                {t('landing.footer_tagline')}
              </p>
            </div>
            <div>
              <h5 className="text-xs font-black uppercase tracking-[0.4em] text-red-600 mb-10">Solution</h5>
              <ul className="space-y-6 text-sm font-black uppercase tracking-widest text-gray-400">
                <li><button onClick={() => scrollToSection('overview')} className="hover:text-white transition-all">Overview</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-all">Workflow</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-all">Investment</button></li>
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-black uppercase tracking-[0.4em] text-red-600 mb-10">Contact Agents</h5>
              <ul className="space-y-6 text-sm font-black uppercase tracking-widest text-gray-400">
                <li className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center shadow-lg"><Phone className="w-5 h-5" /></div>
                  <a href="tel:9890976952" className="hover:text-white transition-all">9890976952</a>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center shadow-lg"><MessageSquare className="w-5 h-5 text-green-500" /></div>
                  <a href="https://wa.me/919890976952" className="hover:text-white transition-all">WHATSAPP AGENT</a>
                </li>
              </ul>
            </div>
            <div className="space-y-10">
              <h5 className="text-xs font-black uppercase tracking-[0.4em] text-red-600 mb-10">Corporate</h5>
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest leading-loose">
                Creative Mark Advertising <br />
                Precision Systems Division <br />
                Email: creativemarkadvertising@gmail.com
              </p>
            </div>
          </div>
          <div className="border-t border-white/5 pt-16 text-center text-xs font-black uppercase tracking-[0.5em] text-gray-500">
            &copy; 2026 Creative Mark Advertising &bull; Automated Growth Systems
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
