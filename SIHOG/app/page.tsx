'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/ui/Header';
import { MapContainer } from '@/components/map/MapContainer';
import { LayerControl, LayerState } from '@/components/layers/LayerControl';
import { ParcelSearchBox } from '@/components/search/ParcelSearchBox';
import { ParcelDetailsPanel } from '@/components/parcel/ParcelDetailsPanel';
import { AIGeneratorModal } from '@/components/ai/AIGeneratorModal';
import { AdminLocationSelector } from '@/components/ui/AdminLocationSelector';
import { ParcelRecord } from '@/scripts/generate_cadastral';
import {
  INDIA_LOCATION,
  getAdminLocationById,
  AdminLocationLevel
} from '@/lib/gis/admin_locations';
import { FeatureCollection } from 'geojson';
import { Zap, RefreshCw, ShieldCheck } from 'lucide-react';

export default function LandStackDashboard() {
  const [layers, setLayers] = useState<LayerState>({
    satellite: true,
    parcels: true,
    labels: true,
    zones: false,
    spatialMode: false
  });

  const [selectedParcel, setSelectedParcel] = useState<ParcelRecord | null>(null);
  const [parcelsGeoJSON, setParcelsGeoJSON] = useState<FeatureCollection | null>(null);
  const [parcelList, setParcelList] = useState<ParcelRecord[]>([]);

  const [spatialIntersectsIds, setSpatialIntersectsIds] = useState<string[]>([]);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [spatialMessage, setSpatialMessage] = useState<string | null>(null);

  // Administrative location selector state (India-wide)
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [selectedTalukaId, setSelectedTalukaId] = useState<string>('');
  const [adminTarget, setAdminTarget] = useState<AdminLocationLevel | null>(INDIA_LOCATION);

  // Load initial cadastral dataset for Karjat
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/parcels');
        const data = await res.json();
        if (data.type === 'FeatureCollection') {
          setParcelsGeoJSON(data);
          const records: ParcelRecord[] = data.features.map((f: any) => ({
            ...f.properties,
            geometry: f.geometry
          }));
          setParcelList(records);
          // Initial map load covers India scale without pre-selecting a single parcel
        }
      } catch (err) {
        console.error("Error loading cadastral parcels:", err);
      }
    }
    loadData();
  }, []);

  const handleToggleLayer = (layerKey: keyof LayerState) => {
    setLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  // Administrative location navigation handlers
  const handleSelectAdminLocation = (target: AdminLocationLevel) => {
    if (target.type === 'state') {
      setSelectedStateId(target.id);
      setSelectedDistrictId('');
      setSelectedTalukaId('');
    } else if (target.type === 'district') {
      setSelectedDistrictId(target.id);
      setSelectedTalukaId('');
    } else if (target.type === 'taluka') {
      setSelectedTalukaId(target.id);
    }
    setAdminTarget(target);
  };

  const handleClearAdminLocation = (type: 'state' | 'district' | 'taluka') => {
    if (type === 'state') {
      setSelectedStateId('');
      setSelectedDistrictId('');
      setSelectedTalukaId('');
      setAdminTarget(INDIA_LOCATION);
    } else if (type === 'district') {
      setSelectedDistrictId('');
      setSelectedTalukaId('');
      const stObj = getAdminLocationById(selectedStateId);
      setAdminTarget(stObj || INDIA_LOCATION);
    } else if (type === 'taluka') {
      setSelectedTalukaId('');
      const distObj = getAdminLocationById(selectedDistrictId);
      setAdminTarget(distObj || INDIA_LOCATION);
    }
  };

  // Preset Spatial Query: Execute ST_Intersects Demo
  const handleRunSTIntersectsDemo = async () => {
    setSpatialMessage("Executing PostGIS ST_Intersects() spatial query across Karjat Sector 04...");
    try {
      // Bounding box for Zone-04 (Karjat Sector 04)
      const zoneBBox: [number, number, number, number] = [73.317, 18.9125, 73.323, 18.920];
      const res = await fetch('/api/spatial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ST_Intersects', bbox: zoneBBox })
      });
      const data = await res.json();
      if (data.success && data.parcels) {
        const ids = data.parcels.map((p: any) => p.parcel_id);
        setSpatialIntersectsIds(ids);
        setSpatialMessage(`ST_Intersects() complete: ${ids.length} matching parcels identified in ${data.executionTimeMs}ms`);
      }
    } catch (err) {
      console.error(err);
      setSpatialMessage(null);
    }
  };

  const handleResetFilter = () => {
    setSpatialIntersectsIds([]);
    setSpatialMessage(null);
  };

  return (
    <div className="relative w-screen h-screen flex flex-col overflow-hidden bg-slate-950 font-sans select-none">
      {/* Top Header */}
      <Header
        onOpenAIModal={() => setIsAIModalOpen(true)}
        parcelCount={parcelList.length || 1000}
      />

      {/* Main Content Area */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {/* Fullscreen MapLibre GIS Container */}
        <MapContainer
          layers={layers}
          selectedParcel={selectedParcel}
          onSelectParcel={(parcel) => setSelectedParcel(parcel)}
          parcelsGeoJSON={parcelsGeoJSON}
          spatialIntersectsIds={spatialIntersectsIds}
          adminTarget={adminTarget}
        />

        {/* Floating Top Control Overlay: Search, India-Wide Admin Nav & Quick Presets */}
        <div className="absolute top-4 left-4 right-4 z-30 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 pointer-events-none">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full xl:w-auto">
            <div className="pointer-events-auto w-full md:w-96">
              <ParcelSearchBox
                onSelectParcel={(parcel) => setSelectedParcel(parcel)}
                selectedParcelId={selectedParcel?.parcel_id}
              />
            </div>

            <div className="pointer-events-auto">
              <AdminLocationSelector
                selectedStateId={selectedStateId}
                selectedDistrictId={selectedDistrictId}
                selectedTalukaId={selectedTalukaId}
                onSelectLocation={handleSelectAdminLocation}
                onClearLocation={handleClearAdminLocation}
              />
            </div>
          </div>

          <div className="pointer-events-auto flex items-center space-x-2">
            <button
              onClick={handleRunSTIntersectsDemo}
              className="bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-500/40 px-3 py-2.5 rounded-xl text-xs font-semibold shadow-xl backdrop-blur-md flex items-center space-x-1.5 transition active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>ST_Intersects Query</span>
            </button>

            {spatialIntersectsIds.length > 0 && (
              <button
                onClick={handleResetFilter}
                className="bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 px-3 py-2.5 rounded-xl text-xs font-semibold shadow-xl backdrop-blur-md flex items-center space-x-1 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Spatial Query Toast Notification */}
        {spatialMessage && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-amber-500/50 text-amber-200 px-4 py-2 rounded-2xl shadow-2xl backdrop-blur-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>{spatialMessage}</span>
          </div>
        )}

        {/* Left Floating Panel: GIS Layer Controls */}
        <div className="absolute bottom-6 left-4 z-30 pointer-events-auto hidden md:block">
          <LayerControl
            layers={layers}
            onToggleLayer={handleToggleLayer}
            intersectingCount={spatialIntersectsIds.length > 0 ? spatialIntersectsIds.length : null}
            onClearSpatialFilter={handleResetFilter}
          />
        </div>

        {/* Right Floating Panel: Selected Parcel Details */}
        <div className="absolute top-20 right-4 z-30 pointer-events-auto">
          <ParcelDetailsPanel
            parcel={selectedParcel}
            onClose={() => setSelectedParcel(null)}
            onFlyTo={(parcel) => setSelectedParcel(parcel)}
          />
        </div>

        {/* Bottom Status Bar */}
        <div className="absolute bottom-2 right-4 z-20 bg-slate-900/80 border border-slate-800 px-3 py-1 rounded-lg text-[10px] text-slate-400 backdrop-blur-md flex items-center space-x-2">
          <span>PostGIS EPSG:4326</span>
          <span>•</span>
          <span>India GIS Engine</span>
          <span>•</span>
          <span className="text-emerald-400 font-semibold">1,000 Cadastral Parcels</span>
        </div>
      </main>

      {/* Engine Architecture Modal */}
      <AIGeneratorModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
      />
    </div>
  );
}
