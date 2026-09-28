'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/ui/Header';
import { SidebarNav, NavTab, UserRole } from '@/components/ui/SidebarNav';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { ParcelRegistryView } from '@/components/registry/ParcelRegistryView';
import { AnalyticsView } from '@/components/analytics/AnalyticsView';
import { UnifiedParcelProfileModal } from '@/components/parcel/UnifiedParcelProfileModal';
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

import { LoginPage, AuthUser } from '@/components/ui/LoginPage';

export default function LandStackDashboard() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('citizen');
  const [profileModalUlpin, setProfileModalUlpin] = useState<string | null>(null);

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

  // Check persistent session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('landstack_auth_user');
      if (stored) {
        const parsed: AuthUser = JSON.parse(stored);
        setAuthUser(parsed);
        setUserRole(parsed.role);
      }
    } catch (e) {
      console.error("Could not parse stored auth user", e);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  const handleLoginSuccess = (user: AuthUser) => {
    setAuthUser(user);
    setUserRole(user.role);
    localStorage.setItem('landstack_auth_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setAuthUser(null);
    localStorage.removeItem('landstack_auth_user');
  };

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

  const KARJAT_LOCATION: AdminLocationLevel = {
    id: 'taluka_karjat',
    name: 'Karjat Cadastral Area',
    type: 'taluka',
    center: [73.3200, 18.9200],
    zoom: 15.2,
    bounds: [
      [73.3050, 18.9050],
      [73.3350, 18.9350]
    ]
  };

  const handleFocusKarjat = () => {
    setSelectedParcel(null);
    setAdminTarget({ ...KARJAT_LOCATION });
    setActiveTab('map');
  };

  const handleOpenProfile = (ulpin: string) => {
    setProfileModalUlpin(ulpin);
  };

  const handleLocateOnMap = (parcel: ParcelRecord) => {
    setSelectedParcel(parcel);
    setActiveTab('map');
  };

  const handleOpenAIForParcel = (ulpin?: string) => {
    if (ulpin) {
      const found = parcelList.find(p => p.ulpin === ulpin);
      if (found) {
        setSelectedParcel(found);
      }
    }
    setIsAIModalOpen(true);
  };

  if (isAuthLoading) {
    return (
      <div className="w-screen h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-400">Loading LandStack Portal...</span>
        </div>
      </div>
    );
  }

  // Display strict login screen if not authenticated
  if (!authUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="relative w-screen h-screen flex overflow-hidden bg-slate-50 font-sans select-none">
      {/* Figma Navigation Sidebar */}
      <SidebarNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAIModal={() => setIsAIModalOpen(true)}
        userRole={userRole}
        onChangeRole={setUserRole}
        totalParcels={parcelList.length || 1000}
        authUser={authUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenAIModal={() => setIsAIModalOpen(true)}
          onFocusKarjat={handleFocusKarjat}
          parcelCount={parcelList.length || 1000}
          authUser={authUser}
          onLogout={handleLogout}
        />

        {/* View Switcher Container */}
        <div className="relative flex-1 w-full h-full overflow-hidden flex flex-col">
          {/* View 1: Overview Dashboard */}
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenProfile={handleOpenProfile}
              onNavigateToMap={() => setActiveTab('map')}
              onNavigateToRegistry={() => setActiveTab('registry')}
              onOpenAICopilot={() => setIsAIModalOpen(true)}
            />
          )}

          {/* View 2: Parcel Registry Data Table */}
          {activeTab === 'registry' && (
            <ParcelRegistryView
              parcels={parcelList}
              onOpenProfile={handleOpenProfile}
              onLocateOnMap={handleLocateOnMap}
              onOpenAIModal={handleOpenAIForParcel}
            />
          )}

          {/* View 3: Risk Intelligence & Area Analytics */}
          {activeTab === 'analytics' && (
            <AnalyticsView
              onOpenProfile={handleOpenProfile}
              onNavigateToMap={() => setActiveTab('map')}
            />
          )}

          {/* View 4: Fullscreen Cadastral GIS Map */}
          {/* Kept mounted in DOM when inactive so WebGL canvas retains state */}
          <div
            className={`relative flex-1 w-full h-full overflow-hidden ${
              activeTab === 'map' ? 'block' : 'hidden'
            }`}
          >
            {/* Fullscreen MapLibre GIS Container */}
            <MapContainer
              layers={layers}
              selectedParcel={selectedParcel}
              onSelectParcel={(parcel) => setSelectedParcel(parcel)}
              parcelsGeoJSON={parcelsGeoJSON}
              parcelList={parcelList}
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
                  onClick={handleFocusKarjat}
                  className="bg-white/95 hover:bg-white text-[#0F2A4A] hover:text-[#0073BB] border border-slate-300 px-3 py-2.5 rounded-xl text-xs font-bold shadow-lg backdrop-blur-md flex items-center space-x-1.5 transition active:scale-95"
                >
                  <span className="w-2 h-2 rounded-full bg-[#0073BB] animate-ping" />
                  <span>🎯 Focus Karjat (1K Plots)</span>
                </button>

                <button
                  onClick={handleRunSTIntersectsDemo}
                  className="bg-white/95 hover:bg-white text-amber-700 border border-amber-300 px-3 py-2.5 rounded-xl text-xs font-bold shadow-lg backdrop-blur-md flex items-center space-x-1.5 transition active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span>ST_Intersects</span>
                </button>

                {spatialIntersectsIds.length > 0 && (
                  <button
                    onClick={handleResetFilter}
                    className="bg-white/95 hover:bg-white text-slate-700 border border-slate-300 px-3 py-2.5 rounded-xl text-xs font-semibold shadow-lg backdrop-blur-md flex items-center space-x-1 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Spatial Query Toast Notification */}
            {spatialMessage && (
              <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-white/95 border border-amber-400 text-amber-900 px-4 py-2 rounded-2xl shadow-xl backdrop-blur-md text-xs font-semibold flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
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
                onOpenAIModal={() => setIsAIModalOpen(true)}
                onOpen360Profile={(ulpin) => setProfileModalUlpin(ulpin)}
              />
            </div>

            {/* Bottom Status Bar */}
            <div className="absolute bottom-2 right-4 z-20 bg-white/90 border border-slate-200 px-3 py-1 rounded-lg text-[10px] text-slate-600 backdrop-blur-md flex items-center space-x-2 shadow-xs">
              <span>PostGIS EPSG:4326</span>
              <span>•</span>
              <span>India GIS Engine</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold">1,000 Cadastral Parcels</span>
            </div>
          </div>
        </div>
      </div>

      {/* 360-Degree Unified Governance Profile Modal */}
      <UnifiedParcelProfileModal
        ulpin={profileModalUlpin}
        onClose={() => setProfileModalUlpin(null)}
        onOpenMapAtParcel={(ulpin) => {
          setProfileModalUlpin(null);
          const found = parcelList.find(p => p.ulpin === ulpin);
          if (found) {
            handleLocateOnMap(found);
          } else {
            setActiveTab('map');
          }
        }}
        onOpenAIModal={(ulpin) => {
          setProfileModalUlpin(null);
          handleOpenAIForParcel(ulpin);
        }}
      />

      {/* AI Governance Agent Copilot Modal */}
      <AIGeneratorModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        selectedParcel={selectedParcel}
        onSelectParcel={(parcel) => setSelectedParcel(parcel)}
      />
    </div>
  );
}
