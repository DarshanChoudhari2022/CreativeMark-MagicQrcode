
import { HfInference } from "@huggingface/inference";

// Initialize Hugging Face client
// Free usage does not strictly require a key for very low volume, but it's highly recommended to avoid rate limits.
// We will use import.meta.env.VITE_HUGGINGFACE_API_KEY if available.
const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
const hf = new HfInference(apiKey);

// Model: Meta Llama 3 8B Instruct (Robust standard model)
const MODEL_NAME = "meta-llama/Meta-Llama-3-8B-Instruct";

export interface ReviewSuggestion {
    text: string;
    rating: number;
}

export async function generateReviewSuggestions(
    businessName: string,
    rating: number,
    language: string = 'en',
    businessType?: string,
    tone?: string
): Promise<ReviewSuggestion[]> {
    const languageMap: Record<string, string> = {
        en: 'English',
        hi: 'Hindi',
        mr: 'Marathi',
    };

    const businessContext = businessType ? ` for a ${businessType} business` : '';
    const toneContext = tone ? ` with a ${tone} tone` : '';

    const uniquenessSeed = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const ratingTone = rating >= 5
        ? '5-star: clearly positive but not exaggerated.'
        : rating === 4
            ? '4-star: mostly positive with one small constructive caveat.'
            : rating === 3
                ? '3-star: mixed and fair, with one good point and one improvement.'
                : rating === 2
                    ? '2-star: disappointed but respectful and constructive.'
                    : '1-star: negative but calm, factual, and respectful.';
    const systemPrompt = `Create 3 short editable Google Maps review ideas for a customer who genuinely visited "${businessName}"${businessContext}${toneContext}. The language must be ${languageMap[language] || 'English'}.
  Unique request seed: ${uniquenessSeed}.
  Customer selected rating: ${rating}/5. Rating tone: ${ratingTone}
  Keep each idea between 12 and 35 words. Do not invent facts, staff names, menu items, prices, offers, or visit details. Do not ask for a specific rating or only positive content. Avoid SEO and exaggerated phrases like "highly recommended" or "must visit".
  Each idea must have a different opening, sentence structure, and topic angle. Do not output duplicate or closely paraphrased ideas.
  Return strictly a JSON array of strings. Do not include any explanation or markdown.`;

    try {
        const response = await hf.chatCompletion({
            model: MODEL_NAME,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Generate the reviews now." }
            ],
            max_tokens: 250,
            temperature: 0.8,
        });

        const text = response.choices[0].message.content || '[]';

        // Clean up response
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        let suggestions: any[] = [];
        try {
            // Try parsing JSON directly
            suggestions = JSON.parse(cleanedText);
        } catch (e) {
            // Fallback: If model chatted instead of giving JSON, try to extract list items or just split lines
            console.warn("HF JSON parse failed, attempting extraction:", text);
            const listMatches = text.match(/"([^"]+)"/g);
            if (listMatches) {
                suggestions = listMatches.map(m => m.replace(/"/g, ''));
            } else {
                suggestions = text.split('\n').filter(line => line.length > 5);
            }
        }

        if (!Array.isArray(suggestions)) {
            return [];
        }

        return suggestions.slice(0, 3).map(s => {
            if (typeof s === 'string') {
                return { text: s, rating };
            } else if (typeof s === 'object' && s !== null && 'text' in s) {
                return { text: s.text, rating };
            }
            return { text: JSON.stringify(s), rating };
        });
    } catch (error) {
        console.error('Error generating reviews with Hugging Face:', error);
        // Fallback is handled by the caller
        throw error;
    }
}

export async function generateAutoReply(
    reviewText: string,
    rating: number,
    businessName: string,
    language: string = 'en'
): Promise<string> {
    try {
        const systemPrompt = `Write a short, professional, and warm reply to this customer review for "${businessName}". The rating was ${rating}/5 stars. Keep it under 50 words.`;

        const response = await hf.chatCompletion({
            model: MODEL_NAME,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Review: "${reviewText}"` }
            ],
            max_tokens: 100,
            temperature: 0.7,
        });

        return (response.choices[0].message.content || "Thank you for your feedback!").trim().replace(/^"|"$/g, '');
    } catch (error) {
        console.error("HF Auto-reply error", error);
        return "Thank you for your feedback!";
    }
}
