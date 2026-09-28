import React, { useState } from 'react';
import { 
  CheckSquare, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  Truck, 
  Sparkles, 
  Eye, 
  Check, 
  X, 
  Layers, 
  MapPin, 
  Radio, 
  Camera, 
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { WeatherReport, CAPAlert, Language } from '../types/weather';
import { TRANSLATIONS } from '../data/mockData';
import { createCAPAlertFromCluster } from '../utils/aiEngine';

interface AuthorityReviewPanelProps {
  reports: WeatherReport[];
  onUpdateStatus: (id: string, newStatus: WeatherReport['verificationStatus']) => void;
  onGenerateCAP: (alert: CAPAlert) => void;
  lang: Language;
}

export const AuthorityReviewPanel: React.FC<AuthorityReviewPanelProps> = ({
  reports,
  onUpdateStatus,
  onGenerateCAP,
  lang,
}) => {
  const [selectedReportId, setSelectedReportId] = useState<string>(
    reports.find((r) => r.verificationStatus === 'pending')?.id || reports[0]?.id || ''
  );
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [capDraftSuccess, setCapDraftSuccess] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  const pendingReports = reports.filter((r) => {
    if (statusFilter !== 'all' && r.verificationStatus !== statusFilter) return false;
    if (stateFilter !== 'all' && r.state !== stateFilter) return false;
    return true;
  });

  const activeReport = reports.find((r) => r.id === selectedReportId) || reports[0];

  const handleApprove = (report: WeatherReport) => {
    onUpdateStatus(report.id, 'verified');
  };

  const handleReject = (report: WeatherReport) => {
    onUpdateStatus(report.id, 'suspicious');
  };

  const handleDraftCAPAlert = (report: WeatherReport) => {
    const clusterReports = reports.filter(
      (r) => (report.clusterId && r.clusterId === report.clusterId) || r.id === report.id
    );
    const newCap = createCAPAlertFromCluster(report.clusterId || `CLU-${report.id}`, clusterReports);
    onGenerateCAP(newCap);
    setCapDraftSuccess(`Drafted official CAP Alert: ${newCap.identifier}`);
    setTimeout(() => setCapDraftSuccess(null), 4000);
  };

  const uniqueStates = Array.from(new Set(reports.map((r) => r.state)));

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6">
      {/* Header and Command Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-cyan-400" />
            <span>Authority Review &amp; Dispatch Console</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            IMD &amp; Disaster Management Officer triage queue. Evaluate AI multi-source trust scores and authorize emergency alerts.
          </p>
        </div>

        {/* Status Counters */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80">
            Pending Review: {reports.filter((r) => r.verificationStatus === 'pending').length}
          </span>
          <span className="px-2.5 py-1 rounded bg-rose-950/80 text-rose-300 border border-rose-800/80">
            Fake Flagged: {reports.filter((r) => r.verificationStatus === 'suspicious').length}
          </span>
          <span className="px-2.5 py-1 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
            Verified: {reports.filter((r) => r.verificationStatus === 'verified').length}
          </span>
        </div>
      </div>

      {capDraftSuccess && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-700 rounded-lg text-xs font-mono text-emerald-300 flex items-center justify-between">
          <span>✓ {capDraftSuccess}</span>
          <span className="text-[11px] underline cursor-pointer">View in CAP Alerts Tab</span>
        </div>
      )}

      {/* Main Grid: Queue on Left, Deep Evidence & Action Panel on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Triage Queue (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Filters */}
          <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded px-2 py-1 flex-1 focus:outline-none"
            >
              <option value="all">All Statuses ({reports.length})</option>
              <option value="pending">Pending AI Review</option>
              <option value="suspicious">Suspicious / Fake Flagged</option>
              <option value="verified">Verified Records</option>
              <option value="duplicate">Duplicates</option>
            </select>

            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded px-2 py-1 flex-1 focus:outline-none"
            >
              <option value="all">All States</option>
              {uniqueStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Queue List */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {pendingReports.map((report) => {
              const isSelected = activeReport?.id === report.id;
              return (
                <div
                  key={report.id}
                  onClick={() => setSelectedReportId(report.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500 shadow-md shadow-cyan-950/20'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-semibold text-white">{report.city}, {report.state}</span>
                    <span className={`font-mono font-bold ${
                      report.trustScore.totalScore >= 80 ? 'text-emerald-400' :
                      report.trustScore.totalScore >= 50 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {report.trustScore.totalScore}/100 Trust
                    </span>
                  </div>

                  <div className="text-xs font-medium text-slate-200 line-clamp-1">
                    {report.title}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span className="font-mono text-cyan-400 uppercase text-[10px]">{report.category.replace('_', ' ')}</span>
                    <span className="capitalize text-slate-300">{report.verificationStatus}</span>
                  </div>
                </div>
              );
            })}

            {pendingReports.length === 0 && (
              <div className="p-8 text-center bg-slate-900/30 rounded-lg border border-slate-800 text-xs text-slate-500">
                No reports found under current filter.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Deep Evidence Inspector & Authority Action Deck (7 cols) */}
        {activeReport ? (
          <div className="lg:col-span-7 bg-slate-900/90 rounded-xl border border-slate-800 p-5 space-y-5">
            {/* Header with Title and Verification Pill */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                  <span className="font-bold text-white text-sm">{activeReport.city}, {activeReport.state}</span>
                  <span>·</span>
                  <span className="font-mono text-cyan-400 uppercase text-xs">{activeReport.category.replace('_', ' ')}</span>
                  <span>·</span>
                  <span className="font-mono tabular-nums">{new Date(activeReport.timestamp).toLocaleString()}</span>
                </div>
                <h3 className="text-base font-bold text-white">{activeReport.title}</h3>
              </div>

              <div className="text-right shrink-0">
                <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded uppercase ${
                  activeReport.verificationStatus === 'verified' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
                  activeReport.verificationStatus === 'suspicious' ? 'bg-rose-950 text-rose-300 border border-rose-700' :
                  'bg-amber-950 text-amber-300 border border-amber-700'
                }`}>
                  {activeReport.verificationStatus}
                </span>
              </div>
            </div>

            {/* Evidence Photography & EXIF Validation */}
            {activeReport.imageUrl && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="rounded overflow-hidden border border-slate-800 bg-black max-h-48">
                  <img
                    src={activeReport.imageUrl}
                    alt={activeReport.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1.5 text-xs font-mono text-slate-300">
                  <div className="text-[11px] text-cyan-400 font-bold uppercase mb-1">
                    Media Forensics &amp; EXIF Audit
                  </div>
                  <div>Camera: {activeReport.exifMetadata?.deviceCamera || 'Mobile Sensor'}</div>
                  <div>
                    GPS Geotag Match:{' '}
                    <span className={activeReport.exifMetadata?.gpsMatch ? 'text-emerald-400' : 'text-rose-400'}>
                      {activeReport.exifMetadata?.gpsMatch ? 'PASS (Coordinates match report location)' : 'FAIL / Unmatched'}
                    </span>
                  </div>
                  <div>
                    Reverse-Search Dupe:{' '}
                    <span className={activeReport.exifMetadata?.reverseHashMatch ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {activeReport.exifMetadata?.reverseHashMatch ? 'FOUND (Recycled archive photo)' : 'CLEAR (Original photo)'}
                    </span>
                  </div>
                  <div>
                    Original Timestamp:{' '}
                    <span className="text-slate-400">
                      {activeReport.exifMetadata?.dateTimeOriginal
                        ? new Date(activeReport.exifMetadata.dateTimeOriginal).toLocaleTimeString()
                        : 'Present'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Description Text */}
            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80 text-xs text-slate-200">
              <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                Citizen Statement &amp; Sensor Log ({activeReport.sourceHandle}):
              </span>
              <p className="leading-relaxed">{activeReport.content}</p>
            </div>

            {/* Explainable AI Trust Engine Breakdown (The 4 Pillars) */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Explainable AI Verification Score
                  </span>
                </div>
                <span className="text-lg font-bold font-mono text-cyan-400">
                  {activeReport.trustScore.totalScore} / 100
                </span>
              </div>

              {/* 4 Pillars Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400">IMD Radar Match</div>
                  <div className="text-sm font-bold font-mono text-white mt-0.5">
                    {activeReport.trustScore.imdCorrelation} / 30
                  </div>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400">Social Corroboration</div>
                  <div className="text-sm font-bold font-mono text-white mt-0.5">
                    {activeReport.trustScore.corroborationCount} / 30
                  </div>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400">Source Credibility</div>
                  <div className="text-sm font-bold font-mono text-white mt-0.5">
                    {activeReport.trustScore.sourceCredibility} / 20
                  </div>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400">Media Forensics</div>
                  <div className="text-sm font-bold font-mono text-white mt-0.5">
                    {activeReport.trustScore.mediaForensics} / 20
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded border border-slate-800">
                <span className="font-semibold text-cyan-300">AI Rationale: </span>
                {activeReport.trustScore.explainability}
              </div>
            </div>

            {/* Resource Allocation Recommendation */}
            <div className="p-3 bg-blue-950/30 rounded-lg border border-blue-900/40 text-xs">
              <div className="flex items-center gap-1.5 text-blue-300 font-semibold mb-1">
                <Truck className="w-3.5 h-3.5" />
                <span>Automated Resource Allocation Advisory</span>
              </div>
              <p className="text-slate-300">
                {activeReport.category === 'flood_inundation'
                  ? 'Recommended Action: Alert NDRF 5th Bn & dispatch 2 inflatable rescue boats + 4 heavy dewatering pumps to Dadar TT underpass.'
                  : activeReport.category === 'landslide'
                  ? 'Recommended Action: Notify BRO (Border Roads Organisation) & deploy excavator JCB units to clear Solan highway debris.'
                  : activeReport.category === 'cyclone'
                  ? 'Recommended Action: Activate Multipurpose Cyclone Shelter No. 4. Evacuate low-lying fishing hamlets within 3km of shore.'
                  : 'Recommended Action: Monitor telemetry. Alert municipal traffic control to divert low-lying roadways.'}
              </p>
            </div>

            {/* Authority Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApprove(activeReport)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Verify Report</span>
                </button>
                <button
                  onClick={() => handleReject(activeReport)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded bg-rose-700 hover:bg-rose-600 text-white transition-colors flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Flag as Fake / Spam</span>
                </button>
              </div>

              {/* CAP Auto-Draft Action */}
              <button
                onClick={() => handleDraftCAPAlert(activeReport)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white transition-all shadow-md flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Auto-Draft CAP Emergency Bulletin</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 p-12 text-center bg-slate-900/30 rounded-xl border border-slate-800 text-slate-400">
            Select a report from the triage queue to examine evidence.
          </div>
        )}
      </div>
    </div>
  );
};
