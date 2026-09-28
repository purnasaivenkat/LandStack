'use client';

import React from 'react';
import {
  LayoutDashboard,
  Map as MapIcon,
  Table as TableIcon,
  BarChart3,
  Sparkles,
  Layers,
  Database,
  UserCheck
} from 'lucide-react';

import { AuthUser } from './LoginPage';

export type NavTab = 'dashboard' | 'map' | 'registry' | 'analytics';
export type UserRole = 'citizen' | 'officer' | 'admin';

interface SidebarNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAIModal: () => void;
  userRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  totalParcels: number;
  authUser?: AuthUser | null;
  onLogout?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenAIModal,
  userRole,
  onChangeRole,
  totalParcels,
  authUser,
  onLogout
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Overview',
      icon: LayoutDashboard,
      badge: 'Live'
    },
    {
      id: 'map' as NavTab,
      label: 'Cadastral GIS Map',
      icon: MapIcon,
      badge: `${totalParcels.toLocaleString()}`
    },
    {
      id: 'registry' as NavTab,
      label: 'Parcel Registry',
      icon: TableIcon,
      badge: '1,012'
    },
    {
      id: 'analytics' as NavTab,
      label: 'Risk Intelligence',
      icon: BarChart3,
      badge: null
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none z-30">
      {/* Top: Branding & Title */}
      <div>
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-500 flex items-center justify-center shadow-sm shadow-sky-100">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="text-base font-extrabold tracking-tight text-slate-900">
                  LANDSTACK
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Unified Cadastral Governance
              </p>
            </div>
          </div>
        </div>

        {/* Primary Navigation Links */}
        <div className="p-3 space-y-1">
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Main Navigation
          </span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition group cursor-pointer ${
                  isActive
                    ? 'bg-sky-50 text-sky-900 border border-sky-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition ${
                      isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isActive
                        ? 'bg-sky-100 text-sky-800 font-bold'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* AI Copilot Direct Button */}
          <div className="pt-2">
            <button
              onClick={onOpenAIModal}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-white shadow-sm hover:shadow transition active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>AI Legal Copilot</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 bg-white/20 rounded font-semibold text-white">
                AUDIT
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom: RBAC Role Switcher & Live Connection Status */}
      <div className="p-3 space-y-3 border-t border-slate-200 bg-slate-50/50">
        {/* Active Persona Profile Card */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Authenticated Session
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-[#0073BB] font-extrabold border border-blue-200">
              {userRole.toUpperCase()}
            </span>
          </div>

          {authUser && (
            <div className="text-left">
              <span className="text-xs font-black text-slate-900 block truncate">
                {authUser.name}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block truncate">
                {authUser.department}
              </span>
            </div>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full text-center py-1.5 px-2 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-lg text-[11px] font-bold transition"
            >
              Sign Out / Switch Portal
            </button>
          )}
        </div>

        {/* Live Infrastructure Status */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-1.5 text-[10px]">
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              FastAPI Central Layer
            </span>
            <span className="text-emerald-700 font-mono font-semibold">:8000</span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Supabase PostGIS
            </span>
            <span className="text-blue-700 font-mono font-semibold">Ready</span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5">
              <Database className="w-3 h-3 text-slate-400" />
              EPSG:4326 Cadastral
            </span>
            <span className="text-slate-800 font-mono font-semibold">1K Plots</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
