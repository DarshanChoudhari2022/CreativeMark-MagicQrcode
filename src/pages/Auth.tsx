import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Building2, Phone, ArrowLeft, Smartphone, CheckCircle2, Loader2, ShieldCheck, UserPlus, LogIn, Sparkles } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center bg-white px-4 relative overflow-hidden font-inter">
        {/* Subtle Pattern Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ee1d23 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

        <Card className="max-w-md w-full border-gray-200 shadow-2xl z-10 animate-in fade-in zoom-in duration-500 rounded-[2.5rem] bg-white">
          <CardHeader className="text-center pt-10 px-8">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-white shadow-xl">
              <CheckCircle2 className="h-12 w-12 text-red-600" />
            </div>
            <CardTitle className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">{t('auth.signup_success')}</CardTitle>
            <CardDescription className="text-gray-500 mt-4 font-bold uppercase tracking-widest text-[10px] bg-red-50 py-2 rounded-full inline-block px-4 mx-auto">
              Verification Pending
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-12 pt-6 px-10 text-center space-y-8">
            <div className="space-y-4 text-left">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-lg shadow-red-200">1</div>
                <div>
                  <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Email Confirmation</p>
                  <p className="text-xs text-gray-500 font-medium">Verify your email address via the link we sent.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start opacity-50">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-black text-xs shrink-0">2</div>
                <div>
                  <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Admin Approval</p>
                  <p className="text-xs text-gray-500 font-medium">Our team will verify your payment and activate your Pro account.</p>
                </div>
              </div>
            </div>

            <Button
              className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-red-200 transition-all hover:scale-[1.02] active:scale-95"
              onClick={() => navigate("/")}
            >
              {t('auth.back_to_home')}
            </Button>
          </CardContent>
          <div className="bg-gray-50 py-6 px-8 text-center rounded-b-[2.5rem] border-t border-gray-100 flex flex-col items-center gap-2">
            <img src="/logo.jpg" alt="Creative Mark" className="h-6 w-auto object-contain rounded-sm" />
            <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">
              Precision AI Systems &bull; Creative Mark
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-inter">
      {/* Premium Red Glow Decor */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-red-50/50 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-red-50/50 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="w-full max-w-[480px] z-10 space-y-8">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-full px-6 py-2 h-auto font-black uppercase tracking-widest text-[10px]"
          >
            <ArrowLeft className="mr-2 h-3.5 w-3.5" />
            {t('auth.back_to_home')}
          </Button>
          <LanguageToggle />
        </div>

        <Card className="border border-gray-100 bg-white/80 backdrop-blur-xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] rounded-[3rem] overflow-hidden">
          <CardHeader className="text-center pb-2 pt-12 px-10">
            <div className="flex justify-center mb-8 relative">
              <div className="absolute -inset-4 bg-red-500/10 rounded-full blur-xl animate-pulse"></div>
              <div className="w-28 h-28 rounded-[2rem] bg-white flex items-center justify-center relative z-10 p-2 shadow-2xl border border-gray-100">
                <img
                  src="/logo.jpg"
                  alt="Creative Mark Logo"
                  className="w-full h-full object-contain rounded-2xl"
                />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-4 w-4 text-red-600 fill-red-600/20" />
              <span className="text-[10px] font-black text-red-600 tracking-widest uppercase">{t('auth.lifetime_badge')}</span>
            </div>

            <CardTitle className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none mb-3">
              {t('auth.title')}
            </CardTitle>
            <CardDescription className="text-gray-400 font-bold uppercase tracking-widest text-[10px] max-w-xs mx-auto">
              {t('auth.subtitle')}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-8 pb-12 px-10">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-10 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                <TabsTrigger
                  value="login"
                  className="rounded-xl py-3 transition-all font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-lg active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5 mr-2" />
                  {t('auth.signin_tab')}
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="rounded-xl py-3 transition-all font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-lg active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-2" />
                  {t('auth.signup_tab')}
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-gray-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ml-1">
                      <Mail className="w-3.5 h-3.5 text-red-600" />
                      {t('auth.email')}
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="bg-gray-50/50 border-gray-200 text-gray-900 h-14 rounded-2xl focus:border-red-600 focus:ring-red-100 focus:bg-white transition-all font-bold"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-gray-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ml-1">
                      <Lock className="w-3.5 h-3.5 text-red-600" />
                      {t('auth.password')}
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="bg-gray-50/50 border-gray-200 text-gray-900 h-14 rounded-2xl focus:border-red-600 focus:ring-red-100 focus:bg-white transition-all font-bold"
                      disabled={loading}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-16 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-2xl transition-all mt-4 shadow-xl shadow-red-200 hover:scale-[1.02] active:scale-95"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : t('auth.signin_button')}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <form onSubmit={handleSignup} className="space-y-5">
                  {[
                    { id: 'signup-business', label: t('auth.business_name'), icon: Building2, type: 'text', value: businessName, setValue: setBusinessName, placeholder: 'My Business' },
                    { id: 'signup-phone', label: t('auth.phone'), icon: Phone, type: 'tel', value: phone, setValue: setPhone, placeholder: '+91' },
                    { id: 'signup-email', label: t('auth.email'), icon: Mail, type: 'email', value: signupEmail, setValue: setSignupEmail, placeholder: 'contact@shop.com' },
                    { id: 'signup-password', label: t('auth.password'), icon: Lock, type: 'password', value: signupPassword, setValue: setSignupPassword, placeholder: '••••••••' }
                  ].map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id} className="text-gray-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ml-1">
                        <field.icon className="w-3.5 h-3.5 text-red-600" />
                        {field.label}
                      </Label>
                      <Input
                        id={field.id}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={field.value}
                        onChange={(e) => field.setValue(e.target.value)}
                        required
                        className="bg-gray-50/50 border-gray-200 text-gray-900 h-14 rounded-2xl focus:border-red-600 focus:ring-red-100 focus:bg-white transition-all font-bold"
                        disabled={loading}
                      />
                    </div>
                  ))}

                  <div className="bg-red-50 p-6 rounded-3xl border border-red-100 mt-4">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5" /> Pro Activation Notice
                    </p>
                    <p className="text-xs text-red-900 font-bold leading-relaxed">
                      After registration, your account will be activated by our admin team within 15 minutes of payment verification (₹999/Mo).
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-16 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-3xl transition-all shadow-xl shadow-red-200 hover:scale-[1.02] active:scale-95"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : t('auth.signup_button')}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>

          <div className="bg-gray-50 py-8 px-10 text-center flex flex-col items-center gap-3 border-t border-gray-100">
            <img src="/logo.jpg" alt="Creative Mark" className="h-8 w-auto object-contain rounded-md" />
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">
              Precision AI Systems &bull; Creative Mark
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
