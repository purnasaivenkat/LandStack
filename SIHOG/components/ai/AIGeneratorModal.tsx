'use client';

import React from 'react';
import { X, Sparkles, Cpu, Layers, ShieldCheck, ArrowRight } from 'lucide-react';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 text-white shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Cadastral Parcel Engine Architecture</h2>
            <p className="text-xs text-slate-400">SIH 2026 PS 26014 | Parent Block Subdivision Pipeline</p>
          </div>
        </div>

        {/* Workflow Diagram */}
        <div className="my-6 p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
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

        {/* Technical Architecture Specs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-6">
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
              Enforces topological validity via <code className="text-cyan-300">ST_IsValid()</code>, eliminates overlaps, calculates acreage, and assigns unique ULPIN identifiers (`ULPIN-DEMO-000001` to `ULPIN-DEMO-001000`).
            </p>
          </div>
        </div>

        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 flex items-start space-x-2">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <p>
            <strong>Disclaimer:</strong> Esri satellite imagery serves as a high-resolution visual basemap. Parcel boundaries are synthetic cadastral data generated for prototype demonstration.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-5 py-2.5 rounded-xl shadow-lg transition"
          >
            Close Engine Spec
          </button>
        </div>
      </div>
    </div>
  );
};

const PipelineStep: React.FC<{ step: string; title: string; desc: string }> = ({ step, title, desc }) => (
  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex flex-col items-center">
    <span className="w-5 h-5 rounded-full bg-indigo-600 text-[10px] font-bold text-white flex items-center justify-center mb-1">
      {step}
    </span>
    <span className="font-bold text-white text-[11px]">{title}</span>
    <span className="text-[9px] text-slate-400 mt-0.5">{desc}</span>
  </div>
);

const PipelineArrow = () => (
  <div className="hidden md:flex items-center justify-center text-slate-600">
    <ArrowRight className="w-4 h-4" />
  </div>
);
