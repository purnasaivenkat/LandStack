'use client';

import React from 'react';
import { Layers, Eye, EyeOff, Map, BoxSelect, Grid } from 'lucide-react';

export interface LayerState {
  satellite: boolean;
  parcels: boolean;
  labels: boolean;
  zones: boolean;
  spatialMode: boolean;
}

interface LayerControlProps {
  layers: LayerState;
  onToggleLayer: (layerKey: keyof LayerState) => void;
  intersectingCount?: number | null;
  onClearSpatialFilter?: () => void;
}

export const LayerControl: React.FC<LayerControlProps> = ({
  layers,
  onToggleLayer,
  intersectingCount,
  onClearSpatialFilter
}) => {
  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-2xl text-white w-72 z-30">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">GIS Layer Controls</h3>
        </div>
      </div>

      {/* Basemap Switcher */}
      <div className="mb-4">
        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Basemap Mode
        </label>
        <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => !layers.satellite && onToggleLayer('satellite')}
            className={`flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
              layers.satellite
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Satellite</span>
          </button>
          <button
            onClick={() => layers.satellite && onToggleLayer('satellite')}
            className={`flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
              !layers.satellite
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Streets</span>
          </button>
        </div>
      </div>

      {/* Spatial Intersects Selection Tool */}
      <div className="mb-4 p-2.5 bg-slate-800/40 border border-slate-700/60 rounded-xl">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center space-x-2">
            <BoxSelect className={`w-4 h-4 ${layers.spatialMode ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
            <span className="text-xs font-semibold text-slate-200">ST_Intersects Mode</span>
          </div>
          <button
            onClick={() => onToggleLayer('spatialMode')}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
              layers.spatialMode
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {layers.spatialMode ? 'ACTIVE' : 'START DRAW'}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          Click and drag a box over Karjat map area to run spatial PostGIS query.
        </p>

        {intersectingCount !== undefined && intersectingCount !== null && (
          <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
            <span className="text-amber-300 font-medium">Found: <strong>{intersectingCount} parcels</strong></span>
            {onClearSpatialFilter && (
              <button
                onClick={onClearSpatialFilter}
                className="text-[10px] text-slate-400 hover:text-white underline"
              >
                Reset Filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Vector Layer Toggles */}
      <div className="space-y-2">
        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
          Vector Layers
        </label>

        <LayerToggleRow
          label="Cadastral Parcels (1000)"
          active={layers.parcels}
          icon={<Layers className="w-3.5 h-3.5 text-orange-400" />}
          onToggle={() => onToggleLayer('parcels')}
        />

        <LayerToggleRow
          label="Survey Number Labels"
          active={layers.labels}
          icon={<span className="text-[11px] font-extrabold text-cyan-400">12/1</span>}
          onToggle={() => onToggleLayer('labels')}
        />

        <LayerToggleRow
          label="Zone Sectors (20)"
          active={layers.zones}
          icon={<Grid className="w-3.5 h-3.5 text-purple-400" />}
          onToggle={() => onToggleLayer('zones')}
        />
      </div>
    </div>
  );
};

const LayerToggleRow: React.FC<{
  label: string;
  active: boolean;
  icon: React.ReactNode;
  onToggle: () => void;
}> = ({ label, active, icon, onToggle }) => (
  <button
    onClick={onToggle}
    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
      active
        ? 'bg-slate-800/80 text-white border border-slate-700/80'
        : 'bg-slate-950/40 text-slate-400 hover:text-slate-200 border border-transparent'
    }`}
  >
    <div className="flex items-center space-x-2.5">
      {icon}
      <span>{label}</span>
    </div>
    {active ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
  </button>
);
