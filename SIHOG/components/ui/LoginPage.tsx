'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Layers, 
  User, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  KeyRound,
  FileCheck2,
  Building2,
  CheckCircle2
} from 'lucide-react';

export type UserRole = 'citizen' | 'officer' | 'admin';

export interface AuthUser {
  userId: string;
  name: string;
  role: UserRole;
  department: string;
  badge: string;
  token?: string;
}

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

// Credentials configuration for each role
const VALID_CREDENTIALS: Record<UserRole, {
  userId: string;
  password: string;
  name: string;
  department: string;
  badge: string;
}> = {
  citizen: {
    userId: 'citizen',
    password: 'citizen123',
    name: 'Purna Sai',
    department: 'Citizen & Public Land Title Verification',
    badge: 'Verified Citizen'
  },
  officer: {
    userId: 'officer',
    password: 'officer123',
    name: 'Dr. K. Ananth (Revenue Inspector)',
    department: 'Dept of Survey Settlement & Land Records',
    badge: 'Revenue Officer'
  },
  admin: {
    userId: 'admin',
    password: 'admin123',
    name: 'System Administrator',
    department: 'LandStack Central Governance & Security',
    badge: 'Full Admin Privileges'
  }
};

const ROLE_CONFIG: Record<UserRole, {
  title: string;
  portalName: string;
  subtitle: string;
  icon: any;
  color: string;
  bgLight: string;
  borderActive: string;
  badgeColor: string;
  buttonBg: string;
  description: string;
  features: string[];
}> = {
  citizen: {
    title: 'Citizen Portal',
    portalName: 'Public Citizen Login',
    subtitle: 'Access parcel title records, search survey numbers, verify mutation status and taxes',
    icon: User,
    color: '#0284c7', // Sky Blue
    bgLight: 'bg-sky-50',
    borderActive: 'border-sky-500 ring-2 ring-sky-300 shadow-sky-100',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
    buttonBg: 'bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 shadow-sky-200',
    description: 'Designed for property owners, buyers, and public land title search.',
    features: ['Public Land Record Verification', 'Khata & RoR Search', 'Tax Due & Payment Records', 'AI Legal Dossier Assistance']
  },
  officer: {
    title: 'Revenue Officer Portal',
    portalName: 'Revenue & Cadastral Officer Login',
    subtitle: 'Manage land mutations, resolve boundary disputes, verify injunctions and survey metrics',
    icon: FileCheck2,
    color: '#059669', // Emerald Green
    bgLight: 'bg-emerald-50',
    borderActive: 'border-emerald-600 ring-2 ring-emerald-300 shadow-emerald-100',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    buttonBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-200',
    description: 'Restricted to revenue inspectors, tahsildars, and authorized survey staff.',
    features: ['ST_Intersects Cadastral GIS Engine', 'Area Mismatch Identification', 'Stay Order & Court Injunctions', 'Official Boundary Settlement']
  },
  admin: {
    title: 'System Admin Portal',
    portalName: 'Central Governance & Admin Login',
    subtitle: 'Full administrative access to all subsystems, audit logs, AI agent tools and security',
    icon: Building2,
    color: '#ea580c', // Vivid Orange
    bgLight: 'bg-orange-50',
    borderActive: 'border-orange-500 ring-2 ring-orange-300 shadow-orange-100',
    badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
    buttonBg: 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-orange-200',
    description: 'Comprehensive system overrides, multi-database sync, and audit trace controls.',
    features: ['Full Database Sync (SQLite & Supabase PostGIS)', 'AI Governance Audit Agent & Tools', 'System Configuration & Overrides', 'All High-Risk Incident Escalations']
  }
};

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('citizen');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentRoleConfig = ROLE_CONFIG[selectedRole];

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setUserId('');
    setPassword('');
    setError(null);
  };

  const handleFillCredentials = () => {
    const creds = VALID_CREDENTIALS[selectedRole];
    setUserId(creds.userId);
    setPassword(creds.password);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const inputUser = userId.trim().toLowerCase();
      const inputPass = password.trim();

      // Find matching role credentials
      const matchedRole = (Object.keys(VALID_CREDENTIALS) as UserRole[]).find(
        (r) => VALID_CREDENTIALS[r].userId === inputUser && VALID_CREDENTIALS[r].password === inputPass
      );

      if (matchedRole) {
        const creds = VALID_CREDENTIALS[matchedRole];
        onLoginSuccess({
          userId: creds.userId,
          name: creds.name,
          role: matchedRole,
          department: creds.department,
          badge: creds.badge
        });
      } else {
        setError(`Invalid User ID or Password. Check credentials below (e.g. ${VALID_CREDENTIALS[selectedRole].userId} / ${VALID_CREDENTIALS[selectedRole].password})`);
        setIsLoading(false);
      }
    }, 200);
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background Decorative Accent Orbs */}
      <div className="absolute top-0 -left-10 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-10 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-100/30 rounded-full blur-3xl pointer-events-none" />

      {/* Header Branding */}
      <div className="relative z-10 flex flex-col items-center mb-6 text-center">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-emerald-500 to-orange-500 flex items-center justify-center shadow-lg shadow-sky-200/50">
            <Layers className="w-7 h-7 text-white" />
          </div>
          <div className="text-left">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-black tracking-wider text-slate-900">LANDSTACK</span>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md">
                GOV PORTAL
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">Unified Geospatial Land Intelligence & Multi-Registry Governance</p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-4xl bg-white rounded-3xl shadow-2xl shadow-slate-200/80 overflow-hidden border border-slate-200/80 flex flex-col md:flex-row">
        
        {/* Left Side: Three Distinct Role Login Selector */}
        <div className="w-full md:w-5/12 bg-slate-50/70 border-r border-slate-100 p-6 flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Step 1: Select Your Portal</span>
              <h2 className="text-lg font-black text-slate-900">Three Dedicated Roles</h2>
              <p className="text-xs text-slate-500 mt-1">Each role provides access to specialized governance workflows and permissions.</p>
            </div>

            <div className="space-y-3">
              {(['citizen', 'officer', 'admin'] as UserRole[]).map((role) => {
                const config = ROLE_CONFIG[role];
                const Icon = config.icon;
                const isSelected = selectedRole === role;

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleChange(role)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-150 flex items-start space-x-3 cursor-pointer ${
                      isSelected
                        ? `bg-white ${config.borderActive} shadow-md`
                        : 'bg-white/90 border-slate-200 hover:bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                      style={{ 
                        backgroundColor: isSelected ? config.color : '#f1f5f9', 
                        color: isSelected ? '#ffffff' : '#64748b' 
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-extrabold ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                          {config.title}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                        {config.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Demo Helper Box */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-sky-900 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-sky-600" />
                  Credentials for {currentRoleConfig.title}:
                </span>
                <button
                  type="button"
                  onClick={handleFillCredentials}
                  className="text-[10px] font-extrabold text-sky-700 hover:underline cursor-pointer"
                >
                  Auto-Fill
                </button>
              </div>
              <div className="text-[11px] font-mono text-sky-900 bg-white px-2 py-1 rounded border border-sky-100 flex items-center justify-between">
                <span>User: <strong>{VALID_CREDENTIALS[selectedRole].userId}</strong></span>
                <span>Pass: <strong>{VALID_CREDENTIALS[selectedRole].password}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="w-full md:w-7/12 p-8 flex flex-col justify-between bg-white">
          <div>
            {/* Header for Active Portal */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <div>
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${currentRoleConfig.badgeColor}`}>
                  {currentRoleConfig.portalName}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2">Sign In with User ID</h3>
                <p className="text-xs text-slate-500 mt-0.5">{currentRoleConfig.subtitle}</p>
              </div>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center space-x-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  User ID / Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder={`e.g. ${VALID_CREDENTIALS[selectedRole].userId}`}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your security password"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Role Permissions Preview */}
              <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 mt-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 block mb-1.5">
                  Included Privileges for {selectedRole.toUpperCase()}:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {currentRoleConfig.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center space-x-1.5 text-[11px] text-slate-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full mt-4 flex items-center justify-center space-x-2 py-3 px-4 ${currentRoleConfig.buttonBg} text-white font-bold text-sm rounded-xl shadow-lg transition-all duration-150 active:scale-[0.99] disabled:opacity-60 cursor-pointer`}
              >
                {isLoading ? (
                  <span>Authenticating Credentials...</span>
                ) : (
                  <>
                    <span>Enter {currentRoleConfig.title}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="shrink mx-3 text-slate-400 text-[10px] uppercase font-bold tracking-wider">or public preview</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button
                type="button"
                onClick={() => onLoginSuccess({
                  userId: selectedRole,
                  name: `Verified ${currentRoleConfig.title}`,
                  role: selectedRole,
                  department: currentRoleConfig.portalName,
                  badge: 'Public Demo Access'
                })}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
              >
                <span>⚡ 1-Click Instant Access (No Password Required)</span>
              </button>
            </form>
          </div>

          {/* Security Notice Footer */}
          <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-semibold text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              AES-256 RBAC Verified
            </span>
            <span>LandStack Government Portal</span>
          </div>
        </div>

      </div>
    </div>
  );
};
