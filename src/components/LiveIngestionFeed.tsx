import React, { useState } from 'react';
import { 
  Radio, 
  Search, 
  Filter, 
  Layers, 
  PlusCircle, 
  CheckCircle2, 
  AlertOctagon, 
  Copy, 
  Clock, 
  MapPin, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { WeatherReport, Language, EventCategory } from '../types/weather';
import { TRANSLATIONS } from '../data/mockData';

interface LiveIngestionFeedProps {
  reports: WeatherReport[];
  onSelectReport: (report: WeatherReport) => void;
  onInjectSimulatedEvent: (type: 'flood' | 'cyclone' | 'fake_test' | 'sms_landslide') => void;
  lang: Language;
}

export const LiveIngestionFeed: React.FC<LiveIngestionFeedProps> = ({
  reports,
  onSelectReport,
  onInjectSimulatedEvent,
  lang,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');

  const t = TRANSLATIONS[lang];

  const filteredReports = reports.filter((report) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        report.title.toLowerCase().includes(q) ||
        report.content.toLowerCase().includes(q) ||
        report.city.toLowerCase().includes(q) ||
        report.state.toLowerCase().includes(q) ||
        report.sourceHandle.toLowerCase().includes(q) ||
        (report.clusterId && report.clusterId.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (selectedCategory !== 'all' && report.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && report.verificationStatus !== selectedStatus) return false;
    if (selectedSource !== 'all' && report.source !== selectedSource) return false;

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6">
      {/* Stream Ingestion Pipeline Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Multi-Source Real-Time Ingestion Engine
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Aggregating from X/Twitter (#IMD, #MumbaiRains), IMD Doppler Radar, CWC Gauges, Sentinel/Bhuvan, and Citizen Ground Truth.
          </p>
        </div>

        {/* Quick Ingestion Event Injector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-slate-400">Stream Simulator:</span>
          <button
            onClick={() => onInjectSimulatedEvent('flood')}
            className="px-2.5 py-1.5 text-xs font-medium rounded bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 transition-colors flex items-center gap-1"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Ingest Mumbai Rain</span>
          </button>
          <button
            onClick={() => onInjectSimulatedEvent('sms_landslide')}
            className="px-2.5 py-1.5 text-xs font-medium rounded bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900 transition-colors flex items-center gap-1"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ SMS Report</span>
          </button>
          <button
            onClick={() => onInjectSimulatedEvent('fake_test')}
            className="px-2.5 py-1.5 text-xs font-medium rounded bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 transition-colors flex items-center gap-1"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>+ Ingest Fake Test</span>
          </button>
        </div>
      </div>

      {/* Filter and Query Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search keywords, city, #tag, cluster..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 text-white border border-slate-800 rounded-lg focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Category filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-950 text-xs text-slate-200 border border-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
        >
          <option value="all">All Weather Categories ({reports.length})</option>
          <option value="flood_inundation">Flood &amp; Waterlogging</option>
          <option value="heavy_rainfall">Heavy Rainfall</option>
          <option value="thunderstorm">Thunderstorm &amp; Lightning</option>
          <option value="cyclone">Cyclone / Storm Surge</option>
          <option value="landslide">Landslide &amp; Rockfall</option>
          <option value="heatwave">Heatwave / Loo</option>
          <option value="fog_smog">Dense Fog / Smog</option>
          <option value="dust_storm">Dust Storm</option>
        </select>

        {/* Verification Status */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-950 text-xs text-slate-200 border border-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
        >
          <option value="all">All Verification Statuses</option>
          <option value="verified">Verified (Corroborated)</option>
          <option value="pending">Pending AI Review</option>
          <option value="suspicious">Suspicious / Fake Flagged</option>
          <option value="duplicate">Duplicate Consolidated</option>
        </select>

        {/* Source Filter */}
        <select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
          className="bg-slate-950 text-xs text-slate-200 border border-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
        >
          <option value="all">All Data Sources</option>
          <option value="social_media">X/Twitter &amp; Reddit (#IMD)</option>
          <option value="citizen_report">Citizen Ground Reports</option>
          <option value="imd_station">IMD Station AWS / Radar</option>
          <option value="cwc_gauge">CWC River Gauges</option>
          <option value="sms_gateway">Offline SMS / USSD Gateway</option>
        </select>
      </div>

      {/* Stream Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800/80">
          <div className="text-slate-400 text-[11px]">Total Processed Events</div>
          <div className="text-lg font-bold text-white mt-1 tabular-nums">{reports.length}</div>
        </div>
        <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800/80">
          <div className="text-emerald-400 text-[11px]">Verified Ground Truth</div>
          <div className="text-lg font-bold text-emerald-400 mt-1 tabular-nums">
            {reports.filter((r) => r.verificationStatus === 'verified').length}
          </div>
        </div>
        <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800/80">
          <div className="text-amber-400 text-[11px]">Deduplicated &amp; Clustered</div>
          <div className="text-lg font-bold text-amber-400 mt-1 tabular-nums">
            {reports.filter((r) => r.verificationStatus === 'duplicate' || (r.clusterCount && r.clusterCount > 1)).length}
          </div>
        </div>
        <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800/80">
          <div className="text-rose-400 text-[11px]">Fake / Misinformation Intercepted</div>
          <div className="text-lg font-bold text-rose-400 mt-1 tabular-nums">
            {reports.filter((r) => r.verificationStatus === 'suspicious').length}
          </div>
        </div>
      </div>

      {/* Ingestion Stream Feed Cards */}
      <div className="space-y-3">
        {filteredReports.map((report) => {
          const isVerified = report.verificationStatus === 'verified';
          const isSuspicious = report.verificationStatus === 'suspicious';
          const isDuplicate = report.verificationStatus === 'duplicate';

          return (
            <div
              key={report.id}
              onClick={() => onSelectReport(report)}
              className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                isSuspicious
                  ? 'bg-rose-950/20 border-rose-900/40 hover:border-rose-700/60'
                  : isDuplicate
                  ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700 opacity-80'
                  : 'bg-slate-900/80 border-slate-800/90 hover:border-cyan-600/50 hover:bg-slate-900'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="flex-1">
                  {/* Clean unboxed metadata with typographic separators (anti-slop) */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-1.5">
                    <span className="font-semibold text-white">{report.city}, {report.state}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-cyan-400 uppercase text-[11px]">{report.category.replace('_', ' ')}</span>
                    <span aria-hidden="true">·</span>
                    <span>{report.sourceHandle}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{new Date(report.timestamp).toLocaleTimeString()}</span>
                  </div>

                  <h3 className="text-sm md:text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">
                    {report.title}
                  </h3>

                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {report.content}
                  </p>

                  {/* Explainable AI snippet */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="text-slate-400">AI Trust Analysis:</span>
                    <span className={`font-mono font-bold ${
                      report.trustScore.totalScore >= 80 ? 'text-emerald-400' :
                      report.trustScore.totalScore >= 50 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {report.trustScore.totalScore}/100
                    </span>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-300 line-clamp-1 flex-1">
                      {report.trustScore.explainability}
                    </span>
                  </div>

                  {/* Cluster indicator & duplicate resolution badge */}
                  {report.clusterId && (
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-cyan-400 font-mono">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Cluster ID: {report.clusterId}</span>
                      {report.clusterCount && report.clusterCount > 1 && (
                        <span className="text-slate-400">
                          ({report.clusterCount} reports aggregated &amp; deduplicated)
                        </span>
                      )}
                      {report.duplicateOfId && (
                        <span className="text-amber-400">
                          (Consolidated duplicate of #{report.duplicateOfId})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column: Status & Media thumbnail if present */}
                <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    {isVerified && (
                      <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    )}
                    {isSuspicious && (
                      <span className="text-xs font-medium text-rose-400 flex items-center gap-1">
                        <AlertOctagon className="w-3.5 h-3.5" />
                        Flagged Suspicious
                      </span>
                    )}
                    {isDuplicate && (
                      <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                        <Copy className="w-3.5 h-3.5" />
                        Duplicate
                      </span>
                    )}
                    {!isVerified && !isSuspicious && !isDuplicate && (
                      <span className="text-xs font-medium text-amber-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Pending Review
                      </span>
                    )}
                  </div>

                  {report.imageUrl && (
                    <div className="w-16 h-12 rounded overflow-hidden border border-slate-700 bg-black">
                      <img
                        src={report.imageUrl}
                        alt="Evidence"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                    report.severity === 'critical' ? 'bg-red-950 text-red-300 border border-red-800' :
                    report.severity === 'high' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {report.severity}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredReports.length === 0 && (
          <div className="p-12 text-center bg-slate-900/30 rounded-xl border border-slate-800 text-slate-400 text-xs">
            No incoming reports match the current filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};
