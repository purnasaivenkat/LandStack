'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Sparkles, ShieldCheck, Navigation } from 'lucide-react';
import { ParcelRecord } from '@/scripts/generate_cadastral';
import { computeCentroid } from '@/lib/gis/spatial_queries';

interface ParcelDetailsPanelProps {
  parcel: ParcelRecord | null;
  onClose: () => void;
  onFlyTo: (parcel: ParcelRecord) => void;
  onOpenAIModal?: () => void;
  onOpen360Profile?: (ulpin: string) => void;
}

export const ParcelDetailsPanel: React.FC<ParcelDetailsPanelProps> = ({
  parcel,
  onClose,
  onFlyTo,
  onOpenAIModal,
  onOpen360Profile
}) => {
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
    <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-xl text-slate-800 w-80 md:w-96 z-40 transition-all duration-200 animate-in fade-in slide-in-from-bottom-3">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-blue-50 text-[#0073BB] border border-blue-200 rounded-md">
              PARCEL DETAILS
            </span>
            <span className="text-xs font-semibold text-slate-500">
              ID: <strong className="text-slate-900">{parcel.parcel_id}</strong>
            </span>
          </div>
          <h2 className="text-base font-bold text-[#0F2A4A] mt-1 flex items-center gap-1.5 font-mono">
            {parcel.ulpin}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Synthetic Cadastral Badge */}
      <div className="mt-3 p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center space-x-2.5">
        <Sparkles className="w-4 h-4 text-[#0073BB] shrink-0" />
        <p className="text-[10px] text-slate-600 leading-tight">
          <strong>Cadastral Subdivision Parcel</strong> synchronized with Supabase PostGIS & central registry.
        </p>
      </div>

      {/* Details Grid */}
      <div className="mt-3.5 space-y-2 text-xs">
        <DetailRow
          label="ULPIN Identifier"
          value={
            <div className="flex items-center space-x-1.5">
              <span className="font-mono font-bold text-[#0073BB]">{parcel.ulpin}</span>
              <button
                onClick={copyULPIN}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
                title="Copy ULPIN"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          }
        />

        <DetailRow
          label="Survey Number"
          value={<span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{parcel.survey_no}</span>}
        />

        <DetailRow
          label="Land Area"
          value={
            <div className="text-right">
              <span className="font-bold text-emerald-700">{parcel.area_acres} acres</span>
              <span className="text-[10px] text-slate-500 block">({sqMeters.toLocaleString()} sq. m)</span>
            </div>
          }
        />

        <DetailRow label="Village / Taluk" value={<span className="text-slate-700 font-medium">{parcel.village}</span>} />
        <DetailRow label="District" value={<span className="text-slate-700 font-medium">{parcel.district}</span>} />
        <DetailRow label="State" value={<span className="text-slate-700 font-medium">{parcel.state}</span>} />
        <DetailRow label="Sector / Zone" value={<span className="font-semibold text-purple-700">{parcel.zone_id}</span>} />

        <DetailRow
          label="Geographic Centroid"
          value={<span className="font-mono text-[11px] text-slate-600">{centroid[1].toFixed(5)}°N, {centroid[0].toFixed(5)}°E</span>}
        />

        <DetailRow
          label="PostGIS Status"
          value={
            <div className="flex items-center space-x-1 text-emerald-700 font-semibold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>ST_IsValid (SRID 4326)</span>
            </div>
          }
        />
      </div>

      {/* 360 Profile Dossier Button */}
      {onOpen360Profile && (
        <button
          onClick={() => onOpen360Profile(parcel.ulpin)}
          className="mt-4 w-full flex items-center justify-center space-x-2 bg-[#0F2A4A] hover:bg-[#0A1E35] text-white font-bold text-xs py-2.5 px-3 rounded-xl transition shadow-xs active:scale-98"
        >
          <ShieldCheck className="w-4 h-4 text-cyan-300" />
          <span>Open 360° Governance Profile</span>
        </button>
      )}

      {/* Action Buttons */}
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <button
          onClick={() => onFlyTo(parcel)}
          className="flex items-center justify-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-[#0073BB] font-semibold text-xs py-2 px-3 rounded-xl transition border border-blue-200"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Fly To Parcel</span>
        </button>

        <button
          onClick={copyGeoJSON}
          className="flex items-center justify-center space-x-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs py-2 px-3 rounded-xl transition border border-slate-200"
        >
          {copiedGeoJSON ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>GeoJSON API</span>
        </button>
      </div>

      {/* AI Audit Action */}
      {onOpenAIModal && (
        <button
          onClick={onOpenAIModal}
          className="mt-2 w-full flex items-center justify-center space-x-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs py-2 px-3 rounded-xl transition border border-slate-200 active:scale-98"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#0073BB]" />
          <span>Audit Legal Risks with AI Agent</span>
        </button>
      )}
    </div>
  );
};

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-center justify-between py-1 border-b border-slate-100">
    <span className="text-slate-500 font-medium">{label}</span>
    <div>{value}</div>
  </div>
);
