'use client';

import React from 'react';
import { Layers, MapPin, Sparkles, Database, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onOpenAIModal: () => void;
  parcelCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAIModal, parcelCount }) => {
  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white px-6 flex items-center justify-between z-30 shadow-lg">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 p-0.5 shadow-indigo-500/30 shadow-md">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Layers className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              LANDSTACK
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
              PostGIS Ready
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <span>SIH 2026 | PS 26014</span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-400 font-semibold flex items-center gap-1">
              <MapPin className="w-3 h-3 inline" /> Karjat, Maharashtra
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden lg:flex items-center space-x-3 bg-slate-800/60 border border-slate-700/60 rounded-xl px-3.5 py-1.5 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Cadastral Engine:</span>
            <span className="font-bold text-white">{parcelCount.toLocaleString()} Parcels</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>SRID 4326</span>
          </div>
        </div>

        <button
          onClick={onOpenAIModal}
          className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border border-cyan-400/30"
        >
          <Sparkles className="w-4 h-4 text-cyan-200" />
          <span>Engine Spec</span>
        </button>
      </div>
    </header>
  );
};
