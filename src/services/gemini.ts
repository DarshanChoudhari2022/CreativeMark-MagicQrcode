// Using Groq (Free Tier, Fast LLaMA) - https://console.groq.com
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";

export interface ReviewSuggestion {
    text: string;
    rating: number;
}

export async function generateReviewSuggestions(
    businessName: string,
    rating: number,
    language: string = 'en',
    businessContext: string = '',
    tone: string = 'Professional'
): Promise<ReviewSuggestion[]> {

    const languageMap: Record<string, string> = {
        en: 'English',
        hi: 'Hindi',
        mr: 'Marathi',
    };

    // SEO-focused prompt with business context
    const prompt = `Generate 3 SEO-optimized, authentic Google review suggestions for "${businessName}".

Business Context: ${businessContext || 'General business'}
Rating: ${rating} stars
Tone: ${tone}
Language: ${languageMap[language] || 'English'}

Instructions:
- Include relevant keywords from the business context
- Keep each review 15-30 words, natural sounding
- Return ONLY a JSON array of strings, no other text
- Example format: ["Review 1 text", "Review 2 text", "Review 3 text"]`;

    try {
        console.log("Fetching reviews from Groq API...");
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [
                    { role: "system", content: "You are a review generation assistant. Output only valid JSON arrays." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 300,
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Groq API Error:", errorText);
            throw new Error(`Groq API Error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '[]';
        console.log("Groq Raw Response:", text);

        // Clean up response
        const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();

        let suggestions: string[] = [];
        try {
            suggestions = JSON.parse(cleanedText);
        } catch (e) {
            console.warn("JSON parse failed, trying regex extraction");
            const match = cleanedText.match(/\[[\s\S]*?\]/);
            if (match) {
                try { suggestions = JSON.parse(match[0]); } catch { }
            }

            if (!suggestions.length) {
                suggestions = text.split('\n')
                    .map(l => l.replace(/^[-*\d.]+\s*/, '').replace(/^"|"$/g, '').trim())
                    .filter(l => l.length > 10 && !l.includes('['));
            }
        }

        return suggestions.slice(0, 3).map(s => ({
            text: typeof s === 'string' ? s : String(s),
            rating
        }));

    } catch (error) {
        console.error('Error generating reviews:', error);
        return [];
    }
}

export async function generateAutoReply(
    reviewText: string,
    rating: number,
    businessName: string,
    language: string = 'en'
): Promise<string> {
    const prompt = `Write a short, professional response to this ${rating}-star review for ${businessName}: "${reviewText}". Keep it warm and under 40 words.`;

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 100,
            })
        });
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "Thank you for your feedback!";
    } catch (e) {
        return "Thank you for your feedback!";
    }
}
