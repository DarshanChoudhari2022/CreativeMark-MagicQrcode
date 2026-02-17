import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Star, Sparkles, TrendingUp, Zap, Users,
  CheckCircle2, ArrowRight, Menu, X, Smartphone, MessageSquare, ArrowLeft
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "@/components/LanguageToggle";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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

  const scrollToSection = (id: string) => {
    setIsMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white font-inter text-gray-900 overflow-x-hidden">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 md:px-6 h-16 md:h-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.href = "https://creativemarkadvertising.com/"}
              className="lg:hidden h-10 w-10 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = "https://creativemarkadvertising.com/"}>
              <img src="/logo.jpg" alt="Creative Mark Logo" className="h-10 md:h-20 w-auto object-contain rounded-lg" />
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            <a
              href="https://creativemarkadvertising.com/"
              className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-red-600 transition-colors"
            >
              {t('home')}
            </a>
            {['overview', 'how_it_works', 'testimonials', 'pricing', 'faq'].map((section) => (
              <button
                key={section}
                onClick={() => scrollToSection(section)}
                className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-red-600 transition-colors"
              >
                {t(`nav.${section}`)}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/auth")} className="hidden sm:flex text-xs font-bold uppercase tracking-widest hover:text-red-600">
              {t('nav.signin')}
            </Button>
            <Button
              onClick={() => navigate("/request-service")}
              className="hidden sm:flex bg-red-600 hover:bg-black text-white text-[10px] sm:text-xs font-black uppercase tracking-widest px-4 sm:px-6 h-10 rounded-full shadow-lg shadow-red-100 transition-all hover:scale-105 active:scale-95"
            >
              {t('nav.get_started')}
            </Button>
            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 text-gray-900"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Overlay */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-xl animate-in slide-in-from-top-2 duration-300">
            <nav className="flex flex-col p-6 gap-4">
              <a
                href="https://creativemarkadvertising.com/"
                className="text-left py-3 border-b border-gray-50 text-sm font-bold uppercase tracking-widest text-gray-900"
              >
                {t('home')}
              </a>
              {['overview', 'how_it_works', 'testimonials', 'pricing', 'faq'].map((section) => (
                <button
                  key={section}
                  onClick={() => scrollToSection(section)}
                  className="text-left py-3 border-b border-gray-50 text-sm font-bold uppercase tracking-widest text-gray-900"
                >
                  {t(`nav.${section}`)}
                </button>
              ))}
              <Button onClick={() => navigate("/auth")} variant="ghost" className="w-full text-gray-900 font-bold uppercase tracking-widest hover:text-red-600">
                {t('nav.signin')}
              </Button>
              <Button onClick={() => navigate("/request-service")} className="w-full mt-2 bg-red-600 text-white h-12 rounded-xl font-bold uppercase tracking-widest">
                {t('nav.get_started')}
              </Button>
            </nav>
          </div>
        )}
      </header>


      {/* Hero / Overview Section */}
      <section id="overview" className="pt-32 md:pt-44 pb-16 md:pb-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-50/40 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/2 -z-10"></div>
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 px-4 py-1.5 rounded-full mb-6 shadow-sm">
              <span className="text-[10px] font-bold text-red-600 tracking-widest uppercase">{t('landing.badge_new')}</span>
              <span className="text-gray-300">|</span>
              <span className="text-[10px] font-bold text-gray-900 tracking-wider uppercase">{t('landing.badge_ai')}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-slate-900 leading-tight">
              {t('landing.what_is_reviewboost')}
            </h1>
            <p className="text-lg md:text-xl text-gray-500 font-medium leading-relaxed max-w-3xl mx-auto mb-8">
              {t('landing.reviewboost_desc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate("/request-service")}
                className="bg-red-600 hover:bg-black text-white text-sm font-black uppercase tracking-widest px-8 h-14 rounded-full shadow-xl shadow-red-200 transition-all hover:-translate-y-1 active:scale-95"
              >
                {t('landing.cta_main')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                onClick={() => scrollToSection('pricing')}
                className="text-sm px-8 h-14 rounded-full border-2 border-gray-200 text-gray-600 font-bold hover:border-red-600 hover:text-red-600 hover:bg-red-50 transition-all"
              >
                {t('landing.cta_secondary')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works / Process Section */}
      <section id="how_it_works" className="py-16 md:py-24 bg-gray-50 border-y border-gray-100">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12 px-4">
            <h2 className="text-[10px] font-bold text-red-600 tracking-[0.3em] mb-4 uppercase">{t('landing.how_it_works_title')}</h2>
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
              {t('landing.reviewboost_desc').split('.')[0] + '.'}
            </h3>
          </div>

          <div className="max-w-5xl mx-auto relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-[2.5rem] left-[15%] right-[15%] h-0.5 bg-red-100 z-0"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
              {[
                { emoji: '📲', text: t('landing.flow_scan'), icon: Smartphone, label: t('landing.step_01_label'), desc: t('landing.step1_desc') },
                { emoji: '✨', text: t('landing.flow_post'), icon: Sparkles, label: t('landing.step_02_label'), desc: t('landing.step2_desc') },
                { emoji: '🚀', text: t('landing.flow_rank'), icon: TrendingUp, label: t('landing.step_result_label'), desc: t('landing.step3_desc') }
              ].map((flow, i) => (
                <div key={i} className="flex flex-col items-center text-center group">
                  <div className="w-20 h-20 bg-white border-4 border-red-50 rounded-full flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300 relative">
                    <flow.icon className="h-8 w-8 text-red-600" />
                    <div className="absolute -top-3 bg-gray-900 text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase">
                      {flow.label}
                    </div>
                  </div>
                  <h4 className="text-lg font-bold tracking-tight mb-2 text-slate-900">{flow.text}</h4>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-xs">
                    {flow.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comparative Matrix */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold text-red-600 tracking-[0.3em] mb-4 uppercase">{t('landing.comparison_title')}</h2>
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">{t('landing.before_after_title')}</h3>
          </div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6 items-stretch">
            {/* Before Card */}
            <Card className="bg-slate-100 border-2 border-dashed border-slate-200 shadow-none rounded-2xl overflow-hidden relative group hover:bg-slate-200/50 transition-colors">
              <CardContent className="p-6 md:p-10 text-center h-full flex flex-col justify-center">
                <div className="absolute top-0 left-0 bg-slate-400 text-white text-[10px] font-bold px-5 py-1.5 rounded-br-xl uppercase tracking-widest">
                  {t('landing.before_label')}
                </div>
                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl grayscale opacity-70">
                  😕
                </div>
                <h4 className="text-lg font-bold text-slate-600 mb-3 uppercase tracking-tight line-through decoration-red-500/50 decoration-2">
                  {t('landing.traditional_way')}
                </h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                  {t('landing.before_desc')}
                </p>
                <div className="mt-auto">
                  <span className="inline-block bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm">
                    {t('landing.before_result')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* After Card (ReviewBoost) */}
            <Card className="bg-gradient-to-br from-red-600 to-red-700 text-white border-0 shadow-xl shadow-red-200 rounded-2xl overflow-hidden relative transform md:-rotate-1 hover:rotate-0 transition-transform duration-300">
              <div className="absolute top-0 right-0 bg-black/20 text-white text-[10px] font-bold px-5 py-1.5 rounded-bl-xl uppercase tracking-widest backdrop-blur-sm">
                {t('common.recommended')}
              </div>
              <CardContent className="p-6 md:p-10 text-center h-full flex flex-col justify-center">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-5 text-4xl shadow-inner">
                  🚀
                </div>
                <h4 className="text-2xl font-black mb-3 uppercase tracking-tight italic">
                  {t('landing.with_reviewboost')}
                </h4>
                <p className="text-base text-red-100 font-medium leading-relaxed mb-6">
                  {t('landing.after_desc')}
                </p>
                <div className="mt-auto">
                  <span className="inline-block bg-white text-red-600 px-6 py-2.5 rounded-full text-sm font-black uppercase tracking-widest shadow-lg">
                    {t('landing.after_result')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 md:py-24 bg-gray-900 overflow-hidden relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12 relative z-10">
            <h2 className="text-xs font-bold text-red-500 tracking-[0.3em] mb-4 uppercase">{t('landing.testimonials_title')}</h2>
            <h3 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight italic">{t('landing.testimonials_subtitle')}</h3>
          </div>

          <div className="flex gap-5 overflow-x-auto pb-6 custom-scrollbar snap-x">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="min-w-[280px] md:min-w-[360px] border-0 bg-white/5 backdrop-blur-md rounded-2xl hover:bg-white/10 transition-all border border-white/10 snap-center">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-red-500 text-red-500" />
                    ))}
                  </div>
                  <p className="text-base text-white mb-6 font-medium italic leading-relaxed">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3 border-t border-white/10 pt-4">
                    <div className="w-10 h-10 bg-red-600 text-white rounded-lg flex items-center justify-center text-lg font-black">
                      {testimonial.author.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm uppercase tracking-tight">{testimonial.author}</p>
                      <p className="text-gray-400 text-xs uppercase tracking-wider">{testimonial.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 md:py-24 bg-white relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-[10px] font-bold text-red-600 tracking-[0.3em] mb-4 uppercase">{t('pricing.title')}</h2>
            <h3 className="text-2xl md:text-4xl font-bold tracking-tight text-slate-900">{t('pricing.choose_plan')}</h3>
          </div>

          <div className="max-w-xl mx-auto">
            <Card className="border-2 border-gray-100 shadow-xl rounded-3xl relative overflow-hidden group hover:border-red-100 transition-colors bg-white">
              <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-6 py-1.5 rounded-bl-2xl uppercase tracking-widest z-10">
                {t('pricing.limited_offer')}
              </div>
              <CardContent className="p-6 md:p-10">
                <div className="text-center mb-8">
                  <h4 className="text-xl font-black mb-4 uppercase tracking-tight italic">{t('pricing.lifetime_pro')}</h4>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-5xl md:text-6xl font-black text-gray-900 tracking-tighter italic">₹999</span>
                      <div className="text-left">
                        <p className="text-red-600 font-bold text-xs uppercase tracking-widest">{t('pricing.lifetime_text')}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('pricing.no_renewal')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    t('pricing.item1'), t('pricing.item2'), t('pricing.item3'), t('pricing.item4'),
                    t('pricing.item5'), t('pricing.item6'), t('pricing.item7'), t('pricing.item8'),
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <span className="text-gray-700 font-bold uppercase tracking-wide text-[10px]">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => navigate("/request-service")}
                  className="w-full bg-red-600 hover:bg-black text-white h-14 text-base font-black uppercase tracking-widest shadow-lg rounded-xl transition-all hover:scale-[1.02] active:scale-95"
                >
                  {t('pricing.claim_button')}
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 md:py-24 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold text-red-600 tracking-[0.3em] mb-4 uppercase">{t('faq.title')}</h2>
            <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tight italic text-gray-900">{t('faq.subtitle')}</h3>
          </div>

          <div className="max-w-2xl mx-auto space-y-3">
            {[...Array(4)].map((_, index) => (
              <Card
                key={index}
                className={`cursor-pointer border-0 rounded-2xl transition-all duration-300 overflow-hidden ${openFaq === index ? 'shadow-lg bg-white' : 'bg-white/50 border border-transparent hover:bg-white'}`}
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <CardContent className="p-5 md:p-6">
                  <div className="flex justify-between items-center gap-4">
                    <h4 className="font-bold text-base md:text-lg uppercase tracking-tight italic text-gray-900">{t(`faq.q${index + 1}`)}</h4>
                    <span className={`text-xl font-bold text-red-600 transition-transform duration-300 ${openFaq === index ? 'rotate-45' : ''}`}>+</span>
                  </div>
                  {openFaq === index && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-500 font-medium leading-relaxed">{t(`faq.a${index + 1}`)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="py-20 bg-gray-950 text-white border-t border-gray-900">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-16">
            <div className="space-y-6">
              <img
                src="/logo.jpg"
                alt="Logo"
                className="h-16 w-auto object-contain transition-all cursor-pointer hover:opacity-80"
                onClick={() => window.location.href = "https://creativemarkadvertising.com/"}
              />
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
                {t('landing.footer_tagline')}
              </p>
            </div>
            {['product', 'support', 'email'].map((key) => (
              <div key={key}>
                <h5 className="text-xs font-black text-red-600 uppercase tracking-widest mb-6">{t(`nav.${key}`)}</h5>
                <ul className="space-y-4 text-sm font-bold uppercase tracking-wide text-gray-400">
                  {key === 'product' && ['overview', 'how_it_works', 'pricing', 'faq'].map(item => (
                    <li key={item}><button onClick={() => scrollToSection(item)} className="hover:text-white transition-colors">{t(`nav.${item}`)}</button></li>
                  ))}
                  {key === 'support' && (
                    <>
                      <li><a href="tel:7447332829" className="hover:text-white transition-colors">7447332829</a></li>
                      <li><a href="https://wa.me/917447332829" className="hover:text-green-400 transition-colors">WhatsApp 24/7</a></li>
                    </>
                  )}
                  {key === 'email' && (
                    <li><a href="mailto:creativemarkadvertising@gmail.com" className="lowercase text-gray-500 hover:text-white break-all">creativemarkadvertising@gmail.com</a></li>
                  )}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-900 pt-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-700">
              © 2026 ReviewBoost &bull; {t('common.powered_by')}
            </p>
          </div>
        </div>
      </footer>

      {/* Fixed Language Toggle */}
      <div className="fixed bottom-6 right-6 z-50">
        <LanguageToggle />
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #111827;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ef4444;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default Index;
