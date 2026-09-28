'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Scale,
  Building2,
  DollarSign,
  Compass,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Zap,
  ArrowRight
} from 'lucide-react';
import { fetchAreaAnalysis, AreaAnalysisResponse } from '@/lib/api';

interface AnalyticsViewProps {
  onOpenProfile: (ulpin: string) => void;
  onNavigateToMap: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  onOpenProfile,
  onNavigateToMap
}) => {
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AreaAnalysisResponse | null>(null);

  const runLiveAreaAnalysis = async () => {
    setLoading(true);
    const ulpins = ['UL001', 'UL002', 'UL003', 'UL004', 'UL005', 'UL006', 'ULPIN-DEMO-000001'];
    const res = await fetchAreaAnalysis(ulpins);
    if (res) {
      setAnalysisResult(res);
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-6 text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#0073BB] border border-blue-200">
              CROSS-DEPARTMENT INTELLIGENCE
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-[#0F2A4A] mt-1">
            Cadastral Risk & Discrepancy Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Macro-level anomaly detection across physical GIS geometries and statutory revenue registers
          </p>
        </div>

        <button
          onClick={runLiveAreaAnalysis}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-[#0F2A4A] hover:bg-[#0A1E35] text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Zap className="w-4 h-4 text-amber-300 animate-pulse" />
          )}
          <span>Run Live Backend Area Analysis</span>
        </button>
      </div>

      {/* Top 3 Analytical Highlights in Figma White Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Overall Cadastral Health</span>
            <ShieldCheck className="w-4 h-4 text-[#2DA757]" />
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">84.2</span>
            <span className="text-xs text-slate-500">/ 100</span>
          </div>
          <p className="text-xs text-emerald-700 font-medium">
            &uarr; 3.2% Title integrity improvement this quarter
          </p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Net Area Discrepancy Extent</span>
            <Compass className="w-4 h-4 text-[#0073BB]" />
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">+14.8</span>
            <span className="text-xs text-slate-500">Acres (GIS &gt; Deed)</span>
          </div>
          <p className="text-xs text-amber-700 font-medium">
            32 Encroachment or unrecorded excess acreage flags
          </p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Total Encumbered Valuation</span>
            <Building2 className="w-4 h-4 text-[#EE8C00]" />
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">₹42.8</span>
            <span className="text-xs text-slate-500">Crore</span>
          </div>
          <p className="text-xs text-slate-500">
            201 active bank liens synchronized via CERSAI
          </p>
        </div>
      </div>

      {/* Live Area Analysis Result Box */}
      {analysisResult && (
        <div className="p-5 bg-white border border-blue-200 rounded-2xl space-y-4 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-[#0F2A4A]">
                Live Backend `/api/area-analysis/by-ulpins` Batch Result
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-[#0073BB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {analysisResult.summary.total_parcels} Benchmark Parcels Audited
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Total GIS Area</span>
              <span className="text-base font-bold text-emerald-700 font-mono">
                {analysisResult.summary.total_gis_area_acres} Acres
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Total Document Area</span>
              <span className="text-base font-bold text-slate-900 font-mono">
                {analysisResult.summary.total_document_area_acres} Acres
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Net Discrepancy</span>
              <span className="text-base font-bold text-amber-700 font-mono">
                {analysisResult.summary.net_area_discrepancy_acres} Acres
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Health Score</span>
              <span className="text-base font-bold text-[#0073BB] font-mono">
                {analysisResult.summary.overall_health_score} / 100
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Audited Benchmark Parcels:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {analysisResult.parcels.map((p) => (
                <div
                  key={p.ulpin}
                  onClick={() => onOpenProfile(p.ulpin)}
                  className="p-2.5 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 rounded-xl cursor-pointer transition flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-bold text-[#0073BB] text-xs">{p.ulpin}</span>
                    <span className="text-[11px] text-slate-700 block truncate font-medium">
                      Sy #{p.parcel.survey_number} • {p.parcel.village}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      p.risk_summary.risk_level === 'CLEAN'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {p.risk_summary.risk_level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cross-Department Risk Distribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Judicial Injunctions & Litigations */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[#D9534F]" />
              Judicial Injunctions & Section 52 Lis Pendens
            </h3>
            <span className="text-xs font-mono font-bold text-[#D9534F] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              35 Active Stays
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Parcels flagged with active judicial injunctions are automatically frozen across the Sub-Registrar Office (SRO) mutation pipeline to prevent fraudulent alienation.
          </p>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-700 font-medium">District Civil Courts (Title Disputes)</span>
              <strong className="text-slate-900 font-mono">22 Cases</strong>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-700 font-medium">High Court Writ Petitions (Land Acquisition)</span>
              <strong className="text-slate-900 font-mono">9 Cases</strong>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-700 font-medium">Revenue Appellate Tribunal Injunctions</span>
              <strong className="text-slate-900 font-mono">4 Cases</strong>
            </div>
          </div>
        </div>

        {/* Master Plan Zoning & Municipal Compliance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#0073BB]" />
              Master Plan Zoning Distribution
            </h3>
            <span className="text-xs font-mono font-bold text-[#0073BB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              1,012 Total Plots
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Automated spatial intersection against the Regional Master Plan detects unauthorized non-agricultural land use conversions before building sanctions are issued.
          </p>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="flex items-center gap-2 font-medium text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2DA757]" />
                Agricultural / Wet Crop Land
              </span>
              <strong className="text-slate-900 font-mono">680 Plots (67.2%)</strong>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="flex items-center gap-2 font-medium text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0073BB]" />
                Residential Zone (R1 / R2)
              </span>
              <strong className="text-slate-900 font-mono">210 Plots (20.8%)</strong>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="flex items-center gap-2 font-medium text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                Commercial / Mixed Use
              </span>
              <strong className="text-slate-900 font-mono">82 Plots (8.1%)</strong>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="flex items-center gap-2 font-medium text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EE8C00]" />
                Green Belt / Eco-Sensitive Zone
              </span>
              <strong className="text-slate-900 font-mono">40 Plots (3.9%)</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
