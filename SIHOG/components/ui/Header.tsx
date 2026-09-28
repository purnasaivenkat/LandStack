import { Layers, MapPin, Sparkles, Database, ShieldCheck, LogOut, User } from 'lucide-react';
import { AuthUser } from './LoginPage';

interface HeaderProps {
  onOpenAIModal: () => void;
  onFocusKarjat?: () => void;
  parcelCount: number;
  authUser?: AuthUser | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenAIModal, 
  onFocusKarjat, 
  parcelCount,
  authUser,
  onLogout
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 text-slate-800 px-6 flex items-center justify-between z-30 shadow-xs select-none">
      {/* Brand & Area Info */}
      <div className="flex items-center space-x-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-500 flex items-center justify-center shadow-sm shadow-sky-200">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-extrabold tracking-tight text-slate-900">
              LANDSTACK
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-full">
              PostGIS Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <span className="font-semibold text-slate-600">SIH 2026 | PS 26014</span>
            <span className="text-slate-300">•</span>
            <button
              onClick={onFocusKarjat}
              title="Click to zoom to Karjat Cadastral Study Area"
              className="text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1 transition underline decoration-sky-200 hover:decoration-sky-500"
            >
              <MapPin className="w-3 h-3 inline text-emerald-600" /> Karjat, Maharashtra
            </button>
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Status Indicators matching Figma */}
        <div className="hidden lg:flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#0F2A4A]" />
            <span className="text-slate-500">Cadastral Registry:</span>
            <span className="font-bold text-slate-900">{parcelCount.toLocaleString()} Parcels</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold text-emerald-700">SRID 4326</span>
          </div>
        </div>

        {/* AI Copilot Action Button matching Theme */}
        <button
          onClick={onOpenAIModal}
          className="flex items-center space-x-2 bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 active:scale-[0.98] cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>AI Legal Copilot</span>
        </button>

        {/* User Info & Logout Button */}
        {authUser && (
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
            <div className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-xl border border-slate-200 transition">
              <div className="w-6 h-6 rounded-lg bg-[#0F2A4A] text-white flex items-center justify-center text-xs font-bold uppercase">
                {authUser.userId.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-xs font-bold text-slate-800 block leading-tight">
                  {authUser.name}
                </span>
                <span className="text-[10px] font-semibold text-[#0073BB] uppercase block leading-tight">
                  {authUser.role}
                </span>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                title="Sign Out of Portal"
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
