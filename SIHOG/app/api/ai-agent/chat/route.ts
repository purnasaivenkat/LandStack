import { NextRequest, NextResponse } from 'next/server';
import { queryLandStackCopilot, REGISTRY_PARCELS } from '@/lib/agent-knowledge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const q = (body.question || "").trim();
    if (!q) {
      return NextResponse.json({
        answer: "Please ask a question regarding land parcels, litigation, taxes, or due diligence.",
        parcel_ids: []
      });
    }

    // Optional LLM Call (Gemini) if API Key is configured in environment
    const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (apiKey) {
      const candidateModels = [
        'gemini-3.1-flash-lite',
        'gemini-3.1-flash-lite-preview',
        'gemini-3.5-flash',
        'gemini-flash-latest',
        'gemini-2.5-flash'
      ];

      for (const model of candidateModels) {
        try {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                    text: `You are the LandStack AI Land Governance Copilot for revenue officers and citizens in India.
Answer the following question authoritatively, accurately, concisely, and factually using Indian land records, PostGIS cadastral systems, and Transfer of Property Act laws.

Registry Benchmark Context:
- UL001: Ravi Kumar, Survey 104/1, 3.20 acres, Clean Title (Tax paid, nil encumbrance, nil court cases).
- UL002: Smt. Lakshmi Devi, Survey 104/2, 3.20 ac GIS vs 2.80 ac RoR (+0.40 ac Area Mismatch). HIGH_RISK.
- UL003: Ramesh Gowda, Survey 105/1, 4.50 ac, Active Court Stay Order (Case OS/442/2023, Senior Civil Court, Partition Suit). BLOCKED.
- UL004: Venkatesh Prasad, Survey 106/1, 1.50 ac, Active SBI Mortgage ₹4.50 Crore. MODERATE_RISK.
- UL005: Anand Rao, Survey 107/1, 2.40 ac, Property Tax DEFAULTED (₹78,000 arrears for 3 years). HIGH_RISK.
- UL006: Horizon Logistics, Survey 108/1, 1.80 ac, Zoning Violation (Agricultural Green Belt used for unauthorized warehouse). BLOCKED.

Question: ${q}`
                  }]
                }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 800 }
              })
            }
          );

          if (geminiRes.ok) {
            const geminiData = await geminiRes.json();
            const cand = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (cand && cand.trim()) {
              const ulpinMatches = q.match(/UL00[1-6]|ULPIN[-A-Z0-9]+/gi);
              return NextResponse.json({
                answer: cand.trim(),
                parcel_ids: ulpinMatches ? ulpinMatches.map((u: string) => u.toUpperCase()) : [],
                sources: [`gemini_${model}`, "landstack_registry"]
              });
            }
          }
        } catch (e) {
          // try next model
        }
      }
    }

    // Comprehensive semantic knowledge engine
    const result = queryLandStackCopilot(q);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to process AI Copilot query." },
      { status: 500 }
    );
  }
}
