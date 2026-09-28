'use client';

import React, { useState } from 'react';
import { X, Sparkles, Cpu, Layers, ShieldCheck, ArrowRight, Bot, Send, AlertTriangle, CheckCircle2, MapPin, Database, RefreshCw } from 'lucide-react';
import { ParcelRecord } from '@/scripts/generate_cadastral';
import { queryLandStackCopilot, REGISTRY_PARCELS } from '@/lib/agent-knowledge';

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

      // 1. Try Live Next.js / Backend AI Chat endpoints
      let chatAnswer: string | null = null;
      let chatTool: string = isAllParcelsQuery ? 'list_all_parcels_summary' : (isMulti ? 'multi_parcel_inspection' : 'unified_parcel_profile');
      let chatRiskScore: number = 10;
      let chatRiskLevel: string = "CLEAN";
      let chatIsSafe: boolean = true;
      let chatAnomalies: string[] = [];
      let chatParcelData: any = null;

      try {
        const endpoints = ['/api/ai-agent/chat', '/backend-api/ai-agent/chat', 'http://127.0.0.1:8000/api/ai-agent/chat'];
        for (const ep of endpoints) {
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 3000);
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
                chatTool = chatJson.tool_used || chatTool;
                chatRiskScore = chatJson.risk_score ?? (chatJson.parcels_data?.[0]?.risk_summary?.risk_score ?? 15);
                chatRiskLevel = chatJson.risk_level ?? (chatJson.parcels_data?.[0]?.risk_summary?.risk_level ?? "LOW_RISK");
                chatIsSafe = chatJson.is_safe ?? (chatJson.parcels_data?.[0]?.risk_summary?.is_safe_for_transaction ?? true);
                chatAnomalies = chatJson.anomalies || (chatJson.parcels_data?.[0]?.risk_summary?.anomalies || []);
                chatParcelData = chatJson.parcels_data?.[0] || null;
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
            text: chatAnswer!,
            toolUsed: chatTool,
            riskScore: chatRiskScore,
            riskLevel: chatRiskLevel,
            isSafe: chatIsSafe,
            anomalies: chatAnomalies,
            parcelData: chatParcelData
          }
        ]);
        setLoading(false);
        return;
      }

      // 2. Client-side Knowledge & Jurisprudence Fallback (Zero network / offline fail-safe)
      const offlineResult = queryLandStackCopilot(userText, currentUlpin);
      setMessages(prev => [
        ...prev,
        {
          sender: 'agent',
          text: offlineResult.answer,
          toolUsed: offlineResult.tool_used,
          riskScore: offlineResult.risk_score,
          riskLevel: offlineResult.risk_level,
          isSafe: offlineResult.is_safe,
          anomalies: offlineResult.anomalies,
          ulpin: offlineResult.parcel_ids[0] || currentUlpin
        }
      ]);
      setLoading(false);
      return;
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
