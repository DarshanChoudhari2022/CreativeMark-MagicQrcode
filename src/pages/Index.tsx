import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Sparkles, TrendingUp, Zap, BarChart3, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI-Powered Review Collection</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Boost Your Google Reviews with AI
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            One-tap review posting with AI-generated suggestions. Increase your Google ranking and customer trust effortlessly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8">
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-lg px-8">
              View Demo
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>AI-Powered Suggestions</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>One-Tap Posting</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span>Real-Time Analytics</span>
            </div>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="container mx-auto px-4 py-20 bg-background">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Overview</h2>
          <h3 className="text-2xl font-semibold text-primary mb-4">What is Smart CONNECT QR?</h3>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Smart CONNECT QR is an AI-powered Google Review tool designed for modern businesses.
            With just one scan and one tap, your customers can post authentic, SEO-friendly reviews instantly —
            no apps, no delays.
          </p>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Comparison</h2>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <Card className="bg-red-50/50 border-red-100">
            <CardContent className="pt-8 text-center">
              <div className="text-4xl mb-4">😕</div>
              <h3 className="text-xl font-bold text-red-600 mb-2">Before (Old QR flow)</h3>
              <p className="text-muted-foreground">
                Customer scans → thinks → types → gets busy → skips review.
                <br /><span className="font-semibold text-red-500">Result: Low conversion, lost visibility.</span>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-green-50/50 border-green-100 shadow-lg transform md:-translate-y-2">
            <CardContent className="pt-8 text-center">
              <div className="text-4xl mb-4">🤩</div>
              <h3 className="text-xl font-bold text-green-600 mb-2">After (Smart CONNECT QR)</h3>
              <p className="text-muted-foreground">
                One scan → AI suggestions → review posted instantly.
                <br /><span className="font-semibold text-green-500">Result: More reviews, higher ranking, more customers.</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Why Businesses Love It Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
          Why Businesses Love Smart CONNECT QR
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Step 1 */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-primary">1</span>
            </div>
            <h3 className="text-xl font-bold">Scan the QR</h3>
            <p className="text-muted-foreground">
              Customer simply scans your Smart CONNECT QR or taps the NFC card.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-primary">2</span>
            </div>
            <h3 className="text-xl font-bold">Pick a Review Line</h3>
            <p className="text-muted-foreground">
              AI suggests ready-made SEO friendly review lines — customer selects one.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-primary">3</span>
            </div>
            <h3 className="text-xl font-bold">Post on Google</h3>
            <p className="text-muted-foreground">
              Review opens instantly on Google — customer just hits "Post".
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/5 px-6 py-3 rounded-full border border-primary/20">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-medium text-primary">Bonus: AI Auto-Reply instantly responds to every new review.</span>
          </div>
        </div>
      </section>

      {/* Features Grid (Updated) */}
      <section className="container mx-auto px-4 py-20 bg-muted/20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> AI Suggestions
              </h3>
              <p className="text-sm text-muted-foreground">SEO-optimized prompts generated by AI.</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" /> One-Tap Posting
              </h3>
              <p className="text-sm text-muted-foreground">Remove friction, get more reviews.</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Custom Branding
              </h3>
              <p className="text-sm text-muted-foreground">Your logo and colors on every QR.</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Mobile Optimized
              </h3>
              <p className="text-sm text-muted-foreground">Fast loading pages for all devices.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto border-2 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden relative">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
          <CardContent className="pt-16 pb-16 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Collect 10X More Google Reviews — Instantly 🚀
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              One Scan. One Tap. Boost trust and local SEO with Smart CONNECT QR.
            </p>
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-10 h-14 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105">
              Get Started Free
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Index;
