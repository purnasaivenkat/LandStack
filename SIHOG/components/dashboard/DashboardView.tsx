'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Building2,
  DollarSign,
  Scale,
  MapPin,
  Sparkles,
  ArrowRight,
  Search,
  ExternalLink,
  Layers,
  CheckCircle2,
  FileText
} from 'lucide-react';

interface DashboardViewProps {
  onOpenProfile: (ulpin: string) => void;
  onNavigateToMap: () => void;
  onNavigateToRegistry: () => void;
  onOpenAICopilot: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenProfile,
  onNavigateToMap,
  onNavigateToRegistry,
  onOpenAICopilot
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const demoParcels = [
    {
      ulpin: 'UL001',
      surveyNo: '104/1',
      title: 'Clean Agricultural Land',
      village: 'Kengeri',
      risk: 'CLEAN',
      tag: '0 Anomalies • Verified Title',
      riskColor: 'emerald'
    },
    {
      ulpin: 'UL002',
      surveyNo: '104/2',
      title: 'GIS vs Deed Discrepancy',
      village: 'Kengeri',
      risk: 'MODERATE_RISK',
      tag: 'GIS 3.20 ac vs Deed 2.80 ac (+0.4 ac)',
      riskColor: 'amber'
    },
    {
      ulpin: 'UL003',
      surveyNo: '105',
      title: 'Active Court Stay Order',
      village: 'Kengeri',
      risk: 'BLOCKED',
      tag: 'Judicial Injunction • Transfers Frozen',
      riskColor: 'rose'
    },
    {
      ulpin: 'UL004',
      surveyNo: '106/1',
      title: 'Active Bank Mortgage Lien',
      village: 'Kengeri',
      risk: 'MODERATE_RISK',
      tag: 'SBI ₹4.5 Crore Lien Registered',
      riskColor: 'amber'
    },
    {
      ulpin: 'UL005',
      surveyNo: '107',
      title: 'Municipal Tax Defaulter',
      village: 'Kengeri',
      risk: 'MODERATE_RISK',
      tag: '3 Years Overdue: ₹78,000 Dues',
      riskColor: 'amber'
    },
    {
      ulpin: 'UL006',
      surveyNo: '108',
      title: 'Zoning Conflict (Green Belt)',
      village: 'Kengeri',
      risk: 'HIGH_RISK',
      tag: 'Unauthorized Commercial Construction',
      riskColor: 'rose'
    },
    {
      ulpin: 'ULPIN-DEMO-000001',
      surveyNo: '10/1',
      title: 'Karjat Cadastral Subdivision',
      village: 'Dahivali',
      risk: 'CLEAN',
      tag: '5.62 Acres • Clear RoR Record',
      riskColor: 'emerald'
    }
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onOpenProfile(searchQuery.trim().toUpperCase());
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-6 text-slate-800">
      {/* Top Banner / Welcome matching Figma */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
              SMART INDIA HACKATHON 2026 | PS 26014
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-1 tracking-tight">
            Cadastral Land Governance & Anomaly Intelligence
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Real-time cross-department synchronization uniting Revenue RoR (7/12), Sub-Registrar Deeds, Judiciary Court Stays, Bank Mortgages, and PostGIS Cadastral Boundaries.
          </p>
        </div>

        {/* Quick ULPIN Search Form */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ULPIN (e.g. UL001, UL003)..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition shrink-0 cursor-pointer"
          >
            Verify
          </button>
        </form>
      </div>

      {/* 4 Macro KPI Cards matching Figma */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Registered Parcels"
          value="1,012"
          sub="Indexed with Unique ULPIN"
          change="+12 Synced Today"
          icon={Layers}
          accent="blue"
          onClick={onNavigateToRegistry}
        />
        <KPICard
          title="Active Court Stays / Injunctions"
          value="35"
          sub="Frozen Legal Transactions"
          change="3 Pending Judgments"
          icon={Scale}
          accent="rose"
          onClick={onNavigateToRegistry}
        />
        <KPICard
          title="Active Bank Mortgages"
          value="201"
          sub="₹42.8 Cr Total Banking Lien"
          change="100% CERSAI Matched"
          icon={Building2}
          accent="amber"
          onClick={onNavigateToRegistry}
        />
        <KPICard
          title="Property Tax Defaulters"
          value="101"
          sub="₹14.2 L Total Arrears Due"
          change="Overdue > 12 Months"
          icon={DollarSign}
          accent="green"
          onClick={onNavigateToRegistry}
        />
      </div>

      {/* Middle Section: Risk Distribution & Quick AI Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Risk Breakdown & Cadastral Health */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Cadastral Risk Classification & Title Health
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated multi-department cross-check across all 1,012 active parcels
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#0F2A4A] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              Health Score: 84 / 100
            </span>
          </div>

          {/* Segmented Progress Bar in Figma colors */}
          <div className="space-y-2">
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-[#2DA757]" style={{ width: '70.4%' }} title="Clean (70.4%)" />
              <div className="h-full bg-[#0073BB]" style={{ width: '16.0%' }} title="Low Risk (16.0%)" />
              <div className="h-full bg-[#EE8C00]" style={{ width: '10.1%' }} title="Moderate Risk (10.1%)" />
              <div className="h-full bg-[#D9534F]" style={{ width: '3.5%' }} title="High Risk / Blocked (3.5%)" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2DA757] shrink-0" />
                <span className="text-slate-600">Clean Title: <strong className="text-slate-900">712</strong> (70.4%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0073BB] shrink-0" />
                <span className="text-slate-600">Low Risk: <strong className="text-slate-900">162</strong> (16.0%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EE8C00] shrink-0" />
                <span className="text-slate-600">Moderate: <strong className="text-slate-900">102</strong> (10.1%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D9534F] shrink-0" />
                <span className="text-slate-600">Blocked: <strong className="text-slate-900">36</strong> (3.5%)</span>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={onNavigateToMap}
              className="p-3.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-200 rounded-xl flex items-center justify-between text-left transition group"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-[#0073BB] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0073BB]" />
                  Cadastral GIS Map
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Interactive satellite overlay
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0073BB] group-hover:translate-x-0.5 transition" />
            </button>

            <button
              onClick={onNavigateToRegistry}
              className="p-3.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-200 rounded-xl flex items-center justify-between text-left transition group"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-[#0F2A4A] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#0F2A4A]" />
                  Parcel Registry Table
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Filter by risk & village
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F2A4A] group-hover:translate-x-0.5 transition" />
            </button>

            <button
              onClick={onOpenAICopilot}
              className="p-3.5 bg-blue-50/60 hover:bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-left transition group"
            >
              <div>
                <span className="text-xs font-bold text-[#0F2A4A] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#0073BB]" />
                  AI Legal Auditor
                </span>
                <span className="text-[11px] text-slate-600 block mt-0.5">
                  Natural language audit
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#0073BB] group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>

        {/* Right 1 Col: AI Governance Insights */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-xs">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0073BB] uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#0073BB]" />
              AI Agent Governance Engine
            </div>
            <h4 className="text-sm font-bold text-slate-900 mt-1">
              Autonomous Land Audit Assistant
            </h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Equipped with deep knowledge of Indian land governance terminology: ULPIN standard, 7/12 RoR records, Mutation Registries, Encumbrance Certificates (EC), Court Stays, and Section 52 Transfer of Property Act.
            </p>
          </div>

          <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px]">
            <div className="flex items-center justify-between text-slate-600">
              <span>Domain Knowledge Rules:</span>
              <strong className="text-emerald-700 font-mono">100% Loaded</strong>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>PostGIS Spatial Intersects:</span>
              <strong className="text-blue-700 font-mono">Enabled</strong>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Cross-Dept Verification:</span>
              <strong className="text-slate-900 font-mono">9 Registers</strong>
            </div>
          </div>

          <button
            onClick={onOpenAICopilot}
            className="w-full py-2.5 px-4 bg-[#0F2A4A] hover:bg-[#0A1E35] text-white font-semibold text-xs rounded-xl shadow-xs transition active:scale-98"
          >
            Launch AI Governance Audit
          </button>
        </div>
      </div>

      {/* Featured Cadastral Scenarios (Demo ULPINs) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Benchmark Cadastral Audit Scenarios
            </h3>
            <p className="text-xs text-slate-500">
              Click any benchmark plot to inspect its live 360° multi-department dossier
            </p>
          </div>
          <span className="text-xs text-[#0073BB] font-semibold">
            {demoParcels.length} Flagship Cases
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {demoParcels.map((item) => (
            <div
              key={item.ulpin}
              onClick={() => onOpenProfile(item.ulpin)}
              className="p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl cursor-pointer transition shadow-xs hover:shadow-sm group space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#0073BB]">
                  {item.ulpin}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    item.riskColor === 'emerald'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : item.riskColor === 'amber'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {item.risk}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#0073BB]">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Survey #{item.surveyNo} • {item.village}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate pr-2">{item.tag}</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0073BB] shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const KPICard: React.FC<{
  title: string;
  value: string;
  sub: string;
  change: string;
  icon: any;
  accent: 'blue' | 'rose' | 'amber' | 'green';
  onClick?: () => void;
}> = ({ title, value, sub, change, icon: Icon, accent, onClick }) => {
  const accentClasses = {
    blue: 'bg-blue-50 text-[#0073BB] border-blue-200',
    rose: 'bg-rose-50 text-[#D9534F] border-rose-200',
    amber: 'bg-amber-50 text-[#EE8C00] border-amber-200',
    green: 'bg-emerald-50 text-[#2DA757] border-emerald-200'
  };

  return (
    <div
      onClick={onClick}
      className="p-5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl cursor-pointer transition shadow-xs hover:shadow-sm space-y-3 group"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">{title}</span>
        <div className={`p-2 rounded-xl border ${accentClasses[accent]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div>
        <div className="text-2xl font-black text-slate-900 group-hover:text-[#0073BB] transition">
          {value}
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
        <span className="text-emerald-700 font-semibold">{change}</span>
        <span className="text-slate-400 group-hover:text-slate-700 font-medium">Inspect &rarr;</span>
      </div>
    </div>
  );
};
