import { supabase } from '@/integrations/supabase/client';
import { generateAutoReply as generateGeminiReply } from './gemini';

interface ReviewData {
  rating: number;
  reviewText: string | null;
  customerName: string | null;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
}

const getSystemPrompt = (businessName: string) => `
You are an AI assistant helping ${businessName} respond to customer reviews.

Guidelines:
- Be professional, friendly, and personable
- Thank customers for their feedback
- For positive reviews (4-5 stars): Express gratitude and invite them back
- For neutral reviews (3 stars): Acknowledge their feedback and mention improvements
- For negative reviews (1-2 stars): Apologize sincerely, offer to resolve issues, provide contact info
- Keep responses under 100 words
- Use a warm, authentic tone
- Personalize with customer name if available
- Never make promises you can't keep
`;

export const generateAutoReply = async (
  reviewData: ReviewData,
  businessName: string,
  campaignId: string
): Promise<string> => {
  try {
    const { rating, reviewText, customerName, sentiment } = reviewData;

    // Use the Gemini service
    const reply = await generateGeminiReply(
      reviewText || '',
      rating,
      businessName
    );

    return reply || generateFallbackReply(reviewData);

  } catch (error) {
    console.error('AI auto-reply error:', error);
    return generateFallbackReply(reviewData);
  }
};

const generateFallbackReply = (reviewData: ReviewData): string => {
  const { rating, customerName } = reviewData;
  const name = customerName ? `${customerName}, ` : '';

  if (rating >= 4) {
    return `Thank you ${name}for your wonderful feedback! We're thrilled you had a great experience. We look forward to serving you again soon!`;
  } else if (rating === 3) {
    return `Thank you ${name}for your feedback. We appreciate you taking the time to share your experience and are always working to improve. Please feel free to reach out if there's anything specific we can address.`;
  } else {
    return `We sincerely apologize ${name}for not meeting your expectations. Your feedback is invaluable to us. Please contact us directly so we can make this right and improve your experience.`;
  }
};

export const processReviewWithAutoReply = async (
  reviewId: string,
  campaignId: string
) => {
  try {
    const { data: review } = await (supabase as any)
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (!review) throw new Error('Review not found');

    const { data: campaign } = await (supabase as any)
      .from('review_campaigns')
      .select('name, auto_reply_enabled')
      .eq('id', campaignId)
      .single();

    if (!campaign || !campaign.auto_reply_enabled) {
      return null;
    }

    const replyText = await generateAutoReply(
      {
        rating: review.rating,
        reviewText: review.review_text,
        customerName: review.customer_name,
        sentiment: review.sentiment,
      },
      campaign.name,
      campaignId
    );

    await (supabase as any)
      .from('reviews')
      .update({
        auto_reply_text: replyText,
        auto_reply_sent: true,
      })
      .eq('id', reviewId);

    return replyText;
  } catch (error) {
    console.error('Process review with auto-reply error:', error);
    throw error;
  }
};

export const analyzeReviewSentiment = async (
  reviewText: string
): Promise<'positive' | 'neutral' | 'negative'> => {
  try {
    if (!reviewText || reviewText.trim().length === 0) {
      return 'neutral';
    }

    // Sentiment analysis logic - simpler fallback for now or use HF later
    // For now, let's keep it simple: 4-5 stars usually positive, 3 neutral, 1-2 negative
    // We can infer sentiment from the rating in the caller usually, but if we only have text:
    const prompt = `[INST] Classify the sentiment of this text as "positive", "neutral", or "negative". Text: "${reviewText}" Answer: [/INST]`;
    // We could call HF here similarly if needed, but for simplicity let's return neutral or verify call.
    return 'neutral';
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return 'neutral';
  }
};
