/**
 * LandStack Frontend — API Client
 * Connects to FastAPI backend at http://localhost:8000
 * Member 4: Replace BASE_URL with your deployed Supabase/backend URL
 */

const API = (() => {
  const BASE_URL = 'http://localhost:8000/api';
  let _token = null;

  const headers = () => ({
    'Content-Type': 'application/json',
    ..._token ? { 'Authorization': `Bearer ${_token}` } : {}
  });

  const setToken = (t) => { _token = t; localStorage.setItem('ls_token', t); };
  const getToken = ()  => _token || localStorage.getItem('ls_token');
  const clearToken = () => { _token = null; localStorage.removeItem('ls_token'); };

  // ── Auth ────────────────────────────────────────────────
  const login = async (username, password) => {
    const body = new URLSearchParams({ username, password });
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Login failed');
    const data = await res.json();
    setToken(data.access_token);
    return data;
  };

  const me = async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, { headers: headers() });
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
  };

  // ── Parcels ─────────────────────────────────────────────
  const getParcels = async (skip=0, limit=20) => {
    const res = await fetch(`${BASE_URL}/parcels/?skip=${skip}&limit=${limit}`, { headers: headers() });
    if (!res.ok) throw new Error('Failed to fetch parcels');
    return res.json();
  };

  const getParcel = async (ulpin) => {
    const res = await fetch(`${BASE_URL}/parcels/${ulpin}`, { headers: headers() });
    if (!res.ok) throw new Error(`Parcel ${ulpin} not found`);
    return res.json();
  };

  // ── Unified Profile ──────────────────────────────────────
  const getUnifiedProfile = async (ulpin) => {
    const res = await fetch(`${BASE_URL}/unified/${ulpin}`, { headers: headers() });
    if (!res.ok) throw new Error(`Profile for ${ulpin} not found`);
    return res.json();
  };

  // ── Department endpoints ─────────────────────────────────
  const getRoR          = async (ulpin) => (await fetch(`${BASE_URL}/ror/${ulpin}`,          { headers: headers() })).json();
  const getRegistration = async (ulpin) => (await fetch(`${BASE_URL}/registration/${ulpin}`, { headers: headers() })).json();
  const getTax          = async (ulpin) => (await fetch(`${BASE_URL}/tax/${ulpin}`,          { headers: headers() })).json();
  const getEncumbrance  = async (ulpin) => (await fetch(`${BASE_URL}/encumbrance/${ulpin}`,  { headers: headers() })).json();
  const getLandUse      = async (ulpin) => (await fetch(`${BASE_URL}/land_use/${ulpin}`,     { headers: headers() })).json();
  const getPermits      = async (ulpin) => (await fetch(`${BASE_URL}/building_permits/${ulpin}`, { headers: headers() })).json();
  const getCases        = async (ulpin) => (await fetch(`${BASE_URL}/court_cases/${ulpin}`,  { headers: headers() })).json();

  // ── Area Analysis ────────────────────────────────────────
  const analyzeArea = async (lat, lng, radiusM=500) => {
    const res = await fetch(`${BASE_URL}/area/?lat=${lat}&lng=${lng}&radius_m=${radiusM}`, { headers: headers() });
    if (!res.ok) throw new Error('Area analysis failed');
    return res.json();
  };

  // ── AI Agent Tools ───────────────────────────────────────
  const aiTools = async () => (await fetch(`${BASE_URL}/ai-agent/tools`, { headers: headers() })).json();

  return {
    login, me, setToken, getToken, clearToken,
    getParcels, getParcel, getUnifiedProfile,
    getRoR, getRegistration, getTax, getEncumbrance,
    getLandUse, getPermits, getCases,
    analyzeArea, aiTools
  };
})();

/* ─────────────────────────────────────────────────────────────
   MOCK DATA  (used when backend is offline for demo purposes)
───────────────────────────────────────────────────────────── */
const MOCK = {
  user: { username: 'officer_ravi', role: 'OFFICER', full_name: 'Ravi Kumar' },

  parcels: [
    { ulpin:'UL001', owner_name:'Ramesh Babu',      area_sqm:450,  district:'Bengaluru Urban', taluk:'South', land_type:'Agricultural' },
    { ulpin:'UL002', owner_name:'Lakshmi Devi',     area_sqm:920,  district:'Bengaluru Urban', taluk:'North', land_type:'Residential' },
    { ulpin:'UL003', owner_name:'Mohammed Irfan',   area_sqm:1250, district:'Mysuru',          taluk:'Urban', land_type:'Commercial' },
    { ulpin:'UL004', owner_name:'Sunita Patil',     area_sqm:310,  district:'Bengaluru Rural', taluk:'East',  land_type:'Residential' },
    { ulpin:'UL005', owner_name:'Vijay Nair',       area_sqm:780,  district:'Bengaluru Urban', taluk:'West',  land_type:'Industrial' },
    { ulpin:'UL006', owner_name:'Priya Sharma',     area_sqm:560,  district:'Hubli',           taluk:'Dharwad', land_type:'Agricultural' },
  ],

  profile: (ulpin) => ({
    ulpin,
    parcel: { owner_name:'Ramesh Babu', area_sqm:450, district:'Bengaluru Urban', taluk:'South', land_type:'Agricultural', survey_no:'12/3A' },
    ror:          { owner_name:'Ramesh Babu', father_name:'Gopala Babu', caste_category:'OBC', khata_no:'KH-2021-445', pattadar_name:'Ramesh Babu' },
    registration: { deed_no:'SRO-BLR-2019-8823', deed_type:'Sale Deed', seller_name:'Gopal Reddy', buyer_name:'Ramesh Babu', registration_date:'2019-04-12', market_value:4500000 },
    tax:          { assessment_no:'BBMP-2023-78821', annual_value:18000, tax_amount:3600, status:'PAID', last_paid_date:'2024-01-10' },
    encumbrance:  { bank_name:'State Bank of India', loan_amount:2000000, status:'ACTIVE', mortgaged_date:'2020-06-01', loan_end_date:'2030-06-01' },
    land_use:     { zone_type:'AGRICULTURAL', current_use:'Cultivation', change_requested:false, plan_year:2031 },
    building_permit: null,
    court_cases:  [],
    anomaly_score: 42,
    anomaly_flags: [
      { flag:'Owner name mismatch: RoR says "Ramesh Babu", Registration says "R. Babu"', severity:'medium' },
      { flag:'Active mortgage but no encumbrance NOC in registration documents', severity:'high' },
    ]
  }),

  stats: {
    total_parcels: 12483,
    anomaly_flagged: 238,
    pending_tax: 1892,
    active_mortgages: 3201,
    court_cases: 94,
    registrations_today: 17,
  },

  alerts: [
    { type:'critical', icon:'🚨', title:'Owner-Registration Mismatch — UL001', desc:'RoR owner differs from deed buyer name.', time:'2m ago' },
    { type:'warning',  icon:'⚠️', title:'Overdue Tax — UL004', desc:'Property tax unpaid for 3 consecutive years.', time:'18m ago' },
    { type:'critical', icon:'🔴', title:'Court Stay Active — UL003', desc:'Civil court stay order prevents any transaction.', time:'1h ago' },
    { type:'warning',  icon:'⚠️', title:'Zone Violation — UL002', desc:'Commercial construction in Agricultural zone.', time:'3h ago' },
    { type:'info',     icon:'ℹ️', title:'New Registration — UL006', desc:'Sale deed registered at Hubli SRO.', time:'5h ago' },
  ],

  activity: [
    { color:'#63b3ed', msg:'<strong>Officer Ravi</strong> searched parcel <strong>UL001</strong>',          time:'2 minutes ago' },
    { color:'#48bb78', msg:'<strong>Deed SRO-BLR-2024-1122</strong> registered successfully',                time:'18 minutes ago' },
    { color:'#fc8181', msg:'<strong>UL003</strong> flagged with court stay order',                           time:'1 hour ago' },
    { color:'#f6ad55', msg:'<strong>Tax reminder</strong> sent for 192 overdue parcels',                    time:'3 hours ago' },
    { color:'#b794f4', msg:'<strong>Admin Sharma</strong> updated land-use zone for taluk North',            time:'5 hours ago' },
  ]
};
