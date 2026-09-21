'use client';

import React, { useState } from 'react';
import { X, Copy, Check, MapPin, Sparkles, ShieldCheck, Navigation } from 'lucide-react';
import { ParcelRecord } from '@/scripts/generate_cadastral';
import { computeCentroid } from '@/lib/gis/spatial_queries';

interface ParcelDetailsPanelProps {
  parcel: ParcelRecord | null;
  onClose: () => void;
  onFlyTo: (parcel: ParcelRecord) => void;
}

export const ParcelDetailsPanel: React.FC<ParcelDetailsPanelProps> = ({ parcel, onClose, onFlyTo }) => {
  const [copied, setCopied] = useState(false);
  const [copiedGeoJSON, setCopiedGeoJSON] = useState(false);

  if (!parcel) return null;

  const centroid = computeCentroid(parcel.geometry);
  const sqMeters = Math.round(parcel.area_acres * 4046.8564224);

  const copyULPIN = () => {
    navigator.clipboard.writeText(parcel.ulpin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyGeoJSON = () => {
    const geojson = JSON.stringify({
      type: "Feature",
      id: parcel.parcel_id,
      properties: parcel,
      geometry: parcel.geometry
    }, null, 2);
    navigator.clipboard.writeText(geojson);
    setCopiedGeoJSON(true);
    setTimeout(() => setCopiedGeoJSON(false), 2000);
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl p-5 shadow-2xl text-white w-80 md:w-96 z-40 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-start justify-between pb-3.5 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md">
              PARCEL DETAILS
            </span>
            <span className="text-xs font-semibold text-slate-400">
              ID: <strong className="text-white">{parcel.parcel_id}</strong>
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1 flex items-center gap-1.5">
            {parcel.ulpin}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Synthetic Cadastral Badge */}
      <div className="mt-3 p-2.5 bg-indigo-950/40 border border-indigo-800/50 rounded-xl flex items-center space-x-2.5">
        <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
        <p className="text-[10px] text-indigo-200 leading-tight">
          <strong>Synthetic Cadastral Subdivision Parcel</strong> generated for Karjat study area demonstration.
        </p>
      </div>

      {/* Details Grid */}
      <div className="mt-4 space-y-2.5 text-xs">
        <DetailRow
          label="ULPIN Identifier"
          value={
            <div className="flex items-center space-x-1.5">
              <span className="font-mono font-bold text-cyan-300">{parcel.ulpin}</span>
              <button
                onClick={copyULPIN}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                title="Copy ULPIN"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          }
        />

        <DetailRow
          label="Survey Number"
          value={<span className="font-extrabold text-white text-sm bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{parcel.survey_no}</span>}
        />

        <DetailRow
          label="Land Area"
          value={
            <div className="text-right">
              <span className="font-bold text-emerald-400">{parcel.area_acres} acres</span>
              <span className="text-[10px] text-slate-400 block">({sqMeters.toLocaleString()} sq. m)</span>
            </div>
          }
        />

        <DetailRow label="Village / Taluk" value={<span className="text-slate-200">{parcel.village}</span>} />
        <DetailRow label="District" value={<span className="text-slate-200">{parcel.district}</span>} />
        <DetailRow label="State" value={<span className="text-slate-200">{parcel.state}</span>} />
        <DetailRow label="Sector / Zone" value={<span className="font-semibold text-purple-300">{parcel.zone_id}</span>} />

        <DetailRow
          label="Geographic Centroid"
          value={<span className="font-mono text-[11px] text-slate-300">{centroid[1].toFixed(5)}°N, {centroid[0].toFixed(5)}°E</span>}
        />

        <DetailRow
          label="PostGIS Status"
          value={
            <div className="flex items-center space-x-1 text-emerald-400 font-semibold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ST_IsValid (SRID 4326)</span>
            </div>
          }
        />
      </div>

      {/* Action Buttons */}
      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          onClick={() => onFlyTo(parcel)}
          className="flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-2 px-3 rounded-xl transition shadow-md"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Fly To Parcel</span>
        </button>

        <button
          onClick={copyGeoJSON}
          className="flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs py-2 px-3 rounded-xl transition border border-slate-700"
        >
          {copiedGeoJSON ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>GeoJSON API</span>
        </button>
      </div>
    </div>
  );
};

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
    <span className="text-slate-400 font-medium">{label}</span>
    <div>{value}</div>
  </div>
);
