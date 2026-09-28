import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css';

// Fix leaflet default marker icons in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
const API = axios.create({ baseURL: API_BASE_URL });

// Color helper by risk level
const getRiskColor = (riskLevel) => {
  switch (riskLevel?.toUpperCase()) {
    case 'BLOCKED':
    case 'CRITICAL':
      return '#ef4444'; // Red
    case 'HIGH':
    case 'HIGH_RISK':
      return '#f97316'; // Orange
    case 'MEDIUM':
    case 'MODERATE':
    case 'MODERATE_RISK':
      return '#f59e0b'; // Amber
    case 'LOW':
    case 'LOW_RISK':
      return '#38bdf8'; // Sky
    case 'CLEAN':
    default:
      return '#10b981'; // Emerald
  }
};

// Initial realistic dataset for all 12 parcels seeded in LandStack database
const INITIAL_PARCELS = [
  {
    ulpin: "UL001",
    label: "UL001 (Survey #104/1)",
    survey_number: "104/1",
    sub_division: "A",
    village: "Kengeri",
    taluk: "Bengaluru South",
    district: "Bengaluru Urban",
    state: "Karnataka",
    gis_area_acres: 3.20,
    document_area_acres: 3.20,
    area_discrepancy: 0.00,
    owner: "Ravi Kumar",
    father_name: "Muniswamy Gowda",
    khata_number: "KH-2021-8901",
    scenario_type: "Clean Title",
    risk_level: "CLEAN",
    risk_score: 0,
    tax_status: "PAID",
    tax_due: 0,
    encumbrance_status: "NONE",
    bank_name: null,
    mortgage_amount: 0,
    court_status: "NO_LITIGATION",
    stay_order_active: false,
    master_plan_zone: "AGRICULTURAL",
    permit_status: "NO_PERMIT",
    color: "#10b981",
    center: [12.9125, 77.4850],
    polygon: [
      [12.9110, 77.4840],
      [12.9110, 77.4860],
      [12.9140, 77.4860],
      [12.9140, 77.4840],
    ],
  },
  {
    ulpin: "UL002",
    label: "UL002 (Survey #104/2)",
    survey_number: "104/2",
    sub_division: "B",
    village: "Kengeri",
    taluk: "Bengaluru South",
    district: "Bengaluru Urban",
    state: "Karnataka",
    gis_area_acres: 3.20,
    document_area_acres: 2.80,
    area_discrepancy: 0.40,
    owner: "Smt. Lakshmi Devi",
    father_name: "W/o Venkataraman",
    khata_number: "KH-2020-5621",
    scenario_type: "Boundary Area Discrepancy",
    risk_level: "MODERATE_RISK",
    risk_score: 35,
    tax_status: "PAID",
    tax_due: 0,
    encumbrance_status: "NONE",
    bank_name: null,
    mortgage_amount: 0,
    court_status: "NO_LITIGATION",
    stay_order_active: false,
    master_plan_zone: "RESIDENTIAL",
    permit_status: "NO_PERMIT",
    color: "#f59e0b",
    center: [12.9135, 77.4870],
    polygon: [
      [12.9110, 77.4860],
      [12.9110, 77.4880],
      [12.9150, 77.4880],
      [12.9150, 77.4860],
    ],
  },
  {
    ulpin: "UL003",
    label: "UL003 (Survey #105)",
    survey_number: "105",
    sub_division: "1",
    village: "Kengeri",
    taluk: "Bengaluru South",
    district: "Bengaluru Urban",
    state: "Karnataka",
    gis_area_acres: 4.50,
    document_area_acres: 4.50,
    area_discrepancy: 0.00,
    owner: "Ramesh Gowda",
    father_name: "Late Byregowda",
    khata_number: "KH-2019-3312",
    scenario_type: "Judicial Stay Order Active",
    risk_level: "BLOCKED",
    risk_score: 80,
    tax_status: "PAID",
    tax_due: 0,
    encumbrance_status: "NONE",
    bank_name: null,
    mortgage_amount: 0,
    court_status: "STAY_ORDER_ACTIVE",
    stay_order_active: true,
    master_plan_zone: "AGRICULTURAL",
    permit_status: "NO_PERMIT",
    color: "#ef4444",
    center: [12.9150, 77.4900],
    polygon: [
      [12.9130, 77.4890],
      [12.9130, 77.4920],
      [12.9170, 77.4920],
      [12.9170, 77.4890],
    ],
  },
  {
    ulpin: "UL004",
    label: "UL004 (Survey #106/1)",
    survey_number: "106/1",
    sub_division: "C",
    village: "Kengeri",
    taluk: "Bengaluru South",
    district: "Bengaluru Urban",
    state: "Karnataka",
    gis_area_acres: 1.50,
    document_area_acres: 1.50,
    area_discrepancy: 0.00,
    owner: "Venkatesh Prasad",
    father_name: "Rama Rao",
    khata_number: "KH-2022-7719",
    scenario_type: "Bank Mortgage Lien (₹4.5 Cr SBI)",
    risk_level: "MODERATE_RISK",
    risk_score: 30,
    tax_status: "PAID",
    tax_due: 0,
    encumbrance_status: "ACTIVE",
    bank_name: "State Bank of India",
    mortgage_amount: 45000000,
    court_status: "NO_LITIGATION",
    stay_order_active: false,
    master_plan_zone: "COMMERCIAL",
    permit_status: "APPROVED",
    color: "#f97316",
    center: [12.9180, 77.4930],
    polygon: [
      [12.9160, 77.4910],
      [12.9160, 77.4940],
      [12.9190, 77.4940],
      [12.9190, 77.4910],
    ],
  },
  {
    ulpin: "UL005",
    label: "UL005 (Survey #107)",
    survey_number: "107",
    sub_division: "2",
    village: "Kengeri",
    taluk: "Bengaluru South",
    district: "Bengaluru Urban",
    state: "Karnataka",
    gis_area_acres: 2.10,
    document_area_acres: 2.10,
    area_discrepancy: 0.00,
    owner: "Anand Rao",
    father_name: "K. N. Rao",
    khata_number: "KH-2018-9940",
    scenario_type: "Tax Defaulter (₹78,000 Overdue)",
    risk_level: "LOW_RISK",
    risk_score: 25,
    tax_status: "DEFAULTED",
    tax_due: 78000,
    encumbrance_status: "NONE",
    bank_name: null,
    mortgage_amount: 0,
    court_status: "NO_LITIGATION",
    stay_order_active: false,
    master_plan_zone: "RESIDENTIAL",
    permit_status: "NO_PERMIT",
    color: "#38bdf8",
    center: [12.9210, 77.4960],
    polygon: [
      [12.9190, 77.4940],
      [12.9190, 77.4980],
      [12.9230, 77.4980],
      [12.9230, 77.4940],
    ],
  },
  {
    ulpin: "UL006",
    label: "UL006 (Survey #108)",
    survey_number: "108",
    sub_division: "A",
    village: "Kengeri",
    taluk: "Bengaluru South",
    district: "Bengaluru Urban",
    state: "Karnataka",
    gis_area_acres: 1.80,
    document_area_acres: 1.80,
    area_discrepancy: 0.00,
    owner: "Horizon Logistics LLP",
    father_name: "Rep by Partner M. Jain",
    khata_number: "KH-2021-4431",
    scenario_type: "Green Belt & Building Deviation",
    risk_level: "HIGH_RISK",
    risk_score: 70,
    tax_status: "PAID",
    tax_due: 0,
    encumbrance_status: "NONE",
    bank_name: null,
    mortgage_amount: 0,
    court_status: "NO_LITIGATION",
    stay_order_active: false,
    master_plan_zone: "GREEN_BELT",
    permit_status: "APPROVED",
    color: "#ef4444",
    center: [12.9230, 77.4990],
    polygon: [
      [12.9210, 77.4970],
      [12.9210, 77.5010],
      [12.9250, 77.5010],
      [12.9250, 77.4970],
    ],
  },
  {
    ulpin: "UL007",
    label: "UL007 (Survey #115/2)",
    survey_number: "115/2",
    sub_division: "1",
    village: "Kengeri",
    taluk: "Bengaluru South",
    district: "Bengaluru Urban",
    state: "Karnataka",
    gis_area_acres: 3.45,
    document_area_acres: 3.45,
    area_discrepancy: 0.00,
    owner: "Landowner 7 (Bengaluru)",
    father_name: "Sri Krishnappa",
    khata_number: "KH-2023-1107",
    scenario_type: "Clean Agricultural",
    risk_level: "CLEAN",
    risk_score: 0,
    tax_status: "PAID",
    tax_due: 0,
    encumbrance_status: "NONE",
    bank_name: null,
    mortgage_amount: 0,
    court_status: "NO_LITIGATION",
    stay_order_active: false,
    master_plan_zone: "AGRICULTURAL",
    permit_status: "NO_PERMIT",
    color: "#10b981",
    center: [12.9410, 77.5160],
    polygon: [
      [12.9395, 77.5145],
      [12.9395, 77.5175],
      [12.9425, 77.5175],
      [12.9425, 77.5145],
    ],
  },
  {
    ulpin: "UL008",
    label: "UL008 (Survey #116/3)",
    survey_number: "116/3",
    sub_division: "2",
    village: "Kengeri",
    taluk: "Bengaluru South",
    district: "Bengaluru Urban",
    state: "Karnataka",
    gis_area_acres: 3.80,
    document_area_acres: 3.80,
    area_discrepancy: 0.00,
    owner: "Landowner 8 (Bengaluru)",
    father_name: "Sri Narayana",
    khata_number: "KH-2023-1108",
    scenario_type: "Clean Residential",
    risk_level: "CLEAN",
    risk_score: 0,
    tax_status: "PAID",
    tax_due: 0,
    encumbrance_status: "NONE",
    bank_name: null,
    mortgage_amount: 0,
    court_status: "NO_LITIGATION",
    stay_order_active: false,
    master_plan_zone: "RESIDENTIAL",
    permit_status: "APPROVED",
    color: "#10b981",
    center: [12.9440, 77.5190],
    polygon: [
      [12.9425, 77.5175],
      [12.9425, 77.5205],
      [12.9455, 77.5205],
      [12.9455, 77.5175],
    ],
  },
  {
    ulpin: "UL009",
    label: "UL009 (Survey #117/1)",
    survey_number: "117/1",
    sub_division: "A",
    village: "Kengeri",
    taluk: "Bengaluru South",
    district: "Bengaluru Urban",
    state: "Karnataka",
    gis_area_acres: 4.15,
    document_area_acres: 4.15,
    area_discrepancy: 0.00,
    owner: "Landowner 9 (Bengaluru)",
    father_name: "Sri Anjanappa",
    khata_number: "KH-2023-1109",
    scenario_type: "Clean Agricultural",
    risk_level: "CLEAN",
    risk_score: 0,
    tax_status: "PAID",
    tax_due: 0,
    encumbrance_status: "NONE",
    bank_name: null,
    mortgage_amount: 0,
    court_status: "NO_LITIGATION",
    stay_order_active: false,
    master_plan_zone: "AGRICULTURAL",
    permit_status: "NO_PERMIT",
    color: "#10b981",
    center: [12.9470, 77.5220],
    polygon: [
      [12.9455, 77.5205],
      [12.9455, 77.5235],
      [12.9485, 77.5235],
      [12.9485, 77.5205],
    ],
  },
  {
    ulpin: "UL010",
    label: "UL010 (Survey #118/2)",
    survey_number: "118/2",
    sub_division: "B",
    village: "Kengeri",
    taluk: "Bengaluru South",
    district: "Bengaluru Urban",
    state: "Karnataka",
    gis_area_acres: 4.50,
    document_area_acres: 4.50,
    area_discrepancy: 0.00,
    owner: "Landowner 10 (Bengaluru)",
    father_name: "Sri Govindappa",
    khata_number: "KH-2023-1110",
    scenario_type: "Clean Residential",
    risk_level: "CLEAN",
    risk_score: 0,
    tax_status: "PAID",
    tax_due: 0,
    encumbrance_status: "NONE",
    bank_name: null,
    mortgage_amount: 0,
    court_status: "NO_LITIGATION",
    stay_order_active: false,
    master_plan_zone: "RESIDENTIAL",
    permit_status: "APPROVED",
    color: "#10b981",
    center: [12.9500, 77.5250],
    polygon: [
      [12.9485, 77.5235],
      [12.9485, 77.5265],
      [12.9515, 77.5265],
      [12.9515, 77.5235],
    ],
  },
  {
    ulpin: "UL011",
    label: "UL011 (Survey #119/3)",
    survey_number: "119/3",
    sub_division: "1",
    village: "Kengeri",
    taluk: "Bengaluru South",
    district: "Bengaluru Urban",
    state: "Karnataka",
    gis_area_acres: 4.85,
    document_area_acres: 4.85,
    area_discrepancy: 0.00,
    owner: "Landowner 11 (Bengaluru)",
    father_name: "Sri Venkataramana",
    khata_number: "KH-2023-1111",
    scenario_type: "Clean Agricultural",
    risk_level: "CLEAN",
    risk_score: 0,
    tax_status: "PAID",
    tax_due: 0,
    encumbrance_status: "NONE",
    bank_name: null,
    mortgage_amount: 0,
    court_status: "NO_LITIGATION",
    stay_order_active: false,
    master_plan_zone: "AGRICULTURAL",
    permit_status: "NO_PERMIT",
    color: "#10b981",
    center: [12.9530, 77.5280],
    polygon: [
      [12.9515, 77.5265],
      [12.9515, 77.5295],
      [12.9545, 77.5295],
      [12.9545, 77.5265],
    ],
  },
  {
    ulpin: "UL012",
    label: "UL012 (Survey #120/1)",
    survey_number: "120/1",
    sub_division: "2",
    village: "Kengeri",
    taluk: "Bengaluru South",
    district: "Bengaluru Urban",
    state: "Karnataka",
    gis_area_acres: 5.20,
    document_area_acres: 5.20,
    area_discrepancy: 0.00,
    owner: "Landowner 12 (Bengaluru)",
    father_name: "Sri Muniyappa",
    khata_number: "KH-2023-1112",
    scenario_type: "Clean Residential",
    risk_level: "CLEAN",
    risk_score: 0,
    tax_status: "PAID",
    tax_due: 0,
    encumbrance_status: "NONE",
    bank_name: null,
    mortgage_amount: 0,
    court_status: "NO_LITIGATION",
    stay_order_active: false,
    master_plan_zone: "RESIDENTIAL",
    permit_status: "APPROVED",
    color: "#10b981",
    center: [12.9560, 77.5310],
    polygon: [
      [12.9545, 77.5295],
      [12.9545, 77.5325],
      [12.9575, 77.5325],
      [12.9575, 77.5295],
    ],
  },
];

// Map Viewport Recenter Helper
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      map.flyTo(center, 15, { duration: 1.0 });
    }
  }, [center, map]);
  return null;
}

// 1. LOGIN COMPONENT
function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (user = username, pass = password) => {
    setLoading(true);
    setError(null);
    try {
      let res;
      try {
        res = await API.post('/auth/login-json', { username: user, password: pass });
      } catch {
        const formData = new URLSearchParams();
        formData.append('username', user);
        formData.append('password', pass);
        res = await API.post('/auth/login', formData);
      }

      const { access_token, role, username: authUser } = res.data;
      localStorage.setItem('landstack_token', access_token);
      localStorage.setItem('landstack_user', JSON.stringify({ username: authUser, role }));
      onLoginSuccess(access_token, { username: authUser, role });
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const quickDemoLogin = (role, user, pass) => {
    setUsername(user);
    setPassword(pass);
    handleLogin(user, pass);
  };

  const handleInstantTokenBypass = async () => {
    setLoading(true);
    try {
      const res = await API.get('/auth/demo-tokens');
      const token = res.data.ADMIN_TOKEN.replace('Bearer ', '');
      localStorage.setItem('landstack_token', token);
      localStorage.setItem('landstack_user', JSON.stringify({ username: 'demo_admin', role: 'ADMIN' }));
      onLoginSuccess(token, { username: 'demo_admin', role: 'ADMIN' });
    } catch {
      setError('Could not fetch demo tokens.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-hero-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">🌐</div>
          <h1 className="auth-title">LandStack</h1>
          <p className="auth-desc">Unified Geospatial Land Intelligence & Multi-Registry Governance</p>
        </div>

        {error && (
          <div className="error-banner">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              placeholder="e.g. citizen, officer, or admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In to Workspace →'}
          </button>
        </form>

        <div className="demo-login-divider">
          <span>or Quick 1-Click Role Login</span>
        </div>

        <div className="demo-roles-grid">
          <button
            type="button"
            className="demo-role-btn"
            onClick={() => quickDemoLogin('CITIZEN', 'citizen', 'citizen123')}
          >
            <span className="demo-role-icon">👤</span>
            <span className="demo-role-name">Citizen</span>
            <span className="demo-role-creds">citizen / citizen123</span>
          </button>

          <button
            type="button"
            className="demo-role-btn"
            onClick={() => quickDemoLogin('OFFICER', 'officer', 'officer123')}
          >
            <span className="demo-role-icon">👮</span>
            <span className="demo-role-name">Revenue Officer</span>
            <span className="demo-role-creds">officer / officer123</span>
          </button>

          <button
            type="button"
            className="demo-role-btn"
            onClick={() => quickDemoLogin('ADMIN', 'admin', 'admin123')}
          >
            <span className="demo-role-icon">⚡</span>
            <span className="demo-role-name">Admin</span>
            <span className="demo-role-creds">admin / admin123</span>
          </button>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            type="button"
            style={{ background: 'transparent', color: '#38bdf8', fontSize: '12px', textDecoration: 'underline', border: 'none', cursor: 'pointer' }}
            onClick={handleInstantTokenBypass}
          >
            ⚡ Instant Admin Token Access
          </button>
        </div>
      </div>
    </div>
  );
}

// 2. GIS MAP & EXPLORER VIEW (WITH LIVE PARCEL INSPECTOR)
function GisExplorer({ parcels, selectedUlpin, onSelectParcel, onOpenProfile, onOpenAI }) {
  const [activeParcel, setActiveParcel] = useState(() => {
    return parcels.find(p => p.ulpin === selectedUlpin) || parcels[0];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL', 'DISCREPANCY', 'LITIGATION', 'ENCUMBERED', 'CLEAN'
  const [inspectorOpen, setInspectorOpen] = useState(true);

  // Synchronize when selectedUlpin prop changes
  useEffect(() => {
    const found = parcels.find(p => p.ulpin === selectedUlpin);
    if (found) {
      setActiveParcel(found);
      setInspectorOpen(true);
    }
  }, [selectedUlpin, parcels]);

  // Filtered parcels for sidebar
  const filteredParcels = useMemo(() => {
    return parcels.filter(p => {
      const q = searchQuery.toLowerCase();
      const matchesQuery = !searchQuery ||
        p.ulpin.toLowerCase().includes(q) ||
        p.survey_number.toLowerCase().includes(q) ||
        (p.owner && p.owner.toLowerCase().includes(q)) ||
        (p.village && p.village.toLowerCase().includes(q));

      if (!matchesQuery) return false;

      if (filterMode === 'DISCREPANCY') return Math.abs(p.area_discrepancy || 0) > 0.01;
      if (filterMode === 'LITIGATION') return p.stay_order_active || p.court_status !== 'NO_LITIGATION';
      if (filterMode === 'ENCUMBERED') return p.encumbrance_status !== 'NONE';
      if (filterMode === 'CLEAN') return p.risk_level === 'CLEAN';
      return true;
    });
  }, [parcels, searchQuery, filterMode]);

  const handleParcelClick = (p) => {
    setActiveParcel(p);
    setInspectorOpen(true);
    onSelectParcel(p.ulpin);
  };

  return (
    <div className="gis-layout-grid">
      {/* Map Center Area */}
      <div className="gis-map-card">
        <MapContainer
          center={activeParcel.center}
          zoom={15}
          style={{ height: '100%', width: '100%', borderRadius: '16px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapRecenter center={activeParcel.center} />

          {parcels.map((p) => {
            const isSelected = p.ulpin === activeParcel.ulpin;
            return (
              <React.Fragment key={p.ulpin}>
                <Polygon
                  positions={p.polygon}
                  pathOptions={{
                    color: p.color,
                    fillColor: p.color,
                    fillOpacity: isSelected ? 0.65 : 0.25,
                    weight: isSelected ? 3.5 : 1.5,
                  }}
                  eventHandlers={{
                    click: () => handleParcelClick(p),
                  }}
                >
                  <Popup>
                    <div style={{ padding: '6px', minWidth: '180px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <strong style={{ color: '#38bdf8', fontSize: '14px' }}>{p.ulpin}</strong>
                        <span className={`risk-pill-badge risk-${p.risk_level}`}>
                          {p.risk_level}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
                        Owner: <strong>{p.owner || 'N/A'}</strong>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        Survey #{p.survey_number} • {p.village}
                      </div>
                      <div style={{ fontSize: '11.5px', marginTop: '4px', color: '#cbd5e1' }}>
                        GIS: <strong>{p.gis_area_acres} ac</strong> | Doc: <strong>{p.document_area_acres} ac</strong>
                      </div>
                      <button
                        style={{
                          marginTop: '8px',
                          width: '100%',
                          background: '#0284c7',
                          color: '#fff',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: 700
                        }}
                        onClick={() => onOpenProfile(p.ulpin)}
                      >
                        Inspect 360° Profile →
                      </button>
                    </div>
                  </Popup>
                </Polygon>

                <Marker position={p.center} eventHandlers={{ click: () => handleParcelClick(p) }}>
                  <Popup>
                    <div style={{ padding: '4px' }}>
                      <strong>{p.ulpin} Centroid</strong><br />
                      Survey: #{p.survey_number} ({p.village})<br />
                      Owner: {p.owner || 'N/A'}
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>

        {/* Live Floating Parcel Inspector Card on Top of Map */}
        {inspectorOpen && activeParcel && (
          <div className="floating-inspector">
            <div className="inspector-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="inspector-ulpin">{activeParcel.ulpin}</span>
                  <span className={`risk-pill-badge risk-${activeParcel.risk_level}`}>
                    {activeParcel.risk_level} (Score: {activeParcel.risk_score})
                  </span>
                </div>
                <div className="inspector-subtext">
                  Survey #{activeParcel.survey_number} • {activeParcel.village}, {activeParcel.district}
                </div>
              </div>
              <button
                className="inspector-close-btn"
                onClick={() => setInspectorOpen(false)}
                title="Dismiss inspector"
              >
                ✕
              </button>
            </div>

            {/* Linked Data Attributes Grid */}
            <div className="inspector-stats-grid">
              <div className="inspector-stat-box">
                <div className="inspector-stat-label">Title Owner (RoR)</div>
                <div className="inspector-stat-val" title={activeParcel.owner}>
                  {activeParcel.owner || 'Unassigned'}
                </div>
              </div>

              <div className="inspector-stat-box">
                <div className="inspector-stat-label">Area Discrepancy</div>
                <div
                  className="inspector-stat-val"
                  style={{ color: activeParcel.area_discrepancy > 0.01 ? '#f59e0b' : '#34d399' }}
                >
                  {activeParcel.area_discrepancy > 0.01
                    ? `⚠️ ${activeParcel.area_discrepancy.toFixed(2)} Ac mismatch`
                    : '✅ Exact Match'}
                </div>
              </div>

              <div className="inspector-stat-box">
                <div className="inspector-stat-label">GIS Area (Measured)</div>
                <div className="inspector-stat-val">{activeParcel.gis_area_acres} Acres</div>
              </div>

              <div className="inspector-stat-box">
                <div className="inspector-stat-label">Document Area (RoR)</div>
                <div className="inspector-stat-val">{activeParcel.document_area_acres} Acres</div>
              </div>
            </div>

            {/* Subsystem Live Badges */}
            <div className="inspector-badges-row">
              {activeParcel.stay_order_active ? (
                <span className="inspector-tag danger">⚠️ Court Stay Active</span>
              ) : (
                <span className="inspector-tag clean">⚖️ Clean Injunction</span>
              )}

              {activeParcel.tax_status === 'DEFAULTED' ? (
                <span className="inspector-tag warning">💰 Tax Defaulter (₹{activeParcel.tax_due?.toLocaleString('en-IN')})</span>
              ) : (
                <span className="inspector-tag clean">💰 Tax Paid</span>
              )}

              {activeParcel.encumbrance_status === 'ACTIVE' ? (
                <span className="inspector-tag warning">🏦 {activeParcel.bank_name || 'Bank Mortgage'}</span>
              ) : (
                <span className="inspector-tag clean">🏦 Nil Encumbrance</span>
              )}

              <span className="inspector-tag clean">
                📐 {activeParcel.master_plan_zone || 'Agricultural'}
              </span>
            </div>

            {/* Actions */}
            <div className="inspector-actions">
              <button
                className="inspector-btn-primary"
                onClick={() => onOpenProfile(activeParcel.ulpin)}
              >
                Inspect 360° Profile & Dossier →
              </button>
              <button
                className="inspector-btn-secondary"
                onClick={() => onOpenAI(activeParcel.ulpin)}
                title="Ask AI Copilot about this parcel"
              >
                🤖 AI Copilot
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cadastral Sidebar */}
      <div className="gis-sidebar-card">
        <div className="sidebar-title">
          <span>Cadastral Registry</span>
          <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700 }}>
            {parcels.length} Synced
          </span>
        </div>

        {/* Search Box */}
        <div className="sidebar-search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search ULPIN, Survey, or Owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="sidebar-filter-pills">
          <button
            className={`sidebar-filter-pill ${filterMode === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterMode('ALL')}
          >
            All ({parcels.length})
          </button>
          <button
            className={`sidebar-filter-pill ${filterMode === 'DISCREPANCY' ? 'active' : ''}`}
            onClick={() => setFilterMode('DISCREPANCY')}
          >
            Discrepancies
          </button>
          <button
            className={`sidebar-filter-pill ${filterMode === 'LITIGATION' ? 'active' : ''}`}
            onClick={() => setFilterMode('LITIGATION')}
          >
            Stays / Litigation
          </button>
          <button
            className={`sidebar-filter-pill ${filterMode === 'CLEAN' ? 'active' : ''}`}
            onClick={() => setFilterMode('CLEAN')}
          >
            Clean Titles
          </button>
        </div>

        {/* Parcels List */}
        <div className="parcel-list-items">
          {filteredParcels.map((p) => {
            const isSelected = activeParcel.ulpin === p.ulpin;
            return (
              <div
                key={p.ulpin}
                className={`parcel-list-item ${isSelected ? 'selected' : ''}`}
                onClick={() => handleParcelClick(p)}
              >
                <div className="item-top">
                  <span className="item-ulpin">{p.ulpin}</span>
                  <span className={`risk-pill-badge risk-${p.risk_level}`}>{p.risk_level}</span>
                </div>

                <div className="item-village">
                  <strong>{p.owner || 'Unknown Owner'}</strong> • Survey #{p.survey_number}
                </div>

                <div className="item-acres" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                  <span>GIS: <strong>{p.gis_area_acres} Ac</strong> | Doc: <strong>{p.document_area_acres} Ac</strong></span>
                  {p.area_discrepancy > 0.01 && (
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>Mismatch!</span>
                  )}
                </div>

                <div style={{ marginTop: '4px', fontSize: '11px', color: p.color }}>
                  Scenario: <strong>{p.scenario_type}</strong>
                </div>
              </div>
            );
          })}
          {filteredParcels.length === 0 && (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '24px 8px', fontSize: '13px' }}>
              No parcels matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 3. 360° UNIFIED PARCEL PROFILE VIEW
function UnifiedProfileView({ token, ulpin, onSelectUlpin, parcels = [] }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subTab, setSubTab] = useState('ror');
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    if (!ulpin) return;
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await API.get(`/parcel-profile/${ulpin}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setProfile(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to fetch parcel profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [ulpin, token]);

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onSelectUlpin(manualInput.trim().toUpperCase());
      setManualInput('');
    }
  };

  return (
    <div className="profile-view-wrapper">
      {/* Top Switcher Bar */}
      <div className="profile-switcher-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8' }}>Select Parcel:</span>
          <select
            className="profile-select-control"
            value={ulpin}
            onChange={(e) => onSelectUlpin(e.target.value)}
          >
            {parcels.map(p => (
              <option key={p.ulpin} value={p.ulpin}>
                {p.ulpin}: Survey #{p.survey_number} — {p.owner || 'Unknown'} ({p.risk_level})
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={handleManualSearch} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Search custom ULPIN (e.g. UL003)..."
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid var(--border-subtle)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12.5px'
            }}
          />
          <button
            type="submit"
            style={{
              background: '#0284c7',
              color: '#fff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '12.5px',
              cursor: 'pointer'
            }}
          >
            Load Profile
          </button>
        </form>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div className="pulse-dot" style={{ width: '16px', height: '16px', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#94a3b8' }}>Aggregating 360° Records for {ulpin} from Cadastral, Tax, EC & Judicial Registries...</p>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {profile && !loading && (
        <>
          {/* Top Banner with Identity & Executive Risk Assessment */}
          <div className="profile-top-banner">
            <div className="profile-identity-col">
              <div>
                <div className="parcel-badge-row">
                  <span className="ulpin-badge">{profile.parcel.ulpin}</span>
                  <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 700 }}>● Cadastral Verified</span>
                </div>
                <div className="parcel-loc-text" style={{ marginTop: '8px' }}>
                  Survey #{profile.parcel.survey_number} • {profile.parcel.village}, {profile.parcel.taluk}, {profile.parcel.district}, {profile.parcel.state}
                </div>
              </div>

              <div className="stats-micro-grid">
                <div className="stat-micro-box">
                  <div className="stat-micro-label">GIS Area</div>
                  <div className="stat-micro-val">{profile.parcel.gis_area_acres} Acres</div>
                </div>
                <div className="stat-micro-box">
                  <div className="stat-micro-label">Document Area</div>
                  <div className="stat-micro-val">
                    {profile.ror ? `${profile.ror.document_area_acres} Acres` : 'N/A'}
                  </div>
                </div>
                <div className="stat-micro-box">
                  <div className="stat-micro-label">Title Owner</div>
                  <div className="stat-micro-val" style={{ fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {profile.ror ? profile.ror.primary_owner : 'Unknown'}
                  </div>
                </div>
              </div>
            </div>

            {/* Executive Risk Scorecard */}
            <div className="risk-card-container">
              <div className="risk-header-row">
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>AI Risk Assessment</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px' }}>
                    Risk Score: {profile.risk_summary.risk_score}/100
                  </div>
                </div>
                <span className={`risk-pill-badge risk-${profile.risk_summary.risk_level}`}>
                  {profile.risk_summary.risk_level}
                </span>
              </div>

              <div className="risk-score-bar-track">
                <div
                  className="risk-score-fill"
                  style={{
                    width: `${Math.max(profile.risk_summary.risk_score, 5)}%`,
                    background: getRiskColor(profile.risk_summary.risk_level),
                  }}
                ></div>
              </div>

              <div className="anomalies-list">
                {profile.risk_summary.anomalies && profile.risk_summary.anomalies.length > 0 ? (
                  profile.risk_summary.anomalies.map((a, idx) => (
                    <div key={idx} className={`anomaly-alert-item severity-${a.severity}`}>
                      <span>🚨</span>
                      <div>
                        <strong>{a.type.replace(/_/g, ' ')}:</strong> {a.description}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="anomaly-clean-state">
                    <span>✅</span>
                    <span>All cross-registry checks passed. Zero legal injunctions or area anomalies detected.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Domain Registry Sub-Tabs */}
          <div className="registry-sub-tabs">
            <button className={`sub-tab-btn ${subTab === 'ror' ? 'active' : ''}`} onClick={() => setSubTab('ror')}>
              📜 Record of Rights (Pahani)
            </button>
            <button className={`sub-tab-btn ${subTab === 'registration' ? 'active' : ''}`} onClick={() => setSubTab('registration')}>
              📑 Sub-Registrar Deed
            </button>
            <button className={`sub-tab-btn ${subTab === 'tax' ? 'active' : ''}`} onClick={() => setSubTab('tax')}>
              💰 Property Tax
            </button>
            <button className={`sub-tab-btn ${subTab === 'ec' ? 'active' : ''}`} onClick={() => setSubTab('ec')}>
              🏦 Encumbrance (EC)
            </button>
            <button className={`sub-tab-btn ${subTab === 'zoning' ? 'active' : ''}`} onClick={() => setSubTab('zoning')}>
              📐 Master Plan & Land Use
            </button>
            <button className={`sub-tab-btn ${subTab === 'permits' ? 'active' : ''}`} onClick={() => setSubTab('permits')}>
              🏗️ Building Permits
            </button>
            <button className={`sub-tab-btn ${subTab === 'court' ? 'active' : ''}`} onClick={() => setSubTab('court')}>
              ⚖️ Court Cases & Injunctions
            </button>
          </div>

          {/* Tab Contents */}
          <div className="registry-card-content">
            {subTab === 'ror' && (
              <div className="fields-grid">
                <div className="field-cell">
                  <span className="field-label">Khata Number</span>
                  <span className="field-value">{profile.ror?.khata_number || 'N/A'}</span>
                </div>
                <div className="field-cell">
                  <span className="field-label">Primary Owner</span>
                  <span className="field-value">{profile.ror?.primary_owner || 'N/A'}</span>
                </div>
                <div className="field-cell">
                  <span className="field-label">Father / Spouse Name</span>
                  <span className="field-value">{profile.ror?.father_name || 'N/A'}</span>
                </div>
                <div className="field-cell">
                  <span className="field-label">Document Registered Acreage</span>
                  <span className="field-value">{profile.ror?.document_area_acres} Acres</span>
                </div>
                <div className="field-cell">
                  <span className="field-label">Land Classification</span>
                  <span className="field-value">{profile.ror?.land_type || 'N/A'}</span>
                </div>
                <div className="field-cell">
                  <span className="field-label">Mutation Order No.</span>
                  <span className="field-value">{profile.ror?.mutation_number || 'N/A'} ({profile.ror?.mutated_date || 'N/A'})</span>
                </div>
              </div>
            )}

            {subTab === 'registration' && (
              <div className="fields-grid">
                <div className="field-cell">
                  <span className="field-label">Deed Document Number</span>
                  <span className="field-value">{profile.registration?.deed_number || 'N/A'}</span>
                </div>
                <div className="field-cell">
                  <span className="field-label">Registration Date</span>
                  <span className="field-value">{profile.registration?.registration_date || 'N/A'}</span>
                </div>
                <div className="field-cell">
                  <span className="field-label">Sub-Registrar Office (SRO)</span>
                  <span className="field-value">{profile.registration?.sro_name || 'N/A'}</span>
                </div>
                <div className="field-cell">
                  <span className="field-label">Seller Party</span>
                  <span className="field-value">{profile.registration?.party_seller || 'N/A'}</span>
                </div>
                <div className="field-cell">
                  <span className="field-label">Buyer Party</span>
                  <span className="field-value">{profile.registration?.party_buyer || 'N/A'}</span>
                </div>
                <div className="field-cell">
                  <span className="field-label">Consideration Amount</span>
                  <span className="field-value">
                    {profile.registration?.consideration_amount ? `₹${profile.registration.consideration_amount.toLocaleString('en-IN')}` : 'N/A'}
                  </span>
                </div>
                <div className="field-cell">
                  <span className="field-label">Stamp Duty Paid</span>
                  <span className="field-value">
                    {profile.registration?.stamp_duty_paid ? `₹${profile.registration.stamp_duty_paid.toLocaleString('en-IN')}` : 'N/A'}
                  </span>
                </div>
                <div className="field-cell">
                  <span className="field-label">Guidance Market Value</span>
                  <span className="field-value">
                    {profile.registration?.market_value ? `₹${profile.registration.market_value.toLocaleString('en-IN')}` : 'N/A'}
                  </span>
                </div>
              </div>
            )}

            {subTab === 'tax' && (
              <div className="fields-grid">
                <div className="field-cell">
                  <span className="field-label">Assessment Year</span>
                  <span className="field-value">{profile.tax?.assessment_year || '2024-2025'}</span>
                </div>
                <div className="field-cell">
                  <span className="field-label">Payment Status</span>
                  <span className={`tag-active-${profile.tax?.payment_status === 'PAID' ? 'no' : 'yes'}`}>
                    {profile.tax?.payment_status || 'UNKNOWN'}
                  </span>
                </div>
                <div className="field-cell">
                  <span className="field-label">Property Tax Due</span>
                  <span className="field-value">₹{profile.tax?.property_tax_due?.toLocaleString('en-IN') || 0}</span>
                </div>
                <div className="field-cell">
                  <span className="field-label">Total Paid Amount</span>
                  <span className="field-value">₹{profile.tax?.total_paid?.toLocaleString('en-IN') || 0}</span>
                </div>
                <div className="field-cell">
                  <span className="field-label">Receipt / Challan Number</span>
                  <span className="field-value">{profile.tax?.receipt_number || 'None'}</span>
                </div>
              </div>
            )}

            {subTab === 'ec' && (
              <div className="fields-grid">
                <div className="field-cell">
                  <span className="field-label">Encumbrance Status</span>
                  <span className={`tag-active-${profile.encumbrance?.has_encumbrance ? 'yes' : 'no'}`}>
                    {profile.encumbrance?.status || 'NONE'}
                  </span>
                </div>
                <div className="field-cell">
                  <span className="field-label">Mortgaging Bank</span>
                  <span className="field-value">{profile.encumbrance?.bank_name || 'None (No Active Bank Lien)'}</span>
                </div>
                <div className="field-cell">
                  <span className="field-label">Mortgage / Charge Amount</span>
                  <span className="field-value">
                    {profile.encumbrance?.mortgage_amount ? `₹${profile.encumbrance.mortgage_amount.toLocaleString('en-IN')}` : '₹0.00'}
                  </span>
                </div>
                <div className="field-cell">
                  <span className="field-label">EC Certificate Number</span>
                  <span className="field-value">{profile.encumbrance?.ec_certificate_number || 'N/A'}</span>
                </div>
                <div className="field-cell" style={{ gridColumn: 'span 2' }}>
                  <span className="field-label">Remarks</span>
                  <span className="field-value">{profile.encumbrance?.remarks || 'Nil encumbrance.'}</span>
                </div>
              </div>
            )}

            {subTab === 'zoning' && (
              <div className="fields-grid">
                <div className="field-cell">
                  <span className="field-label">Master Plan Zone</span>
                  <span className="field-value">{profile.land_use?.master_plan_zone || 'AGRICULTURAL'}</span>
                </div>
                <div className="field-cell">
                  <span className="field-label">Current Ground Usage</span>
                  <span className="field-value">{profile.land_use?.current_usage || 'Cultivation'}</span>
                </div>
                <div className="field-cell">
                  <span className="field-label">Agricultural Conversion (NA Order)</span>
                  <span className={`tag-active-${profile.land_use?.is_converted ? 'no' : 'yes'}`}>
                    {profile.land_use?.is_converted ? 'Converted (NA Approved)' : 'Not Converted (Agricultural)'}
                  </span>
                </div>
                <div className="field-cell">
                  <span className="field-label">Flood Zone Risk</span>
                  <span className="field-value">{profile.land_use?.flood_zone_risk || 'LOW'}</span>
                </div>
              </div>
            )}

            {subTab === 'permits' && (
              <div className="fields-grid">
                <div className="field-cell">
                  <span className="field-label">Permit Status</span>
                  <span className="field-value">{profile.building_permit?.approval_status || 'NO_PERMIT'}</span>
                </div>
                <div className="field-cell">
                  <span className="field-label">Sanctioned Floors</span>
                  <span className="field-value">{profile.building_permit?.sanctioned_floors || 0} Floors</span>
                </div>
                <div className="field-cell">
                  <span className="field-label">Actual Constructed Floors</span>
                  <span className="field-value">{profile.building_permit?.actual_floors || 0} Floors</span>
                </div>
                <div className="field-cell">
                  <span className="field-label">Deviation Detected</span>
                  <span className={`tag-active-${profile.building_permit?.deviation_detected ? 'yes' : 'no'}`}>
                    {profile.building_permit?.deviation_detected ? 'YES - Unauthorized Deviation' : 'NO Deviation'}
                  </span>
                </div>
              </div>
            )}

            {subTab === 'court' && (
              <div className="fields-grid">
                <div className="field-cell">
                  <span className="field-label">Litigation Status</span>
                  <span className={`tag-active-${profile.court_case?.has_litigation ? 'yes' : 'no'}`}>
                    {profile.court_case?.case_status || 'NO_LITIGATION'}
                  </span>
                </div>
                <div className="field-cell">
                  <span className="field-label">Active Stay Order / Injunction</span>
                  <span className={`tag-active-${profile.court_case?.stay_order_active ? 'yes' : 'no'}`}>
                    {profile.court_case?.stay_order_active ? '⚠️ ACTIVE STAY ORDER' : 'No Active Injunction'}
                  </span>
                </div>
                <div className="field-cell">
                  <span className="field-label">Court Name & Case No.</span>
                  <span className="field-value">{profile.court_case?.court_name || 'N/A'} ({profile.court_case?.case_number || 'N/A'})</span>
                </div>
                <div className="field-cell" style={{ gridColumn: 'span 2' }}>
                  <span className="field-label">Case Summary</span>
                  <span className="field-value">{profile.court_case?.case_summary || 'No litigation records.'}</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// 4. MULTI-PARCEL AREA ANALYSIS VIEW
function AreaAnalysisView({ token, onInspectParcel, parcels = [] }) {
  const [selectedUlpins, setSelectedUlpins] = useState(() => parcels.map(p => p.ulpin));
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  // Keep selected up to date if parcels change
  useEffect(() => {
    if (parcels.length > 0 && selectedUlpins.length === 0) {
      setSelectedUlpins(parcels.map(p => p.ulpin));
    }
  }, [parcels]);

  const runAnalysis = async () => {
    if (selectedUlpins.length === 0) {
      alert('Please select at least one parcel for area analysis.');
      return;
    }
    setLoading(true);
    try {
      const res = await API.post(
        '/area-analysis/by-ulpins',
        { ulpins: selectedUlpins },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setAnalysis(res.data);
    } catch {
      alert('Failed to run area analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUlpins.length > 0) {
      runAnalysis();
    }
  }, []);

  const toggleUlpin = (u) => {
    setSelectedUlpins(prev =>
      prev.includes(u) ? prev.filter(x => x !== u) : [...prev, u]
    );
  };

  const handleSelectAll = () => setSelectedUlpins(parcels.map(p => p.ulpin));
  const handleClearAll = () => setSelectedUlpins([]);
  const handleSelectIssuesOnly = () => {
    setSelectedUlpins(parcels.filter(p => p.risk_level !== 'CLEAN').map(p => p.ulpin));
  };

  return (
    <div className="area-analysis-grid">
      {/* Selection Left Panel */}
      <div className="selector-panel">
        <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Select Area Parcels</h3>
        <p style={{ fontSize: '12px', color: '#94a3b8' }}>Include or exclude parcels to simulate cluster risk analysis:</p>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', color: '#cbd5e1', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
            onClick={handleSelectAll}
          >
            Select All ({parcels.length})
          </button>
          <button
            type="button"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', color: '#cbd5e1', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
            onClick={handleClearAll}
          >
            Clear
          </button>
          <button
            type="button"
            style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
            onClick={handleSelectIssuesOnly}
          >
            Issues Only
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
          {parcels.map(p => (
            <label key={p.ulpin} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px' }}>
              <input
                type="checkbox"
                checked={selectedUlpins.includes(p.ulpin)}
                onChange={() => toggleUlpin(p.ulpin)}
              />
              <span style={{ color: p.color }}>●</span>
              <span><strong>{p.ulpin}</strong> (Survey #{p.survey_number})</span>
            </label>
          ))}
        </div>

        <button className="btn-primary" onClick={runAnalysis} disabled={loading}>
          {loading ? 'Analyzing...' : `Re-calculate Metrics (${selectedUlpins.length} selected)`}
        </button>
      </div>

      {/* Analysis Results */}
      <div className="analysis-results-panel">
        {analysis && (
          <>
            <div className="summary-cards-row">
              <div className="summary-stat-card">
                <div className="field-label">Selected Parcels</div>
                <div className="val">{analysis.summary.total_parcels}</div>
              </div>
              <div className="summary-stat-card">
                <div className="field-label">Total GIS Acreage</div>
                <div className="val">{analysis.summary.total_gis_area_acres.toFixed(2)} Ac</div>
              </div>
              <div className="summary-stat-card">
                <div className="field-label">Total Document Area</div>
                <div className="val">{analysis.summary.total_document_area_acres.toFixed(2)} Ac</div>
              </div>
              <div className="summary-stat-card">
                <div className="field-label">Area Discrepancy</div>
                <div className="val" style={{ color: analysis.summary.net_area_discrepancy_acres !== 0 ? '#f59e0b' : '#10b981' }}>
                  {analysis.summary.net_area_discrepancy_acres.toFixed(2)} Ac
                </div>
              </div>
              <div className="summary-stat-card">
                <div className="field-label">Parcels Under Stay Order</div>
                <div className="val" style={{ color: analysis.summary.litigated_parcels_count > 0 ? '#ef4444' : '#10b981' }}>
                  {analysis.summary.litigated_parcels_count}
                </div>
              </div>
              <div className="summary-stat-card">
                <div className="field-label">Total Tax Arrears</div>
                <div className="val" style={{ color: analysis.summary.total_tax_arrears > 0 ? '#f97316' : '#10b981' }}>
                  ₹{analysis.summary.total_tax_arrears.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="summary-stat-card">
                <div className="field-label">Overall Health Score</div>
                <div className="val" style={{ color: '#10b981' }}>
                  {analysis.summary.overall_health_score}/100
                </div>
              </div>
            </div>

            <div className="registry-card-content">
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>Cluster Parcels Breakdown</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                      <th style={{ padding: '8px' }}>ULPIN</th>
                      <th style={{ padding: '8px' }}>Survey #</th>
                      <th style={{ padding: '8px' }}>Owner</th>
                      <th style={{ padding: '8px' }}>GIS Area</th>
                      <th style={{ padding: '8px' }}>Doc Area</th>
                      <th style={{ padding: '8px' }}>Risk Assessment</th>
                      <th style={{ padding: '8px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.parcels.map(p => (
                      <tr key={p.parcel.ulpin} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 8px', fontWeight: 700, color: '#38bdf8' }}>{p.parcel.ulpin}</td>
                        <td style={{ padding: '10px 8px' }}>#{p.parcel.survey_number}</td>
                        <td style={{ padding: '10px 8px' }}>{p.ror?.primary_owner || 'N/A'}</td>
                        <td style={{ padding: '10px 8px' }}>{p.parcel.gis_area_acres} ac</td>
                        <td style={{ padding: '10px 8px' }}>{p.ror?.document_area_acres || 'N/A'} ac</td>
                        <td style={{ padding: '10px 8px' }}>
                          <span className={`risk-pill-badge risk-${p.risk_summary.risk_level}`}>
                            {p.risk_summary.risk_level} ({p.risk_summary.risk_score})
                          </span>
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <button
                            style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', border: 'none', cursor: 'pointer' }}
                            onClick={() => onInspectParcel(p.parcel.ulpin)}
                          >
                            Inspect Dossier →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// 5. AI LAND INTELLIGENCE AGENT CHAT
function AIAgentView({ token, initialUlpin = 'UL001' }) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Greetings! I am the LandStack AI Land Governance Agent. You can ask me to inspect any parcel across Karnataka land registries, verify title ownership, detect area anomalies, audit tax arrears, or check judicial stay orders.',
      toolsUsed: [],
    },
  ]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const samplePrompts = [
    "Compare UL001 and UL002",
    "Show details of UL001, UL002, and UL003",
    "Is UL003 safe for purchase?",
    "Check area discrepancy on UL002",
    "Find bank mortgages on UL004",
    "Check tax arrears on UL005",
    "Show parcels in selected area",
    "Verify clean title for UL001",
  ];

  const handleSend = async (queryText = prompt) => {
    if (!queryText.trim()) return;
    const userMsg = { sender: 'user', text: queryText };
    setMessages(prev => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);

    try {
      const upper = queryText.toUpperCase();
      const matchUlpins = upper.match(/UL\d{3,4}/g);
      const isMulti = matchUlpins && matchUlpins.length > 1;

      // 1. Try unified AI Agent Chat endpoint
      try {
        const chatRes = await API.post(
          '/ai-agent/chat',
          { question: queryText, ulpins: matchUlpins || [] },
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        if (chatRes.data && chatRes.data.answer) {
          setMessages(prev => [
            ...prev,
            {
              sender: 'ai',
              text: chatRes.data.answer,
              toolsUsed: chatRes.data.sources || ['ai_governance_agent'],
              raw: chatRes.data,
              parcelIds: chatRes.data.parcel_ids || [],
            },
          ]);
          setLoading(false);
          return;
        }
      } catch {
        // Fallback to direct execute-tool if /chat not available
      }

      // 2. Direct tool invocation fallback
      let toolName = isMulti ? "get_multiple_parcels_details" : "get_unified_parcel_profile";
      const targetUlpin = matchUlpins ? matchUlpins[0] : (initialUlpin || "UL001");
      let toolArgs = isMulti ? { ulpins: matchUlpins } : { ulpin: targetUlpin };

      if (!isMulti) {
        if (upper.includes("TAX") || upper.includes("ARREARS") || upper.includes("DEFAULTER")) {
          toolName = "get_tax_status";
          toolArgs = { ulpin: targetUlpin };
        } else if (upper.includes("COURT") || upper.includes("STAY") || upper.includes("LITIGATION") || upper.includes("INJUNCTION")) {
          toolName = "get_court_cases";
          toolArgs = { ulpin: targetUlpin };
        } else if (upper.includes("MORTGAGE") || upper.includes("ENCUMBRANCE") || upper.includes("BANK") || upper.includes("LIEN")) {
          toolName = "get_encumbrance_status";
          toolArgs = { ulpin: targetUlpin };
        } else if (upper.includes("ROR") || upper.includes("OWNER") || upper.includes("PAHANI") || upper.includes("KHATA")) {
          toolName = "get_ror";
          toolArgs = { ulpin: targetUlpin };
        } else {
          toolName = "get_unified_parcel_profile";
          toolArgs = { ulpin: targetUlpin };
        }
      }

      const res = await API.post(
        '/ai-agent/tools',
        { tool_name: toolName, arguments: toolArgs },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      const toolResult = res.data;
      let replyText = "";

      if (toolResult.parcels && Array.isArray(toolResult.parcels)) {
        replyText = `### LandStack AI Inspection Report (${toolResult.parcels.length} Parcels)\n\n`;
        toolResult.parcels.forEach((p, idx) => {
          const u = p.ulpin;
          const owner = p.ror?.primary_owner || p.owner || "Unknown";
          const area = p.parcel?.gis_area_acres || p.gis_area_acres || "N/A";
          const risk = p.risk_summary?.risk_level || p.risk_level || "CLEAN";
          const score = p.risk_summary?.risk_score ?? p.risk_score ?? 0;
          const isSafe = p.risk_summary?.is_safe_for_transaction ?? (score <= 30);
          replyText += `**${idx + 1}. Parcel \`${u}\`**\n`;
          replyText += `• Owner: **${owner}** | GIS Area: **${area} acres**\n`;
          replyText += `• Risk: **${risk}** (${score}/100) — ${isSafe ? '✅ Safe to Proceed' : '⛔ Caution / High Risk'}\n\n`;
        });
      } else if (toolResult.risk_summary) {
        replyText = `I executed backend tool **\`${toolName}\`** for parcel \`${targetUlpin}\`:\n\n`;
        replyText += `**Risk Level**: ${toolResult.risk_summary.risk_level} (Score: ${toolResult.risk_summary.risk_score}/100)\n`;
        replyText += `**Recommendation**: ${toolResult.risk_summary.is_safe_for_transaction ? '✅ Safe for Transaction' : '⛔ High Risk / Action Required'}\n\n`;
        if (toolResult.risk_summary.anomalies?.length > 0) {
          replyText += `**Detected Anomalies & Alerts**:\n` + toolResult.risk_summary.anomalies.map(a => `• **${a.type.replace(/_/g, ' ')}**: ${a.description}`).join('\n');
        } else {
          replyText += `✅ Clear Title: Zero encumbrances, court stays, or area discrepancies detected.`;
        }
      } else {
        replyText = `I executed backend tool **\`${toolName}\`**:\n\n` + '```json\n' + JSON.stringify(toolResult, null, 2) + '\n```';
      }

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: replyText,
          toolsUsed: [toolName],
          raw: toolResult,
        },
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: 'Error executing AI tool: ' + (err.response?.data?.detail || err.message),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-agent-container">
      <div className="ai-chat-card">
        <div className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🤖</span>
            <strong>LandStack AI Governance Copilot</strong>
          </div>
          <span className="backend-pill">● Connected to Live AI Tools Hub</span>
        </div>

        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.sender}`}>
              {m.toolsUsed && m.toolsUsed.length > 0 && (
                <div className="tool-execution-pill">
                  ⚡ Tool Executed: {m.toolsUsed.join(', ')}
                </div>
              )}
              <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
            </div>
          ))}
          {loading && (
            <div className="chat-bubble ai">
              <span className="pulse-dot" style={{ display: 'inline-block', marginRight: '8px' }}></span>
              Executing tool against LandStack Relational Registries...
            </div>
          )}
        </div>

        <div className="chat-input-row">
          <input
            type="text"
            placeholder="Ask AI Copilot about any parcel, stay order, or title mismatch..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          />
          <button className="btn-primary" onClick={() => handleSend()} disabled={loading}>
            Send →
          </button>
        </div>
      </div>

      <div className="ai-tools-sidebar">
        <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Quick Audit Scenarios</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {samplePrompts.map((p, i) => (
            <button
              key={i}
              className="preset-chip"
              style={{ textAlign: 'left', width: '100%', cursor: 'pointer' }}
              onClick={() => handleSend(p)}
            >
              💬 {p}
            </button>
          ))}
        </div>

        <h4 style={{ fontSize: '14px', fontWeight: 700, marginTop: '16px' }}>Registered AI Subsystem Tools</h4>
        <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div>• <code>get_unified_parcel_profile</code></div>
          <div>• <code>get_ror</code> (Record of Rights)</div>
          <div>• <code>get_tax_status</code> (Arrears / Defaulter)</div>
          <div>• <code>get_encumbrance_status</code> (Mortgage Lien)</div>
          <div>• <code>get_court_cases</code> (Stay orders & Injunctions)</div>
          <div>• <code>get_parcels_in_area</code> (Spatial Buffer Analysis)</div>
        </div>
      </div>
    </div>
  );
}

// MAIN ROOT APPLICATION
export default function App() {
  const [token, setToken] = useState(localStorage.getItem('landstack_token') || null);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('landstack_user') || '{}');
    } catch {
      return { username: 'citizen', role: 'CITIZEN' };
    }
  });

  const [activeTab, setActiveTab] = useState('gis'); // 'gis', 'profile', 'area', 'ai'
  const [selectedUlpin, setSelectedUlpin] = useState('UL001');
  const [parcels, setParcels] = useState(INITIAL_PARCELS);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Fetch Live Parcels & Profiles from Backend on Load
  useEffect(() => {
    let isMounted = true;
    async function loadLiveParcels() {
      try {
        let rawParcels = [];
        try {
          const res = await API.get('/parcels/enriched/all?limit=1500');
          if (res.data && Array.isArray(res.data) && res.data.length > 0) {
            rawParcels = res.data;
          }
        } catch (e) {
          console.warn('Enriched endpoint error, trying /parcels fallback:', e);
        }

        if (rawParcels.length === 0) {
          const pRes = await API.get('/parcels?limit=1500');
          if (pRes.data && Array.isArray(pRes.data)) {
            rawParcels = pRes.data;
          }
        }

        if (rawParcels.length > 0) {
          const merged = rawParcels.map(p => {
            const fallback = INITIAL_PARCELS.find(ip => ip.ulpin === p.ulpin);

            let polygonCoords = fallback?.polygon || [];
            if (p.geometry_geojson) {
              try {
                const geo = typeof p.geometry_geojson === 'string' ? JSON.parse(p.geometry_geojson) : p.geometry_geojson;
                if (geo.coordinates && geo.coordinates[0]) {
                  polygonCoords = geo.coordinates[0].map(([lng, lat]) => [lat, lng]);
                }
              } catch (err) {
                console.warn(`Error parsing geometry for ${p.ulpin}:`, err);
              }
            }

            const gisArea = p.gis_area_acres || fallback?.gis_area_acres || 0;
            const docArea = p.document_area_acres ?? fallback?.document_area_acres ?? gisArea;
            const areaDiscrepancy = Math.abs(gisArea - docArea);
            const riskLevel = p.risk_level || fallback?.risk_level || 'CLEAN';
            const riskScore = p.risk_score ?? fallback?.risk_score ?? 0;

            const centerLat = p.centroid_lat || (polygonCoords.length > 0 ? polygonCoords[0][0] : (fallback?.center[0] || 18.9057));
            const centerLng = p.centroid_lng || (polygonCoords.length > 0 ? polygonCoords[0][1] : (fallback?.center[1] || 73.3055));

            return {
              ulpin: p.ulpin,
              label: `${p.ulpin} (Survey #${p.survey_number})`,
              survey_number: p.survey_number,
              sub_division: p.sub_division || fallback?.sub_division || '1',
              village: p.village || 'Karjat',
              taluk: p.taluk || 'Karjat',
              district: p.district || 'Raigad',
              state: p.state || 'Maharashtra',
              gis_area_acres: gisArea,
              document_area_acres: docArea,
              area_discrepancy: areaDiscrepancy,
              owner: p.owner || fallback?.owner || 'Registered Landholder',
              father_name: p.father_name || fallback?.father_name || '',
              khata_number: p.khata_number || fallback?.khata_number || '',
              scenario_type: p.scenario_type || fallback?.scenario_type || 'Cadastral Parcel',
              risk_level: riskLevel,
              risk_score: riskScore,
              tax_status: p.tax_status || fallback?.tax_status || 'PAID',
              tax_due: p.tax_due || fallback?.tax_due || 0,
              encumbrance_status: p.encumbrance_status || fallback?.encumbrance_status || 'NONE',
              bank_name: p.bank_name || fallback?.bank_name || null,
              mortgage_amount: p.mortgage_amount || fallback?.mortgage_amount || 0,
              court_status: p.court_status || fallback?.court_status || 'NO_LITIGATION',
              stay_order_active: p.stay_order_active ?? fallback?.stay_order_active ?? false,
              master_plan_zone: p.master_plan_zone || fallback?.master_plan_zone || 'AGRICULTURAL',
              permit_status: p.permit_status || fallback?.permit_status || 'NO_PERMIT',
              color: getRiskColor(riskLevel),
              center: [centerLat, centerLng],
              polygon: polygonCoords.length > 0 ? polygonCoords : fallback?.polygon || [],
            };
          });

          if (isMounted) {
            setParcels(merged);
            setDataLoaded(true);
            if (merged.length > 0) {
              setSelectedUlpin(merged[0].ulpin);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load parcels from backend:', err);
      }
    }

    loadLiveParcels();
    return () => { isMounted = false; };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('landstack_token');
    localStorage.removeItem('landstack_user');
    setToken(null);
  };

  const handleSelectParcel = (u) => {
    setSelectedUlpin(u);
  };

  const handleOpenProfile = (u) => {
    setSelectedUlpin(u);
    setActiveTab('profile');
  };

  const handleOpenAI = (u) => {
    setSelectedUlpin(u);
    setActiveTab('ai');
  };

  if (!token) {
    return (
      <Login
        onLoginSuccess={(tok, usr) => {
          setToken(tok);
          setUser(usr);
        }}
      />
    );
  }

  return (
    <div className="app-root">
      {/* Header Bar */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo-icon">🌐</div>
          <div>
            <div className="brand-title">LandStack</div>
            <div className="brand-subtitle">Unified Geospatial Land Intelligence</div>
          </div>
        </div>

        <nav className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'gis' ? 'active' : ''}`}
            onClick={() => setActiveTab('gis')}
          >
            🗺️ GIS Explorer
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            📑 360° Parcel Profile
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'area' ? 'active' : ''}`}
            onClick={() => setActiveTab('area')}
          >
            📊 Multi-Parcel Analysis
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            🤖 AI Governance Agent
          </button>
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-tab-btn"
            style={{ textDecoration: 'none', borderLeft: '1px solid rgba(255,255,255,0.15)', marginLeft: '4px' }}
            title="Open Satellite GIS Cadastral Engine (Next.js & MapLibre)"
          >
            🛰️ Cadastral Engine ↗
          </a>
        </nav>

        <div className="header-right">
          <div className="backend-pill">
            <span className="pulse-dot"></span>
            <span>Live Database: {parcels.length} Parcels</span>
          </div>

          <div className="user-badge">
            <div className="user-avatar">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
            <div>
              <div className="user-name">{user?.username || 'User'}</div>
              <span className={`user-role-tag role-${user?.role || 'CITIZEN'}`}>
                {user?.role || 'CITIZEN'}
              </span>
            </div>
          </div>

          <button className="btn-logout" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="main-container">
        {/* Preset Quick ULPIN Selector Bar */}
        <div className="preset-bar">
          <span className="preset-label">Quick Scenarios:</span>
          {parcels.slice(0, 8).map((p) => (
            <button
              key={p.ulpin}
              className={`preset-chip ${selectedUlpin === p.ulpin ? 'active' : ''}`}
              onClick={() => setSelectedUlpin(p.ulpin)}
            >
              <span style={{ color: p.color }}>●</span>
              <span>{p.ulpin} ({p.scenario_type.split(' ')[0]})</span>
            </button>
          ))}
          {parcels.length > 8 && (
            <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px' }}>
              +{parcels.length - 8} more parcels
            </span>
          )}
        </div>

        {activeTab === 'gis' && (
          <GisExplorer
            parcels={parcels}
            selectedUlpin={selectedUlpin}
            onSelectParcel={handleSelectParcel}
            onOpenProfile={handleOpenProfile}
            onOpenAI={handleOpenAI}
          />
        )}

        {activeTab === 'profile' && (
          <UnifiedProfileView
            token={token}
            ulpin={selectedUlpin}
            onSelectUlpin={setSelectedUlpin}
            parcels={parcels}
          />
        )}

        {activeTab === 'area' && (
          <AreaAnalysisView
            token={token}
            parcels={parcels}
            onInspectParcel={handleOpenProfile}
          />
        )}

        {activeTab === 'ai' && (
          <AIAgentView
            token={token}
            initialUlpin={selectedUlpin}
          />
        )}
      </main>
    </div>
  );
}
