import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, inventoryContext, userApiKey } = body;

    const apiKey = (userApiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '').trim();

    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      
      const allDiamonds = inventoryContext?.allDiamonds || [];
      const allGold = inventoryContext?.allGold || [];

      const systemPrompt = `You are RUBY, the prestigious AI Vault Copilot for "SHINE GOLD & DIAMONDS — Preserving Purity", powered by Google Gemini.

LANGUAGE RULES:
- Detect query language. Reply in English, Malayalam/Manglish, or Hindi/Hinglish matching the user's language.
- Always use luxury-grade formatting: bold numbers, bullet points, currency signs ($), emoji accents.

LIVE VAULT TELEMETRY:
- Total Gold: ${inventoryContext?.totalGoldWeightKg || 0} kg (${inventoryContext?.goldCount || 0} items) — Value: $${inventoryContext?.totalGoldValueUsd?.toLocaleString() || 0}
- Gold Spot: $${inventoryContext?.goldSpotPrice || 66.82}/g
- Total Diamonds: ${inventoryContext?.totalDiamondCarats || 0} ct (${inventoryContext?.diamondCount || 0} stones) — Value: $${inventoryContext?.totalDiamondValueUsd?.toLocaleString() || 0}
- Active Vaults: 8 Branches (London, Geneva, Dubai, Paris, New York, Zurich, Milan, Tokyo)
- Alerts: ${inventoryContext?.alertsCount || 0} active

FULL DIAMOND INVENTORY (${allDiamonds.length} stones):
${JSON.stringify(allDiamonds)}

FULL GOLD INVENTORY (${allGold.length} items):
${JSON.stringify(allGold)}

RESPONSE FORMAT RULES — CRITICAL:
When the user asks about inventory availability, search, or stock (e.g. "is there VVS2 E pear shape available?", "how many auriz 50g pieces?", "show round diamonds"), you can:
1. Return a JSON object if returning a list/card view:
{"type":"inventory-result","summary":"<brief human answer in user's language>","totalFound":<number>,"totalCarats":<number or null>,"totalValue":<number or null>,"items":[{"tagNo":"...","branch":"...","carat":<num>,"clarity":"...","shape":"...","colour":"...","tagPrice":<num>,"item":"..."}],"branchBreakdown":[{"branch":"...","count":<num>,"carats":<num>}]}
2. For specific questions (counts, summaries, valuation, Manglish questions, advice): Provide a clear, polite, conversational response in the user's language.

INSTRUCTIONS:
1. Identify yourself as RUBY when asked.
2. Search through BOTH diamond and gold inventories thoroughly.
3. If no matching items found, politely explain in the user's language that no items match that query.`;

      let result;
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
        result = await model.generateContent({
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Query: ${message}` }] }
          ]
        });
      } catch (err: any) {
        console.warn('gemini-3.5-flash error, trying gemini-3.8-flash...', err?.message);
        const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });
        result = await fallbackModel.generateContent({
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Query: ${message}` }] }
          ]
        });
      }

      let replyText = result.response.text().trim();

      // Try to parse as structured inventory-result JSON
      try {
        const jsonMatch = replyText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.type === 'inventory-result') {
            return NextResponse.json({ structured: parsed, source: 'google-gemini-live' });
          }
        }
      } catch {
        // Not JSON, treat as plain text reply
      }

      return NextResponse.json({ reply: replyText, source: 'google-gemini-live' });
    }

    return NextResponse.json({
      reply: null,
      error: 'NO_API_KEY',
      source: 'client-engine',
      needsKey: true
    });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({
      reply: null,
      error: error.message || 'Gemini API call failed',
      source: 'client-engine'
    });
  }
}
