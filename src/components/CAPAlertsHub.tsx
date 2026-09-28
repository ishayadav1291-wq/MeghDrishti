import React, { useState } from 'react';
import { 
  Bell, 
  FileCode, 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Share2, 
  ShieldAlert,
  Send
} from 'lucide-react';
import { CAPAlert, Language } from '../types/weather';
import { TRANSLATIONS } from '../data/mockData';

interface CAPAlertsHubProps {
  alerts: CAPAlert[];
  onBroadcastAlert: (alertId: string) => void;
  lang: Language;
}

export const CAPAlertsHub: React.FC<CAPAlertsHubProps> = ({
  alerts,
  onBroadcastAlert,
  lang,
}) => {
  const [selectedAlertId, setSelectedAlertId] = useState<string>(alerts[0]?.id || '');
  const [showXml, setShowXml] = useState(false);
  const [copiedXml, setCopiedXml] = useState(false);

  const t = TRANSLATIONS[lang];
  const activeAlert = alerts.find((a) => a.id === selectedAlertId) || alerts[0];

  const handleCopyXml = (xml: string) => {
    navigator.clipboard.writeText(xml);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6">
      {/* CAP Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <span>Common Alerting Protocol (CAP v1.2) Engine</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Standardized XML emergency bulletins generated automatically when cluster verification thresholds are exceeded. Compatible with NDMA SACHET and Cell Broadcast System.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            Active Bulletins: <span className="text-cyan-400 font-bold">{alerts.length}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Alerts List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Authorized CAP Feed
          </div>

          <div className="space-y-2">
            {alerts.map((alt) => {
              const isSelected = activeAlert?.id === alt.id;
              return (
                <div
                  key={alt.id}
                  onClick={() => setSelectedAlertId(alt.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500 shadow-md shadow-amber-950/20'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-mono text-[10px] text-amber-400 uppercase font-semibold">
                      {alt.severity} Severity
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {new Date(alt.sent).toLocaleTimeString()}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white line-clamp-2">
                    {alt.headline}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/80">
                    <span className="font-mono text-[10px]">{alt.identifier}</span>
                    <span className={`font-semibold ${alt.status === 'Broadcasted' ? 'text-emerald-400' : 'text-cyan-400'}`}>
                      {alt.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Alert Inspector & XML Payload (8 cols) */}
        {activeAlert ? (
          <div className="lg:col-span-8 bg-slate-900/90 rounded-xl border border-slate-800 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                  <span className="font-mono text-cyan-400">{activeAlert.identifier}</span>
                  <span>·</span>
                  <span className="font-semibold text-white">{activeAlert.sender}</span>
                </div>
                <h3 className="text-base font-bold text-white">{activeAlert.headline}</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowXml(!showXml)}
                  className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-colors flex items-center gap-1.5 ${
                    showXml
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{showXml ? 'Formatted View' : 'CAP XML v1.2'}</span>
                </button>

                {activeAlert.status !== 'Broadcasted' && (
                  <button
                    onClick={() => onBroadcastAlert(activeAlert.id)}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 rounded-lg shadow-md flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Broadcast via Cell Alert</span>
                  </button>
                )}
              </div>
            </div>

            {showXml ? (
              <div className="relative">
                <button
                  onClick={() => handleCopyXml(activeAlert.xmlPayload)}
                  className="absolute top-3 right-3 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700 flex items-center gap-1"
                >
                  {copiedXml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedXml ? 'Copied' : 'Copy XML'}</span>
                </button>
                <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto max-h-[460px] leading-relaxed">
                  {activeAlert.xmlPayload}
                </pre>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Formatted Alert Notice */}
                <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/50 space-y-3">
                  <div className="flex items-center gap-2 text-red-400 font-bold uppercase tracking-wider text-xs">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Official National Weather Warning</span>
                  </div>

                  <p className="text-sm text-slate-200 leading-relaxed font-medium">
                    {activeAlert.description}
                  </p>

                  <div className="p-3 bg-slate-950 rounded-lg border border-red-950 text-slate-300">
                    <span className="font-semibold text-amber-400 block mb-1">Civil Protection Instructions:</span>
                    <p>{activeAlert.instruction}</p>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Urgency</div>
                    <div className="text-xs font-bold text-white mt-0.5">{activeAlert.urgency}</div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Severity</div>
                    <div className="text-xs font-bold text-rose-400 mt-0.5">{activeAlert.severity}</div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Certainty</div>
                    <div className="text-xs font-bold text-emerald-400 mt-0.5">{activeAlert.certainty}</div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Target Area</div>
                    <div className="text-xs font-bold text-white mt-0.5 truncate">{activeAlert.areaDesc}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
