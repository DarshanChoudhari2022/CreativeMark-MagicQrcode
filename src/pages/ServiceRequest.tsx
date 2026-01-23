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

const ServiceRequest = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
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

        const message = `🚀 *New ReviewBoost Service Request*%0a%0a` +
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
            title: "Request Sent!",
            description: "Redirecting to WhatsApp to send your details...",
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
                        Request Received!
                    </h1>
                    <p className="text-gray-500 mb-8 font-medium">
                        We have opened WhatsApp to send your details. Please hit 'Send' in WhatsApp to complete the process. Our admin will verify and contact you shortly.
                    </p>
                    <Button
                        onClick={() => navigate("/")}
                        className="w-full bg-red-600 text-white h-14 rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-red-100"
                    >
                        Back to Home
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 py-12 md:py-20 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <button
                        onClick={() => navigate("/")}
                        className="flex items-center gap-2 text-gray-400 hover:text-red-600 font-bold uppercase tracking-widest text-xs transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </button>
                    <button
                        onClick={() => navigate("/auth")}
                        className="text-red-600 hover:text-black font-bold uppercase tracking-widest text-xs transition-colors"
                    >
                        Already a member? Sign In
                    </button>
                </div>

                <div className="grid md:grid-cols-5 gap-12">
                    {/* Info Side */}
                    <div className="md:col-span-2 space-y-8">
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 mb-6 uppercase tracking-tight italic leading-none">
                                Get <span className="text-red-600">ReviewBoost</span> For Your Business
                            </h1>
                            <p className="text-gray-500 font-medium leading-relaxed">
                                Join hundreds of local businesses growing their GMB ranking with AI-powered smart reviews.
                            </p>
                        </div>

                        <div className="space-y-6">
                            {[
                                "10x Faster Customer Reviews",
                                "AI-Powered Review Suggestions",
                                "NFC & QR Tech Integration",
                                "Dedicated Admin Dashboard"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-red-50 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="w-4 h-4 text-red-600" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">{item}</span>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
                            <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2">Process</p>
                            <p className="text-sm text-gray-500 font-medium">
                                Submit this form → Open WhatsApp → Send Details → Admin Approval → Account Activation.
                            </p>
                        </div>
                    </div>

                    {/* Form Side */}
                    <div className="md:col-span-3">
                        <Card className="border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
                            <CardHeader className="bg-red-600 p-8 text-white">
                                <CardTitle className="text-2xl font-black uppercase tracking-tight italic">Onboarding Form</CardTitle>
                                <CardDescription className="text-red-100 font-medium tracking-wide">Enter your business details below</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                                <User className="w-3 h-3 text-red-600" /> Full Name
                                            </Label>
                                            <Input name="fullName" required placeholder="John Doe" className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                                <Building2 className="w-3 h-3 text-red-600" /> Business Name
                                            </Label>
                                            <Input name="businessName" required placeholder="My Business" className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                                <Phone className="w-3 h-3 text-red-600" /> WhatsApp Number
                                            </Label>
                                            <Input name="whatsapp" required type="tel" placeholder="+91 00000 00000" className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                                <Mail className="w-3 h-3 text-red-600" /> Email Address
                                            </Label>
                                            <Input name="email" required type="email" placeholder="john@example.com" className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                            <MapPin className="w-3 h-3 text-red-600" /> GMB Link / Address
                                        </Label>
                                        <Input name="gmbLink" required placeholder="https://maps.app.goo.gl/..." className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                            Requirement Notes
                                        </Label>
                                        <Textarea
                                            name="notes"
                                            placeholder="Tell us about your business goals..."
                                            className="min-h-[120px] rounded-2xl bg-gray-50 border-gray-100 focus:bg-white transition-all resize-none"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-red-600 hover:bg-black text-white h-16 text-lg font-black uppercase tracking-widest shadow-xl rounded-2xl transition-all hover:scale-[1.02] active:scale-95"
                                    >
                                        {isSubmitting ? "Opening WhatsApp..." : "Send Request 🚀"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceRequest;
