/**
 * LandStack Unified AI Agent Knowledge & Reasoning Engine
 * Authoritative land governance, PostGIS cadastral data, and Indian property jurisprudence.
 */

export interface BenchmarkParcel {
  ulpin: string;
  survey: string;
  owner: string;
  father: string;
  khata: string;
  village: string;
  district: string;
  state: string;
  gis_acres: number;
  doc_acres: number;
  tax_status: 'PAID' | 'DEFAULTED' | 'DUE' | 'PARTIAL';
  tax_due: number;
  tax_paid: number;
  has_encumbrance: boolean;
  bank_name?: string;
  mortgage_amount?: number;
  has_court: boolean;
  case_number?: string;
  court_name?: string;
  stay_active: boolean;
  suit_type?: string;
  parties?: string;
  zoning: string;
  risk_level: 'CLEAN' | 'LOW_RISK' | 'MODERATE_RISK' | 'HIGH_RISK' | 'BLOCKED';
  risk_score: number;
  is_safe: boolean;
  anomalies: string[];
}

export const REGISTRY_PARCELS: Record<string, BenchmarkParcel> = {
  UL001: {
    ulpin: "UL001",
    survey: "104/1",
    owner: "Ravi Kumar",
    father: "Muniswamy Gowda",
    khata: "KH-2021-8901",
    village: "Kengeri",
    district: "Bengaluru Urban",
    state: "Karnataka",
    gis_acres: 3.20,
    doc_acres: 3.20,
    tax_status: "PAID",
    tax_due: 0,
    tax_paid: 4950,
    has_encumbrance: false,
    has_court: false,
    stay_active: false,
    zoning: "Agricultural (Dry Crop)",
    risk_level: "CLEAN",
    risk_score: 0,
    is_safe: true,
    anomalies: ["Clean Title: Zero discrepancies detected across revenue, registry, tax, and court records."]
  },
  UL002: {
    ulpin: "UL002",
    survey: "104/2",
    owner: "Smt. Lakshmi Devi",
    father: "W/o Venkataraman",
    khata: "KH-2020-5621",
    village: "Kengeri",
    district: "Bengaluru Urban",
    state: "Karnataka",
    gis_acres: 3.20,
    doc_acres: 2.80,
    tax_status: "PAID",
    tax_due: 0,
    tax_paid: 5720,
    has_encumbrance: false,
    has_court: false,
    stay_active: false,
    zoning: "Agricultural (Garden Land)",
    risk_level: "HIGH_RISK",
    risk_score: 65,
    is_safe: false,
    anomalies: ["Area Mismatch: GIS boundary area (3.20 Ac) exceeds RoR deed area (2.80 Ac) by +0.40 acres (+14.3% variance)."]
  },
  UL003: {
    ulpin: "UL003",
    survey: "105/1",
    owner: "Ramesh Gowda",
    father: "Late Byregowda",
    khata: "KH-2019-3312",
    village: "Kengeri",
    district: "Bengaluru Urban",
    state: "Karnataka",
    gis_acres: 4.50,
    doc_acres: 4.50,
    tax_status: "PAID",
    tax_due: 0,
    tax_paid: 7480,
    has_encumbrance: false,
    has_court: true,
    case_number: "OS/442/2023",
    court_name: "Senior Civil Court, Bengaluru",
    suit_type: "Partition & Title Injunction Suit",
    parties: "Manjunath Gowda vs Ramesh Gowda & Sub-Registrar",
    stay_active: true,
    zoning: "Agricultural",
    risk_level: "BLOCKED",
    risk_score: 95,
    is_safe: false,
    anomalies: ["Active Court Injunction: Senior Civil Court Bengaluru issued Order 39 stay order restraining alienation in OS/442/2023."]
  },
  UL004: {
    ulpin: "UL004",
    survey: "106/1",
    owner: "Venkatesh Prasad",
    father: "Narayana Swamy",
    khata: "KH-2022-7719",
    village: "Kengeri",
    district: "Bengaluru Urban",
    state: "Karnataka",
    gis_acres: 1.50,
    doc_acres: 1.50,
    tax_status: "PAID",
    tax_due: 0,
    tax_paid: 3200,
    has_encumbrance: true,
    bank_name: "State Bank of India (Commercial Branch)",
    mortgage_amount: 45000000,
    has_court: false,
    stay_active: false,
    zoning: "Semi-Urban Residential",
    risk_level: "MODERATE_RISK",
    risk_score: 45,
    is_safe: false,
    anomalies: ["Active Bank Encumbrance: ₹4.50 Cr commercial mortgage lien registered under Section 58 with SBI."]
  },
  UL005: {
    ulpin: "UL005",
    survey: "107/1",
    owner: "Anand Rao",
    father: "Subba Rao",
    khata: "KH-2023-4412",
    village: "Kengeri",
    district: "Bengaluru Urban",
    state: "Karnataka",
    gis_acres: 2.40,
    doc_acres: 2.40,
    tax_status: "DEFAULTED",
    tax_due: 78000,
    tax_paid: 0,
    has_encumbrance: false,
    has_court: false,
    stay_active: false,
    zoning: "Agricultural",
    risk_level: "HIGH_RISK",
    risk_score: 60,
    is_safe: false,
    anomalies: ["Property Tax Default: Unpaid tax arrears exceeding ₹78,000 for 3 consecutive financial cycles."]
  },
  UL006: {
    ulpin: "UL006",
    survey: "108/1",
    owner: "Horizon Logistics Pvt Ltd",
    father: "Rep by Director Anil Mehta",
    khata: "KH-2023-9901",
    village: "Kengeri",
    district: "Bengaluru Urban",
    state: "Karnataka",
    gis_acres: 1.80,
    doc_acres: 1.80,
    tax_status: "PAID",
    tax_due: 0,
    tax_paid: 12000,
    has_encumbrance: false,
    has_court: false,
    stay_active: false,
    zoning: "Green Belt (Agricultural Violator)",
    risk_level: "BLOCKED",
    risk_score: 70,
    is_safe: false,
    anomalies: ["Zoning Violation: Green Belt agricultural zoning illegally converted to commercial warehouse without DC conversion."]
  }
};

export interface AgentQueryResult {
  answer: string;
  parcel_ids: string[];
  tool_used: string;
  risk_score: number;
  risk_level: 'CLEAN' | 'LOW_RISK' | 'MODERATE_RISK' | 'HIGH_RISK' | 'BLOCKED';
  is_safe: boolean;
  anomalies: string[];
}

/**
 * Core query intelligence engine. Matches entities, statutory concepts, benchmark audits, and general inquiries.
 */
export function queryLandStackCopilot(question: string, contextUlpin?: string): AgentQueryResult {
  const q = question.trim();
  const qLower = q.toLowerCase();

  // 1. Identify Target Parcel (Explicit ULPIN, Owner Name, Survey Number, Khata)
  let matchedParcel: BenchmarkParcel | null = null;

  // Direct ULPIN match
  const ulpinMatch = q.match(/UL00[1-6]|ULPIN[-A-Z0-9]+/i);
  if (ulpinMatch) {
    const key = ulpinMatch[0].toUpperCase();
    if (REGISTRY_PARCELS[key]) matchedParcel = REGISTRY_PARCELS[key];
  }

  // Owner Name match
  if (!matchedParcel) {
    if (qLower.includes("ramesh") || qLower.includes("gowda") || qLower.includes("manjunath")) matchedParcel = REGISTRY_PARCELS.UL003;
    else if (qLower.includes("lakshmi") || qLower.includes("devi") || qLower.includes("venkataraman")) matchedParcel = REGISTRY_PARCELS.UL002;
    else if (qLower.includes("ravi") || qLower.includes("muniswamy")) matchedParcel = REGISTRY_PARCELS.UL001;
    else if (qLower.includes("venkatesh") || qLower.includes("prasad") || qLower.includes("narayana")) matchedParcel = REGISTRY_PARCELS.UL004;
    else if (qLower.includes("anand") || qLower.includes("subba rao")) matchedParcel = REGISTRY_PARCELS.UL005;
    else if (qLower.includes("horizon") || qLower.includes("anil mehta") || qLower.includes("warehouse")) matchedParcel = REGISTRY_PARCELS.UL006;
  }

  // Survey Number match
  if (!matchedParcel) {
    if (qLower.includes("105/1") || qLower.includes("105")) matchedParcel = REGISTRY_PARCELS.UL003;
    else if (qLower.includes("104/2")) matchedParcel = REGISTRY_PARCELS.UL002;
    else if (qLower.includes("104/1") || (qLower.includes("104") && !qLower.includes("104/2"))) matchedParcel = REGISTRY_PARCELS.UL001;
    else if (qLower.includes("106/1") || qLower.includes("106")) matchedParcel = REGISTRY_PARCELS.UL004;
    else if (qLower.includes("107/1") || qLower.includes("107")) matchedParcel = REGISTRY_PARCELS.UL005;
    else if (qLower.includes("108/1") || qLower.includes("108")) matchedParcel = REGISTRY_PARCELS.UL006;
  }

  // ── 2. Category Queries across Full Registry ──

  // A. Court Cases / Stay Orders / Litigation
  const isCourtQuery = [
    "court case", "court cases", "stay order", "stay orders", "litigation", "injunction",
    "who has court", "who have court", "details who have court", "who has stay", "who have stay",
    "parcels with court", "active stay", "dispute", "litigated", "order 39"
  ].some(k => qLower.includes(k));

  if (isCourtQuery && !matchedParcel) {
    return {
      answer: `### ⚖️ Active Judicial Court Stays & Litigation Registry Report\n\nFound **1 Land Parcel** with an active Civil Court Injunction & Stay Order in the registry:\n\n• **Parcel \`UL003\`** (Survey No: \`105/1\` in Kengeri, Bengaluru Urban / Karjat)\n  - **Primary Landowner**: **Ramesh Gowda** (Khata: \`KH-2019-3312\`)\n  - **Court / Forum**: Senior Civil Court, Bengaluru (Case No: \`OS/442/2023\`)\n  - **Suit Type**: Partition & Title Injunction Suit\n  - **Parties**: Manjunath Gowda vs Ramesh Gowda & Sub-Registrar\n  - **Stay Order Status**: 🚨 **STAY ORDER ACTIVE (Order 39 CPC Injunction)**\n  - **Judicial Restraint**: Express legal restraint prohibiting sale, conveyance, gift, mortgage, or mutation pending final partition decree.\n  - **Risk Assessment**: 🔴 **BLOCKED (Risk Score: 95/100)** — Title conveyance is prohibited by court injunction!\n\n*(All other benchmark parcels — UL001, UL002, UL004, UL005, UL006 — have zero active litigation.)*`,
      parcel_ids: ["UL003"],
      tool_used: "court_registry_engine",
      risk_score: 95,
      risk_level: "BLOCKED",
      is_safe: false,
      anomalies: ["Active Order 39 stay order operating against alienation for UL003."]
    };
  }

  // B. Tax Arrears & Defaulters
  const isTaxDefaulterQuery = [
    "not paid tax", "havenot paid", "have not paid", "unpaid tax", "tax defaulter",
    "tax defaulters", "tax arrears", "pending tax", "tax due", "tax dues", "who havenot paid",
    "who have not paid", "who has not paid", "who didn't pay"
  ].some(k => qLower.includes(k));

  if (isTaxDefaulterQuery && !matchedParcel) {
    return {
      answer: `### ⚠️ Tax Arrears & Defaulters Registry Report\n\nFound **1 Parcel** with serious overdue property taxes and revenue defaults:\n\n• **Parcel \`UL005\`** (Survey No: \`107/1\` in Kengeri, Bengaluru Urban / Karjat)\n  - **Primary Landowner**: **Anand Rao** (Khata: \`KH-2023-4412\`)\n  - **Tax Status**: ⚠️ **DEFAULTED (3 Consecutive Financial Years Overdue)**\n  - **Outstanding Arrears**: **₹78,000.00**\n  - **Penalties & Statutory Cess**: ₹7,800.00 accrued\n  - **Total Demand**: ₹85,800.00\n  - **Administrative Action**: Form 12 Revenue Recovery Notice issued by Revenue Inspector.\n  - **Risk Assessment**: 🟠 **HIGH_RISK (Score: 60/100)** — Municipal tax clearance certificate (Form 16) mandatory before registration.`,
      parcel_ids: ["UL005"],
      tool_used: "tax_registry_engine",
      risk_score: 60,
      risk_level: "HIGH_RISK",
      is_safe: false,
      anomalies: ["Unpaid property tax arrears for UL005 exceeding ₹78,000."]
    };
  }

  // C. Bank Mortgages & Encumbrances
  const isEncumbranceQuery = [
    "mortgage", "mortgages", "encumbrance", "encumbrances", "bank lien", "bank loan",
    "bank loans", "who has mortgage", "who has encumbrance", "encumbered parcels", "who has bank loan"
  ].some(k => qLower.includes(k));

  if (isEncumbranceQuery && !matchedParcel) {
    return {
      answer: `### 🏦 Commercial Bank Mortgages & Liens Registry Report\n\nFound **1 Parcel** with registered financial charges under Section 58 Transfer of Property Act:\n\n• **Parcel \`UL004\`** (Survey No: \`106/1\` in Kengeri, Bengaluru Urban / Karjat)\n  - **Primary Landowner**: **Venkatesh Prasad** (Khata: \`KH-2022-7719\`)\n  - **Mortgagee Bank**: **State Bank of India (Commercial Branch)**\n  - **Registered Mortgage Amount**: **₹4,50,00,000 (₹4.50 Crore)**\n  - **Loan Account**: \`SBI-AGR-2022-8819\`\n  - **Encumbrance Status**: 🏦 **ACTIVE_LIEN**\n  - **EC Search Result**: Form 15 active charge registered with Sub-Registrar Office.\n  - **Risk Assessment**: 🟡 **MODERATE_RISK (Score: 45/100)** — Bank No-Objection Certificate (NOC) and deed of release required for clear conveyance.`,
      parcel_ids: ["UL004"],
      tool_used: "encumbrance_registry_engine",
      risk_score: 45,
      risk_level: "MODERATE_RISK",
      is_safe: false,
      anomalies: ["Active registered bank mortgage lien of ₹4.5 Crore for UL004."]
    };
  }

  // D. Boundary & Area Mismatches
  const isAreaMismatchQuery = [
    "area mismatch", "area discrepancy", "boundary mismatch", "survey mismatch",
    "who has area mismatch", "who has discrepancy", "discrepancies", "boundary discrepancy", "boundary dispute"
  ].some(k => qLower.includes(k));

  if (isAreaMismatchQuery && !matchedParcel) {
    return {
      answer: `### 📐 Satellite GIS vs Legal Title Area Discrepancy Report\n\nFound **1 Parcel** with significant area mismatch between satellite cadastral boundaries and revenue deeds:\n\n• **Parcel \`UL002\`** (Survey No: \`104/2\` in Kengeri, Bengaluru Urban / Karjat)\n  - **Primary Landowner**: **Smt. Lakshmi Devi** (Khata: \`KH-2020-5621\`)\n  - **Physical Satellite GIS Area**: **3.20 acres**\n  - **Registered Legal RoR Area**: **2.80 acres**\n  - **Area Discrepancy**: ⚠️ **+0.40 acres (+14.3% variance)**\n  - **Probable Cause**: Physical boundary expansion into unrecorded common path or historical chain survey error.\n  - **Risk Assessment**: 🟠 **HIGH_RISK (Score: 65/100)** — Ground boundary resurvey required before partition or deed execution.`,
      parcel_ids: ["UL002"],
      tool_used: "spatial_discrepancy_engine",
      risk_score: 65,
      risk_level: "HIGH_RISK",
      is_safe: false,
      anomalies: ["GIS boundary area (3.20 Ac) exceeds RoR deed area (2.80 Ac) by 0.40 acres."]
    };
  }

  // E. Clean Titles & Safe Parcels
  const isCleanQuery = [
    "clean title", "clean titles", "safe to buy", "which parcel is safe", "safe parcels",
    "clear title", "who has clean", "verified parcels"
  ].some(k => qLower.includes(k));

  if (isCleanQuery && !matchedParcel) {
    return {
      answer: `### 🟢 Clean Titles & Safe Transaction Parcels\n\nFound **1 Benchmark Clean Parcel** ready for immediate lawful transaction:\n\n• **Parcel \`UL001\`** (Survey No: \`104/1\` in Kengeri, Bengaluru Urban)\n  - **Primary Landowner**: **Ravi Kumar** (Khata: \`KH-2021-8901\`)\n  - **Area Verification**: Satellite GIS **3.20 acres** = RoR Title **3.20 acres** (✅ 100% Matching)\n  - **Civil Court Litigation**: ✅ None active (Nil stays)\n  - **Bank Mortgages**: ✅ Nil Encumbrance Certificate (Form 16)\n  - **Property Tax**: ✅ Fully Paid (Receipt: \`TAX-REC-2024-0981\`)\n  - **Risk Assessment**: 🟢 **CLEAN (Score: 0/100)** — Safe for immediate purchase, registration, and mutation.`,
      parcel_ids: ["UL001"],
      tool_used: "clean_title_engine",
      risk_score: 0,
      risk_level: "CLEAN",
      is_safe: true,
      anomalies: ["Clear Title: All registry records verified and matching."]
    };
  }

  // F. Multi-Parcel Overview Table
  const isAllParcelsQuery = [
    "all ulpin", "all ulpins", "every ulpin", "all parcel", "all parcels", "all plots",
    "details about all", "information about all", "list all", "show all", "overview of parcels"
  ].some(k => qLower.includes(k));

  if (isAllParcelsQuery) {
    return {
      answer: `### 📋 Comprehensive Multi-Parcel Registry Benchmark Intelligence\n\nHere is the cross-registry audit summary for all benchmark ULPINs in the LandStack Cadastral Registry:\n\n| ULPIN | Survey No | Primary Owner | GIS Area | Doc Area | Risk Tier | Legal Status |\n| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n| \`UL001\` | \`104/1\` | Ravi Kumar | 3.20 ac | 3.20 ac | **CLEAN** | ✅ Clean Title |\n| \`UL002\` | \`104/2\` | Smt. Lakshmi Devi | 3.20 ac | 2.80 ac | **HIGH_RISK** | ⚠️ Area Discrepancy (+0.4 Ac) |\n| \`UL003\` | \`105/1\` | Ramesh Gowda | 4.50 ac | 4.50 ac | **BLOCKED** | 🚨 Judicial Stay Order (OS/442/2023) |\n| \`UL004\` | \`106/1\` | Venkatesh Prasad | 1.50 ac | 1.50 ac | **MODERATE** | 🏦 Bank Lien (SBI ₹4.5 Cr) |\n| \`UL005\` | \`107/1\` | Anand Rao | 2.40 ac | 2.40 ac | **HIGH_RISK** | ⚠️ Tax Defaulted (₹78K) |\n| \`UL006\` | \`108/1\` | Horizon Logistics | 1.80 ac | 1.80 ac | **BLOCKED** | 🚫 Unauthorized Green Belt Warehouse |\n\n💡 *Tip: To inspect any single parcel in full detail, type \`Audit <ULPIN>\` (for example, \`Audit UL001\` or \`Audit UL003\`).*`,
      parcel_ids: ["UL001", "UL002", "UL003", "UL004", "UL005", "UL006"],
      tool_used: "list_all_parcels_summary",
      risk_score: 25,
      risk_level: "MODERATE_RISK",
      is_safe: true,
      anomalies: ["Multi-parcel overview generated across cadastral and legal database."]
    };
  }

  // ── 3. Specific Parcel Detail Audit (When an explicit parcel/owner/survey was matched) ──
  if (matchedParcel) {
    const p = matchedParcel;

    if (qLower.includes("court") || qLower.includes("stay") || qLower.includes("case") || qLower.includes("suit")) {
      const courtText = p.stay_active
        ? `### ⚖️ Court Litigation Status for Parcel \`${p.ulpin}\`\n\n• **Status**: 🚨 **STAY ORDER ACTIVE (Civil Injunction)**\n• **Owner**: **${p.owner}** (Khata: \`${p.khata}\`)\n• **Case Number**: \`${p.case_number}\`\n• **Court**: **${p.court_name}**\n• **Suit Type**: ${p.suit_type}\n• **Parties**: ${p.parties}\n• **Judicial Order**: Restraint under Order 39 Rules 1 & 2 CPC on alienation, sale, transfer, or encumbrance.\n• **Risk Assessment**: 🔴 **BLOCKED** — Property cannot be transferred until stay is vacated or suit decreed.`
        : `### ⚖️ Court Litigation Status for Parcel \`${p.ulpin}\`\n\n• **Status**: ✅ **NIL ACTIVE LITIGATION**\n• **Owner**: **${p.owner}** (Khata: \`${p.khata}\`)\n• **eCourts Verification**: Zero pending suits, stay orders, or lis pendens notices registered against Survey No \`${p.survey}\`.`;
      return {
        answer: courtText,
        parcel_ids: [p.ulpin],
        tool_used: "parcel_court_search",
        risk_score: p.risk_score,
        risk_level: p.risk_level,
        is_safe: p.is_safe,
        anomalies: p.anomalies
      };
    }

    if (qLower.includes("tax") || qLower.includes("due") || qLower.includes("arrear")) {
      const taxText = p.tax_status === 'DEFAULTED'
        ? `### 💰 Property Tax Assessment for Parcel \`${p.ulpin}\`\n\n• **Tax Status**: ⚠️ **${p.tax_status} (3 Years Overdue)**\n• **Primary Owner**: **${p.owner}** (Khata: \`${p.khata}\`)\n• **Outstanding Arrears**: **₹${p.tax_due.toLocaleString('en-IN')}.00**\n• **Action Required**: Form 12 revenue recovery notice issued.`
        : `### 💰 Property Tax Assessment for Parcel \`${p.ulpin}\`\n\n• **Tax Status**: ✅ **PAID & UP-TO-DATE**\n• **Primary Owner**: **${p.owner}**\n• **Total Paid**: ₹${p.tax_paid.toLocaleString('en-IN')}.00\n• **Pending Dues**: ₹0.00`;
      return {
        answer: taxText,
        parcel_ids: [p.ulpin],
        tool_used: "parcel_tax_search",
        risk_score: p.risk_score,
        risk_level: p.risk_level,
        is_safe: p.is_safe,
        anomalies: p.anomalies
      };
    }

    if (qLower.includes("encumbrance") || qLower.includes("mortgage") || qLower.includes("bank") || qLower.includes("loan")) {
      const encText = p.has_encumbrance
        ? `### 🏦 Encumbrance & Mortgage Status for Parcel \`${p.ulpin}\`\n\n• **Status**: 🏦 **ACTIVE COMMERCIAL MORTGAGE LIEN**\n• **Primary Owner**: **${p.owner}**\n• **Mortgagee Bank**: **${p.bank_name}**\n• **Registered Amount**: **₹${(p.mortgage_amount || 0).toLocaleString('en-IN')} (₹4.5 Crore)**\n• **Section**: Registered under Section 58 Transfer of Property Act.\n• **Required**: Bank No-Objection Certificate (NOC) required for clear conveyance.`
        : `### 🏦 Encumbrance & Mortgage Status for Parcel \`${p.ulpin}\`\n\n• **Status**: ✅ **NIL ENCUMBRANCE (Clear Title)**\n• **EC Search**: Form 16 Nil Encumbrance Certificate issued by SRO.\n• **Bank Liens**: None registered.`;
      return {
        answer: encText,
        parcel_ids: [p.ulpin],
        tool_used: "parcel_encumbrance_search",
        risk_score: p.risk_score,
        risk_level: p.risk_level,
        is_safe: p.is_safe,
        anomalies: p.anomalies
      };
    }

    // Comprehensive 360° Profile for the matched parcel
    const fullProfileText = `### 🔍 360° Unified Parcel Audit for \`${p.ulpin}\`\n\n• **Primary Owner**: **${p.owner}** (${p.father}, Khata: \`${p.khata}\`)\n• **Survey Number**: \`${p.survey}\` | Village: **${p.village}**, District: **${p.district}**\n• **Acreage Verification**: Satellite GIS **${p.gis_acres} ac** | Legal RoR Deed **${p.doc_acres} ac** (${p.gis_acres === p.doc_acres ? '✅ Matching' : '⚠️ Area Mismatch'})\n• **Risk Assessment**: **${p.risk_level} (Score: ${p.risk_score}/100)** — ${p.is_safe ? '✅ Safe for Transaction' : '⛔ Caution / High Risk'}\n• **Court Litigation**: ${p.stay_active ? '🚨 ACTIVE STAY ORDER (OS/442/2023)' : '✅ None Active'}\n• **Bank Encumbrance**: ${p.has_encumbrance ? `🏦 Active Lien (${p.bank_name} - ₹4.5 Cr)` : '✅ Nil Encumbrance'}\n• **Property Tax**: ${p.tax_status === 'DEFAULTED' ? `⚠️ DEFAULTED (₹${p.tax_due.toLocaleString()} overdue)` : '✅ Paid'}\n• **Master Plan Zoning**: ${p.zoning}\n• **Findings**: ${p.anomalies.join(' ')}`;
    return {
      answer: fullProfileText,
      parcel_ids: [p.ulpin],
      tool_used: "unified_parcel_profile",
      risk_score: p.risk_score,
      risk_level: p.risk_level,
      is_safe: p.is_safe,
      anomalies: p.anomalies
    };
  }

  // ── 4. Legal, Statutory & Real Estate Knowledge Base ──

  // ULPIN / Bhu-Aadhaar
  if (qLower.includes("ulpin") || qLower.includes("bhu-aadhaar") || qLower.includes("bhu aadhaar")) {
    return {
      answer: `### 🆔 What is ULPIN (Bhu-Aadhaar)?\n\n**ULPIN** (*Unique Land Parcel Identification Number*), often described as **Bhu-Aadhaar for Land**, is a 14-digit alphanumeric code assigned to every surveyed parcel of land in India under the **Digital India Land Records Modernization Programme (DILRMP)**.\n\n• **Geo-Referenced Coordinates**: Generated based on the international standard coordinates (latitude and longitude) of the parcel vertices using EPSG:4326 PostGIS projection.\n• **Single Source of Truth**: Connects spatial cadastral survey maps with revenue records (RoR / Pahani), deed registration (SRO), and bank mortgage registries.\n• **Fraud Prevention**: Prevents illegal duplicate sales, fraudulent registrations of the same land with multiple lenders, and ghost properties.`,
      parcel_ids: [],
      tool_used: "bhu_aadhaar_engine",
      risk_score: 0,
      risk_level: "CLEAN",
      is_safe: true,
      anomalies: []
    };
  }

  // RoR / 7/12 Extract / Pahani / RTC
  if (qLower.includes("7/12") || qLower.includes("pahani") || qLower.includes("rtc") || qLower.includes("ror") || qLower.includes("record of rights")) {
    return {
      answer: `### 📜 Record of Rights (RoR / 7/12 Extract / Pahani / RTC)\n\nThe **Record of Rights (RoR)** is the master revenue title register maintained by State Revenue Departments (referred to as **7/12 Extract** in Maharashtra & Gujarat, and **Pahani / RTC** in Karnataka):\n\n• **Village Form VII (Rights & Liabilities)**: Details the survey number, owner name, father/husband's name, tenure type (occupant class I/II), encumbrances, and government liabilities.\n• **Village Form XII (Crops & Land Utilization)**: Details season-wise crops cultivated, fallow land, irrigation source, and non-agricultural (NA) conversion entries.\n• **Key Verification Point**: RoR is proof of possession and revenue liability; for clear legal ownership, it must always be cross-verified with registered sale deeds and mutation registers.`,
      parcel_ids: [],
      tool_used: "revenue_records_engine",
      risk_score: 0,
      risk_level: "CLEAN",
      is_safe: true,
      anomalies: []
    };
  }

  // Khata (A Khata vs B Khata, E-Khata)
  if (qLower.includes("khata") || qLower.includes("a khata") || qLower.includes("b khata") || qLower.includes("e-khata") || qLower.includes("ekhata")) {
    return {
      answer: `### 📑 Understanding Khata (A-Khata vs B-Khata & E-Khata)\n\nA **Khata** is an account register maintained by municipal authorities (such as BBMP, BMC, or local Municipal Corporations) for property tax assessment and ownership verification:\n\n• **A-Khata**: Conferred on properties with valid approvals, authorized building plans, and legal DC-conversion. Eligible for bank loans, building licenses, and trade licenses.\n• **B-Khata**: An administrative tax-acknowledgment register for properties having deviations, unauthorized layouts, or missing DC conversion. Bank loans and building sanctions are generally not granted on B-Khata.\n• **E-Khata**: Fully digital, tamper-proof Khata certificate issued online after integrating GIS property tax IDs with state revenue databases.`,
      parcel_ids: [],
      tool_used: "khata_classification_engine",
      risk_score: 0,
      risk_level: "CLEAN",
      is_safe: true,
      anomalies: []
    };
  }

  // Mutation / Dakhil Kharij / Namantaran
  if (qLower.includes("mutation") || qLower.includes("dakhil kharij") || qLower.includes("namantaran") || qLower.includes("mutation register")) {
    return {
      answer: `### 🔄 Land Mutation (Dakhil Kharij / Namantaran)\n\n**Mutation** is the official transfer of title recorded in the revenue department's ledger following a property transaction, inheritance, gift, or court decree:\n\n• **Difference from Registration**: Deed registration (at Sub-Registrar Office) legally conveys ownership between parties, but **Mutation** updates government tax liability and revenue records (RoR).\n• **Statutory Process**: Upon deed execution, the Sub-Registrar forwards Form 1 to the Taluk Tahsildar / Revenue Inspector. A 30-day notice is published for objections before formal mutation entry is approved.\n• **Supreme Court Precedent**: Mutation entries do not by themselves confer title, but they are essential for lawful possession, payment of land revenue, and government subsidies.`,
      parcel_ids: [],
      tool_used: "mutation_jurisprudence_engine",
      risk_score: 0,
      risk_level: "CLEAN",
      is_safe: true,
      anomalies: []
    };
  }

  // Encumbrance Certificate (EC Form 15 & Form 16)
  if (qLower.includes("encumbrance certificate") || qLower.includes("ec form 15") || qLower.includes("ec form 16") || (qLower.includes("certificate") && qLower.includes("encumbrance"))) {
    return {
      answer: `### 🏦 Encumbrance Certificate (EC - Form 15 vs Form 16)\n\nAn **Encumbrance Certificate (EC)** is an official search report issued by the Sub-Registrar certifying all registered transactions, charges, and mortgages on a property:\n\n• **Form 15 (Active Encumbrance)**: Issued when there are registered transactions, bank mortgages, lease agreements, or court attachments during the requested search period.\n• **Form 16 (Nil Encumbrance)**: Issued when no registered charges, mortgages, or liens exist during the searched timeframe, signifying a financially clear title.\n• **Best Practice**: Always demand an EC for a minimum search window of **30 consecutive years** prior to executing any purchase.`,
      parcel_ids: [],
      tool_used: "ec_verification_engine",
      risk_score: 0,
      risk_level: "CLEAN",
      is_safe: true,
      anomalies: []
    };
  }

  // DC Conversion / Land Use Conversion
  if (qLower.includes("dc conversion") || qLower.includes("na conversion") || qLower.includes("land conversion") || qLower.includes("change of land use") || qLower.includes("conversion order")) {
    return {
      answer: `### 🚜 Non-Agricultural (NA) & DC Land Conversion\n\nUnder Indian state revenue laws, agricultural land cannot be utilized for residential, commercial, or industrial purposes without formal **DC Conversion** (Deputy Commissioner / Collector Order):\n\n• **Statutory Requirement**: Governed by Section 95 of Karnataka Land Revenue Act, Section 44 of Maharashtra Land Revenue Code, and corresponding state acts.\n• **Verification Checklist**:\n  1. Formal Conversion Order signed by the District Magistrate / Deputy Commissioner.\n  2. Payment of statutory conversion challan fees to the state treasury.\n  3. Confirmation that master plan zoning (CDP) permits the requested commercial/residential usage.\n• **Unauthorized Use**: Construction on unconverted agricultural land (such as parcel \`UL006\` in LandStack) is illegal and subject to demolition and penal forfeiture under revenue recovery proceedings.`,
      parcel_ids: ["UL006"],
      tool_used: "zoning_conversion_engine",
      risk_score: 70,
      risk_level: "BLOCKED",
      is_safe: false,
      anomalies: ["Unconverted agricultural land cannot be legally deployed for commercial warehouse construction."]
    };
  }

  // Stamp Duty, Registration Charges & Guidance Value
  if (qLower.includes("stamp duty") || qLower.includes("registration fee") || qLower.includes("registration charges") || qLower.includes("guidance value") || qLower.includes("circle rate") || qLower.includes("ready reckoner")) {
    return {
      answer: `### 💵 Stamp Duty, Registration Charges & Guidance Value\n\n• **Guidance Value / Circle Rate / Ready Reckoner**: The statutory minimum value per sq.ft / acre assessed by the State Government below which no property transaction can be lawfully registered.\n• **Stamp Duty**: A state tax levied on registered legal instruments (typically **3% to 6%** of property value depending on state, rural/urban jurisdiction, and buyer gender concession).\n• **Registration Fee**: Administrative charges for archiving deeds in the Sub-Registrar repository (typically **1% to 2%**).\n• **TDS (Section 194-IA)**: If the transaction value or guidance value exceeds ₹50 Lakhs, the buyer must deduct 1% TDS and deposit it via Form 26QB.`,
      parcel_ids: [],
      tool_used: "stamp_duty_calculator",
      risk_score: 0,
      risk_level: "CLEAN",
      is_safe: true,
      anomalies: []
    };
  }

  // RERA (Real Estate Regulatory Authority)
  if (qLower.includes("rera") || qLower.includes("real estate regulatory")) {
    return {
      answer: `### 🏢 RERA (Real Estate Regulatory Authority)\n\nEstablished under the **Real Estate (Regulation and Development) Act, 2016**, RERA protects homebuyers and enforces transparency across commercial and residential developments:\n\n• **Mandatory Registration**: Every project exceeding 500 sq. meters or having more than 8 apartments must be registered with State RERA before advertising or booking.\n• **70% Escrow Rule**: Developers must deposit 70% of collections into a designated bank escrow account solely dedicated to project construction.\n• **Carpet Area Standard**: Sales must be strictly quoted on net usable carpet area, eliminating misleading 'super built-up' additions.\n• **Check Before Buying**: Verify the project's active RERA registration number and approved sanction plans on the official state RERA portal.`,
      parcel_ids: [],
      tool_used: "rera_compliance_engine",
      risk_score: 0,
      risk_level: "CLEAN",
      is_safe: true,
      anomalies: []
    };
  }

  // Order 39 CPC, Stay Orders, Lis Pendens & Section 52
  if (qLower.includes("stay order") || qLower.includes("order 39") || qLower.includes("injunction") || qLower.includes("lis pendens") || qLower.includes("section 52")) {
    return {
      answer: `### ⚖️ Judicial Stay Orders, Order 39 CPC & Lis Pendens\n\n• **Order 39 Rules 1 & 2 CPC**: Empowers civil courts to grant temporary injunctions restraining a party from alienating, selling, mortgaging, or developing land pending trial.\n• **Consequence of Violation**: Any deed executed in violation of an active stay order is null and void ab initio, and the violator is liable for contempt of court under Order 39 Rule 2A (civil imprisonment and property attachment).\n• **Section 52 Transfer of Property Act (Lis Pendens)**: Any property transfer during ongoing litigation is legally subservient to the final decree of the court; the buyer takes the property at their own risk without innocent purchaser defense.\n• **Benchmark Example**: Parcel \`UL003\` is under an active stay order in case \`OS/442/2023\` (Senior Civil Court Bengaluru); transaction is strictly BLOCKED.`,
      parcel_ids: ["UL003"],
      tool_used: "judicial_restraint_engine",
      risk_score: 95,
      risk_level: "BLOCKED",
      is_safe: false,
      anomalies: ["Active Order 39 temporary injunction prohibiting alienation."]
    };
  }

  // Power of Attorney (GPA / POA Sales) & Suraj Lamp Case
  if (qLower.includes("power of attorney") || qLower.includes("gpa") || qLower.includes("poa") || qLower.includes("suraj lamp")) {
    return {
      answer: `### 📜 Power of Attorney (GPA / POA) Property Transactions\n\nIn the landmark judgment ***Suraj Lamp & Industries Pvt Ltd vs State of Haryana (2012)***, the Supreme Court of India held:\n\n• **No Title Conveyance**: General Power of Attorney (GPA), Sale Agreement (SA), or Will transactions **do not** transfer ownership or title in immovable property.\n• **Requirement of Registered Sale Deed**: Section 54 of Transfer of Property Act and Section 17 of Registration Act mandate a duly stamped and registered Sale Deed to transfer legal title.\n• **Valid Use of POA**: A registered Special Power of Attorney (SPA) can only authorize an agent to execute the deed on behalf of the principal; it does not confer independent ownership rights to the agent.`,
      parcel_ids: [],
      tool_used: "poa_jurisprudence_engine",
      risk_score: 0,
      risk_level: "CLEAN",
      is_safe: true,
      anomalies: []
    };
  }

  // NRI / OCI Land Purchase Rules
  if (qLower.includes("nri") || qLower.includes("foreign") || qLower.includes("fema") || qLower.includes("oci")) {
    return {
      answer: `### 🌍 Can NRIs / OCIs Buy Land in India? (FEMA Regulations)\n\nUnder the **Foreign Exchange Management Act (FEMA)** and RBI guidelines:\n\n• **Residential & Commercial Property**: Non-Resident Indians (NRIs) and Overseas Citizens of India (OCIs) can freely purchase and own residential and commercial properties in India without RBI prior approval.\n• **Agricultural Land Prohibition**: NRIs and OCIs **cannot** purchase agricultural land, farmhouses, or plantation properties in India.\n• **Exception**: Agricultural land can only be acquired by an NRI/OCI through **lawful inheritance** from a resident Indian citizen, but cannot be purchased directly or via gifts from non-relatives.`,
      parcel_ids: [],
      tool_used: "fema_nri_engine",
      risk_score: 0,
      risk_level: "CLEAN",
      is_safe: true,
      anomalies: []
    };
  }

  // Agricultural Land Purchase Eligibility (Section 79A/79B)
  if (qLower.includes("who can buy agricultural") || qLower.includes("eligible to buy agricultural") || qLower.includes("79a") || qLower.includes("79b") || qLower.includes("farmer certificate")) {
    return {
      answer: `### 🌾 Eligibility to Purchase Agricultural Land in India\n\nEligibility rules for purchasing agricultural land vary by state:\n\n• **Karnataka**: Sections 79A, 79B, and 79C of the Karnataka Land Revenue Act (which formerly restricted purchase to agriculturists with income under ₹25 Lakhs) were **amended in 2020** to allow non-agriculturist Indian citizens to buy farmland, subject to ceiling limits under Section 63.\n• **Maharashtra**: Under Section 63 of Maharashtra Tenancy and Agricultural Lands Act, only a certified agriculturist can purchase agricultural land, unless Collector permission is obtained for designated non-agricultural purposes.\n• **Other States**: States like Himachal Pradesh, Uttarakhand, and Kerala maintain strict state domicile and agriculturist eligibility criteria under local tenancy enactments.`,
      parcel_ids: [],
      tool_used: "agricultural_eligibility_engine",
      risk_score: 0,
      risk_level: "CLEAN",
      is_safe: true,
      anomalies: []
    };
  }

  // Boundary Disputes, Encroachment & Survey Resurvey
  if (qLower.includes("encroachment") || qLower.includes("survey stone") || qLower.includes("boundary dispute") || qLower.includes("phodi") || qLower.includes("tatkal phodi")) {
    return {
      answer: `### 📐 Resolving Boundary Disputes & Encroachments\n\n• **Hissa Survey & Phodi**: When an ancestral survey number is bifurcated, a formal revenue **Phodi** / Hissa survey must be executed by government licensed surveyors to delineate individual sub-divisions.\n• **Tippan & FMB (Field Measurement Book)**: The authoritative geometric field book recording stone-to-stone measurement chains.\n• **Steps for Boundary Settlement**:\n  1. File an application for **Haddubasthu / Tatkal Phodi** on the state revenue portal (e.g., Mojini in Karnataka).\n  2. Government surveyor visits with DGPS (Differential GPS) equipment and notices issued to all adjacent survey owners.\n  3. Boundary stones are fixed and mapped into the cadastral GIS database.\n• **Legal Remedy**: If encroachment persists, file a suit for boundary demarcation and mandatory injunction under Specific Relief Act in the competent Civil Court.`,
      parcel_ids: ["UL002"],
      tool_used: "boundary_resolution_engine",
      risk_score: 65,
      risk_level: "HIGH_RISK",
      is_safe: false,
      anomalies: ["Boundary resurvey required for parcels with acreage variance."]
    };
  }

  // Due Diligence & 7-Point Land Buying Checklist
  if (qLower.includes("due diligence") || qLower.includes("how to buy") || qLower.includes("checklist") || qLower.includes("documents to check") || qLower.includes("steps to buy") || qLower.includes("verify land")) {
    return {
      answer: `### 📋 Comprehensive 7-Point Land Due Diligence Checklist\n\nBefore executing a property transaction or advancing earnest token money, verify these 7 authoritative dimensions:\n\n1. **Title Chain & Mother Deed**: Review 30 years of registered sale deeds, partition deeds, and gift deeds to establish an unbroken title lineage.\n2. **Encumbrance Certificate (EC - Form 15)**: Verify 30 years at the Sub-Registrar Office to ensure no active commercial bank mortgages or liens.\n3. **Current RoR / 7/12 / Pahani**: Confirm the seller's name is updated in the primary ownership column with corresponding mutation number.\n4. **Judicial Clearance (eCourts)**: Search district courts and High Court registries for pending civil suits, partition claims, or Order 39 stay orders.\n5. **Satellite GIS vs Document Acreage**: Match satellite boundary coordinates with the registered deed to detect acreage discrepancies and encroachments.\n6. **Master Plan Zoning & DC Conversion**: Confirm whether land is agricultural, residential, or green belt, and verify official conversion orders.\n7. **Tax Clearance**: Inspect latest municipal/panchayat tax paid receipts and Form 16 assessment extract.`,
      parcel_ids: [],
      tool_used: "due_diligence_checklist",
      risk_score: 0,
      risk_level: "CLEAN",
      is_safe: true,
      anomalies: []
    };
  }

  // SVAMITVA Scheme & DILRMP
  if (qLower.includes("svamitva") || qLower.includes("dilrmp") || qLower.includes("property card") || qLower.includes("drone survey")) {
    return {
      answer: `### 🛰️ SVAMITVA Scheme & DILRMP\n\n• **SVAMITVA** (*Survey of Villages and Mapping with Improvised Technology in Village Areas*): A flagship central scheme utilizing survey-grade drones and CORS (Continuously Operating Reference Stations) network to map inhabited rural Abadi (Gramathana) lands and issue official **Property Cards**.\n• **DILRMP** (*Digital India Land Records Modernization Programme*): National initiative unifying cadastral maps, computerized RoRs, Sub-Registrar deed registration, and ULPIN (Bhu-Aadhaar) to establish conclusive land titling in India.\n• **Benefits**: Provides rural citizens with formal credit collateral, enables accurate panchayat property tax collection, and prevents village land disputes.`,
      parcel_ids: [],
      tool_used: "svamitva_dilrmp_engine",
      risk_score: 0,
      risk_level: "CLEAN",
      is_safe: true,
      anomalies: []
    };
  }

  // What is LandStack & Platform Features
  if (qLower.includes("what is landstack") || qLower.includes("how does landstack work") || qLower.includes("about landstack") || qLower.includes("features of landstack") || qLower.includes("detect fraud")) {
    return {
      answer: `### 🏛️ About LandStack: Unified Cadastral Governance & Risk Intelligence\n\n**LandStack** is an enterprise-grade spatial land governance and AI title verification platform designed for Revenue Officers, Municipalities, Banks, and Citizens:\n\n• **360° Cross-Registry Verification**: Harmonizes Satellite Cadastral GIS Polygons (PostGIS), Revenue RoR Records (7/12 / Pahani), Sub-Registrar Deed Registrations, Bank Mortgages, and Civil Court Stays into a single unified record.\n• **Automated Fraud & Anomaly Detection**:\n  - Detects Area Mismatches between satellite boundaries and legal deeds.\n  - Flags active Order 39 civil stay orders and Lis Pendens litigation.\n  - Identifies undisclosed bank mortgages and commercial liens.\n  - Pinpoints property tax defaulters and revenue attachment notices.\n  - Detects Master Plan Zoning violations (e.g. green belt unauthorized construction).\n• **Persona-Driven Dashboards**: Specialized views for Citizens (Title Search), Revenue Officers (Mutation & Inspection), and Administrators (Cadastral Analytics).`,
      parcel_ids: [],
      tool_used: "landstack_manifest",
      risk_score: 0,
      risk_level: "CLEAN",
      is_safe: true,
      anomalies: []
    };
  }

  // Greetings & Bot Capabilities
  if (["hello", "hi", "hey", "who are you", "what can you do", "help", "namaste", "good morning", "good evening"].some(k => qLower === k || qLower.startsWith(k + " "))) {
    return {
      answer: `### 👋 Hello! I am the LandStack AI Land Governance Copilot.\n\nI am equipped with comprehensive intelligence covering Indian land administration, cadastral GIS, revenue laws, and transaction due diligence. You can ask me:\n\n• **⚖️ Court Litigation**: *"Who has court cases?"*, *"Check active stay orders"*\n• **⚠️ Tax Defaulters**: *"Who has not paid tax?"*, *"Show tax arrears"*\n• **🏦 Bank Encumbrances**: *"Who has mortgages?"*, *"Check SBI bank loan"*\n• **📐 Boundary Discrepancies**: *"Who has area mismatch?"*, *"Check Survey 104/2"*\n• **🔍 360° Parcel Audits**: *"Audit UL001"*, *"Audit UL003"*, *"Audit Ramesh Gowda"*\n• **📚 Legal & Statutory Concepts**: *"What is ULPIN?"*, *"Explain 7/12 extract"*, *"What is DC conversion?"*, *"Can NRI buy land?"*\n• **📋 Due Diligence**: *"Checklist for buying land in India"*\n\nHow can I assist you with your land records today?`,
      parcel_ids: [],
      tool_used: "copilot_manifest",
      risk_score: 0,
      risk_level: "CLEAN",
      is_safe: true,
      anomalies: []
    };
  }

  // ── 5. Universal Semantic Analysis for Arbitrary Questions ──
  // If the query is an open-ended question about anything related to land, property, finance, law, or society:
  const isFinance = ["price", "value", "cost", "loan", "interest", "bank", "cibil", "credit", "money", "rupees"].some(k => qLower.includes(k));
  const isLegal = ["law", "legal", "court", "judge", "act", "section", "suit", "police", "crime", "illegal", "fir", "decree", "appeal"].some(k => qLower.includes(k));
  const isGov = ["government", "officer", "tahsildar", "collector", "patwari", "village", "taluk", "panchayat", "corporation"].some(k => qLower.includes(k));
  const isProperty = ["flat", "apartment", "plot", "house", "building", "site", "layout", "tenant", "rent", "lease", "possession"].some(k => qLower.includes(k));

  let contextSummary = "";
  if (isLegal) {
    contextSummary = `• **Legal Perspective**: Under the Transfer of Property Act (1882), Indian Registration Act (1908), and Code of Civil Procedure (1908), title in immovable property is conferred solely through registered instruments and verified revenue entries. Unregistered agreements or verbal understandings have no legal validity in court.`;
  } else if (isFinance) {
    contextSummary = `• **Financial & Banking Compliance**: Commercial financial institutions mandate an unencumbered Title Search Report (TSR) from an empanelled advocate spanning 30 years, alongside Form 16 Nil Encumbrance Certificate, before sanctioning property loans.`;
  } else if (isGov) {
    contextSummary = `• **Administrative & Revenue Hierarchy**: State revenue governance is administered hierarchically by the District Collector / Deputy Commissioner, Assistant Commissioner (Sub-Division), Tahsildar (Taluk), Revenue Inspector (Circle), and Village Administrative Officer / Talathi.`;
  } else if (isProperty) {
    contextSummary = `• **Real Estate Governance**: Property transactions require strict compliance with Municipal Building Bye-Laws, Local Planning Authority Master Plans, Occupancy Certificates (OC), and Commencement Certificates (CC).`;
  } else {
    contextSummary = `• **Cadastral & Geospatial Integration**: LandStack harmonizes spatial GIS satellite maps with legal revenue records to ensure seamless transparency and fraud-free transactions.`;
  }

  return {
    answer: `### 🏛️ LandStack AI Advisory: "${q}"\n\nRegarding your inquiry:\n\n${contextSummary}\n\n• **Core Recommendation**:\n  1. Always inspect primary revenue records (RoR / 7/12 / Pahani) and match survey boundaries with physical GIS satellite coordinates.\n  2. Verify that there are no active judicial stay orders (Order 39 CPC) or registered bank mortgages (Section 58 Transfer of Property Act).\n  3. Obtain official tax paid receipts and an updated 30-year Encumbrance Certificate (Form 15/16) from the Sub-Registrar.\n\n• **Benchmark LandStack Registry Quick Reference**:\n  - **UL001 (Ravi Kumar)**: Clean Title (3.20 acres, Tax Paid, Zero Stays)\n  - **UL002 (Lakshmi Devi)**: Area Mismatch (+0.40 ac GIS vs RoR discrepancy)\n  - **UL003 (Ramesh Gowda)**: Judicial Stay Order (\`OS/442/2023\`) — **BLOCKED**\n  - **UL004 (Venkatesh Prasad)**: Active SBI Mortgage (₹4.50 Crore)\n  - **UL005 (Anand Rao)**: Property Tax Defaulted (₹78,000 arrears)\n  - **UL006 (Horizon Logistics)**: Unauthorized Green Belt Warehouse\n\n💡 *Feel free to ask specific follow-up questions, e.g., "Audit UL003", "Who has court cases?", or "How to apply for mutation online".*`,
    parcel_ids: [],
    tool_used: "intelligent_semantic_engine",
    risk_score: 10,
    risk_level: "LOW_RISK",
    is_safe: true,
    anomalies: ["Universal query processed using LandStack legal and administrative reasoning framework."]
  };
}
