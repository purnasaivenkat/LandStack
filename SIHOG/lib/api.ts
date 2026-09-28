/**
 * LandStack Unified Backend & GIS API Integration Client
 * Connects Next.js Frontend with:
 * 1. FastAPI Backend (http://127.0.0.1:8000 via /backend-api rewrite)
 * 2. Supabase PostGIS Database (https://slrjtctvyhhbwwcgomcy.supabase.co)
 * 3. Spatial GIS Engine
 */

export interface ParcelResponse {
  id?: number;
  ulpin: string;
  state: string;
  district: string;
  taluk: string;
  village: string;
  survey_number: string;
  sub_division?: string;
  gis_area_acres: number;
  centroid_lat: number;
  centroid_lng: number;
  geometry_geojson?: string;
  created_at?: string;
}

export interface RoRResponse {
  id?: number;
  ulpin: string;
  khata_number: string;
  primary_owner: string;
  father_name?: string;
  joint_owners?: string;
  document_area_acres: number;
  land_type?: string;
  soil_type?: string;
  mutation_number?: string;
  mutated_date?: string;
}

export interface RegistrationResponse {
  id?: number;
  ulpin: string;
  deed_number: string;
  registration_date?: string;
  sro_name?: string;
  party_seller?: string;
  party_buyer?: string;
  consideration_amount?: number;
  stamp_duty_paid?: number;
  market_value?: number;
  document_url?: string;
}

export interface TaxResponse {
  id?: number;
  ulpin: string;
  assessment_year?: string;
  property_tax_due?: number;
  cess_amount?: number;
  penalties?: number;
  total_paid?: number;
  payment_status: 'PAID' | 'OVERDUE' | 'PARTIAL' | 'EXEMPT';
  last_payment_date?: string;
  receipt_number?: string;
}

export interface EncumbranceResponse {
  id?: number;
  ulpin: string;
  has_encumbrance: boolean;
  bank_name?: string;
  loan_account_no?: string;
  mortgage_amount?: number;
  date_of_mortgage?: string;
  status: 'NONE' | 'ACTIVE_MORTGAGE' | 'DISCHARGED' | 'ATTACHMENT';
  ec_certificate_number?: string;
  period_from?: string;
  period_to?: string;
  remarks?: string;
}

export interface LandUseResponse {
  id?: number;
  ulpin: string;
  master_plan_zone?: string;
  current_usage?: string;
  is_converted?: boolean;
  conversion_order_no?: string;
  conversion_date?: string;
  zoning_authority?: string;
  flood_zone_risk?: string;
}

export interface BuildingPermitResponse {
  id?: number;
  ulpin: string;
  permit_number?: string;
  sanctioning_authority?: string;
  sanctioned_floors?: number;
  actual_floors?: number;
  sanctioned_builtup_area_sqft?: number;
  actual_builtup_area_sqft?: number;
  approval_status?: string;
  deviation_detected?: boolean;
  violation_remarks?: string;
}

export interface CourtCaseResponse {
  id?: number;
  ulpin: string;
  has_litigation: boolean;
  case_number?: string;
  court_name?: string;
  case_type?: string;
  petitioner?: string;
  respondent?: string;
  stay_order_active: boolean;
  case_status?: string;
  next_hearing_date?: string;
  case_summary?: string;
}

export interface AnomalyItem {
  type: string;
  category?: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  gis_value?: string;
  record_value?: string;
  delta?: string;
}

export interface RiskSummary {
  risk_score: number;
  score?: number;
  risk_level: 'CLEAN' | 'LOW_RISK' | 'MODERATE_RISK' | 'HIGH_RISK' | 'BLOCKED';
  level?: string;
  anomaly_count: number;
  is_safe_for_transaction: boolean;
  summary: string;
  anomalies?: AnomalyItem[];
}

export interface UnifiedParcelProfile {
  ulpin: string;
  parcel: ParcelResponse;
  ror?: RoRResponse | null;
  registration?: RegistrationResponse | null;
  tax?: TaxResponse | null;
  encumbrance?: EncumbranceResponse | null;
  land_use?: LandUseResponse | null;
  building_permit?: BuildingPermitResponse | null;
  court_case?: CourtCaseResponse | null;
  anomalies: AnomalyItem[];
  risk_summary: RiskSummary;
}

export interface AreaAnalysisSummary {
  total_parcels: number;
  total_gis_area_acres: number;
  total_document_area_acres: number;
  net_area_discrepancy_acres: number;
  litigated_parcels_count: number;
  disputed_parcels_count?: number;
  encumbered_parcels_count: number;
  tax_default_count: number;
  total_tax_arrears: number;
  zoning_breakdown: Record<string, number>;
  overall_health_score: number;
}

export interface AreaAnalysisResponse {
  summary: AreaAnalysisSummary;
  parcels: UnifiedParcelProfile[];
}

export interface SystemStatus {
  status: string;
  system: string;
  version: string;
  database: string;
  supabase: {
    project_id: string;
    url: string;
    schemas: string[];
  };
  demo_ulpins: Record<string, string>;
}

// Fallback base URL: works in browser via /backend-api rewrite or direct localhost:8000
const API_BASE = typeof window !== 'undefined' ? '/backend-api' : 'http://127.0.0.1:8000/api';

/**
 * Fetch Central Backend and Supabase System Status
 */
export async function fetchSystemStatus(): Promise<SystemStatus | null> {
  try {
    const res = await fetch(`${API_BASE}/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Backend status fetch fallback:", err);
    return null;
  }
}

/**
 * Fetch 360-Degree Unified Parcel Profile from Backend
 */
export async function fetchParcelProfile(ulpin: string): Promise<UnifiedParcelProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/parcel-profile/${encodeURIComponent(ulpin)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Backend parcel profile call fallback for ${ulpin}`);
  }

  // Self-contained fallback for direct Vercel deployment
  const u = ulpin.toUpperCase();
  const isBlocked = u === 'UL003';
  const isMismatch = u === 'UL002';
  const isMortgage = u === 'UL004';
  const isTax = u === 'UL005';

  return {
    ulpin: u,
    parcel: {
      ulpin: u,
      survey_number: u === 'UL001' ? '104/1' : (u === 'UL002' ? '104/2' : (u === 'UL003' ? '105' : '106/1')),
      village: 'Kengeri',
      taluk: 'Bengaluru South',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      gis_area_acres: isMismatch ? 3.20 : 2.50,
      centroid_lat: 12.9081,
      centroid_lng: 77.4878
    },
    ror: {
      ulpin: u,
      khata_number: 'KH-2024-8901',
      primary_owner: u === 'UL001' ? 'Ravi Kumar' : (u === 'UL002' ? 'Smt. Lakshmi Devi' : (u === 'UL003' ? 'Ramesh Gowda' : 'Anand Sharma')),
      document_area_acres: isMismatch ? 2.80 : 2.50,
      land_type: 'Agricultural Dry',
      mutation_number: 'MUT-2022-0941'
    },
    registration: {
      ulpin: u,
      deed_number: 'DEED/BNG/2021/4891',
      party_seller: 'Muniswamy Gowda',
      party_buyer: 'Ravi Kumar',
      consideration_amount: 4500000,
      stamp_duty_paid: 250000
    },
    encumbrance: {
      ulpin: u,
      has_encumbrance: isMortgage,
      bank_name: isMortgage ? 'State Bank of India' : 'None',
      loan_amount: isMortgage ? 45000000 : 0,
      encumbrance_status: isMortgage ? 'ACTIVE_LIEN' : 'NIL_ENCUMBRANCE'
    },
    tax: {
      ulpin: u,
      assessment_year: '2025-2026',
      property_tax_due: isTax ? 78000 : 0,
      payment_status: isTax ? 'DEFAULTED' : 'PAID'
    },
    court_case: {
      ulpin: u,
      has_litigation: isBlocked,
      stay_order_active: isBlocked,
      case_number: isBlocked ? 'OS/442/2023' : undefined,
      court_name: isBlocked ? 'Senior Civil Court, Bengaluru' : undefined,
      case_status: isBlocked ? 'STAY_ORDER_ACTIVE' : 'DISPOSED'
    },
    anomalies: isBlocked
      ? [{ anomaly_type: 'COURT_STAY', description: 'Active Order 39 stay order restraining conveyance.', severity: 'CRITICAL', department: 'dept_judiciary' }]
      : isMismatch
      ? [{ anomaly_type: 'AREA_MISMATCH', description: 'GIS Area (3.20 Ac) exceeds RoR Document Area (2.80 Ac) by 0.40 acres.', severity: 'HIGH', department: 'dept_gis' }]
      : isMortgage
      ? [{ anomaly_type: 'BANK_MORTGAGE', description: 'Active commercial bank mortgage lien for ₹4.5 Crore.', severity: 'MODERATE', department: 'dept_banking' }]
      : [],
    risk_summary: {
      risk_score: isBlocked ? 95 : (isMismatch ? 65 : (isMortgage ? 45 : (isTax ? 40 : 0))),
      risk_level: isBlocked ? 'BLOCKED' : (isMismatch ? 'HIGH_RISK' : (isMortgage ? 'MODERATE_RISK' : 'CLEAN')),
      is_safe_for_transaction: !isBlocked && !isMismatch
    }
  };
}

/**
 * Perform Area Analysis across a list of ULPINs
 */
export async function fetchAreaAnalysis(ulpins: string[]): Promise<AreaAnalysisResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/area-analysis/by-ulpins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ulpins })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Error running area analysis:", err);
    return null;
  }
}

/**
 * Fetch RBAC Demo Tokens
 */
export async function fetchDemoTokens(): Promise<Record<string, { role: string; token: string; description: string }> | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/demo-tokens`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return null;
  }
}
