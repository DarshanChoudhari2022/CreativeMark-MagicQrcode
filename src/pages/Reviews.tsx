import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
    ArrowLeft, Loader2, Star,
    Bot, Copy, Sparkles, RefreshCw, Send, CheckCircle2
} from 'lucide-react';
import { generateAutoReply } from '@/services/gemini';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '@/components/LanguageToggle';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface Review {
    id: string;
    rating: number;
    review_text: string | null;
    customer_name: string | null;
    created_at: string;
    auto_reply_text?: string | null;
    metadata?: any;
}

export default function ReviewManagement() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [generatingFor, setGeneratingFor] = useState<string | null>(null);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await (supabase as any)
                .from('analytics_logs')
                .select('*')
                .eq('event_type', 'review_click')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedReviews = data.map((item: any) => ({
                id: item.id,
                rating: item.metadata?.rating || 5,
                review_text: item.metadata?.suggestion || 'Customer left a positive review',
                customer_name: item.metadata?.customer_name || 'Verified Customer',
                created_at: item.created_at,
                auto_reply_text: item.metadata?.auto_reply,
                metadata: item.metadata
            }));

            setReviews(formattedReviews);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            toast.error('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReply = async (review: Review) => {
        setGeneratingFor(review.id);
        try {
            const reply = await generateAutoReply(
                review.review_text || 'Great experience',
                review.rating,
                'Our Business', // You might want to fetch real business name here
                'en'
            );

            await (supabase as any)
                .from('analytics_logs')
                .update({
                    metadata: {
                        ...review.metadata,
                        auto_reply: reply
                    }
                })
                .eq('id', review.id);

            toast.success('Reply generated!');
            setReviews(prev => prev.map(r => r.id === review.id ? { ...r, auto_reply_text: reply } : r));
        } catch (error) {
            console.error('Reply generation failed:', error);
            toast.error('Failed to generate response');
        } finally {
            setGeneratingFor(null);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 font-inter">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 font-inter text-slate-900 pb-20">
            {/* Clean Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
                <div className="container mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate("/dashboard")}
                            className="hover:bg-gray-100 text-slate-500 hover:text-slate-900 rounded-full h-10 w-10 min-h-[44px] min-w-[44px]"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-lg md:text-xl font-bold text-slate-900">Response Hub</h1>
                            <p className="text-xs text-slate-500 font-medium">Manage & reply to customer feedback</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                            <Bot className="h-3.5 w-3.5" />
                            <span>AI Assistant Active</span>
                        </div>
                        <LanguageToggle />
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-5xl">

                {/* Stats / Overview could go here */}

                <div className="space-y-6">
                    {reviews.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
                            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">No reviews yet</h3>
                            <p className="text-slate-500 text-sm max-w-md mx-auto mt-2">
                                When customers verify reviews via your QR code, they will appear here for you to respond.
                            </p>
                        </div>
                    ) : (
                        reviews.map((review) => (
                            <div key={review.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                                <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">

                                    {/* LEFT: Customer Review */}
                                    <div className="lg:col-span-5 p-6 md:p-8 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold border border-blue-50">
                                                    {(review.customer_name || 'C')[0]}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-slate-900 text-sm">{review.customer_name || 'Verified Customer'}</h3>
                                                    <p className="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`h-4 w-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-100 text-gray-200'}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <blockquote className="text-slate-700 text-sm leading-relaxed border-l-2 border-blue-100 pl-4 py-1 italic relative bg-slate-50/50 rounded-r-lg p-3">
                                            "{review.review_text}"
                                        </blockquote>

                                        <div className="flex gap-2 pt-2">
                                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-50 border-slate-200 font-medium">Google Review</Badge>
                                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-green-600 bg-green-50 border-green-100 font-medium flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> Verified
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* RIGHT: Owner Response Editor */}
                                    <div className="lg:col-span-7 p-6 md:p-8 bg-gray-50/30 flex flex-col h-full">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                                <Bot className="h-4 w-4 text-blue-600" />
                                                Your Response
                                            </h4>
                                            {review.auto_reply_text && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0 text-[10px] gap-1 px-2.5 py-0.5 cursor-help transition-colors">
                                                            <Sparkles className="h-3 w-3" /> AI Draft
                                                        </Badge>
                                                    </TooltipTrigger>
                                                    <TooltipContent>AI generated this draft based on the review.</TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>

                                        {review.auto_reply_text ? (
                                            <div className="flex-1 flex flex-col gap-4">
                                                <Textarea
                                                    className="min-h-[120px] bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-100 rounded-xl text-sm leading-relaxed resize-none shadow-sm p-4"
                                                    defaultValue={review.auto_reply_text}
                                                    readOnly
                                                />
                                                <div className="flex items-center gap-3 mt-auto">
                                                    <Button
                                                        onClick={() => handleCopy(review.auto_reply_text!)}
                                                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg h-10 md:h-11 font-medium text-sm transition-all shadow-sm active:scale-[0.98] min-h-[44px]"
                                                    >
                                                        <Copy className="h-4 w-4 mr-2" />
                                                        Copy to Clipboard
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => handleGenerateReply(review)}
                                                        disabled={generatingFor === review.id}
                                                        className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg h-10 w-10 md:h-11 md:w-11 p-0 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
                                                        title="Regenerate"
                                                    >
                                                        {generatingFor === review.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                                        ) : (
                                                            <RefreshCw className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-white/50 hover:bg-white hover:border-blue-300 transition-all group">
                                                <div className="bg-blue-50 group-hover:bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors">
                                                    <Sparkles className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-900 mb-1">No reply yet</p>
                                                <p className="text-xs text-slate-500 mb-4 px-8">Generate a professional, AI-crafted response instantly.</p>
                                                <Button
                                                    onClick={() => handleGenerateReply(review)}
                                                    disabled={generatingFor === review.id}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 h-10 font-medium text-xs shadow-lg shadow-blue-200 transition-all hover:shadow-xl active:scale-95 min-h-[44px]"
                                                >
                                                    {generatingFor === review.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    ) : (
                                                        <Sparkles className="h-4 w-4 mr-2" />
                                                    )}
                                                    Write Reply
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
