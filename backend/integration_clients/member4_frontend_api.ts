/**
 * 🎨 LandStack Frontend Integration API Client (For Member 4 — Frontend Lead)
 * 
 * Provides TypeScript interfaces and API methods to connect React/Next.js/Vue
 * with Member 2's FastAPI backend.
 */

export interface Parcel {
  ulpin: string;
  state: string;
  district: string;
  taluk: string;
  village: string;
  survey_number: string;
  sub_division?: string;
  gis_area_acres: number;
  centroid_lat?: number;
  centroid_lng?: number;
  geometry_geojson?: string;
}

export interface RoR {
  id: number;
  ulpin: string;
  khata_number: string;
  primary_owner: string;
  father_name?: string;
  joint_owners?: string;
  document_area_acres: number;
  land_type: string;
  soil_type?: string;
  mutated_date?: string;
}

export interface Registration {
  id: number;
  ulpin: string;
  deed_number: string;
  registration_date: string;
  sro_name: string;
  party_seller: string;
  party_buyer: string;
  consideration_amount: number;
  stamp_duty_paid: number;
  market_value: number;
}

export interface Tax {
  id: number;
  ulpin: string;
  assessment_year: string;
  property_tax_due: number;
  cess_amount: number;
  total_paid: number;
  payment_status: 'PAID' | 'PARTIAL' | 'DUE' | 'DEFAULTED';
  receipt_number?: string;
}

export interface Encumbrance {
  id: number;
  ulpin: string;
  has_encumbrance: boolean;
  bank_name?: string;
  mortgage_amount?: number;
  status: 'NONE' | 'ACTIVE' | 'RELEASED';
  ec_certificate_number?: string;
}

export interface LandUse {
  id: number;
  ulpin: string;
  master_plan_zone: string;
  current_usage: string;
  is_converted: boolean;
  conversion_order_no?: string;
}

export interface BuildingPermit {
  id: number;
  ulpin: string;
  permit_number?: string;
  sanctioned_floors: number;
  actual_floors: number;
  approval_status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'NO_PERMIT';
  deviation_detected: boolean;
}

export interface CourtCase {
  id: number;
  ulpin: string;
  has_litigation: boolean;
  case_number?: string;
  court_name?: string;
  stay_order_active: boolean;
  case_status: 'PENDING' | 'STAY_GRANTED' | 'DISPOSED_FAVOURABLE' | 'NO_LITIGATION';
  case_summary?: string;
}

export interface AnomalyItem {
  category: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  gis_value?: string;
  record_value?: string;
  delta?: string;
}

export interface RiskSummary {
  score: number; // 0 to 100
  level: 'CLEAN' | 'LOW_RISK' | 'MODERATE_RISK' | 'HIGH_RISK' | 'BLOCKED';
  anomaly_count: number;
  is_safe_for_transaction: boolean;
  summary: string;
}

export interface UnifiedParcelProfile {
  ulpin: string;
  parcel: Parcel;
  ror?: RoR;
  registration?: Registration;
  tax?: Tax;
  encumbrance?: Encumbrance;
  land_use?: LandUse;
  building_permit?: BuildingPermit;
  court_case?: CourtCase;
  anomalies: AnomalyItem[];
  risk_summary: RiskSummary;
}

export interface AreaAnalysisSummary {
  total_parcels: number;
  total_gis_area_acres: number;
  total_doc_area_acres: number;
  area_discrepancy_acres: number;
  disputed_parcels_count: number;
  encumbered_parcels_count: number;
  tax_default_count: number;
  total_tax_dues: number;
  zoning_breakdown: Record<string, number>;
  overall_health_score: number;
}

export interface AreaAnalysisResponse {
  summary: AreaAnalysisSummary;
  parcels: UnifiedParcelProfile[];
}

export class LandStackApiService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://127.0.0.1:8000') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  /**
   * Fetch Flagship Unified Parcel Profile (All 8 subsystems in 1 call)
   */
  async getUnifiedProfile(ulpin: string): Promise<UnifiedParcelProfile> {
    const res = await fetch(`${this.baseUrl}/api/parcel-profile/${ulpin.trim()}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch parcel profile for ${ulpin}: ${res.statusText}`);
    }
    return res.json();
  }

  /**
   * Batch Area Analysis for multiple selected ULPINs (from Map)
   */
  async getAreaAnalysis(ulpins: string[]): Promise<AreaAnalysisResponse> {
    const res = await fetch(`${this.baseUrl}/api/area-analysis/by-ulpins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ulpins }),
    });
    if (!res.ok) {
      throw new Error(`Failed to analyze area: ${res.statusText}`);
    }
    return res.json();
  }

  /**
   * List all available parcels
   */
  async listParcels(): Promise<Parcel[]> {
    const res = await fetch(`${this.baseUrl}/api/parcels`);
    if (!res.ok) throw new Error('Failed to list parcels');
    return res.json();
  }
}

export const landStackApi = new LandStackApiService();
