import React, { useState } from 'react';
import { 
  PhoneCall, 
  ShieldAlert, 
  MapPin, 
  Users, 
  Waves, 
  Send, 
  CheckCircle2, 
  X,
  Building2,
  Ambulance,
  Flame,
  LifeBuoy
} from 'lucide-react';
import { EmergencyService, SOSRescueRequest } from '../types/weather';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'directory' | 'sos';
  emergencyServices: EmergencyService[];
  sosRequests: SOSRescueRequest[];
  onDispatchSOS: (sos: SOSRescueRequest) => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  mode,
  emergencyServices,
  sosRequests,
  onDispatchSOS,
}) => {
  const [activeTab, setActiveTab] = useState<'sos' | 'directory'>(mode);
  
  // SOS Form state
  const [citizenName, setCitizenName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [peopleCount, setPeopleCount] = useState(2);
  const [situation, setSituation] = useState('');
  const [waterLevel, setWaterLevel] = useState('2.5');
  const [city, setCity] = useState('Mumbai');
  const [sosSent, setSosSent] = useState(false);

  if (!isOpen) return null;

  const handleSendSOS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizenName.trim() || !phone.trim()) return;

    const newSos: SOSRescueRequest = {
      id: `sos-${Date.now()}`,
      timestamp: new Date().toISOString(),
      citizenName,
      phoneMasked: phone.slice(0, 6) + '****' + phone.slice(-2),
      city,
      state: city === 'Mumbai' ? 'Maharashtra' : city === 'Guwahati' ? 'Assam' : 'Tamil Nadu',
      lat: city === 'Mumbai' ? 19.0178 : 26.1925,
      lng: city === 'Mumbai' ? 72.8478 : 91.7584,
      peopleCount,
      situation: situation || 'Severe flooding emergency, request urgent boat rescue or shelter assistance.',
      waterLevelFeet: parseFloat(waterLevel) || 2.0,
      status: 'Active',
    };

    onDispatchSOS(newSos);
    setSosSent(true);
    setTimeout(() => {
      setSosSent(false);
      onClose();
    }, 2500);
  };

  const NATIONAL_HELPLINES = [
    { name: 'National Emergency Universal Helpline', number: '112', desc: 'All emergencies (Police, Fire, Ambulance)', icon: PhoneCall },
    { name: 'NDMA National Disaster Helpline', number: '1070', desc: 'National Disaster Management Authority HQ', icon: ShieldAlert },
    { name: 'District Disaster Management Authority (DDMA)', number: '1077', desc: 'Local district collector disaster cell', icon: Building2 },
    { name: 'Emergency Medical Ambulance', number: '108', desc: 'State trauma and emergency medical response', icon: Ambulance },
    { name: 'Fire & Rescue Services', number: '101', desc: 'Structural collapse & swift water rescue', icon: Flame },
    { name: 'Indian Coast Guard SAR', number: '1554', desc: 'Maritime & coastal cyclone search & rescue', icon: LifeBuoy },
    { name: 'BMC Disaster Control Room (Mumbai)', number: '1916', desc: 'Municipal flood pumping & ward control', icon: Waves },
  ];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              activeTab === 'sos' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {activeTab === 'sos' ? 'Emergency SOS Rescue Beacon' : 'National Emergency Directory'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Official NDMA &amp; State Emergency Operation Centers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex p-0.5 bg-slate-800 rounded-lg text-xs font-medium">
              <button
                onClick={() => setActiveTab('sos')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'sos' ? 'bg-red-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                One-Tap SOS
              </button>
              <button
                onClick={() => setActiveTab('directory')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'directory' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Helplines
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'sos' ? (
            sosSent ? (
              <div className="p-8 text-center space-y-3 bg-red-950/20 rounded-xl border border-red-800/60">
                <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-600 mx-auto flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">Distress Beacon Broadcasted!</h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Your GPS coordinates and emergency rescue request have been prioritized in the Authority Control Console and transmitted to the nearest NDRF/SDRF outpost.
                </p>
                <div className="text-xs font-mono text-cyan-400">Keep your phone line open.</div>
              </div>
            ) : (
              <form onSubmit={handleSendSOS} className="space-y-4 text-xs">
                <div className="p-3 bg-red-950/30 rounded-lg border border-red-900/50 text-red-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                  <span>
                    Use this form ONLY for genuine life-threatening emergencies requiring boat rescue, evacuation, or urgent medical transport.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Your Full Name</label>
                    <input
                      type="text"
                      value={citizenName}
                      onChange={(e) => setCitizenName(e.target.value)}
                      placeholder="e.g. Ramesh Kulkarni"
                      className="w-full bg-slate-950 text-white border border-slate-800 rounded-lg p-2.5 focus:outline-none focus:border-red-500 font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Emergency Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98200 00000"
                      className="w-full bg-slate-950 text-white border border-slate-800 rounded-lg p-2.5 font-mono focus:outline-none focus:border-red-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Current City / Location</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-950 text-white border border-slate-800 rounded-lg p-2.5 focus:outline-none focus:border-red-500"
                    >
                      <option value="Mumbai">Mumbai (Maharashtra)</option>
                      <option value="Guwahati">Guwahati (Assam)</option>
                      <option value="Chennai">Chennai (Tamil Nadu)</option>
                      <option value="Kochi">Kochi (Kerala)</option>
                      <option value="Puri">Puri (Odisha)</option>
                      <option value="New Delhi">New Delhi (Delhi NCR)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">People Trapped / Stranded</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={peopleCount}
                      onChange={(e) => setPeopleCount(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-950 text-white border border-slate-800 rounded-lg p-2.5 font-mono focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Water Depth (Feet)</label>
                    <input
                      type="text"
                      value={waterLevel}
                      onChange={(e) => setWaterLevel(e.target.value)}
                      placeholder="e.g. 3.5 ft"
                      className="w-full bg-slate-950 text-white border border-slate-800 rounded-lg p-2.5 font-mono focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Emergency Situation Details</label>
                  <textarea
                    rows={3}
                    value={situation}
                    onChange={(e) => setSituation(e.target.value)}
                    placeholder="Describe exact landmarks, stranded elderly/children, medical requirements, or building floor..."
                    className="w-full bg-slate-950 text-white border border-slate-800 rounded-lg p-3 focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 rounded-xl shadow-lg shadow-red-950/50 flex items-center justify-center gap-2 active:scale-98 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>BROADCAST DISTRESS BEACON WITH GPS COORDINATES</span>
                  </button>
                </div>
              </form>
            )
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                {NATIONAL_HELPLINES.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.number}
                      className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{item.name}</div>
                          <div className="text-[11px] text-slate-400">{item.desc}</div>
                        </div>
                      </div>

                      <a
                        href={`tel:${item.number}`}
                        className="px-3.5 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/80 font-mono text-xs font-bold transition-colors shrink-0"
                      >
                        Dial {item.number}
                      </a>
                    </div>
                  );
                })}
              </div>

              {/* Nearby Local Services */}
              <div className="pt-3 border-t border-slate-800">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Pre-Staged Rapid Response Outposts
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {emergencyServices.map((es) => (
                    <div key={es.id} className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                      <div className="font-semibold text-white truncate">{es.name}</div>
                      <div className="text-[11px] text-slate-400">{es.city}, {es.state}</div>
                      <div className="text-[11px] font-mono text-amber-400 mt-1">{es.phone}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
