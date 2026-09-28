'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Hash, CheckCircle2 } from 'lucide-react';
import { ParcelRecord } from '@/scripts/generate_cadastral';

interface ParcelSearchBoxProps {
  onSelectParcel: (parcel: ParcelRecord) => void;
  selectedParcelId?: string | null;
}

export const ParcelSearchBox: React.FC<ParcelSearchBoxProps> = ({ onSelectParcel, selectedParcelId }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ParcelRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/parcels?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (data.success && data.results) {
          setResults(data.results);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchResults, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (parcel: ParcelRecord) => {
    onSelectParcel(parcel);
    setQuery(`${parcel.ulpin} (${parcel.survey_no})`);
    setIsOpen(false);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0) {
        handleSelect(results[0]);
      }
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md z-40">
      <div className="relative flex items-center">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Search by ULPIN, Parcel ID, or Survey No (e.g. ULPIN-DEMO-000157, P0157, 12/1)..."
          className="w-full bg-slate-900/90 text-slate-100 placeholder-slate-400 text-xs pl-10 pr-9 py-3 rounded-xl border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-xl backdrop-blur-md transition-all outline-none"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-800/60 z-50">
          {loading ? (
            <div className="p-4 text-center text-xs text-slate-400">
              Searching cadastral dataset...
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="px-3 py-2 text-[10px] uppercase font-bold text-slate-400 bg-slate-950/40 tracking-wider">
                Matching Parcels ({results.length})
              </div>
              {results.map((parcel) => (
                <button
                  key={parcel.parcel_id}
                  onClick={() => handleSelect(parcel)}
                  className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-indigo-600/10 transition-colors group ${
                    selectedParcelId === parcel.parcel_id ? 'bg-indigo-600/20 border-l-2 border-indigo-500' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors">
                        {parcel.ulpin}
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-300 rounded border border-slate-700">
                        ID: {parcel.parcel_id}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3 text-cyan-400" />
                        Survey: <strong className="text-slate-200">{parcel.survey_no}</strong>
                      </span>
                      <span>•</span>
                      <span>{parcel.area_acres} Acres</span>
                      <span>•</span>
                      <span>{parcel.village}</span>
                    </div>
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-1 rounded border border-slate-700/50">
                    {parcel.zone_id}
                  </div>
                </button>
              ))}
            </>
          ) : (
            <div className="p-4 text-center text-xs text-slate-400">
              No matching parcels found for &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
};
