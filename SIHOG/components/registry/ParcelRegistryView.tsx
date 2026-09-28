'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  MapPin,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Building2,
  DollarSign,
  Scale,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ParcelRecord } from '@/scripts/generate_cadastral';

interface ParcelRegistryViewProps {
  parcels: ParcelRecord[];
  onOpenProfile: (ulpin: string) => void;
  onLocateOnMap: (parcel: ParcelRecord) => void;
  onOpenAIModal: (ulpin: string) => void;
}

type FilterCategory = 'all' | 'clean' | 'litigation' | 'mortgage' | 'tax';

export const ParcelRegistryView: React.FC<ParcelRegistryViewProps> = ({
  parcels,
  onOpenProfile,
  onLocateOnMap,
  onOpenAIModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const benchmarkParcels = [
    {
      ulpin: 'UL001',
      survey_no: '104/1',
      village: 'Kengeri',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      area_acres: 3.2,
      riskLevel: 'CLEAN',
      status: 'Clean Title (0 Risk)',
      tags: ['Verified 7/12', 'Nil Encumbrance']
    },
    {
      ulpin: 'UL002',
      survey_no: '104/2',
      village: 'Kengeri',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      area_acres: 3.2,
      riskLevel: 'MODERATE_RISK',
      status: 'Area Discrepancy',
      tags: ['GIS 3.20ac vs Deed 2.80ac (+0.4ac)']
    },
    {
      ulpin: 'UL003',
      survey_no: '105',
      village: 'Kengeri',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      area_acres: 4.5,
      riskLevel: 'BLOCKED',
      status: 'Judicial Injunction / Stay',
      tags: ['Civil Court Stay', 'Transfers Frozen']
    },
    {
      ulpin: 'UL004',
      survey_no: '106/1',
      village: 'Kengeri',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      area_acres: 5.1,
      riskLevel: 'MODERATE_RISK',
      status: 'Bank Mortgage Lien',
      tags: ['SBI ₹4.5 Crore Lien']
    },
    {
      ulpin: 'UL005',
      survey_no: '107',
      village: 'Kengeri',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      area_acres: 2.3,
      riskLevel: 'MODERATE_RISK',
      status: 'Tax Defaulter',
      tags: ['3 Yrs Overdue: ₹78,000']
    },
    {
      ulpin: 'UL006',
      survey_no: '108',
      village: 'Kengeri',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      area_acres: 6.0,
      riskLevel: 'HIGH_RISK',
      status: 'Green Belt Conflict',
      tags: ['Unauthorized Construction']
    }
  ];

  const mergedList = useMemo(() => {
    const list: any[] = [...benchmarkParcels];
    parcels.forEach((p, idx) => {
      let riskLevel = 'CLEAN';
      let status = 'Clean Title';
      let tags: string[] = ['Standard Cadastral Subdivision'];

      if (idx % 29 === 0) {
        riskLevel = 'BLOCKED';
        status = 'Judicial Stay Injunction';
        tags = ['Court Case Inquiry Pending'];
      } else if (idx % 11 === 0) {
        riskLevel = 'MODERATE_RISK';
        status = 'Bank Mortgage';
        tags = ['Commercial Bank Lien'];
      } else if (idx % 17 === 0) {
        riskLevel = 'MODERATE_RISK';
        status = 'Tax Arrears';
        tags = ['Municipal Arrears Pending'];
      }

      list.push({
        ulpin: p.ulpin,
        survey_no: p.survey_no || p.survey_number,
        village: p.village,
        district: p.district,
        state: p.state,
        area_acres: p.area_acres,
        riskLevel,
        status,
        tags,
        rawParcel: p
      });
    });
    return list;
  }, [parcels]);

  const villages = useMemo(() => {
    const set = new Set<string>();
    mergedList.forEach((p) => {
      if (p.village) set.add(p.village);
    });
    return Array.from(set).sort();
  }, [mergedList]);

  const filteredList = useMemo(() => {
    return mergedList.filter((item) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesUlpin = item.ulpin?.toLowerCase().includes(q);
        const matchesSurvey = item.survey_no?.toLowerCase().includes(q);
        const matchesVillage = item.village?.toLowerCase().includes(q);
        const matchesStatus = item.status?.toLowerCase().includes(q);
        if (!matchesUlpin && !matchesSurvey && !matchesVillage && !matchesStatus) {
          return false;
        }
      }

      if (activeCategory === 'clean' && item.riskLevel !== 'CLEAN') return false;
      if (activeCategory === 'litigation' && item.riskLevel !== 'BLOCKED') return false;
      if (activeCategory === 'mortgage' && !item.status.includes('Mortgage') && !item.status.includes('Lien')) return false;
      if (activeCategory === 'tax' && !item.status.includes('Tax')) return false;

      if (selectedVillage !== 'all' && item.village !== selectedVillage) return false;

      return true;
    });
  }, [mergedList, searchTerm, activeCategory, selectedVillage]);

  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'CLEAN':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'LOW_RISK':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'MODERATE_RISK':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'HIGH_RISK':
      case 'BLOCKED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 p-6 space-y-4 text-slate-800">
      {/* Title & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#0F2A4A] flex items-center gap-2">
            <span>National Cadastral Parcel Registry</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#0073BB] border border-blue-200">
              {filteredList.length.toLocaleString()} Parcels
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized with Supabase PostGIS & Central Land Governance Layer
          </p>
        </div>

        {/* Search Input & Village Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by ULPIN, Survey #, or Village..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0073BB] shadow-xs transition"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs shadow-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedVillage}
              onChange={(e) => {
                setSelectedVillage(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-700 text-xs focus:outline-none cursor-pointer font-medium"
            >
              <option value="all">All Villages ({villages.length})</option>
              {villages.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
        {[
          { id: 'all', label: 'All Parcels', count: mergedList.length },
          { id: 'clean', label: 'Clean Title (0 Risk)', count: mergedList.filter(p => p.riskLevel === 'CLEAN').length },
          { id: 'litigation', label: 'Judicial Stays', count: mergedList.filter(p => p.riskLevel === 'BLOCKED').length },
          { id: 'mortgage', label: 'Bank Mortgages', count: mergedList.filter(p => p.status.includes('Mortgage') || p.status.includes('Lien')).length },
          { id: 'tax', label: 'Tax Defaulters', count: mergedList.filter(p => p.status.includes('Tax')).length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveCategory(tab.id as FilterCategory);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeCategory === tab.id
                ? 'bg-[#0F2A4A] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeCategory === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table Container in Figma white aesthetic */}
      <div className="flex-1 overflow-auto bg-white border border-slate-200 rounded-2xl shadow-xs">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 sticky top-0 z-10">
            <tr>
              <th className="py-3 px-4">ULPIN Identifier</th>
              <th className="py-3 px-4">Survey Number</th>
              <th className="py-3 px-4">Location (Village / Taluk)</th>
              <th className="py-3 px-4">Extent (Acres)</th>
              <th className="py-3 px-4">Risk Status</th>
              <th className="py-3 px-4">Department Flags</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedList.map((item) => (
              <tr
                key={item.ulpin}
                className="hover:bg-blue-50/40 transition group cursor-pointer"
                onClick={() => onOpenProfile(item.ulpin)}
              >
                <td className="py-3 px-4 font-mono font-bold text-[#0073BB]">
                  {item.ulpin}
                </td>
                <td className="py-3 px-4 font-semibold text-slate-900">
                  Sy #{item.survey_no}
                </td>
                <td className="py-3 px-4 text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{item.village}, {item.district}</span>
                  </div>
                </td>
                <td className="py-3 px-4 font-semibold text-emerald-700 font-mono">
                  {item.area_acres} ac
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRiskBadge(
                      item.riskLevel
                    )}`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((t: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-slate-50 text-slate-600 border border-slate-200 px-1.5 py-0.2 rounded"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end space-x-1.5">
                    <button
                      onClick={() => onOpenProfile(item.ulpin)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-[#0F2A4A] text-[#0073BB] hover:text-white border border-blue-200 hover:border-[#0F2A4A] text-[11px] font-semibold transition"
                      title="Open 360° Profile Dossier"
                    >
                      360° Profile
                    </button>
                    {item.rawParcel && (
                      <button
                        onClick={() => onLocateOnMap(item.rawParcel)}
                        className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                        title="Locate on Cadastral Map"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#0073BB]" />
                      </button>
                    )}
                    <button
                      onClick={() => onOpenAIModal(item.ulpin)}
                      className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                      title="AI Legal Audit"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#0073BB]" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span>
          Showing{' '}
          <strong className="text-slate-800">
            {Math.min((currentPage - 1) * pageSize + 1, filteredList.length)}
          </strong>{' '}
          to{' '}
          <strong className="text-slate-800">
            {Math.min(currentPage * pageSize, filteredList.length)}
          </strong>{' '}
          of <strong className="text-slate-800">{filteredList.length}</strong> parcels
        </span>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-slate-600 font-semibold">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition shadow-xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
