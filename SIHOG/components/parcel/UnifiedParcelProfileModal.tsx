'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Building2,
  DollarSign,
  Scale,
  Compass,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertOctagon,
  Copy,
  Check
} from 'lucide-react';
import { fetchParcelProfile, UnifiedParcelProfile } from '@/lib/api';

interface UnifiedParcelProfileModalProps {
  ulpin: string | null;
  onClose: () => void;
  onOpenMapAtParcel?: (ulpin: string) => void;
  onOpenAIModal?: (ulpin: string) => void;
}

export const UnifiedParcelProfileModal: React.FC<UnifiedParcelProfileModalProps> = ({
  ulpin,
  onClose,
  onOpenMapAtParcel,
  onOpenAIModal
}) => {
  const [profile, setProfile] = useState<UnifiedParcelProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'ror' | 'deed' | 'mortgage' | 'tax' | 'court' | 'gis'>('overview');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!ulpin) {
      setProfile(null);
      return;
    }

    let isMounted = true;
    async function load() {
      setLoading(true);
      const data = await fetchParcelProfile(ulpin!);
      if (isMounted) {
        setProfile(data);
        setLoading(false);
      }
    }
    load();

    return () => {
      isMounted = false;
    };
  }, [ulpin]);

  if (!ulpin) return null;

  const copyUlpin = () => {
    navigator.clipboard.writeText(ulpin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'CLEAN':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          dot: 'bg-[#2DA757]',
          label: 'Clear Title (0 Risk)'
        };
      case 'LOW_RISK':
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-700',
          dot: 'bg-[#0073BB]',
          label: 'Low Risk'
        };
      case 'MODERATE_RISK':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-700',
          dot: 'bg-[#EE8C00]',
          label: 'Moderate Risk'
        };
      case 'HIGH_RISK':
      case 'BLOCKED':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-700',
          dot: 'bg-[#D9534F]',
          label: 'High Risk / Injunction'
        };
      default:
        return {
          bg: 'bg-slate-100 border-slate-200 text-slate-700',
          dot: 'bg-slate-500',
          label: level
        };
    }
  };

  const riskBadge = profile ? getRiskBadge(profile.risk_summary.risk_level) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden text-slate-800">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#0F2A4A] flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-[#0073BB]">{ulpin}</span>
                {profile && riskBadge && (
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${riskBadge.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${riskBadge.dot}`} />
                    {riskBadge.label}
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-[#0F2A4A] flex items-center gap-2">
                360° Unified Parcel Governance Profile
                <button
                  onClick={copyUlpin}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded transition"
                  title="Copy ULPIN"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenMapAtParcel && (
              <button
                onClick={() => onOpenMapAtParcel(ulpin)}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0073BB] text-xs font-semibold border border-blue-200 transition"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Locate on GIS Map</span>
              </button>
            )}

            {onOpenAIModal && (
              <button
                onClick={() => onOpenAIModal(ulpin)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#0F2A4A] hover:bg-[#0A1E35] text-white text-xs font-semibold shadow-xs transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>AI Legal Audit</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-8 h-8 border-2 border-[#0073BB] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-medium">
              Aggregating 9 Department Registers for <span className="font-mono text-[#0073BB] font-bold">{ulpin}</span>...
            </p>
          </div>
        )}

        {/* Profile Content */}
        {!loading && profile && (
          <div className="flex-1 overflow-y-auto">
            {/* Top Quick Status Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-6 border-b border-slate-100 bg-slate-50/60">
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                <span className="text-[11px] text-slate-400 uppercase font-semibold block">Survey Number</span>
                <span className="text-base font-bold text-slate-900 mt-0.5 block">
                  {profile.parcel.survey_number}
                </span>
                <span className="text-[10px] text-slate-500">
                  {profile.parcel.village}, {profile.parcel.taluk}
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                <span className="text-[11px] text-slate-400 uppercase font-semibold block">Registered Owner</span>
                <span className="text-base font-bold text-slate-900 mt-0.5 block truncate">
                  {profile.ror?.primary_owner || 'Government / Not Specified'}
                </span>
                <span className="text-[10px] text-slate-500">
                  Khata: {profile.ror?.khata_number || 'N/A'}
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                <span className="text-[11px] text-slate-400 uppercase font-semibold block">Acreage Comparison</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-base font-bold text-emerald-700">
                    {profile.parcel.gis_area_acres} ac (GIS)
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  Deed: {profile.ror?.document_area_acres || profile.parcel.gis_area_acres} ac
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                <span className="text-[11px] text-slate-400 uppercase font-semibold block">Risk Score</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-base font-bold text-slate-900">
                    {profile.risk_summary.risk_score} / 100
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${profile.risk_summary.is_safe_for_transaction ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                    {profile.risk_summary.is_safe_for_transaction ? 'SAFE' : 'CAUTION'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {profile.anomalies.length} Anomaly Flags
                </span>
              </div>
            </div>

            {/* Department Navigation Tabs */}
            <div className="flex items-center space-x-1 px-6 pt-2 border-b border-slate-200 bg-white overflow-x-auto">
              {[
                { id: 'overview', label: 'Risk & Anomalies', icon: AlertTriangle, count: profile.anomalies.length },
                { id: 'ror', label: 'Revenue / RoR (7/12)', icon: FileText },
                { id: 'deed', label: 'Deed & Registration', icon: ExternalLink },
                { id: 'mortgage', label: 'Banking & Lien', icon: Building2 },
                { id: 'tax', label: 'Property Tax', icon: DollarSign },
                { id: 'court', label: 'Court & Judicial', icon: Scale },
                { id: 'gis', label: 'GIS Spatial Details', icon: Compass }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                      isActive
                        ? 'border-[#0F2A4A] text-[#0F2A4A] bg-blue-50/50'
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Body */}
            <div className="p-6">
              {/* Tab 1: Overview & Anomalies */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Summary Box */}
                  <div className={`p-4 rounded-xl border ${profile.risk_summary.is_safe_for_transaction ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'}`}>
                    <div className="flex items-start gap-3">
                      {profile.risk_summary.is_safe_for_transaction ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertOctagon className="w-5 h-5 text-[#D9534F] shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {profile.risk_summary.summary}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1">
                          Cross-department algorithmic audit evaluated spatial boundaries, revenue records, judicial registers, bank liens, and municipal tax compliance.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Anomalies List */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Detected Cross-Department Anomalies ({profile.anomalies.length})
                    </h3>

                    {profile.anomalies.length === 0 ? (
                      <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-900">Nil Discrepancy Certificate</p>
                        <p className="text-xs text-slate-500 mt-1">
                          All 9 department databases are 100% synchronized for this cadastral unit.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {profile.anomalies.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${item.severity === 'CRITICAL' || item.severity === 'HIGH' ? 'bg-[#D9534F]' : 'bg-[#EE8C00]'}`} />
                                {item.title}
                              </span>
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${item.severity === 'CRITICAL' || item.severity === 'HIGH' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                {item.severity}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {item.description}
                            </p>
                            {(item.gis_value || item.record_value) && (
                              <div className="mt-2.5 flex items-center gap-4 text-[11px] bg-slate-50 p-2 rounded-lg font-mono border border-slate-200">
                                {item.gis_value && <span>GIS Value: <strong className="text-[#0073BB]">{item.gis_value}</strong></span>}
                                {item.record_value && <span>Record Value: <strong className="text-amber-800">{item.record_value}</strong></span>}
                                {item.delta && <span>Delta: <strong className="text-rose-700">{item.delta}</strong></span>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: RoR / 7/12 */}
              {activeTab === 'ror' && profile.ror && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldCard label="Primary Owner" value={profile.ror.primary_owner} />
                    <FieldCard label="Father / Husband Name" value={profile.ror.father_name || 'N/A'} />
                    <FieldCard label="Joint Owners" value={profile.ror.joint_owners || 'None'} />
                    <FieldCard label="Khata Number" value={profile.ror.khata_number} mono />
                    <FieldCard label="Documented Land Extent" value={`${profile.ror.document_area_acres} Acres`} highlight />
                    <FieldCard label="Land Classification" value={profile.ror.land_type || 'Agricultural'} />
                    <FieldCard label="Soil Type" value={profile.ror.soil_type || 'Alluvial'} />
                    <FieldCard label="Latest Mutation Number" value={profile.ror.mutation_number || 'N/A'} mono />
                    <FieldCard label="Mutation Date" value={profile.ror.mutated_date || 'N/A'} />
                  </div>
                </div>
              )}

              {/* Tab 3: Registration Deed */}
              {activeTab === 'deed' && (
                <div className="space-y-4">
                  {profile.registration ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FieldCard label="Deed Number" value={profile.registration.deed_number} mono />
                      <FieldCard label="Registration Date" value={profile.registration.registration_date || 'N/A'} />
                      <FieldCard label="Sub-Registrar Office (SRO)" value={profile.registration.sro_name || 'Local SRO'} />
                      <FieldCard label="Seller Party" value={profile.registration.party_seller || 'N/A'} />
                      <FieldCard label="Buyer Party" value={profile.registration.party_buyer || 'N/A'} />
                      <FieldCard label="Consideration Value" value={`₹${(profile.registration.consideration_amount || 0).toLocaleString()}`} highlight />
                      <FieldCard label="Stamp Duty Paid" value={`₹${(profile.registration.stamp_duty_paid || 0).toLocaleString()}`} />
                      <FieldCard label="Government Market Value" value={`₹${(profile.registration.market_value || 0).toLocaleString()}`} />
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No deed record registered for this survey parcel.</p>
                  )}
                </div>
              )}

              {/* Tab 4: Banking & Mortgage */}
              {activeTab === 'mortgage' && (
                <div className="space-y-4">
                  {profile.encumbrance?.has_encumbrance ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Active Bank Encumbrance / Mortgage Lien Detected
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <FieldCard label="Lending Financial Institution" value={profile.encumbrance.bank_name || 'Scheduled Bank'} />
                        <FieldCard label="Loan Account Number" value={profile.encumbrance.loan_account_no || 'N/A'} mono />
                        <FieldCard label="Mortgage Charge Amount" value={`₹${(profile.encumbrance.mortgage_amount || 0).toLocaleString()}`} highlight />
                        <FieldCard label="Date of Mortgage" value={profile.encumbrance.date_of_mortgage || 'N/A'} />
                        <FieldCard label="EC Certificate Number" value={profile.encumbrance.ec_certificate_number || 'N/A'} mono />
                        <FieldCard label="Remarks" value={profile.encumbrance.remarks || 'Charge registered'} />
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-900">Nil Encumbrance Certificate</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Certificate No: <strong className="font-mono text-[#0073BB]">{profile.encumbrance?.ec_certificate_number || 'EC-NIL-2024'}</strong>. No active bank lien or mortgage found.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Property Tax */}
              {activeTab === 'tax' && profile.tax && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldCard label="Assessment Year" value={profile.tax.assessment_year || '2024-2025'} />
                    <FieldCard
                      label="Payment Status"
                      value={
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${profile.tax.payment_status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                          {profile.tax.payment_status}
                        </span>
                      }
                    />
                    <FieldCard label="Annual Property Tax Due" value={`₹${(profile.tax.property_tax_due || 0).toLocaleString()}`} />
                    <FieldCard label="Total Tax Paid" value={`₹${(profile.tax.total_paid || 0).toLocaleString()}`} highlight />
                    <FieldCard label="Receipt Number" value={profile.tax.receipt_number || 'N/A'} mono />
                    <FieldCard label="Last Payment Date" value={profile.tax.last_payment_date || 'N/A'} />
                  </div>
                </div>
              )}

              {/* Tab 6: Court & Judiciary */}
              {activeTab === 'court' && (
                <div className="space-y-4">
                  {profile.court_case?.has_litigation ? (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase">
                        <AlertOctagon className="w-4 h-4 text-rose-600" />
                        Active Judicial Dispute / Stay Injunction
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <FieldCard label="Case Number" value={profile.court_case.case_number || 'N/A'} mono />
                        <FieldCard label="Court Name" value={profile.court_case.court_name || 'District Court'} />
                        <FieldCard label="Petitioner" value={profile.court_case.petitioner || 'N/A'} />
                        <FieldCard label="Respondent" value={profile.court_case.respondent || 'N/A'} />
                        <FieldCard label="Stay Order Status" value={profile.court_case.stay_order_active ? 'ACTIVE STAY ORDER (TRANSFERS BLOCKED)' : 'NO STAY'} highlight />
                        <FieldCard label="Case Summary" value={profile.court_case.case_summary || 'Judicial inquiry pending.'} />
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-900">Clean Judicial Record</p>
                      <p className="text-xs text-slate-500 mt-1">
                        No pending civil cases, injunctions, or stay orders registered against this survey parcel.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 7: GIS Spatial */}
              {activeTab === 'gis' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldCard label="State" value={profile.parcel.state} />
                    <FieldCard label="District" value={profile.parcel.district} />
                    <FieldCard label="Taluk" value={profile.parcel.taluk} />
                    <FieldCard label="Village" value={profile.parcel.village} />
                    <FieldCard label="Centroid Latitude" value={`${profile.parcel.centroid_lat.toFixed(6)}°N`} mono />
                    <FieldCard label="Centroid Longitude" value={`${profile.parcel.centroid_lng.toFixed(6)}°E`} mono />
                    <FieldCard label="Physical GIS Area" value={`${profile.parcel.gis_area_acres} Acres`} highlight />
                    <FieldCard label="Spatial Coordinate System" value="WGS84 EPSG:4326" mono />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-700">Supabase PostGIS Live Sync</span>
            <span>•</span>
            <span>FastAPI Unified Engine</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold transition"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};

const FieldCard: React.FC<{
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  highlight?: boolean;
}> = ({ label, value, mono, highlight }) => (
  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
    <span className="text-[11px] text-slate-500 uppercase font-semibold block">{label}</span>
    <span
      className={`text-sm font-semibold mt-0.5 block ${
        highlight ? 'text-emerald-700 font-bold' : mono ? 'font-mono text-[#0073BB]' : 'text-slate-900'
      }`}
    >
      {value}
    </span>
  </div>
);
