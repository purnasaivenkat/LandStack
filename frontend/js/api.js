/**
 * LandStack Frontend — API Client (LIVE + MOCK FALLBACK)
 * Backend: FastAPI at http://localhost:8000
 * Real endpoints mapped to exact backend route prefixes.
 */

const API = (() => {
  const BASE = 'http://localhost:8000/api';
  let _token = localStorage.getItem('ls_token') || null;

  // ── Token helpers ──────────────────────────────────────────
  const setToken = (t) => { _token = t; localStorage.setItem('ls_token', t); };
  const getToken = ()  => _token;
  const clearToken= () => { _token = null; localStorage.removeItem('ls_token'); };

  const hdrs = (extra={}) => ({
    'Content-Type': 'application/json',
    ...(_token ? { Authorization: `Bearer ${_token}` } : {}),
    ...extra
  });

  // ── Generic fetch with error handling ─────────────────────
  const call = async (path, opts={}) => {
    const res = await fetch(`${BASE}${path}`, { headers: hdrs(), ...opts });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  };

  // ── Auth ────────────────────────────────────────────────────
  // POST /api/auth/login  (OAuth2 form)
  const login = async (username, password) => {
    const body = new URLSearchParams({ username, password });
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(err.detail || 'Login failed');
    }
    const data = await res.json();
    setToken(data.access_token);
    return data;   // { access_token, token_type, role, username }
  };

  // GET /api/auth/me
  const me = () => call('/auth/me');

  // GET /api/auth/demo-tokens
  const demoTokens = () => call('/auth/demo-tokens');

  // ── Parcels ─────────────────────────────────────────────────
  // GET /api/parcels?limit=50
  const getParcels = (limit=50) => call(`/parcels?limit=${limit}`);
  // GET /api/parcels/{ulpin}
  const getParcel  = (ulpin) => call(`/parcels/${encodeURIComponent(ulpin)}`);

  // ── Unified Profile (flagship) ───────────────────────────────
  // GET /api/parcel-profile/{ulpin}
  const getProfile = (ulpin) => call(`/parcel-profile/${encodeURIComponent(ulpin)}`);

  // ── Individual department endpoints ─────────────────────────
  // GET /api/ror/{ulpin}
  const getRoR          = (u) => call(`/ror/${u}`).catch(()=>null);
  // GET /api/registration/{ulpin}
  const getRegistration = (u) => call(`/registration/${u}`).catch(()=>null);
  // GET /api/tax/{ulpin}
  const getTax          = (u) => call(`/tax/${u}`).catch(()=>null);
  // GET /api/encumbrance/{ulpin}
  const getEncumbrance  = (u) => call(`/encumbrance/${u}`).catch(()=>null);
  // GET /api/land_use/{ulpin}
  const getLandUse      = (u) => call(`/land_use/${u}`).catch(()=>null);
  // GET /api/building_permits/{ulpin}
  const getPermits      = (u) => call(`/building_permits/${u}`).catch(()=>null);
  // GET /api/court_cases/{ulpin}
  const getCases        = (u) => call(`/court_cases/${u}`).catch(()=>null);

  // ── Area Analysis ────────────────────────────────────────────
  // POST /api/area-analysis/by-ulpins
  const analyzeArea = (ulpins) => call('/area-analysis/by-ulpins', {
    method: 'POST',
    body: JSON.stringify({ ulpins })
  });

  // ── AI Agent tools ────────────────────────────────────────────
  // GET /api/ai-agent/tools
  const aiTools = () => call('/ai-agent/tools');

  // ── Health check ─────────────────────────────────────────────
  const health = () => fetch('http://localhost:8000/').then(r => r.ok).catch(() => false);

  return {
    setToken, getToken, clearToken,
    login, me, demoTokens,
    getParcels, getParcel,
    getProfile,
    getRoR, getRegistration, getTax, getEncumbrance,
    getLandUse, getPermits, getCases,
    analyzeArea, aiTools, health
  };
})();

/* ─────────────────────────────────────────────────────────────
   MOCK DATA — used only when backend is unreachable
───────────────────────────────────────────────────────────── */
const MOCK = {
  user: { username: 'officer_ravi', role: 'OFFICER', full_name: 'Ravi Kumar' },

  parcels: [
    { ulpin:'UL001', owner_name:'Ramesh Babu',    area_sqm:4500,  district:'Bengaluru Urban', village:'Doddakallasandra', taluk:'South',  land_type:'Agricultural',  survey_number:'12/3A', centroid_lat:12.89, centroid_lng:77.59 },
    { ulpin:'UL002', owner_name:'Lakshmi Devi',   area_sqm:9200,  district:'Bengaluru Urban', village:'Yelahanka',        taluk:'North',  land_type:'Residential',   survey_number:'45/2B', centroid_lat:13.10, centroid_lng:77.59 },
    { ulpin:'UL003', owner_name:'Mohammed Irfan', area_sqm:12500, district:'Mysuru',          village:'Vijayanagar',      taluk:'Urban',  land_type:'Commercial',    survey_number:'78/1C', centroid_lat:12.29, centroid_lng:76.64 },
    { ulpin:'UL004', owner_name:'Sunita Patil',   area_sqm:3100,  district:'Bengaluru Rural', village:'Devanahalli',      taluk:'East',   land_type:'Residential',   survey_number:'33/4A', centroid_lat:13.24, centroid_lng:77.71 },
    { ulpin:'UL005', owner_name:'Vijay Nair',     area_sqm:7800,  district:'Bengaluru Urban', village:'Peenya',           taluk:'West',   land_type:'Industrial',    survey_number:'99/1D', centroid_lat:13.03, centroid_lng:77.52 },
    { ulpin:'UL006', owner_name:'Priya Sharma',   area_sqm:5600,  district:'Hubli',           village:'Vidyanagar',       taluk:'Dharwad',land_type:'Agricultural',  survey_number:'21/7B', centroid_lat:15.36, centroid_lng:75.12 },
  ],

  profile: (ulpin) => {
    const descriptions = {
      UL001: { anomaly_score: 5,  label: 'Clean', flags: [] },
      UL002: { anomaly_score: 45, label: 'Area Mismatch', flags: [
        { flag:'Area mismatch: GIS 3.20 acres vs RoR 2.80 acres (+14.3%)', severity:'medium' }]},
      UL003: { anomaly_score: 95, label: 'Court Stay', flags: [
        { flag:'Active court stay order — no transactions permitted', severity:'high' },
        { flag:'Civil suit filed: ownership dispute, pending HC decision', severity:'high' }]},
      UL004: { anomaly_score: 60, label: 'Heavy Mortgage', flags: [
        { flag:'SBI mortgage ₹4.5Cr active — no NOC in deed', severity:'high' }]},
      UL005: { anomaly_score: 72, label: 'Tax Defaulter', flags: [
        { flag:'Property tax unpaid 3 consecutive years (₹78,000 dues)', severity:'high' }]},
      UL006: { anomaly_score: 88, label: 'Zone Violation', flags: [
        { flag:'Unauthorized construction on Green Belt zone', severity:'high' },
        { flag:'Building permit shows 2 floors; structure has 5 floors', severity:'medium' }]},
    };
    const d = descriptions[ulpin] || descriptions.UL001;
    return {
      ulpin, anomaly_score: d.anomaly_score, anomaly_flags: d.flags, risk_label: d.label,
      parcel:       { ulpin, owner_name:'Ramesh Babu', area_sqm:4500, district:'Bengaluru Urban', taluk:'South', land_type:'Agricultural', survey_number:'12/3A', village:'Doddakallasandra', state:'Karnataka' },
      ror:          { khata_no:'KH-2021-445', owner_name:'Ramesh Babu', father_name:'Gopala Babu', caste_category:'OBC', pattadar_name:'Ramesh Babu', recorded_area_acres:1.11 },
      registration: { deed_no:'SRO-BLR-2019-8823', deed_type:'Sale Deed', seller_name:'Gopal Reddy', buyer_name:'Ramesh Babu', registration_date:'2019-04-12', market_value:4500000, stamp_duty:225000, sro_office:'Jayanagar SRO' },
      tax:          { assessment_no:'BBMP-2023-78821', annual_value:18000, tax_amount:3600, status:'PAID', last_paid_date:'2024-01-10', arrears:0 },
      encumbrance:  { bank_name:'State Bank of India', loan_amount:2000000, status:'ACTIVE', mortgaged_date:'2020-06-01', loan_end_date:'2030-06-01', cersai_id:'CERSAI-2020-3341' },
      land_use:     { zone_type:'AGRICULTURAL', current_use:'Cultivation', change_requested:false, plan_year:2031, conversion_order:null },
      building_permit: null,
      court_cases:  []
    };
  },

  stats: { total_parcels:12483, anomaly_flagged:238, pending_tax:1892, active_mortgages:3201, court_cases:94, registrations_today:17 },

  alerts: [
    { type:'critical', icon:'🚨', title:'Owner-Registration Mismatch — UL001', desc:'RoR owner differs from deed buyer name by spelling.', time:'2m ago' },
    { type:'critical', icon:'🔴', title:'Court Stay Active — UL003', desc:'Civil court stay order blocks all transactions.', time:'1h ago' },
    { type:'warning',  icon:'⚠️', title:'Overdue Tax — UL005', desc:'Property tax unpaid for 3 consecutive years (₹78,000).', time:'18m ago' },
    { type:'warning',  icon:'⚠️', title:'Zone Violation — UL006', desc:'Unauthorized 5-floor construction in Green Belt zone.', time:'3h ago' },
    { type:'info',     icon:'ℹ️', title:'New Registration — UL002', desc:'Sale deed registered at Yelahanka SRO.', time:'5h ago' },
  ],

  activity: [
    { color:'#63b3ed', msg:'<strong>Officer Ravi</strong> loaded profile for <strong>UL003</strong>', time:'2 min ago' },
    { color:'#48bb78', msg:'<strong>Deed SRO-BLR-2024-1122</strong> registered at Jayanagar SRO', time:'18 min ago' },
    { color:'#fc8181', msg:'<strong>UL003</strong> flagged — court stay order from HC', time:'1 hour ago' },
    { color:'#f6ad55', msg:'<strong>Tax reminder</strong> dispatched for 192 overdue parcels', time:'3 hours ago' },
    { color:'#b794f4', msg:'<strong>Admin Sharma</strong> updated zoning for North Bengaluru', time:'5 hours ago' },
  ]
};
