import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, inventoryContext, userApiKey } = body;

    const rawKey = (userApiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '').trim();
    // Only attempt Google Gemini API when a valid Gemini API key (starts with AIza) is present
    const isValidGeminiKey = rawKey.startsWith('AIza') && rawKey.length > 20;

    if (isValidGeminiKey) {
      const genAI = new GoogleGenerativeAI(rawKey);

      const allDiamonds = inventoryContext?.allDiamonds || [];
      const allGold = inventoryContext?.allGold || [];
      const soldGold = inventoryContext?.soldGold || [];

      const systemPrompt = `You are RUBY, the intelligent AI Vault Copilot for "SHINE GOLD & DIAMONDS", powered by Google Gemini.

LANGUAGE RULES:
- Detect the user's language (English, Malayalam, Manglish like "S1 il etra gold und?", or Hindi).
- Reply clearly and naturally in the EXACT same language the user used.
- Keep responses concise, accurate, and easy to read (or listen to via voice).
- Gold weights are ALWAYS in grams (g). Diamond weights are in carats (ct).

LIVE INVENTORY TELEMETRY:
- Total Gold: ${inventoryContext?.totalGoldWeightKg || 0} g (${inventoryContext?.goldCount || 0} items) — Est. Value: $${inventoryContext?.totalGoldValueUsd?.toLocaleString() || 0}
- Gold Spot Rate: $${inventoryContext?.goldSpotPrice || 66.82}/g
- Total Diamonds: ${inventoryContext?.totalDiamondCarats || 0} ct (${inventoryContext?.diamondCount || 0} stones) — Total Tag Price: $${inventoryContext?.totalDiamondValueUsd?.toLocaleString() || 0}
- Sold Gold Today/History: ${soldGold.length} items
- Active Branches: 14 Branches (HO, S1 to S13)

FULL GOLD INVENTORY (${allGold.length} items — weights in grams):
${JSON.stringify(allGold.slice(0, 250))}

FULL DIAMOND INVENTORY (${allDiamonds.length} stones):
${JSON.stringify(allDiamonds.slice(0, 250))}

SOLD GOLD HISTORY (${soldGold.length} items):
${JSON.stringify(soldGold.slice(0, 100))}

RESPONSE FORMAT:
- If the user asks to list/search/find specific Gold or Diamond items, return JSON:
{"type":"inventory-result","summary":"<clear answer in user's language>","totalFound":<number>,"totalCarats":<number or null>,"totalValue":<number or null>,"items":[{"tagNo":"...","branch":"...","carat":<num or null>,"weight":<num or null>,"clarity":"...","shape":"...","colour":"...","brand":"...","purity":"...","tagPrice":<num or null>,"item":"..."}],"branchBreakdown":[{"branch":"...","count":<num>,"carats":<num or null>,"weightKg":<num or null>}]}
- For summaries, counts, held items, transfer status, sold totals, or conversational questions: respond directly in clean text with bold numbers.`;

      const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      let result = null;
      let lastError: any = null;

      for (const modelName of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          result = await model.generateContent({
            contents: [
              { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Query: ${message}` }] }
            ]
          });
          break;
        } catch (err: any) {
          lastError = err;
          console.warn(`Model ${modelName} failed, trying fallback...`, err?.message);
        }
      }

      if (result) {
        const replyText = result.response.text().trim();

        // Try to parse as structured inventory-result JSON
        try {
          const jsonMatch = replyText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.type === 'inventory-result' && Array.isArray(parsed.items)) {
              return NextResponse.json({ structured: parsed, source: 'google-gemini-live' });
            }
          }
        } catch {
          // Plain text reply
        }

        return NextResponse.json({ reply: replyText, source: 'google-gemini-live' });
      }

      console.error('All Gemini models failed:', lastError?.message);
    }

    // Smoothly fall back to the built-in Smart RUBY Engine without breaking UX
    return NextResponse.json({
      reply: null,
      source: 'smart-local-engine',
      needsKey: !isValidGeminiKey
    });
  } catch (error: any) {
    console.error('AI Chat Route Error:', error);
    return NextResponse.json({
      reply: null,
      source: 'smart-local-engine'
    });
  }
}
