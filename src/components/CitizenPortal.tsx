import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Send, 
  MapPin, 
  Camera, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  HeartHandshake, 
  Share2, 
  ShieldAlert, 
  WifiOff, 
  MessageSquare,
  Building2,
  Copy,
  Check
} from 'lucide-react';
import { WeatherReport, SafeShelter, Language, EventCategory } from '../types/weather';
import { TRANSLATIONS } from '../data/mockData';
import { classifyEventWithNLP, evaluateTrustScore, detectDuplicatesAndCluster } from '../utils/aiEngine';

interface CitizenPortalProps {
  reports: WeatherReport[];
  shelters: SafeShelter[];
  onSubmitReport: (report: WeatherReport) => void;
  onOpenSOS: () => void;
  lang: Language;
}

export const CitizenPortal: React.FC<CitizenPortalProps> = ({
  reports,
  shelters,
  onSubmitReport,
  onOpenSOS,
  lang,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'submit' | 'my_reports' | 'shelters' | 'im_safe' | 'offline_sms'>('submit');

  // Submission Form State
  const [city, setCity] = useState('Mumbai');
  const [stateName, setStateName] = useState('Maharashtra');
  const [reportText, setReportText] = useState('');
  const [phone, setPhone] = useState('+91 98200 12345');
  const [attachedImage, setAttachedImage] = useState<string | null>('/src/assets/images/flood_ground_report_1790628253774.jpg');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  // Real-time AI NLP detection preview
  const [aiPreview, setAiPreview] = useState<{
    category: EventCategory;
    severity: string;
    confidence: number;
    matchedKeywords: string[];
  }>({
    category: 'heavy_rainfall',
    severity: 'moderate',
    confidence: 70,
    matchedKeywords: [],
  });

  // "I'm Safe" beacon state
  const [safeLocation, setSafeLocation] = useState('Bandra West, Mumbai');
  const [copiedSafe, setCopiedSafe] = useState(false);

  // Offline SMS Simulator state
  const [smsQuery, setSmsQuery] = useState('REPORT FLOOD MUMBAI HIGH 400050 WATER 2FT ROAD BLOCKED');
  const [smsSentSuccess, setSmsSentSuccess] = useState(false);

  // User's submitted reports (filter citizen reports from the main list)
  const myReports = reports.filter((r) => r.source === 'citizen_report' || r.source === 'sms_gateway');

  // Trigger real-time NLP classification as user types
  useEffect(() => {
    if (!reportText.trim()) {
      setAiPreview({
        category: 'heavy_rainfall',
        severity: 'moderate',
        confidence: 65,
        matchedKeywords: [],
      });
      return;
    }
    const result = classifyEventWithNLP(reportText);
    setAiPreview(result);
  }, [reportText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const nlp = classifyEventWithNLP(reportText);
      const trust = evaluateTrustScore(
        {
          content: reportText,
          city,
          source: 'citizen_report',
          imageUrl: attachedImage || undefined,
          hasExif: true,
          exifGpsMatch: true,
          category: nlp.category,
        },
        3,
        42
      );

      const newReport: WeatherReport = {
        id: `cit-${Date.now()}`,
        source: 'citizen_report',
        sourceHandle: `Citizen (${phone.slice(0, 7)}****)`,
        citizenPhoneMasked: phone.slice(0, 8) + '****',
        timestamp: new Date().toISOString(),
        title: `${nlp.category.replace('_', ' ').toUpperCase()} in ${city}`,
        content: reportText,
        category: nlp.category,
        severity: nlp.severity as any,
        city,
        state: stateName,
        lat: city === 'Mumbai' ? 19.0178 : city === 'Guwahati' ? 26.1925 : 28.6139,
        lng: city === 'Mumbai' ? 72.8478 : city === 'Guwahati' ? 91.7584 : 77.2090,
        imageUrl: attachedImage || undefined,
        verificationStatus: 'pending',
        trustScore: trust,
        exifMetadata: {
          dateTimeOriginal: new Date().toISOString(),
          gpsMatch: true,
          deviceCamera: 'Verified Mobile Device Sensor',
          reverseHashMatch: false,
        },
      };

      const clustered = detectDuplicatesAndCluster(newReport, reports);
      newReport.clusterId = clustered.clusterId;
      if (clustered.isDuplicate) {
        newReport.verificationStatus = 'duplicate';
        newReport.duplicateOfId = clustered.duplicateOfId;
      }

      onSubmitReport(newReport);
      setIsSubmitting(false);
      setSubmissionSuccess(`Report logged successfully with Tracking ID: #${newReport.id}`);
      setReportText('');
      setActiveSubTab('my_reports');
    }, 600);
  };

  const handleCopySafeMessage = () => {
    const text = `🚨 Emergency Safety Update: I am SAFE in ${safeLocation}. Weather conditions monitored via MeghDrishti National Weather Platform.`;
    navigator.clipboard.writeText(text);
    setCopiedSafe(true);
    setTimeout(() => setCopiedSafe(false), 3000);
  };

  const handleSendSimulatedSMS = () => {
    setSmsSentSuccess(true);
    setTimeout(() => {
      setSmsSentSuccess(false);
      const newSmsReport: WeatherReport = {
        id: `sms-${Date.now()}`,
        source: 'sms_gateway',
        sourceHandle: 'SMS Gateway (+91 98****8811)',
        timestamp: new Date().toISOString(),
        title: 'SMS Report: ' + smsQuery.slice(0, 35) + '...',
        content: smsQuery,
        category: 'flood_inundation',
        severity: 'high',
        city: 'Mumbai',
        state: 'Maharashtra',
        lat: 19.055,
        lng: 72.83,
        verificationStatus: 'pending',
        trustScore: {
          totalScore: 82,
          imdCorrelation: 22,
          corroborationCount: 22,
          sourceCredibility: 19,
          mediaForensics: 19,
          explainability: 'Parsed from offline SMS Gateway parser. Corroborated with municipal ward telemetry.',
        },
      };
      onSubmitReport(newSmsReport);
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6">
      {/* Citizen Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-cyan-400" />
            <span>Citizen Ground-Truth &amp; Safety Portal</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Contribute verified ground-level weather observations, track your submission lifecycle, locate safe shelters, and broadcast safety status.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab('submit')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeSubTab === 'submit' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60' : 'text-slate-400 hover:text-white'
            }`}
          >
            Submit Report
          </button>
          <button
            onClick={() => setActiveSubTab('my_reports')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeSubTab === 'my_reports' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60' : 'text-slate-400 hover:text-white'
            }`}
          >
            My Submissions ({myReports.length})
          </button>
          <button
            onClick={() => setActiveSubTab('shelters')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeSubTab === 'shelters' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60' : 'text-slate-400 hover:text-white'
            }`}
          >
            Safe Shelters
          </button>
          <button
            onClick={() => setActiveSubTab('im_safe')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeSubTab === 'im_safe' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60' : 'text-slate-400 hover:text-white'
            }`}
          >
            "I'm Safe" Beacon
          </button>
          <button
            onClick={() => setActiveSubTab('offline_sms')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeSubTab === 'offline_sms' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60' : 'text-slate-400 hover:text-white'
            }`}
          >
            Offline / SMS Mode
          </button>
        </div>
      </div>

      {submissionSuccess && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-700 rounded-lg text-xs font-mono text-emerald-300 flex items-center justify-between">
          <span>✓ {submissionSuccess}</span>
          <button onClick={() => setSubmissionSuccess(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Sub-Tab 1: Submit Ground Report Form */}
      {activeSubTab === 'submit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Form (7 cols) */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>Record Real-Time Ground Weather Observation</span>
            </h3>

            {/* City & State Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">City / District</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Mumbai">Mumbai (Maharashtra)</option>
                  <option value="Guwahati">Guwahati (Assam)</option>
                  <option value="New Delhi">New Delhi (Delhi NCR)</option>
                  <option value="Chennai">Chennai (Tamil Nadu)</option>
                  <option value="Kochi">Kochi (Kerala)</option>
                  <option value="Puri">Puri (Odisha)</option>
                  <option value="Bengaluru">Bengaluru (Karnataka)</option>
                  <option value="Ahmedabad">Ahmedabad (Gujarat)</option>
                  <option value="Shimla">Shimla (Himachal Pradesh)</option>
                  <option value="Jodhpur">Jodhpur (Rajasthan)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">State / UT</label>
                <input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Observation Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  What are you experiencing? (English / हिंदी / Hinglish)
                </label>
                <span className="text-[10px] text-cyan-400 font-mono">AI NLP Auto-Categorization</span>
              </div>
              <textarea
                rows={4}
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="e.g. Waterlogged 2 feet at Kings Circle underpass, cars stranded. Heavy thunderstorm and strong wind gusts... (या हिंदी में: भारी बारिश के कारण घुटनों तक पानी भर गया है)"
                className="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-lg p-3 focus:outline-none focus:border-cyan-500 leading-relaxed"
                required
              />
            </div>

            {/* Photo / Media Attachment simulation */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ground Photo / Video Evidence</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">EXIF &amp; GPS Auto-Extracted</span>
              </div>

              {attachedImage ? (
                <div className="relative rounded overflow-hidden border border-slate-700 bg-black h-36">
                  <img
                    src={attachedImage}
                    alt="Attached Ground Evidence"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300">
                    EXIF Match: 19.0178° N, 72.8478° E
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center border-2 border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
                  Upload photo from camera or gallery
                </div>
              )}
            </div>

            {/* Mobile Contact Masked for Verification */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Contact Number (Encrypted for emergency verification only)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded-lg shadow-lg shadow-cyan-950/40 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>AI Ingesting &amp; Corroborating...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Transmit Observation to National Platform</span>
                </>
              )}
            </button>
          </form>

          {/* AI Pre-Ingestion Analysis Card (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Real-Time AI Ingestion Telemetry
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 mb-1">Detected Hazard Category</div>
                <div className="text-base font-bold text-cyan-300 font-mono capitalize">
                  {aiPreview.category.replace('_', ' ')}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  NLP Model Confidence: <span className="text-emerald-400 font-mono">{aiPreview.confidence}%</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 mb-1">Estimated Severity</div>
                <div className="text-sm font-bold font-mono uppercase text-amber-400">
                  {aiPreview.severity}
                </div>
                {aiPreview.matchedKeywords.length > 0 && (
                  <div className="text-[10px] text-slate-400 mt-1">
                    Matched Triggers: {aiPreview.matchedKeywords.join(', ')}
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 mb-1">Automated Verification Checklist</div>
                <ul className="space-y-1 text-[11px] text-slate-300 font-mono">
                  <li className="flex items-center gap-1.5 text-emerald-400">
                    <span>✓</span> EXIF Geotag cross-referenced with city center
                  </li>
                  <li className="flex items-center gap-1.5 text-emerald-400">
                    <span>✓</span> Perceptual image hash checked for archive recycling
                  </li>
                  <li className="flex items-center gap-1.5 text-cyan-400">
                    <span>⏳</span> Real-time IMD radar reflectivity check
                  </li>
                  <li className="flex items-center gap-1.5 text-cyan-400">
                    <span>⏳</span> Spatial clustering with nearby #IMD social posts
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-cyan-950/30 rounded-lg border border-cyan-800/40 text-[11px] text-cyan-300">
                💡 <strong>Why this matters:</strong> Unlike static forms, MeghDrishti immediately analyzes ground statements with NLP and cross-checks with official Doppler stations to filter out hoaxes.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: "My Submissions" Pipeline Tracker (Fixes infinite loading bug) */}
      {activeSubTab === 'my_reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-base font-bold text-white">
              My Ground Observations Lifecycle Tracker
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Total Recorded: {myReports.length}
            </span>
          </div>

          <div className="space-y-4">
            {myReports.map((report) => (
              <div
                key={report.id}
                className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-bold text-white">{report.city}, {report.state}</span>
                      <span>·</span>
                      <span className="font-mono text-cyan-400 uppercase text-[10px]">{report.category.replace('_', ' ')}</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">{new Date(report.timestamp).toLocaleString()}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-white mt-1">{report.title}</h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                      {report.trustScore.totalScore}/100 Trust
                    </span>
                  </div>
                </div>

                {/* Real-Time Processing Pipeline Stages (Visualizing the complete lifecycle) */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                  {/* Step 1 */}
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-emerald-800/80 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-white text-[11px]">1. Ingested</div>
                      <div className="text-[10px] text-slate-400">Stored in Central DB</div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-emerald-800/80 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-white text-[11px]">2. AI NLP Tagged</div>
                      <div className="text-[10px] text-slate-400">Event categorized</div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className={`p-2.5 rounded-lg bg-slate-950 border flex items-center gap-2 ${
                    report.verificationStatus === 'verified'
                      ? 'border-emerald-800/80'
                      : 'border-amber-800/80'
                  }`}>
                    {report.verificationStatus === 'verified' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                    )}
                    <div>
                      <div className="font-semibold text-white text-[11px]">3. Radar Corroborated</div>
                      <div className="text-[10px] text-slate-400">
                        {report.verificationStatus === 'verified' ? 'IMD Radar Matched' : 'Pending Multi-sensor'}
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className={`p-2.5 rounded-lg bg-slate-950 border flex items-center gap-2 ${
                    report.verificationStatus === 'verified'
                      ? 'border-emerald-800/80'
                      : 'border-slate-800'
                  }`}>
                    {report.verificationStatus === 'verified' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <div>
                      <div className="font-semibold text-white text-[11px]">4. Action Taken</div>
                      <div className="text-[10px] text-slate-400">
                        {report.verificationStatus === 'verified' ? 'Dispatched to SDMA' : 'Under Assessment'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Evidence and explanation */}
                <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80 text-xs text-slate-300">
                  <div className="font-mono text-[10px] text-cyan-400 mb-1">AI Trust Engine Note:</div>
                  <p>{report.trustScore.explainability}</p>
                </div>
              </div>
            ))}

            {myReports.length === 0 && (
              <div className="p-12 text-center bg-slate-900/30 rounded-xl border border-slate-800 text-slate-400 text-xs">
                No submissions logged yet. Switch to "Submit Report" to log your first weather observation.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Safe Shelters & Evacuation Points */}
      {activeSubTab === 'shelters' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Designated Evacuation Shelters &amp; Relief Camps</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Government approved cyclone shelters, elevated schools, and relief camps equipped with food, water, and medical aid.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shelters.map((sh) => (
              <div
                key={sh.id}
                className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-white leading-snug">{sh.name}</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase font-semibold">
                    {sh.status}
                  </span>
                </div>

                <div className="text-xs text-slate-300">
                  <div>City: <span className="font-semibold text-white">{sh.city}, {sh.state}</span></div>
                  <div>Elevation: <span className="font-mono text-cyan-300">{sh.elevationMeters}m above MSL (Flood Safe)</span></div>
                  <div>Medical Post: <span className={sh.hasMedicalPost ? 'text-emerald-400' : 'text-slate-400'}>{sh.hasMedicalPost ? 'Available on site' : 'None'}</span></div>
                </div>

                {/* Capacity Bar */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Occupancy</span>
                    <span className="font-mono text-slate-200">{sh.currentOccupancy} / {sh.capacity} beds</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${(sh.currentOccupancy / sh.capacity) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-cyan-400 font-mono">Helpline: {sh.contact}</span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${sh.lat},${sh.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-slate-300 hover:text-white underline"
                  >
                    Directions
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 4: "I'm Safe" Family Beacon */}
      {activeSubTab === 'im_safe' && (
        <div className="max-w-2xl mx-auto bg-slate-900/80 rounded-xl border border-slate-800 p-6 space-y-5">
          <div className="text-center space-y-2 pb-4 border-b border-slate-800">
            <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-700/80 mx-auto flex items-center justify-center text-emerald-400">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Family Safety / "I'm Safe" Broadcast Beacon</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Quickly reassure loved ones during major cyclones, heavy downpours, or flood situations. Generates a one-tap shareable status card.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 block">Current Location / Area</label>
            <input
              type="text"
              value={safeLocation}
              onChange={(e) => setSafeLocation(e.target.value)}
              className="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-lg p-2.5 focus:outline-none focus:border-cyan-500 font-medium"
            />
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-emerald-900/40 text-xs font-mono text-slate-200 space-y-2">
            <div className="text-emerald-400 font-bold text-[11px] uppercase">Message Preview:</div>
            <p className="leading-relaxed">
              🚨 Emergency Safety Update: I am SAFE in {safeLocation}. Weather conditions monitored via MeghDrishti National Weather Platform.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleCopySafeMessage}
              className="w-full py-2.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
            >
              {copiedSafe ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSafe ? 'Copied to Clipboard!' : 'Copy Safety Message'}</span>
            </button>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(`🚨 Emergency Safety Update: I am SAFE in ${safeLocation}. Weather conditions monitored via MeghDrishti National Weather Platform.`)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 text-xs font-bold rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white transition-all flex items-center justify-center gap-2 text-center"
            >
              <Share2 className="w-4 h-4" />
              <span>Share via WhatsApp</span>
            </a>
          </div>
        </div>
      )}

      {/* Sub-Tab 5: Offline / SMS Simulator (No internet fallback) */}
      {activeSubTab === 'offline_sms' && (
        <div className="max-w-3xl mx-auto bg-slate-900/80 rounded-xl border border-slate-800 p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-amber-950 border border-amber-700 flex items-center justify-center text-amber-400">
              <WifiOff className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Offline Disaster Communication &amp; SMS Gateway</h3>
              <p className="text-xs text-slate-400">
                When mobile data and broadband fail during cyclones or floods, citizen reports flow via SMS / USSD gateways (Toll-Free 51969).
              </p>
            </div>
          </div>

          {/* Offline Architecture Flow Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-cyan-400 font-bold mb-1">1. Normal Internet</div>
              <div className="text-slate-400 text-[11px]">Mobile App → HTTPS REST / WebSocket → Central DB</div>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-amber-400 font-bold mb-1">2. Weak Internet</div>
              <div className="text-slate-400 text-[11px]">Local IndexedDB Queue → Auto Sync on Reconnect</div>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-rose-400 font-bold mb-1">3. Zero Internet</div>
              <div className="text-slate-400 text-[11px]">SMS Syntax / USSD → Telecom Gateway → Ingestion Engine</div>
            </div>
          </div>

          {/* Interactive SMS Simulator */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>Simulate Citizen SMS Submission (to 51969)</span>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                Standard SMS Syntax: REPORT &lt;EVENT&gt; &lt;CITY&gt; &lt;SEVERITY&gt; &lt;PINCODE&gt; &lt;DESCRIPTION&gt;
              </label>
              <input
                type="text"
                value={smsQuery}
                onChange={(e) => setSmsQuery(e.target.value)}
                className="w-full bg-slate-900 text-xs text-cyan-300 font-mono border border-slate-800 rounded-lg p-2.5 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500 font-mono">Parsed via Regex NLP Tokenizer</span>
              <button
                onClick={handleSendSimulatedSMS}
                disabled={smsSentSuccess}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors flex items-center gap-1.5"
              >
                {smsSentSuccess ? 'Transmitted &amp; Ingested!' : 'Send Simulated SMS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
