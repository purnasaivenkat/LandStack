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

    // 1. Check authoritative registry knowledge engine first
    const domainResult = queryLandStackCopilot(q);

    // If the question is a direct cadastral/legal benchmark query, return the precise registry record
    const isDirectBenchmarkMatch = 
      domainResult.tool_used !== "intelligent_semantic_engine" && 
      domainResult.tool_used !== "copilot_manifest";

    if (isDirectBenchmarkMatch) {
      return NextResponse.json(domainResult);
    }

    // 2. For open-ended, general, or educational queries, call Gemini LLM if key is present
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
- Clean Titles (Safe): UL001 (Ravi Kumar, 104/1, 3.20 ac), UL013 (Dr. Arvind Swamy, 127/1, 2.50 ac, A-Khata), UL016 (Sunita Deshmukh, 132/1, 1.75 ac, DC Converted), UL020 (Green Valley Orchard, 140/1, 5.00 ac).
- Court Stays / Litigation: UL003 (Ramesh Gowda, 105/1, 4.50 ac, Order 39 stay in OS/442/2023), UL006 (Horizon Logistics, 108/1, 1.80 ac, NGT stop-work order OA/219/2023), UL008 (K. Suresh Kumar, 112/3, 3.10 ac, High Court status quo in RA/118/2022), UL012 (Maheshwari Developers, 125/2, 2.10 ac, KAT stay REV/AP/88/2024 & Sec 145 CrPC restraint).
- Tax Defaulters (Unpaid Arrears): UL005 (Anand Rao, 107/1, 2.40 ac, ₹78,000 arrears for 3 years, Form 12 notice), UL009 (Balaji Industrial Warehousing, 114/2, 3.50 ac, ₹1,42,000 commercial tax arrears, Sec 104 notice), UL014 (Pradeep Hegde, 129/1, 1.90 ac, ₹45,500 panchayat dues, Form 9 demand).
- Bank Mortgages / Liens: UL004 (Venkatesh Prasad, 106/1, 1.50 ac, SBI ₹4.50 Cr commercial lien), UL007 (Sri Krishna Agro, 109/2, 5.20 ac, Canara Bank ₹1.80 Cr agri loan), UL011 (Apex Logistics, 121/1, 4.00 ac, HDFC Bank ₹6.20 Cr corporate lien).
- Area Discrepancies: UL002 (Lakshmi Devi, 104/2, GIS 3.20 ac vs RoR 2.80 ac, +0.40 ac variance), UL010 (Shivaram Patil, 115/1, GIS 3.45 ac vs RoR 4.10 ac, -0.65 ac deficit), UL015 (Reliance Bio-Agro, 130/2, GIS 2.90 ac vs RoR 2.60 ac, +0.30 ac variance).
- When asked for a category (e.g. who has court cases, who hasn't paid tax, who has mortgages, who has area mismatch), ALWAYS provide details for ALL matching parcels with structured tables rather than a single record.

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
                parcel_ids: ulpinMatches ? ulpinMatches.map((u: string) => u.toUpperCase()) : domainResult.parcel_ids,
                tool_used: `gemini_copilot`,
                risk_score: domainResult.risk_score,
                risk_level: domainResult.risk_level,
                is_safe: domainResult.is_safe,
                anomalies: domainResult.anomalies,
                sources: [`gemini_${model}`, "landstack_registry"]
              });
            }
          }
        } catch (e) {
          // try next model
        }
      }
    }

    // 3. Fallback to comprehensive knowledge engine
    return NextResponse.json(domainResult);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to process AI Copilot query." },
      { status: 500 }
    );
  }
}
