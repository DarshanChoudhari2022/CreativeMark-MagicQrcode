import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Building2, Phone, ArrowLeft, Smartphone, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "@/components/LanguageToggle";

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
});

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);

  // Signup form state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Confirmation state
  const [showConfirmation, setShowConfirmation] = useState(false);

  const isMarathi = i18n.language === 'mr';
  const fontClass = isMarathi ? 'font-sans' : 'font-inter';

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Session check error:", error);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = signupSchema.parse({
        email: signupEmail,
        password: signupPassword,
        businessName,
        phone,
      });

      const { error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            business_name: validated.businessName,
            phone: validated.phone,
          },
        },
      });

      if (error) throw error;

      setShowConfirmation(true);
      toast({
        title: t('auth.signup_success'),
        description: t('auth.check_email'),
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = loginSchema.parse({
        email: loginEmail,
        password: loginPassword,
      });

      const { error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) throw error;

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Please check your credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (showConfirmation) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-gray-50 px-4 relative overflow-hidden ${fontClass}`}>
        <Card className="max-w-lg w-full bg-white shadow-xl rounded-2xl border border-gray-100 animate-in fade-in zoom-in duration-300">
          <CardHeader className="text-center pt-10 pb-2">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100">
              <ShieldCheck className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">{t('auth.signup_success')}</CardTitle>
            <CardDescription className="text-gray-500 mt-4 leading-relaxed px-4 text-base">
              {t('auth.check_email')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-10 px-8 text-center">
            <Button
              className="w-full h-12 bg-gray-900 hover:bg-black text-white font-medium transition-all mt-6 rounded-lg"
              onClick={() => navigate("/")}
            >
              {t('auth.back_to_home')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden ${fontClass}`}>
      {/* Refined Background - clear and professional */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gray-900 lg:bg-indigo-900/10 -z-10"></div>

      <div className="w-full max-w-[480px] z-10">
        {/* Header Navigation */}
        <div className="flex justify-between items-center mb-8 px-1">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className={`text-gray-400 hover:text-white lg:hover:text-gray-900 transition-colors font-medium text-sm gap-2 ${isMarathi ? 'text-base' : ''}`}
          >
            <ArrowLeft className="h-4 w-4" />
            {t('auth.back_to_home')}
          </Button>

          <div className="bg-white/10 backdrop-blur-md p-1 rounded-full border border-white/20 lg:border-gray-200 lg:bg-white/80">
            <LanguageToggle />
          </div>
        </div>

        <Card className="border-0 shadow-2xl bg-white rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-2 pt-10 px-8 bg-white">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center shadow-lg border border-gray-100">
                <img
                  src="/logo.jpg"
                  alt="Logo"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
            </div>

            <CardTitle className={`text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-2 ${isMarathi ? 'leading-normal' : ''}`}>
              {t('auth.title')}
            </CardTitle>
            <CardDescription className="text-gray-500 font-medium">
              {t('auth.subtitle')}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 pb-10 px-6 md:px-10">
            {/* Login Form Only */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-gray-700 text-sm font-semibold flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {t('auth.email')}
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="name@company.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="bg-gray-50 border-gray-200 h-11 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="login-password" className="text-gray-700 text-sm font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-400" />
                    {t('auth.password')}
                  </Label>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="bg-gray-50 border-gray-200 h-11 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-red-500/30 mt-4 active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  t('auth.signin_button')
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500 font-medium mb-3">
                {t('auth.no_account')}
              </p>
              <Button
                variant="outline"
                className="w-full border-red-100 text-red-600 hover:bg-red-50 font-bold"
                onClick={() => window.open('https://wa.me/917447332829', '_blank')}
              >
                {t('auth.contact_admin_create')}
              </Button>
            </div>
          </CardContent>
          <div className="bg-gray-50 py-4 text-center border-t border-gray-100">
            <p className="text-xs text-gray-400 font-medium">
              Secure Enterprise Login
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
