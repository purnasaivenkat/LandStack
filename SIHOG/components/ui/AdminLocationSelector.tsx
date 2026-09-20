'use client';

import React, { useMemo } from 'react';
import { ChevronRight, Navigation } from 'lucide-react';
import {
  getAllStates,
  getDistrictsForState,
  getTalukasForDistrict,
  AdminLocationLevel
} from '@/lib/gis/admin_locations';

interface AdminLocationSelectorProps {
  selectedStateId: string;
  selectedDistrictId: string;
  selectedTalukaId: string;
  onSelectLocation: (target: AdminLocationLevel) => void;
  onClearLocation: (type: 'state' | 'district' | 'taluka') => void;
}

export const AdminLocationSelector: React.FC<AdminLocationSelectorProps> = ({
  selectedStateId,
  selectedDistrictId,
  selectedTalukaId,
  onSelectLocation,
  onClearLocation
}) => {
  const statesList = useMemo(() => getAllStates(), []);
  const districtsList = useMemo(() => getDistrictsForState(selectedStateId), [selectedStateId]);
  const talukasList = useMemo(() => getTalukasForDistrict(selectedDistrictId), [selectedDistrictId]);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      onClearLocation('state');
    } else {
      const stateObj = statesList.find(s => s.id === val);
      if (stateObj) {
        onSelectLocation(stateObj);
      }
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      onClearLocation('district');
    } else {
      const distObj = districtsList.find(d => d.id === val);
      if (distObj) {
        onSelectLocation(distObj);
      }
    }
  };

  const handleTalukaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      onClearLocation('taluka');
    } else {
      const talukaObj = talukasList.find(t => t.id === val);
      if (talukaObj) {
        onSelectLocation(talukaObj);
      }
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2 md:px-3.5 md:py-2 shadow-2xl backdrop-blur-md flex flex-col md:flex-row items-stretch md:items-center space-y-2 md:space-y-0 md:space-x-2 text-xs">
      <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold px-1">
        <Navigation className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
        <span className="hidden lg:inline text-slate-300 text-[11px] uppercase tracking-wider font-bold">India GIS Nav:</span>
      </div>

      {/* State / UT Selector */}
      <div className="relative flex items-center">
        <select
          value={selectedStateId}
          onChange={handleStateChange}
          className="bg-slate-950/80 text-slate-100 border border-slate-700 hover:border-slate-500 rounded-lg px-2.5 py-1.5 pr-7 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition cursor-pointer appearance-none text-xs max-w-[170px] truncate"
        >
          <option value="">Select State / UT...</option>
          {statesList.map((st) => (
            <option key={st.id} value={st.id}>
              {st.name}
            </option>
          ))}
        </select>
        <ChevronRight className="w-3 h-3 text-slate-500 absolute right-2 pointer-events-none" />
      </div>

      <span className="hidden md:inline text-slate-600 font-bold">•</span>

      {/* District Selector */}
      <div className="relative flex items-center">
        <select
          value={selectedDistrictId}
          onChange={handleDistrictChange}
          disabled={!selectedStateId}
          className={`bg-slate-950/80 text-slate-100 border border-slate-700 rounded-lg px-2.5 py-1.5 pr-7 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition text-xs max-w-[170px] truncate ${
            !selectedStateId ? 'opacity-40 cursor-not-allowed' : 'hover:border-slate-500 cursor-pointer'
          } appearance-none`}
        >
          <option value="">Select District...</option>
          {districtsList.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <ChevronRight className="w-3 h-3 text-slate-500 absolute right-2 pointer-events-none" />
      </div>

      <span className="hidden md:inline text-slate-600 font-bold">•</span>

      {/* Taluka / Tehsil Selector */}
      <div className="relative flex items-center">
        <select
          value={selectedTalukaId}
          onChange={handleTalukaChange}
          disabled={!selectedDistrictId}
          className={`bg-slate-950/80 text-slate-100 border border-slate-700 rounded-lg px-2.5 py-1.5 pr-7 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition text-xs max-w-[170px] truncate ${
            !selectedDistrictId ? 'opacity-40 cursor-not-allowed' : 'hover:border-slate-500 cursor-pointer'
          } appearance-none`}
        >
          <option value="">Select Taluka / Tehsil...</option>
          {talukasList.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <ChevronRight className="w-3 h-3 text-slate-500 absolute right-2 pointer-events-none" />
      </div>
    </div>
  );
};
