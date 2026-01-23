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
      <div className="min-h-screen flex items-center justify-center bg-white px-6 relative overflow-hidden font-inter">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ee1d23 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

        <Card className="max-w-xl w-full border-gray-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] z-10 animate-in fade-in zoom-in duration-700 rounded-[3.5rem] bg-white overflow-hidden">
          <CardHeader className="text-center pt-16 px-12">
            <div className="w-32 h-32 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-10 border-8 border-white shadow-2xl">
              <CheckCircle2 className="h-16 w-16 text-red-600" />
            </div>
            <CardTitle className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none italic">{t('auth.signup_success')}</CardTitle>
            <CardDescription className="text-red-600 mt-6 font-black uppercase tracking-widest text-xs bg-red-50 py-3 rounded-full inline-block px-8 mx-auto border border-red-100 italic">
              Verification Protocol Initialized
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-16 pt-8 px-12 text-center space-y-10">
            <div className="space-y-6 text-left bg-gray-50/50 p-8 rounded-[2rem] border border-gray-50">
              <div className="flex gap-6 items-start">
                <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xl shadow-red-200">1</div>
                <div>
                  <p className="text-lg font-black text-gray-900 uppercase tracking-tight leading-none mb-1">Email Confirmation</p>
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-wide opacity-60">Authorize your gateway via the secure link sent.</p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-10 h-10 rounded-2xl bg-gray-200 text-gray-600 flex items-center justify-center font-black text-sm shrink-0 shadow-inner">2</div>
                <div>
                  <p className="text-lg font-black text-gray-400 uppercase tracking-tight leading-none mb-1">System Activation</p>
                  <p className="text-sm text-gray-400 font-bold uppercase tracking-wide opacity-60">Our Intelligence Team will verify payment and enable Pro Systems.</p>
                </div>
              </div>
            </div>

            <Button
              className="w-full h-20 bg-red-600 hover:bg-black text-white font-black uppercase tracking-[0.3em] rounded-[2rem] shadow-2xl shadow-red-200 transition-all hover:scale-[1.02] active:scale-95 text-sm"
              onClick={() => navigate("/")}
            >
              {t('auth.back_to_home')}
            </Button>
          </CardContent>
          <div className="bg-gray-50 py-10 px-12 text-center border-t border-gray-100 flex flex-col items-center gap-4">
            <img src="/logo.jpg" alt="Creative Mark" className="h-10 w-auto object-contain rounded-lg opacity-40 grayscale" />
            <p className="text-xs text-gray-400 font-black uppercase tracking-[0.3em] italic">
              Precision Intelligence &bull; Creative Mark
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-inter">
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-red-50/30 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-red-50/30 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="w-full max-w-[540px] z-10 space-y-10">
        <div className="flex justify-between items-center px-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-full px-8 py-4 h-auto font-black uppercase tracking-widest text-xs"
          >
            <ArrowLeft className="mr-3 h-4 w-4" />
            {t('auth.back_to_home')}
          </Button>
          <LanguageToggle />
        </div>

        <Card className="border border-gray-100 bg-white/90 backdrop-blur-3xl shadow-[0_80px_160px_-40px_rgba(0,0,0,0.15)] rounded-[4rem] overflow-hidden transition-all duration-700">
          <CardHeader className="text-center pb-6 pt-16 px-12">
            <div className="flex justify-center mb-10 relative">
              <div className="absolute -inset-8 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="w-32 h-32 rounded-[2.5rem] bg-white flex items-center justify-center relative z-10 p-3 shadow-2xl border border-gray-100 transform hover:scale-105 transition-transform">
                <img
                  src="/logo.jpg"
                  alt="Creative Mark Logo"
                  className="w-full h-full object-contain rounded-[2rem]"
                />
              </div>
            </div>

            <div className="inline-flex items-center gap-3 bg-red-50 border border-red-100 px-6 py-3 rounded-full mb-10 shadow-sm">
              <Sparkles className="h-5 w-5 text-red-600 fill-red-600/20" />
              <span className="text-xs font-black text-red-600 tracking-widest uppercase italic">{t('auth.lifetime_badge')}</span>
            </div>

            <CardTitle className="text-5xl font-black text-gray-900 tracking-tighter uppercase leading-none mb-4 italic">
              {t('auth.title')}
            </CardTitle>
            <CardDescription className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs max-w-sm mx-auto italic">
              {t('auth.subtitle')}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-10 pb-16 px-12">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-12 bg-gray-50/50 p-2 rounded-[2rem] border border-gray-100 shadow-inner">
                <TabsTrigger
                  value="login"
                  className="rounded-[1.5rem] py-4 transition-all font-black uppercase tracking-widest text-xs data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-2xl active:scale-[0.98]"
                >
                  <LogIn className="w-4 h-4 mr-3" />
                  {t('auth.signin_tab')}
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="rounded-[1.5rem] py-4 transition-all font-black uppercase tracking-widest text-xs data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-2xl active:scale-[0.98]"
                >
                  <UserPlus className="w-4 h-4 mr-3" />
                  {t('auth.signup_tab')}
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <form onSubmit={handleLogin} className="space-y-8">
                  <div className="space-y-3">
                    <Label htmlFor="login-email" className="text-gray-400 text-xs font-black uppercase tracking-widest flex items-center gap-3 ml-2 italic">
                      <Mail className="w-4 h-4 text-red-600" />
                      {t('auth.email')}
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@corporate.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="bg-gray-50/50 border-gray-200 text-gray-900 h-16 rounded-2xl focus:border-red-600 focus:ring-red-100 focus:bg-white transition-all font-black text-lg"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="login-password" className="text-gray-400 text-xs font-black uppercase tracking-widest flex items-center gap-3 ml-2 italic">
                      <Lock className="w-4 h-4 text-red-600" />
                      {t('auth.password')}
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="bg-gray-50/50 border-gray-200 text-gray-900 h-16 rounded-2xl focus:border-red-600 focus:ring-red-100 focus:bg-white transition-all font-black text-lg"
                      disabled={loading}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-20 bg-red-600 hover:bg-black text-white font-black uppercase tracking-[0.3em] rounded-[2rem] transition-all mt-6 shadow-2xl shadow-red-200 hover:scale-[1.02] active:scale-95 text-sm"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : t('auth.signin_button')}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <form onSubmit={handleSignup} className="space-y-6">
                  {[
                    { id: 'signup-business', label: t('auth.business_name'), icon: Building2, type: 'text', value: businessName, setValue: setBusinessName, placeholder: 'e.g. Pune Tech Hub' },
                    { id: 'signup-phone', label: t('auth.phone'), icon: Phone, type: 'tel', value: phone, setValue: setPhone, placeholder: '+91 99999 99999' },
                    { id: 'signup-email', label: t('auth.email'), icon: Mail, type: 'email', value: signupEmail, setValue: setSignupEmail, placeholder: 'contact@brand.com' },
                    { id: 'signup-password', label: t('auth.password'), icon: Lock, type: 'password', value: signupPassword, setValue: setSignupPassword, placeholder: '••••••••••••' }
                  ].map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id} className="text-gray-400 text-xs font-black uppercase tracking-widest flex items-center gap-3 ml-2 italic">
                        <field.icon className="w-4 h-4 text-red-600" />
                        {field.label}
                      </Label>
                      <Input
                        id={field.id}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={field.value}
                        onChange={(e) => field.setValue(e.target.value)}
                        required
                        className="bg-gray-50/50 border-gray-200 text-gray-900 h-14 rounded-2xl focus:border-red-600 focus:ring-red-100 focus:bg-white transition-all font-black text-lg"
                        disabled={loading}
                      />
                    </div>
                  ))}

                  <div className="bg-red-50/50 p-8 rounded-[2.5rem] border border-red-100 mt-8 shadow-inner italic">
                    <p className="text-xs font-black text-red-600 uppercase tracking-[0.3em] mb-3 flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5" /> Enterprise Deployment Notice
                    </p>
                    <p className="text-sm text-red-900 font-bold leading-relaxed opacity-80">
                      Post-registration, our Strategic Operations Team activates your Pro-Licensed environment within 15 minutes of payment verification (₹999/Mo).
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-20 bg-red-600 hover:bg-black text-white font-black uppercase tracking-[0.3em] rounded-[2.5rem] transition-all shadow-2xl shadow-red-200 hover:scale-[1.02] active:scale-95 text-sm"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : t('auth.signup_button')}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>

          <div className="bg-gray-50 py-10 px-12 text-center flex flex-col items-center gap-4 border-t border-gray-100 shadow-inner">
            <img src="/logo.jpg" alt="Creative Mark" className="h-10 w-auto object-contain rounded-xl opacity-40 grayscale" />
            <p className="text-xs text-gray-400 font-black uppercase tracking-[0.4em] italic leading-none">
              Precision Intelligence &bull; Creative Mark Systems
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
