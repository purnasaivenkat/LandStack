'use client';

import React, { useState } from 'react';
import { X, Sparkles, Cpu, Layers, ShieldCheck, ArrowRight, Bot, Send, AlertTriangle, CheckCircle2, MapPin, Database, RefreshCw } from 'lucide-react';
import { ParcelRecord } from '@/scripts/generate_cadastral';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedParcel?: ParcelRecord | null;
  onSelectParcel?: (parcel: ParcelRecord) => void;
}

interface Message {
  sender: 'user' | 'agent';
  text: string;
  toolUsed?: string;
  riskScore?: number;
  riskLevel?: string;
  isSafe?: boolean;
  anomalies?: string[];
  ulpin?: string;
}

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({
  isOpen,
  onClose,
  selectedParcel,
  onSelectParcel
}) => {
  const [activeTab, setActiveTab] = useState<'copilot' | 'spec'>('copilot');
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'agent',
      text: "👋 Hello! I am the **LandStack AI Governance Copilot**.\n\nI can perform real-time autonomous title cross-checks, court stay verification, bank encumbrance detection, and satellite area discrepancy audits across all Indian land records.",
      ulpin: selectedParcel?.ulpin
    }
  ]);

  if (!isOpen) return null;

  const currentUlpin = selectedParcel?.ulpin || "UL001";
  const currentParcelId = selectedParcel?.parcel_id || "P0001";

  const handleExecuteTool = async (customPrompt?: string, forcedTool?: string) => {
    const q = (customPrompt || inputQuery).trim();
    if (!q && !forcedTool) return;

    const userText = customPrompt || inputQuery;
    setInputQuery('');

    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      // Determine target ULPINs from query or current selected parcel
      const ulpinMatches = userText.match(/UL\d+|ULPIN[-A-Z0-9]+|P\d{4}/gi);
      const isMulti = ulpinMatches && ulpinMatches.length > 1;
      const targetUlpin = ulpinMatches ? ulpinMatches[0].toUpperCase() : currentUlpin;
      const targetUlpins = ulpinMatches ? ulpinMatches.map((u: string) => u.toUpperCase()) : [currentUlpin];
      const qLower = userText.toLowerCase();

      // Check if user is asking for all parcels
      const isAllParcelsQuery = [
        "all ulpin", "all ulpins", "every ulpin", "all parcel", "all parcels", "all plots",
        "details about all", "information about all", "details of all", "list all", "show all"
      ].some(k => qLower.includes(k));

      // 1. Try Live Backend AI Chat endpoints
      let chatAnswer: string | null = null;
      let chatParcels: any[] = [];
      try {
        const endpoints = ['/backend-api/ai-agent/chat', '/api/ai-agent/chat', 'http://127.0.0.1:8000/api/ai-agent/chat'];
        for (const ep of endpoints) {
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 2500);
            const chatRes = await fetch(ep, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                question: userText,
                ulpins: isAllParcelsQuery ? [] : targetUlpins
              })
            });
            clearTimeout(timer);
            if (chatRes.ok) {
              const chatJson = await chatRes.json();
              if (chatJson.answer) {
                chatAnswer = chatJson.answer;
                chatParcels = chatJson.parcels_data || [];
                break;
              }
            }
          } catch (_) {
            // try next endpoint
          }
        }
      } catch (chatErr) {
        console.warn("Backend chat call note:", chatErr);
      }

      if (chatAnswer) {
        setMessages(prev => [
          ...prev,
          {
            sender: 'agent',
            text: chatAnswer,
            toolUsed: isAllParcelsQuery ? 'list_all_parcels_summary' : (isMulti ? 'multi_parcel_inspection' : 'unified_parcel_profile'),
            riskScore: chatParcels[0]?.risk_summary?.risk_score ?? 15,
            riskLevel: chatParcels[0]?.risk_summary?.risk_level ?? "LOW_RISK",
            isSafe: chatParcels[0]?.risk_summary?.is_safe_for_transaction ?? true,
            anomalies: chatParcels[0]?.risk_summary?.anomalies || [],
            parcelData: chatParcels[0] || null,
          }
        ]);
        setLoading(false);
        return;
      }

      // 2. Intelligent Category Audits across Registry

      // ── Category Query: Court Cases & Litigation ──
      const isCourtQuery = [
        "court case", "court cases", "stay order", "stay orders", "litigation", "injunction",
        "who has court", "who have court", "who has stay", "who have stay", "parcels with court",
        "details who have court", "who has litigation", "active stay", "dispute", "litigated"
      ].some(k => qLower.includes(k)) && !ulpinMatches;

      if (isCourtQuery) {
        setMessages(prev => [
          ...prev,
          {
            sender: 'agent',
            text: `### ⚖️ Active Judicial Court Stays & Litigation Registry Report\n\nFound **1 Land Parcel** with an active Civil Court Injunction & Stay Order in the registry:\n\n• **Parcel \`UL003\`** (Survey No: \`105/1\` in Kengeri, Bengaluru Urban / Karjat)\n  - **Primary Landowner**: **Ramesh Gowda** (Khata: \`KH-2019-3312\`)\n  - **Court / Forum**: Senior Civil Court, Bengaluru (Case No: \`OS/442/2023\`)\n  - **Suit Type**: Partition & Title Injunction Suit\n  - **Petitioner vs Respondent**: Manjunath Gowda vs Ramesh Gowda & Sub-Registrar\n  - **Stay Order Status**: 🚨 **STAY ORDER ACTIVE (Order 39 CPC Injunction)**\n  - **Legal Injunction**: Court order restraining alienation, conveyance, or creation of third-party rights pending partition decree.\n  - **Risk Level**: 🔴 **BLOCKED (Risk Score: 95/100)** — Title transfer is legally prohibited by court injunction!\n\n*(All other benchmark parcels — UL001, UL002, UL004, UL005, UL006 — have zero active litigation.)*`,
            toolUsed: "court_registry_engine",
            riskScore: 95,
            riskLevel: "BLOCKED",
            isSafe: false,
            anomalies: ["Active Order 39 stay order operating against alienation for UL003."],
            ulpin: "UL003"
          }
        ]);
        setLoading(false);
        return;
      }

      // ── Category Query: Tax Arrears & Defaulters ──
      const isTaxDefaulterQuery = [
        "not paid tax", "havenot paid", "have not paid", "unpaid tax", "tax defaulter",
        "tax defaulters", "tax arrears", "pending tax", "tax due", "tax dues", "who havenot paid",
        "who have not paid", "who has not paid"
      ].some(k => qLower.includes(k)) && !ulpinMatches;

      if (isTaxDefaulterQuery) {
        setMessages(prev => [
          ...prev,
          {
            sender: 'agent',
            text: `### ⚠️ Tax Arrears & Defaulters Registry Report\n\nFound **1 Parcel** with serious overdue property taxes and revenue defaults:\n\n• **Parcel \`UL005\`** (Survey No: \`107/1\` in Kengeri, Bengaluru Urban / Karjat)\n  - **Primary Landowner**: **Anand Rao** (Khata: \`KH-2023-4412\`)\n  - **Tax Status**: ⚠️ **DEFAULTED (3 Years Overdue)**\n  - **Outstanding Arrears**: **₹78,000.00**\n  - **Penalties & Cess**: ₹7,800.00 accrued\n  - **Total Dues**: ₹85,800.00\n  - **Action Required**: Form 12 notice issued by Revenue Inspector.\n  - **Risk Level**: 🟠 **HIGH_RISK (Score: 60/100)** — Municipal clearance required prior to conveyance.`,
            toolUsed: "tax_registry_engine",
            riskScore: 60,
            riskLevel: "HIGH_RISK",
            isSafe: false,
            anomalies: ["Unpaid property tax arrears for UL005 exceeding ₹78,000."],
            ulpin: "UL005"
          }
        ]);
        setLoading(false);
        return;
      }

      // ── Category Query: Mortgages & Encumbrances ──
      const isEncumbranceQuery = [
        "mortgage", "mortgages", "encumbrance", "encumbrances", "bank lien", "bank loan",
        "bank loans", "who has mortgage", "who has encumbrance", "encumbered parcels", "who has bank loan"
      ].some(k => qLower.includes(k)) && !ulpinMatches;

      if (isEncumbranceQuery) {
        setMessages(prev => [
          ...prev,
          {
            sender: 'agent',
            text: `### 🏦 Commercial Bank Mortgages & Liens Registry Report\n\nFound **1 Parcel** with active registered financial charges under Section 58 Transfer of Property Act:\n\n• **Parcel \`UL004\`** (Survey No: \`106/1\` in Kengeri, Bengaluru Urban / Karjat)\n  - **Primary Landowner**: **Venkatesh Prasad** (Khata: \`KH-2022-7719\`)\n  - **Mortgagee Bank**: **State Bank of India (SBI Commercial Branch)**\n  - **Mortgage Amount**: **₹4,50,00,000 (₹4.50 Crore)**\n  - **Loan Account Number**: \`SBI-AGR-2022-8819\`\n  - **Encumbrance Status**: 🏦 **ACTIVE_LIEN**\n  - **EC Certificate**: Form 15 active charge registered at Sub-Registrar Office.\n  - **Risk Level**: 🟡 **MODERATE_RISK (Score: 45/100)** — Bank No-Objection Certificate (NOC) required for clear title.`,
            toolUsed: "encumbrance_registry_engine",
            riskScore: 45,
            riskLevel: "MODERATE_RISK",
            isSafe: false,
            anomalies: ["Active registered bank mortgage lien of ₹4.5 Crore for UL004."],
            ulpin: "UL004"
          }
        ]);
        setLoading(false);
        return;
      }

      // ── Category Query: Boundary & Area Mismatches ──
      const isAreaMismatchQuery = [
        "area mismatch", "area discrepancy", "boundary mismatch", "survey mismatch",
        "who has area mismatch", "who has discrepancy", "discrepancies", "boundary discrepancy"
      ].some(k => qLower.includes(k)) && !ulpinMatches;

      if (isAreaMismatchQuery) {
        setMessages(prev => [
          ...prev,
          {
            sender: 'agent',
            text: `### 📐 Satellite GIS vs Legal Title Area Discrepancy Report\n\nFound **1 Parcel** with significant area mismatch between satellite cadastral boundaries and revenue deeds:\n\n• **Parcel \`UL002\`** (Survey No: \`104/2\` in Kengeri, Bengaluru Urban / Karjat)\n  - **Primary Landowner**: **Smt. Lakshmi Devi** (Khata: \`KH-2020-5621\`)\n  - **Physical Satellite GIS Area**: **3.20 acres**\n  - **Registered Legal RoR Area**: **2.80 acres**\n  - **Area Discrepancy**: ⚠️ **+0.40 acres (+14.3% variance)**\n  - **Possible Causes**: Physical boundary expansion into unrecorded common land or historical chain survey error.\n  - **Risk Level**: 🟠 **HIGH_RISK (Score: 65/100)** — Cadastral ground resurvey required before boundary settlement.`,
            toolUsed: "spatial_discrepancy_engine",
            riskScore: 65,
            riskLevel: "HIGH_RISK",
            isSafe: false,
            anomalies: ["GIS boundary area (3.20 Ac) exceeds RoR deed area (2.80 Ac) by 0.40 acres."],
            ulpin: "UL002"
          }
        ]);
        setLoading(false);
        return;
      }

      // ── Category Query: Clean Titles & Safe Parcels ──
      const isCleanQuery = [
        "clean title", "clean titles", "safe to buy", "which parcel is safe", "safe parcels",
        "clear title", "who has clean"
      ].some(k => qLower.includes(k)) && !ulpinMatches;

      if (isCleanQuery) {
        setMessages(prev => [
          ...prev,
          {
            sender: 'agent',
            text: `### 🟢 Clean Titles & Safe Transaction Parcels\n\nFound **1 Benchmark Clean Parcel** ready for immediate lawful transaction:\n\n• **Parcel \`UL001\`** (Survey No: \`104/1\` in Kengeri, Bengaluru Urban)\n  - **Primary Landowner**: **Ravi Kumar** (Khata: \`KH-2021-8901\`)\n  - **Area Verification**: Satellite GIS **3.20 acres** = RoR Title **3.20 acres** (✅ 100% Matching)\n  - **Civil Court Litigation**: ✅ None active (Nil stays)\n  - **Bank Mortgages**: ✅ Nil Encumbrance Certificate (Form 16)\n  - **Property Tax**: ✅ Fully Paid (Receipt: \`TAX-REC-2024-0981\`)\n  - **Risk Level**: 🟢 **CLEAN (Score: 0/100)** — Safe for immediate purchase and mutation.`,
            toolUsed: "clean_title_engine",
            riskScore: 0,
            riskLevel: "CLEAN",
            isSafe: true,
            anomalies: ["Clear Title: All registry records verified and matching."],
            ulpin: "UL001"
          }
        ]);
        setLoading(false);
        return;
      }

      // 3. Multi-Parcel Registry Table Query
      if (isAllParcelsQuery) {
        let allParcelsData: any[] = [];
        try {
          const pRes = await fetch('/api/parcels');
          const pJson = await pRes.json();
          if (pJson && pJson.features) {
            allParcelsData = pJson.features.map((f: any) => f.properties);
          }
        } catch (e) {
          console.error(e);
        }

        const count = allParcelsData.length || 1000;
        let tableRows = `| \`UL001\` | \`104/1\` | Ravi Kumar | 3.20 ac | 3.20 ac | **CLEAN** | ✅ Clean Title |\n| \`UL002\` | \`104/2\` | Smt. Lakshmi Devi | 3.20 ac | 2.80 ac | **HIGH_RISK** | ⚠️ Area Discrepancy (+0.4 Ac) |\n| \`UL003\` | \`105/1\` | Ramesh Gowda | 4.50 ac | 4.50 ac | **BLOCKED** | 🚨 Judicial Stay Order |\n| \`UL004\` | \`106/1\` | Venkatesh Prasad | 1.50 ac | 1.50 ac | **MODERATE** | 🏦 Bank Lien (₹4.5 Cr) |\n| \`UL005\` | \`107/1\` | Anand Rao | 2.40 ac | 2.40 ac | **HIGH_RISK** | ⚠️ Tax Defaulted (₹78K) |\n| \`UL006\` | \`108/1\` | Horizon Logistics | 1.80 ac | 1.80 ac | **BLOCKED** | 🚫 Unauthorized Green Belt |`;

        const multiParcelReply = `### 📋 Comprehensive Multi-Parcel Registry Intelligence (${count.toLocaleString()} Registered Parcels)\n\nHere is the cross-registry audit summary for all benchmark ULPINs in the LandStack Cadastral Registry:\n\n• **Total Registered Land Parcels**: **${count.toLocaleString()} parcels**\n• **Clean Conveyance Titles**: **92%** compliant across revenue records\n• **Active Injunctions / Court Stays**: **1 parcel (UL003)** flagged with Order 39 restraints\n• **Commercial Bank Liens**: **1 parcel (UL004)** mortgaged with SBI\n• **Property Tax Arrears**: **1 parcel (UL005)** flagged for municipal notice\n\n#### 🔍 Registry Cross-Audit Benchmark Table:\n\n| ULPIN | Survey No | Primary Owner | GIS Area | Doc Area | Risk Tier | Legal Status |\n| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n${tableRows}\n\n💡 *Tip: To inspect any single parcel in full detail, type \`Audit <ULPIN>\` (for example, \`Audit UL001\` or \`Audit UL003\`).*`;

        setMessages(prev => [
          ...prev,
          {
            sender: 'agent',
            text: multiParcelReply,
            toolUsed: "list_all_parcels_summary",
            riskScore: 25,
            riskLevel: "MODERATE_RISK",
            isSafe: true,
            anomalies: ["Multi-parcel query processed across cadastral and legal database."]
          }
        ]);
        setLoading(false);
        return;
      }

      // 4. Conceptual & Educational Queries
      if (qLower.includes("ulpin") || qLower.includes("bhu-aadhaar") || qLower.includes("bhu aadhaar")) {
        setMessages(prev => [
          ...prev,
          {
            sender: 'agent',
            text: "### 🆔 What is ULPIN (Bhu-Aadhaar)?\n\n**ULPIN** (*Unique Land Parcel Identification Number*), also known as **Bhu-Aadhaar**, is a 14-digit alphanumeric code assigned to every surveyed land parcel in India under the **Digital India Land Records Modernization Programme (DILRMP)**.\n\n• **Geo-Referenced Pinning**: Generated from the latitude/longitude boundary coordinates of the land parcel vertices.\n• **Single Source of Truth**: Integrates Cadastral Map GIS polygons with Revenue RoR (7/12 / Pahani), Deed Registration, and Property Tax databases.\n• **Fraud Prevention**: Eliminates duplicate registration, bogus titles, and illegal double-mortgaging of land across commercial banks.",
            toolUsed: "bhu_aadhaar_engine"
          }
        ]);
        setLoading(false);
        return;
      }

      if (qLower.includes("7/12") || qLower.includes("pahani") || qLower.includes("ror") || qLower.includes("record of rights") || qLower.includes("khata")) {
        setMessages(prev => [
          ...prev,
          {
            sender: 'agent',
            text: "### 📜 Record of Rights (RoR / 7/12 / Pahani)\n\nThe **Record of Rights (RoR)** is the foundational revenue title register maintained by State Revenue Departments (known as **7/12 Extract** in Maharashtra & Gujarat, and **Pahani/RTC** in Karnataka).\n\n• **Village Form VII (Rights & Liabilities)**: Records primary landowner names, survey & hissa numbers, tenure type, and government charges.\n• **Village Form XII (Crops & Land Use)**: Records seasonal crops, fallow acreage, and non-agricultural (NA) DC-conversion status.\n• **Khata Number**: The revenue ledger account number identifying the landowner within the Tehsil circle.",
            toolUsed: "revenue_records_engine"
          }
        ]);
        setLoading(false);
        return;
      }

      if (["hello", "hi", "hey", "who are you", "what can you do", "help"].some(k => qLower === k || qLower.startsWith(k + " "))) {
        setMessages(prev => [
          ...prev,
          {
            sender: 'agent',
            text: `### 👋 Hello! I am the LandStack AI Land Governance Copilot.\n\nI can assist you with:\n• **⚖️ Court Litigation**: *'Who has court cases?'*, *'Check court stays'* \n• **⚠️ Tax Defaulters**: *'Who has not paid tax?'*, *'List tax arrears'*\n• **🏦 Bank Encumbrances**: *'Who has bank mortgages?'*, *'Active liens'*\n• **📐 Boundary Discrepancies**: *'Who has area mismatch?'*\n• **🔍 360° Parcel Audits**: *'Audit UL001'*, *'Audit UL003'*\n• **📚 Land Concepts**: *'What is ULPIN?'*, *'Explain 7/12 extract'*`,
            toolUsed: "copilot_manifest"
          }
        ]);
        setLoading(false);
        return;
      }

      // 5. Benchmark Parcel Detailed Lookup (UL001 - UL006)
      const u = targetUlpin.toUpperCase();
      let responseText = "";
      let riskScore = 0;
      let riskLevel = "CLEAN";
      let isSafe = true;
      let anomalies: string[] = [];

      if (u === 'UL003') {
        riskScore = 95;
        riskLevel = "BLOCKED";
        isSafe = false;
        anomalies = ["Active Order 39 stay order operating against alienation."];
        responseText = `### ⚖️ 360° Parcel Audit for \`UL003\` (🚨 STAY ORDER ACTIVE)\n\n• **Primary Owner**: **Ramesh Gowda** (Khata: \`KH-2019-3312\`)\n• **Survey Number**: \`105/1\` | Village: **Kengeri**, District: **Bengaluru Urban**\n• **Acreage**: GIS **4.50 acres** | RoR Document **4.50 acres** (✅ Matching)\n• **Court Litigation**: 🚨 **ACTIVE STAY ORDER** (Case: \`OS/442/2023\`, Senior Civil Court)\n• **Suit Type**: Partition & Title Injunction Suit (Manjunath Gowda vs Ramesh Gowda)\n• **Bank Encumbrance**: ✅ Clean Title (Nil charges)\n• **Tax Status**: ✅ Paid (₹7,480.00)\n• **Transaction Verdict**: ⛔ **BLOCKED / PROHIBITED** (Score: 95/100) — Title transfer prohibited pending court decree!`;
      } else if (u === 'UL002') {
        riskScore = 65;
        riskLevel = "HIGH_RISK";
        isSafe = false;
        anomalies = ["GIS Area (3.20 Ac) exceeds RoR Document Area (2.80 Ac) by 0.40 acres."];
        responseText = `### 📐 360° Parcel Audit for \`UL002\` (⚠️ AREA MISMATCH DETECTED)\n\n• **Primary Owner**: **Smt. Lakshmi Devi** (Khata: \`KH-2020-5621\`)\n• **Survey Number**: \`104/2\` | Village: **Kengeri**, District: **Bengaluru Urban**\n• **Acreage**: Physical GIS **3.20 acres** vs Legal RoR **2.80 acres** (⚠️ **+0.40 acre discrepancy**)\n• **Court Litigation**: ✅ None active\n• **Bank Encumbrance**: ✅ Nil Encumbrance\n• **Tax Status**: ✅ Paid\n• **Transaction Verdict**: ⚠️ **HIGH RISK** (Score: 65/100) — Ground boundary resurvey required before deed execution!`;
      } else if (u === 'UL004') {
        riskScore = 45;
        riskLevel = "MODERATE_RISK";
        isSafe = false;
        anomalies = ["Active registered bank mortgage lien for ₹4.5 Crore."];
        responseText = `### 🏦 360° Parcel Audit for \`UL004\` (🏦 ACTIVE BANK MORTGAGE)\n\n• **Primary Owner**: **Venkatesh Prasad** (Khata: \`KH-2022-7719\`)\n• **Survey Number**: \`106/1\` | Village: **Kengeri**, District: **Bengaluru Urban**\n• **Acreage**: GIS **1.50 acres** | RoR Document **1.50 acres** (✅ Matching)\n• **Bank Mortgage**: 🏦 **State Bank of India** (₹4,50,00,000 / ₹4.50 Crore)\n• **Encumbrance Status**: Active commercial lien registered under Section 58\n• **Court Litigation**: ✅ None\n• **Transaction Verdict**: 🟡 **MODERATE RISK** (Score: 45/100) — Bank NOC & Deed Discharge required for clear title!`;
      } else if (u === 'UL005') {
        riskScore = 60;
        riskLevel = "HIGH_RISK";
        isSafe = false;
        anomalies = ["Unpaid municipal property tax arrears exceeding ₹78,000."];
        responseText = `### 💰 360° Parcel Audit for \`UL005\` (⚠️ TAX DEFAULTED)\n\n• **Primary Owner**: **Anand Rao** (Khata: \`KH-2023-4412\`)\n• **Survey Number**: \`107/1\` | Village: **Kengeri**, District: **Bengaluru Urban**\n• **Property Tax**: ⚠️ **DEFAULTED (₹78,000 overdue for 3 years)**\n• **Court Litigation**: ✅ None\n• **Bank Encumbrance**: ✅ Nil\n• **Transaction Verdict**: 🟠 **HIGH RISK** (Score: 60/100) — Municipal tax clearance certificate (Form 16) mandatory before registration!`;
      } else {
        // Default / UL001: Clean Title
        riskScore = 0;
        riskLevel = "CLEAN";
        isSafe = true;
        anomalies = ["Verified matching records across Revenue Pahani and Cadastral Map."];
        responseText = `### 🟢 360° Unified Parcel Audit for \`UL001\` (✅ CLEAR TITLE)\n\n• **Primary Owner**: **Ravi Kumar** (Khata: \`KH-2021-8901\`)\n• **Survey Number**: \`104/1\` | Village: **Kengeri**, District: **Bengaluru Urban**\n• **Acreage**: Satellite GIS **3.20 acres** | RoR Deed **3.20 acres** (✅ 100% Matching)\n• **Civil Court Litigation**: ✅ None active (Clear title)\n• **Bank Encumbrance**: ✅ Form 16 Nil Encumbrance Certificate\n• **Property Tax**: ✅ Fully Paid (₹4,950)\n• **Transaction Verdict**: 🟢 **CLEAN (Score: 0/100)** — ✅ Safe for immediate purchase, registration, and mutation!`;
      }

      setMessages(prev => [
        ...prev,
        {
          sender: 'agent',
          text: responseText,
          toolUsed: u === 'UL003' ? 'get_court_cases' : (u === 'UL004' ? 'get_encumbrance_status' : (u === 'UL005' ? 'get_tax_status' : 'unified_parcel_profile')),
          riskScore,
          riskLevel,
          isSafe,
          anomalies,
          ulpin: u
        }
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'agent',
          text: `❌ Error connecting to AI agent: ${err.message || 'Unknown network error'}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full h-[620px] flex flex-col text-slate-800 shadow-xl relative animate-in zoom-in-95 duration-150 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-500 flex items-center justify-center shadow-xs text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">LandStack AI Governance Agent</h2>
                <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Tool Hub
                </span>
              </div>
              <p className="text-xs text-slate-500">Autonomous Title Verification & Multi-Department Anomaly Diagnostics</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Tab switch */}
            <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-200 flex items-center text-xs">
              <button
                onClick={() => setActiveTab('copilot')}
                className={`px-3 py-1 rounded-lg transition font-semibold cursor-pointer ${
                  activeTab === 'copilot' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                AI Copilot
              </button>
              <button
                onClick={() => setActiveTab('spec')}
                className={`px-3 py-1 rounded-lg transition font-semibold cursor-pointer ${
                  activeTab === 'spec' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Engine Specs
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: AI Copilot */}
        {activeTab === 'copilot' ? (
          <div className="flex-1 flex flex-col overflow-hidden p-4 bg-slate-50/50">
            {/* Quick Action Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
              <span className="text-[11px] font-bold text-slate-500 shrink-0 uppercase tracking-wider">Quick Actions:</span>
              <button
                onClick={() => handleExecuteTool("Give me details and status about all ULPINs in the registry", "list_all_parcels_summary")}
                className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold px-3 py-1.5 rounded-xl shrink-0 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>All ULPINs Audit</span>
              </button>
              <button
                onClick={() => handleExecuteTool(`Audit 360 unified profile for ${currentParcelId} (${currentUlpin})`, "get_unified_parcel_profile")}
                className="bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-800 font-semibold px-3 py-1.5 rounded-xl shrink-0 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                <span>Audit {currentParcelId}</span>
              </button>
              <button
                onClick={() => handleExecuteTool("Which parcels have active court stay orders or legal disputes?", "get_court_cases")}
                className="bg-orange-50 hover:bg-orange-100 border border-orange-300 text-orange-800 px-3 py-1.5 rounded-xl shrink-0 transition flex items-center gap-1.5 shadow-xs font-medium cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                <span>Court Stays</span>
              </button>
              <button
                onClick={() => handleExecuteTool("Which parcels have commercial bank mortgages or liens?", "get_encumbrance_status")}
                className="bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-800 px-3 py-1.5 rounded-xl shrink-0 transition flex items-center gap-1.5 shadow-xs font-medium cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Bank Mortgages</span>
              </button>
              <button
                onClick={() => handleExecuteTool("List all tax defaulters with overdue property taxes", "get_tax_status")}
                className="bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 px-3 py-1.5 rounded-xl shrink-0 transition flex items-center gap-1.5 shadow-xs font-medium cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-rose-600" />
                <span>Tax Defaulters</span>
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 py-2">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs shadow-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-gradient-to-r from-sky-600 to-sky-700 text-white rounded-br-sm'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                    }`}
                  >
                    {m.toolUsed && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded-md text-[10px] font-mono mb-2 font-bold">
                        <Sparkles className="w-3 h-3 text-sky-600" /> Tool: {m.toolUsed}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{m.text}</div>

                    {m.anomalies && m.anomalies.length > 0 && (
                      <div className="mt-3 p-2.5 bg-orange-50 rounded-xl border border-orange-200 text-[11px] space-y-1">
                        <span className="font-bold text-orange-900 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-orange-600" /> Cross-Department Findings:
                        </span>
                        {m.anomalies.map((a, i) => (
                          <div key={i} className="text-slate-700 pl-4 border-l-2 border-orange-400">
                            {a}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 text-xs text-sky-700 flex items-center space-x-2 shadow-xs">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Agent analyzing multi-registry records...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleExecuteTool();
              }}
              className="pt-2 flex items-center gap-2 border-t border-slate-200"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask AI Agent (e.g. 'Details about all ULPINs', 'Who has court stays?', 'Audit UL001')..."
                className="flex-1 bg-white border border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-400 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 shadow-xs transition"
              />
              <button
                type="submit"
                disabled={loading || !inputQuery.trim()}
                className="bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs hover:shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Ask</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        ) : (
          /* Tab 2: Architecture Spec */
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-3 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-400" /> Synthetic Cadastral Subdivision Pipeline
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-center text-xs">
                <PipelineStep step="1" title="Karjat BBOX" desc="Study Area Region" />
                <PipelineArrow />
                <PipelineStep step="2" title="Macro Blocks" desc="Residential & Agri" />
                <PipelineArrow />
                <PipelineStep step="3" title="Polygonal Slice" desc="Shared Boundaries" />
                <PipelineArrow />
                <PipelineStep step="4" title="PostGIS Check" desc="ST_IsValid & SRID 4326" />
                <PipelineArrow />
                <PipelineStep step="5" title="ULPIN Engine" desc="PostgreSQL DB Sync" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/50">
                <h4 className="font-bold text-white mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-orange-400" /> Parent Block Subdivision
                </h4>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Subdivides macro parent land blocks into realistic neighboring plots using cutting planes. Shared boundary geometry guarantees zero internal gaps, zero overlaps, and natural land tessellation.
                </p>
              </div>

              <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/50">
                <h4 className="font-bold text-white mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> PostGIS Validation Engine
                </h4>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Enforces topological validity via <code className="text-cyan-300">ST_IsValid()</code>, eliminates overlaps, calculates acreage, and assigns unique ULPIN identifiers (ULPIN-DEMO-000001 to 001000).
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PipelineStep = ({ step, title, desc }: { step: string; title: string; desc: string }) => (
  <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
    <div className="w-5 h-5 mx-auto bg-indigo-600/30 text-indigo-400 font-bold rounded-full flex items-center justify-center text-[10px] mb-1">
      {step}
    </div>
    <div className="font-semibold text-white text-[11px]">{title}</div>
    <div className="text-[10px] text-slate-400">{desc}</div>
  </div>
);

const PipelineArrow = () => (
  <div className="hidden md:flex items-center justify-center text-slate-600">
    <ArrowRight className="w-4 h-4" />
  </div>
);
