import React from 'react';
import { 
  ShieldAlert, 
  Map, 
  Radio, 
  CheckSquare, 
  UserCheck, 
  Bell, 
  BarChart3, 
  PhoneCall, 
  Globe2,
  Sparkles
} from 'lucide-react';
import { Language } from '../types/weather';
import { TRANSLATIONS } from '../data/mockData';

interface TopNavigationProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  isStreaming: boolean;
  setIsStreaming: (stream: boolean) => void;
  onOpenSOS: () => void;
  onOpenEmergency: () => void;
  pendingCount: number;
  activeCapCount: number;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  currentTab,
  setCurrentTab,
  lang,
  setLang,
  isStreaming,
  setIsStreaming,
  onOpenSOS,
  onOpenEmergency,
  pendingCount,
  activeCapCount,
}) => {
  const t = TRANSLATIONS[lang];

  const navItems = [
    { id: 'map', label: t.gisMap, icon: Map },
    { id: 'feed', label: t.liveFeeds, icon: Radio },
    { id: 'admin', label: t.adminReview, icon: CheckSquare, badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'citizen', label: t.citizenPortal, icon: UserCheck },
    { id: 'cap', label: t.capAlerts, icon: Bell, badge: activeCapCount > 0 ? activeCapCount : undefined },
    { id: 'analytics', label: t.analytics, icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Single element Brand wordmark with subtle national badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-900/30">
            <ShieldAlert className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              {t.appTitle}
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 uppercase">
                National IMD Fusion
              </span>
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              {t.platformSub}
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-800/90 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions, Streaming indicator, Language toggle & SOS */}
        <div className="flex items-center gap-2">
          {/* Live Streaming Toggle */}
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            title={isStreaming ? 'Stream Active - Click to pause' : 'Stream Paused - Click to resume'}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-md border transition-all ${
              isStreaming
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="hidden lg:inline">{isStreaming ? 'LIVE INGESTION' : 'STREAM PAUSED'}</span>
          </button>

          {/* Bilingual Switch */}
          <button
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-md transition-colors"
            title="Toggle English / Hindi"
          >
            <Globe2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold">{lang === 'en' ? 'हिंदी' : 'EN'}</span>
          </button>

          {/* Emergency Helplines Directory */}
          <button
            onClick={onOpenEmergency}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-900 border border-slate-700 rounded-md hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            title="National Helplines Directory"
          >
            <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">Helplines</span>
          </button>

          {/* One-Tap SOS Distress */}
          <button
            onClick={onOpenSOS}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 rounded-md shadow-md shadow-red-950/40 transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-95"
          >
            <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
            <span>SOS</span>
          </button>
        </div>
      </div>

      {/* Mobile navigation tab strip */}
      <div className="flex md:hidden items-center justify-between overflow-x-auto pt-2 gap-1 border-t border-slate-800/50 mt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`px-2 py-1 text-[11px] font-medium rounded flex items-center gap-1 shrink-0 ${
                isActive ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-mono">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
