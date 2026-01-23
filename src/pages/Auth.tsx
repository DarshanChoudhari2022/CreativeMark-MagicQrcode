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
  const { t } = useTranslation();
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

      const { error, data } = await supabase.auth.signUp({
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
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[120px]"></div>
        </div>

        <Card className="max-w-md w-full border-gray-800 bg-gray-900/80 backdrop-blur-xl shadow-2xl z-10 animate-in fade-in zoom-in duration-300">
          <CardHeader className="text-center pt-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
              <ShieldCheck className="h-10 w-10 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">{t('auth.signup_success')}</CardTitle>
            <CardDescription className="text-gray-400 mt-4 leading-relaxed px-4">
              {t('auth.check_email')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8 text-center">
            <Button
              className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-lg shadow-red-600/20 mt-4"
              onClick={() => navigate("/")}
            >
              {t('auth.back_to_home')}
            </Button>
            <p className="mt-6 text-xs text-gray-500 font-medium uppercase tracking-widest">
              ReviewBoost verification system
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-inter">
      {/* Dynamic Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] bg-red-600/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] bg-blue-600/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-[450px] z-10">
        <div className="flex justify-between items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('auth.back_to_home')}
          </Button>
          <div className="bg-gray-900/50 backdrop-blur-md rounded-full px-2">
            <LanguageToggle />
          </div>
        </div>

        <Card className="border-gray-800 bg-gray-900/40 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border-t-red-500/50">
          <div className="h-1.5 bg-gradient-to-r from-red-600 via-red-500 to-orange-500"></div>

          <CardHeader className="text-center pb-2 pt-8">
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-red-500 to-blue-500 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center relative z-10 p-2 shadow-2xl overflow-hidden">
                  <img
                    src="/logo.jpg"
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Premium Badge */}
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500/10 to-blue-500/10 border border-red-500/20 px-4 py-1.5 rounded-full shadow-sm">
                <Smartphone className="h-4 w-4 text-red-500" />
                <span className="text-xs font-bold text-red-400 tracking-wider uppercase">{t('auth.lifetime_badge')}</span>
              </div>
            </div>

            <CardTitle className="text-3xl font-black mt-2 text-white tracking-tight">
              {t('auth.title')}
            </CardTitle>
            <CardDescription className="text-gray-400 mt-2 font-medium">
              {t('auth.subtitle')}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-8 pb-10 px-8">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-black/40 p-1 border border-gray-800 rounded-xl">
                <TabsTrigger
                  value="login"
                  className="rounded-lg py-2.5 transition-all outline-none data-[state=active]:bg-gray-800 data-[state=active]:text-white data-[state=active]:shadow-xl"
                >
                  {t('auth.signin_tab')}
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="rounded-lg py-2.5 transition-all outline-none data-[state=active]:bg-gray-800 data-[state=active]:text-white data-[state=active]:shadow-xl"
                >
                  {t('auth.signup_tab')}
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" />
                      {t('auth.email')}
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="bg-black/20 border-gray-800 text-white h-12 focus:border-red-500/50 focus:ring-red-500/20 transition-all"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5" />
                      {t('auth.password')}
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="bg-black/20 border-gray-800 text-white h-12 focus:border-red-500/50 focus:ring-red-500/20 transition-all"
                      disabled={loading}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black text-lg transition-all mt-6 shadow-[0_10px_30px_rgba(220,38,38,0.3)] rounded-xl"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {t('auth.signing_in')}
                      </div>
                    ) : (
                      t('auth.signin_button')
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-business" className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5" />
                      {t('auth.business_name')}
                    </Label>
                    <Input
                      id="signup-business"
                      type="text"
                      placeholder="Awesome Store"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      required
                      className="bg-black/20 border-gray-800 text-white h-12 focus:border-red-500/50 transition-all"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone" className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" />
                      {t('auth.phone')}
                    </Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="9890xxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="bg-black/20 border-gray-800 text-white h-12 focus:border-red-500/50 transition-all"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" />
                      {t('auth.email')}
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@business.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      className="bg-black/20 border-gray-800 text-white h-12 focus:border-red-500/50 transition-all"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5" />
                      {t('auth.password')}
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Min 8 characters"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      className="bg-black/20 border-gray-800 text-white h-12 focus:border-red-500/50 transition-all"
                      disabled={loading}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black text-lg transition-all mt-6 shadow-[0_10px_30px_rgba(220,38,38,0.3)] rounded-xl"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {t('auth.creating_account')}
                      </div>
                    ) : (
                      t('auth.signup_button')
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>

          <div className="bg-white/5 border-t border-gray-800 py-6 px-8 text-center flex flex-col items-center gap-3">
            <img src="/logo.jpg" alt="Creative Mark" className="h-8 w-auto object-contain rounded-md opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer" />
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">
              Powered by reviewboost ai &bull; Creative Mark
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
