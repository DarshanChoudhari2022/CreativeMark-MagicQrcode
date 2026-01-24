import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Sparkles } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[120px] -z-0 animate-pulse"></div>

      <div className="relative z-10 text-center max-w-md w-full animate-in fade-in zoom-in duration-700">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-[3.5rem] shadow-2xl">
          <div className="w-24 h-24 bg-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-red-600/20 rotate-12">
            <Sparkles className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-8xl font-black text-white italic uppercase tracking-tighter mb-4 italic">404</h1>
          <p className="text-sm font-black text-red-600 uppercase tracking-[0.4em] mb-10 italic">Signal Lost in Space</p>

          <div className="space-y-4">
            <Button
              onClick={() => window.location.href = "https://creative-mark.vercel.app/"}
              className="w-full h-16 bg-red-600 hover:bg-white hover:text-red-600 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 text-xs"
            >
              <ArrowLeft className="h-5 w-5 mr-3" />
              Main Agency
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="w-full h-16 bg-transparent border-2 border-white/10 text-white hover:bg-white/5 rounded-2xl font-black uppercase tracking-widest transition-all text-xs"
            >
              <Home className="h-5 w-5 mr-3" />
              Control Hub
            </Button>
          </div>
        </div>

        <p className="mt-12 text-[10px] font-bold text-slate-500 uppercase tracking-[0.5em] italic">
          ReviewBoost Protocol Error
        </p>
      </div>
    </div>
  );
};

export default NotFound;
