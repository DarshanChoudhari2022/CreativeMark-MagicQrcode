import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, ArrowLeft, Send, Building2, User, Phone, MapPin, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { LanguageToggle } from "@/components/LanguageToggle";

const ServiceRequest = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isMarathi = i18n.language === 'mr';
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('fullName'),
            business: formData.get('businessName'),
            whatsapp: formData.get('whatsapp'),
            email: formData.get('email'),
            gmb: formData.get('gmbLink'),
            notes: formData.get('notes')
        };

        const message = `🚀 *New Smart Tap AI Service Request*%0a%0a` +
            `*Name:* ${data.name}%0a` +
            `*Business:* ${data.business}%0a` +
            `*Phone:* ${data.whatsapp}%0a` +
            `*Email:* ${data.email}%0a` +
            `*GMB:* ${data.gmb}%0a%0a` +
            `*Notes:* ${data.notes}`;

        // Open WhatsApp
        window.open(`https://wa.me/917447332829?text=${message}`, '_blank');

        setIsSubmitting(false);
        setSubmitted(true);
        toast({
            title: t('service.request_received'),
            description: t('service.opening_whatsapp'),
        });
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle2 className="w-12 h-12 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tight italic">
                        {t('service.request_received')}
                    </h1>
                    <p className="text-gray-500 mb-8 font-medium">
                        {t('service.request_received_desc')}
                    </p>
                    <Button
                        onClick={() => navigate("/")}
                        className="w-full bg-red-600 text-white h-14 rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-red-100"
                    >
                        {t('service.back_to_home')}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-gray-50/50 py-12 md:py-20 px-4 ${isMarathi ? 'font-sans' : 'font-inter'}`}>
            <div className="fixed top-6 right-6 z-50">
                <LanguageToggle />
            </div>
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <button
                        onClick={() => window.location.href = "https://creative-mark.vercel.app/"}
                        className="flex items-center gap-2 text-gray-400 hover:text-red-600 font-bold uppercase tracking-widest text-[10px] md:text-xs transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('service.agency_home')}
                    </button>
                    <button
                        onClick={() => navigate("/auth")}
                        className="text-red-600 hover:text-black font-bold uppercase tracking-widest text-[10px] md:text-xs transition-colors"
                    >
                        {t('service.already_member')}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 text-center lg:text-left">
                    {/* Info Side */}
                    <div className="lg:col-span-2 space-y-6 md:space-y-8">
                        <div>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-4 md:mb-6 uppercase tracking-tight italic leading-[1.1]">
                                {t('service.get_for_business').split(' ')[0]} <span className="text-red-600">Smart Tap AI</span> {t('service.get_for_business').split(' ').slice(4).join(' ')}
                            </h1>
                            <p className="text-sm md:text-base text-gray-500 font-medium leading-relaxed">
                                {t('service.join_hundreds')}
                            </p>
                        </div>

                        <div className="space-y-4 md:space-y-6 max-w-sm mx-auto lg:mx-0">
                            {[
                                t('service.faster_reviews'),
                                t('service.ai_suggestions'),
                                t('service.nfc_qr'),
                                t('service.admin_dashboard')
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-5 h-5 md:w-6 md:h-6 bg-red-50 rounded-full flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-red-600" />
                                    </div>
                                    <span className="text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wide">{item}</span>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
                            <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2">{t('service.process')}</p>
                            <p className="text-sm text-gray-500 font-medium">
                                {t('service.process_steps')}
                            </p>
                        </div>
                    </div>

                    {/* Form Side */}
                    <div className="lg:col-span-3">
                        <Card className="border-0 shadow-2xl rounded-[1.5rem] md:rounded-[2.5rem] bg-white overflow-hidden">
                            <CardHeader className="bg-red-600 p-6 md:p-8 text-white">
                                <CardTitle className="text-xl md:text-2xl font-black uppercase tracking-tight italic">{t('service.form_title')}</CardTitle>
                                <CardDescription className="text-red-100 font-medium tracking-wide text-xs">{t('service.form_subtitle')}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 md:p-8">
                                <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                                <User className="w-3 h-3 text-red-600" /> {t('service.full_name')}
                                            </Label>
                                            <Input name="fullName" required placeholder="John Doe" className="h-11 md:h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all text-sm" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                                <Building2 className="w-3 h-3 text-red-600" /> {t('service.business_name')}
                                            </Label>
                                            <Input name="businessName" required placeholder="My Business" className="h-11 md:h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all text-sm" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                                <Phone className="w-3 h-3 text-red-600" /> {t('service.whatsapp_number')}
                                            </Label>
                                            <Input name="whatsapp" required type="tel" placeholder="+91 00000 00000" className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                                <Mail className="w-3 h-3 text-red-600" /> {t('service.email_address')}
                                            </Label>
                                            <Input name="email" required type="email" placeholder="john@example.com" className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                            <MapPin className="w-3 h-3 text-red-600" /> {t('service.gmb_link')}
                                        </Label>
                                        <Input name="gmbLink" required placeholder="https://maps.app.goo.gl/..." className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                            {t('service.notes_label')}
                                        </Label>
                                        <Textarea
                                            name="notes"
                                            placeholder={t('service.notes_placeholder')}
                                            className="min-h-[120px] rounded-2xl bg-gray-50 border-gray-100 focus:bg-white transition-all resize-none"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-red-600 hover:bg-black text-white h-16 text-lg font-black uppercase tracking-widest shadow-xl rounded-2xl transition-all hover:scale-[1.02] active:scale-95"
                                    >
                                        {isSubmitting ? t('service.opening_whatsapp') : t('service.submit_button')}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default ServiceRequest;
