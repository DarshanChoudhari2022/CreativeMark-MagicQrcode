import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Star, Sparkles, TrendingUp, Zap, BarChart3, Shield,
  QrCode, MessageSquare, Phone, CheckCircle2, ArrowRight,
  Clock, Users, Award, Smartphone, Bot, CreditCard, Gift, XCircle
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "@/components/LanguageToggle";

// Note: clients and testimonials data is now handled inside the component with t()

// Note: FAQ data is now handled inside the component with t()

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

  const faqs = [
    { question: t('faq.q1'), answer: t('faq.a1') },
    { question: t('faq.q2'), answer: t('faq.a2') },
    { question: t('faq.q3'), answer: t('faq.a3') },
    { question: t('faq.q4'), answer: t('faq.a4') },
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
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src="/logo.jpg" alt="Creative Mark Logo" className="h-10 md:h-14 w-auto object-contain" />
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
            <button onClick={() => scrollToSection('overview')} className="text-gray-600 hover:text-red-600 transition-colors">{t('nav.overview')}</button>
            <button onClick={() => scrollToSection('how-it-works')} className="text-gray-600 hover:text-red-600 transition-colors">{t('nav.how_it_works')}</button>
            <button onClick={() => scrollToSection('testimonials')} className="text-gray-600 hover:text-red-600 transition-colors">{t('nav.testimonials')}</button>
            <button onClick={() => scrollToSection('pricing')} className="text-gray-600 hover:text-red-600 transition-colors">{t('nav.pricing')}</button>
            <button onClick={() => scrollToSection('faq')} className="text-gray-600 hover:text-red-600 transition-colors">{t('nav.faq')}</button>
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <LanguageToggle />
            <Button variant="ghost" onClick={() => navigate("/auth")} className="hidden sm:flex text-sm">
              {t('nav.signin')}
            </Button>
            <Button onClick={() => navigate("/auth")} className="bg-red-600 hover:bg-red-700 text-white text-xs md:text-sm px-4 md:px-6 h-9 md:h-10 rounded-full shadow-lg transition-transform hover:scale-105">
              {t('nav.get_started')}
            </Button>
            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 text-gray-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <XCircle /> : <div className="space-y-1.5"><div className="w-6 h-0.5 bg-gray-600"></div><div className="w-6 h-0.5 bg-gray-600"></div><div className="w-6 h-0.5 bg-gray-600"></div></div>}
            </button>
          </div>
        </div>

        {/* Mobile Nav Overlay */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b shadow-2xl animate-fade-in">
            <nav className="flex flex-col p-6 gap-4 font-medium text-lg">
              <button onClick={() => scrollToSection('overview')} className="text-left py-2 border-b border-gray-50">{t('nav.overview')}</button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-left py-2 border-b border-gray-50">{t('nav.how_it_works')}</button>
              <button onClick={() => scrollToSection('testimonials')} className="text-left py-2 border-b border-gray-50">{t('nav.testimonials')}</button>
              <button onClick={() => scrollToSection('pricing')} className="text-left py-2 border-b border-gray-50">{t('nav.pricing')}</button>
              <button onClick={() => scrollToSection('faq')} className="text-left py-2">{t('nav.faq')}</button>
              <Button onClick={() => navigate("/auth")} className="w-full mt-4 bg-red-600 text-white h-12 rounded-xl">
                {t('nav.get_started')}
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-gray-50 via-white to-red-50/30 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-red-100 px-4 py-2 rounded-full mb-6 animate-pulse">
              <span className="text-xs font-bold text-red-600 tracking-wider font-montserrat">{t('landing.badge_new')}</span>
              <span className="text-red-500">•</span>
              <span className="text-sm font-medium text-red-700">{t('landing.badge_ai')}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
              {t('landing.hero_title')} 🚀
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              <strong>{t('landing.hero_subtitle_bold')}</strong> {t('landing.hero_subtitle')}
              <span className="text-red-600 font-semibold block mt-2">{t('landing.price_badge')}</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-lg px-10 h-14 rounded-full shadow-2xl hover:shadow-red-500/25 transition-all hover:scale-105"
              >
                {t('landing.cta_main')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => scrollToSection('pricing')}
                className="text-lg px-10 h-14 rounded-full border-2 border-gray-300 hover:border-red-500 hover:text-red-600"
              >
                {t('landing.cta_secondary')}
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-sm text-gray-600">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>🚀 {t('landing.feature_rank')}</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span>⚡ {t('landing.feature_speed')}</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <Users className="h-4 w-4 text-blue-500" />
                <span>🤝 {t('landing.trusted_by')}</span>
              </div>
            </div>

            {/* QR Mockup Flow */}
            <div className="mt-16 flex flex-wrap justify-center items-center gap-4 text-lg font-medium text-gray-700">
              <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-xl shadow-lg border">
                <Smartphone className="h-6 w-6 text-blue-500" />
                <span>📲 {t('landing.flow_scan')}</span>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 hidden sm:block" />
              <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-xl shadow-lg border">
                <MessageSquare className="h-6 w-6 text-green-500" />
                <span>✍️ {t('landing.flow_post')}</span>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 hidden sm:block" />
              <div className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl shadow-lg">
                <Star className="h-6 w-6" />
                <span>🚀 {t('landing.flow_rank')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section id="overview" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-sm font-bold text-red-600 tracking-wider mb-3">{t('landing.overview_title')}</h2>
            <h3 className="text-3xl md:text-4xl font-bold mb-6">{t('landing.what_is_reviewboost')}</h3>
            <p className="text-lg text-gray-600 leading-relaxed">
              {t('landing.reviewboost_desc')}
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-sm font-bold text-red-600 tracking-wider mb-3">{t('landing.comparison_title')}</h2>
            <h3 className="text-3xl md:text-4xl font-bold">{t('landing.before_after_title')}</h3>
            <p className="text-gray-600 mt-3">{t('landing.before_after_subtitle')}</p>
          </div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
            {/* Before Card */}
            <Card className="bg-red-50/50 border-red-200 hover:shadow-xl transition-shadow">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="text-6xl mb-4">😕</div>
                <h4 className="text-2xl font-bold text-red-600 mb-4">{t('landing.before_label')}</h4>
                <p className="text-gray-600 leading-relaxed">
                  {t('landing.before_desc')}
                </p>
                <div className="mt-4 inline-block bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-semibold">
                  {t('landing.before_result')}
                </div>
              </CardContent>
            </Card>

            {/* After Card */}
            <Card className="bg-green-50/50 border-green-200 shadow-2xl transform md:-translate-y-4 hover:shadow-3xl transition-all">
              <CardContent className="pt-8 pb-8 text-center relative overflow-hidden">
                <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {t('common.recommended')}
                </div>
                <div className="text-6xl mb-4">🤩</div>
                <h4 className="text-2xl font-bold text-green-600 mb-4">{t('landing.after_label')}</h4>
                <p className="text-gray-600 leading-relaxed">
                  {t('landing.after_desc')}
                </p>
                <div className="mt-4 inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                  {t('landing.after_result')}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-red-600 tracking-wider mb-3">{t('landing.how_it_works_title')}</h2>
            <h3 className="text-3xl md:text-4xl font-bold">{t('landing.why_businesses_love')}</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Step 1 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-3xl font-black text-white">1️⃣</span>
              </div>
              <h4 className="text-xl font-bold mb-3">{t('landing.step1_title')}</h4>
              <p className="text-gray-600">
                {t('landing.step1_desc')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-3xl font-black text-white">2️⃣</span>
              </div>
              <h4 className="text-xl font-bold mb-3">{t('landing.step2_title')}</h4>
              <p className="text-gray-600">
                {t('landing.step2_desc')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-3xl font-black text-white">3️⃣</span>
              </div>
              <h4 className="text-xl font-bold mb-3">{t('landing.step3_title')}</h4>
              <p className="text-gray-600">
                {t('landing.step3_desc')}
              </p>
            </div>
          </div>

          {/* Bonus */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-100 to-blue-100 px-8 py-4 rounded-full border border-purple-200 shadow-lg">
              <Bot className="w-6 h-6 text-purple-600" />
              <span className="font-semibold text-purple-800">
                {t('landing.bonus_ai')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Clients Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-sm font-bold text-red-600 tracking-wider mb-3">{t('landing.clients_title')}</h2>
            <h3 className="text-3xl md:text-4xl font-bold">{t('landing.clients_subtitle')}</h3>
            <p className="text-gray-600 mt-3">{t('landing.clients_desc')}</p>
          </div>

          <div className="overflow-x-auto pb-4">
            <div className="flex gap-6 min-w-max px-4 justify-center">
              {clients.map((client, index) => (
                <Card key={index} className="w-64 hover:shadow-xl transition-all hover:-translate-y-2 cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <QrCode className="w-8 h-8 text-red-600" />
                    </div>
                    <h4 className="font-bold text-lg">{client.name}</h4>
                    <p className="text-red-600 text-sm font-medium">{client.location}</p>
                    <p className="text-gray-500 text-xs mt-2">{client.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-sm font-bold text-red-600 tracking-wider mb-3">{t('landing.testimonials_title')}</h2>
            <h3 className="text-3xl md:text-4xl font-bold">{t('landing.testimonials_subtitle')}</h3>
            <p className="text-gray-600 mt-3">{t('landing.testimonials_desc')}</p>
          </div>

          {/* Infinite Scroll Testimonials */}
          <div className="relative" ref={testimonialRef}>
            <div className="flex gap-6 animate-scroll">
              {[...testimonials, ...testimonials].map((testimonial, index) => (
                <Card key={index} className="min-w-[350px] border-2 hover:border-red-200 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold">
                        {testimonial.author.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{testimonial.author}</p>
                        <p className="text-gray-500 text-xs">{testimonial.location}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-sm font-bold text-red-600 tracking-wider mb-3">{t('landing.features_title')}</h2>
            <h3 className="text-3xl md:text-4xl font-bold">{t('landing.everything_you_need')}</h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {[
              { icon: Sparkles, title: t('features.ai_suggestions'), desc: t('features.ai_suggestions_desc') },
              { icon: Zap, title: t('features.one_tap'), desc: t('features.one_tap_desc') },
              { icon: Shield, title: t('features.branding'), desc: t('features.branding_desc') },
              { icon: TrendingUp, title: t('features.mobile_optimized'), desc: t('features.mobile_optimized_desc') },
              { icon: Bot, title: t('features.auto_reply'), desc: t('features.auto_reply_desc') },
              { icon: Gift, title: t('features.nfc_card'), desc: t('features.nfc_card_desc') },
              { icon: BarChart3, title: t('features.analytics'), desc: t('features.analytics_desc') },
              { icon: Phone, title: t('features.support'), desc: t('features.support_desc') },
            ].map((feature, index) => (
              <Card key={index} className="border-none shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                <CardContent className="pt-6 pb-6">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-red-600" />
                  </div>
                  <h4 className="font-semibold mb-2">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-sm font-bold text-red-600 tracking-wider mb-3">{t('pricing.title')}</h2>
            <h3 className="text-3xl md:text-4xl font-bold">{t('pricing.choose_plan')}</h3>
            <p className="text-gray-600 mt-3">{t('pricing.subtitle')}</p>
          </div>

          <div className="flex justify-center">
            <div className="max-w-2xl mx-auto">
              {/* Lifetime Pro Plan */}
              <Card className="border-4 border-red-500 relative overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-all">
                <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-6 py-2 rounded-bl-xl uppercase tracking-widest animate-pulse">
                  {t('pricing.limited_offer')}
                </div>
                <CardContent className="p-10">
                  <div className="text-center mb-10">
                    <h4 className="text-3xl font-black mb-4 uppercase tracking-tighter">{t('pricing.lifetime_pro')}</h4>
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-gray-400 line-through text-lg">₹3,499</span>
                      <div className="flex items-center gap-2">
                        <span className="text-6xl font-black text-red-600">₹999</span>
                        <div className="text-left">
                          <p className="text-gray-500 font-bold leading-tight">{t('pricing.lifetime_text')}</p>
                          <p className="text-xs text-green-600 font-bold uppercase tracking-widest">{t('pricing.no_renewal')}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 mt-6 font-medium bg-red-50 py-2 rounded-lg">{t('pricing.includes_nfc')}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-x-12 gap-y-4 mb-10">
                    {[
                      t('pricing.item1'),
                      t('pricing.item2'),
                      t('pricing.item3'),
                      t('pricing.item4'),
                      t('pricing.item5'),
                      t('pricing.item6'),
                      t('pricing.item7'),
                      t('pricing.item8'),
                    ].map((feature, index) => (
                      <li key={index} className="flex items-center gap-3 list-none">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700 font-semibold text-sm">{feature}</span>
                      </li>
                    ))}
                  </div>

                  <Button
                    onClick={() => navigate("/auth")}
                    className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 h-16 text-xl font-bold shadow-2xl rounded-2xl group"
                  >
                    {t('pricing.claim_button')}
                    <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                  </Button>

                  <p className="text-center text-gray-400 text-[10px] mt-6 flex items-center justify-center gap-2">
                    <Shield className="h-3 w-3" /> {t('landing.secure_payment_footer')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <p className="text-center text-gray-500 text-sm mt-6">
            {t('landing.gst_included')}
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-sm font-bold text-red-600 tracking-wider mb-3">{t('faq.title')}</h2>
            <h3 className="text-3xl md:text-4xl font-bold">{t('faq.subtitle')}</h3>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              { q: t('faq.q1'), a: t('faq.a1') },
              { q: t('faq.q2'), a: t('faq.a2') },
              { q: t('faq.q3'), a: t('faq.a3') },
              { q: t('faq.q4'), a: t('faq.a4') },
            ].map((faq, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-all ${openFaq === index ? 'border-red-300 shadow-lg' : 'hover:border-gray-300'}`}
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-lg">{faq.q}</h4>
                    <span className="text-2xl text-red-500">{openFaq === index ? '−' : '+'}</span>
                  </div>
                  {openFaq === index && (
                    <p className="mt-4 text-gray-600 leading-relaxed">{faq.a}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <a
              href="https://wa.me/919890976952"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold"
            >
              <MessageSquare className="w-5 h-5" />
              {t('landing.whatsapp_chat')}
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-red-600 to-red-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
            {t('landing.cta_footer_title')}
          </h2>
          <p className="text-xl text-red-100 mb-10 max-w-2xl mx-auto">
            {t('landing.cta_footer_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-white text-red-600 hover:bg-gray-100 text-lg px-10 h-14 rounded-full shadow-2xl font-bold"
            >
              {t('landing.cta_final_button')}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="mb-4">
                <img src="/logo.jpg" alt="Creative Mark Logo" className="h-10 w-auto object-contain brightness-0 invert" />
              </div>
              <p className="text-gray-400 text-sm">
                {t('landing.footer_tagline')}
              </p>
            </div>
            <div>
              <h5 className="font-bold mb-4">{t('nav.product')}</h5>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#overview" className="hover:text-white transition-colors">{t('nav.overview')}</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">{t('nav.how_it_works')}</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">{t('nav.pricing')}</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">{t('nav.faq')}</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-4">{t('nav.support')}</h5>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <a href="tel:9890976952" className="hover:text-white transition-colors">9890976952</a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <a href="tel:7447332829" className="hover:text-white transition-colors">7447332829</a>
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-500" />
                  <a href="https://wa.me/919890976952" className="hover:text-white transition-colors">WhatsApp</a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-4">{t('nav.email')}</h5>
              <a href="mailto:creativemarkadvertising@gmail.com" className="text-gray-400 hover:text-white text-sm transition-colors">
                creativemarkadvertising@gmail.com
              </a>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
            <p>© 2026 Creative Mark Advertising. All rights reserved.</p>
            <p className="mt-2">{t('common.powered_by')}</p>
          </div>
        </div>
      </footer>

      {/* CSS for animations */}
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default Index;
