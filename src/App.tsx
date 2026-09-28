/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  INITIAL_WEATHER_REPORTS, 
  SAFE_SHELTERS, 
  EMERGENCY_SERVICES, 
  INITIAL_SOS_REQUESTS, 
  INITIAL_CAP_ALERTS 
} from './data/mockData';
import { 
  WeatherReport, 
  SafeShelter, 
  EmergencyService, 
  SOSRescueRequest, 
  CAPAlert, 
  Language 
} from './types/weather';
import { TopNavigation } from './components/TopNavigation';
import { GisMapIndia } from './components/GisMapIndia';
import { GoogleEarthMap } from './components/GoogleEarthMap';
import { LiveIngestionFeed } from './components/LiveIngestionFeed';
import { AuthorityReviewPanel } from './components/AuthorityReviewPanel';
import { CitizenPortal } from './components/CitizenPortal';
import { CAPAlertsHub } from './components/CAPAlertsHub';
import { BigDataAnalytics } from './components/BigDataAnalytics';
import { EmergencyModal } from './components/EmergencyModal';
import { evaluateTrustScore, detectDuplicatesAndCluster } from './utils/aiEngine';

export default function App() {
  const [reports, setReports] = useState<WeatherReport[]>(INITIAL_WEATHER_REPORTS);
  const [shelters, setShelters] = useState<SafeShelter[]>(SAFE_SHELTERS);
  const [emergencyServices] = useState<EmergencyService[]>(EMERGENCY_SERVICES);
  const [sosRequests, setSosRequests] = useState<SOSRescueRequest[]>(INITIAL_SOS_REQUESTS);
  const [capAlerts, setCapAlerts] = useState<CAPAlert[]>(INITIAL_CAP_ALERTS);

  const [currentTab, setCurrentTab] = useState<string>('map');
  const [mapEngine, setMapEngine] = useState<'earth' | 'leaflet'>('earth');
  const [lang, setLang] = useState<Language>('en');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [selectedReport, setSelectedReport] = useState<WeatherReport | null>(null);

  // Emergency Modal
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [emergencyModalMode, setEmergencyModalMode] = useState<'sos' | 'directory'>('directory');

  // Counts for Top Navigation Badges
  const pendingCount = reports.filter((r) => r.verificationStatus === 'pending').length;
  const activeCapCount = capAlerts.length;

  // Stream simulator: periodic subtle event ingestion
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      // Rotate simulated streams
      const randomCities = [
        { city: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
        { city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
        { city: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362 },
        { city: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673 },
        { city: 'New Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090 },
      ];
      const target = randomCities[Math.floor(Math.random() * randomCities.length)];

      const newStreamItem: WeatherReport = {
        id: `auto-${Date.now()}`,
        source: 'social_media',
        sourceHandle: `@weather_watcher_${Math.floor(10 + Math.random() * 89)} (X/Twitter)`,
        timestamp: new Date().toISOString(),
        title: `Rapid water accumulation near ${target.city} central junction`,
        content: `Heavy sudden showers continuing over ${target.city}. Drains backing up and traffic moving at snail pace. #IMD #WeatherUpdate`,
        category: 'heavy_rainfall',
        severity: 'moderate',
        city: target.city,
        state: target.state,
        lat: target.lat + (Math.random() - 0.5) * 0.05,
        lng: target.lng + (Math.random() - 0.5) * 0.05,
        verificationStatus: 'pending',
        trustScore: {
          totalScore: Math.floor(72 + Math.random() * 18),
          imdCorrelation: 22,
          corroborationCount: 20,
          sourceCredibility: 18,
          mediaForensics: 16,
          explainability: `Auto-streamed from X/Twitter API topic #IMD. Cross-referenced with ${target.city} Doppler Radar.`,
        },
      };

      setReports((prev) => [newStreamItem, ...prev]);
    }, 45000);

    return () => clearInterval(interval);
  }, [isStreaming]);

  // Handler: Update Report Status (Approve / Reject / Duplicate)
  const handleUpdateStatus = (id: string, newStatus: WeatherReport['verificationStatus']) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              verificationStatus: newStatus,
              reviewedBy: 'Authorized IMD/SDMA Officer',
              reviewedAt: new Date().toISOString(),
            }
          : r
      )
    );
  };

  // Handler: Add New CAP Alert
  const handleGenerateCAP = (alert: CAPAlert) => {
    setCapAlerts((prev) => [alert, ...prev]);
  };

  // Handler: Broadcast CAP Alert
  const handleBroadcastAlert = (alertId: string) => {
    setCapAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'Broadcasted' } : a))
    );
  };

  // Handler: Submit Report from Citizen Portal
  const handleSubmitReport = (newReport: WeatherReport) => {
    setReports((prev) => [newReport, ...prev]);
    setSelectedReport(newReport);
  };

  // Handler: Dispatch SOS Rescue Request
  const handleDispatchSOS = (sos: SOSRescueRequest) => {
    setSosRequests((prev) => [sos, ...prev]);
  };

  // Handler: Inject specific test scenario
  const handleInjectSimulatedEvent = (type: 'flood' | 'cyclone' | 'fake_test' | 'sms_landslide') => {
    let newReport: WeatherReport;
    const now = new Date().toISOString();

    if (type === 'flood') {
      newReport = {
        id: `inj-mumbai-${Date.now()}`,
        source: 'citizen_report',
        sourceHandle: 'Citizen @Aditya_M',
        timestamp: now,
        title: 'Severe waterlogging at Milan Subway, Santa Cruz',
        content: 'Milan Subway flooded 3.5 feet. Cars trapped. Need civic pumping units immediately. #MumbaiRains #IMD',
        category: 'flood_inundation',
        severity: 'critical',
        city: 'Mumbai',
        state: 'Maharashtra',
        lat: 19.0833,
        lng: 72.8417,
        imageUrl: '/src/assets/images/flood_ground_report_1790628253774.jpg',
        verificationStatus: 'verified',
        clusterId: 'CLU-MUM-842',
        trustScore: {
          totalScore: 95,
          imdCorrelation: 29,
          corroborationCount: 28,
          sourceCredibility: 19,
          mediaForensics: 19,
          explainability: 'IMD Santacruz AWS recorded 84mm rainfall in 1hr. Exif GPS matched Milan Subway.',
        },
      };
    } else if (type === 'fake_test') {
      newReport = {
        id: `inj-fake-${Date.now()}`,
        source: 'social_media',
        sourceHandle: '@viral_disaster_hoax (X/Twitter)',
        timestamp: now,
        title: 'BREAKING: Massive tsunami wave hits Marine Drive promenade!!',
        content: 'Gigantic 30-meter wave crossing Nariman Point right now!! Evacuate entire Mumbai! #Tsunami #Mumbai #IMD',
        category: 'cyclone',
        severity: 'critical',
        city: 'Mumbai',
        state: 'Maharashtra',
        lat: 18.9438,
        lng: 72.8231,
        imageUrl: '/src/assets/images/satellite_insat_cloud_1790628242082.jpg',
        verificationStatus: 'suspicious',
        trustScore: {
          totalScore: 12,
          imdCorrelation: 0,
          corroborationCount: 1,
          sourceCredibility: 3,
          mediaForensics: 8,
          isFakeSuspect: true,
          fakeReason: 'Tsunami hoaxes debunked. INCOIS Indian Tsunami Early Warning Centre indicates zero seismic anomaly and calm sea state (0.6m wave height).',
          explainability: 'FLAGGED MISINFORMATION: Contradicts official INCOIS ocean buoy network and coastal radar.',
        },
      };
    } else if (type === 'sms_landslide') {
      newReport = {
        id: `inj-sms-${Date.now()}`,
        source: 'sms_gateway',
        sourceHandle: 'SMS: +91 94****2200',
        timestamp: now,
        title: 'SMS Alert: Landslide on Dharamshala-Kangra road',
        content: 'REPORT LANDSLIDE DHARAMSHALA CRITICAL 176215 ROAD BROKEN 50M FALLEN PINES',
        category: 'landslide',
        severity: 'critical',
        city: 'Dharamshala',
        state: 'Himachal Pradesh',
        lat: 32.2190,
        lng: 76.3234,
        verificationStatus: 'verified',
        clusterId: 'CLU-HP-402',
        trustScore: {
          totalScore: 89,
          imdCorrelation: 25,
          corroborationCount: 26,
          sourceCredibility: 19,
          mediaForensics: 19,
          explainability: 'Verified via Emergency SMS Parser. Corroborated with Kangra District Disaster Control Room.',
        },
      };
    } else {
      newReport = {
        id: `inj-cyclone-${Date.now()}`,
        source: 'social_media',
        sourceHandle: '@odisha_disaster_monitor',
        timestamp: now,
        title: 'Severe Cyclonic Storm landfall warning near Paradip Port',
        content: 'Barometric pressure dropping to 982 hPa. Wind gusting 120 kmph. Red alert coastal warning. #OdishaWeather #IMD',
        category: 'cyclone',
        severity: 'critical',
        city: 'Puri',
        state: 'Odisha',
        lat: 19.8135,
        lng: 85.8312,
        imageUrl: '/src/assets/images/satellite_insat_cloud_1790628242082.jpg',
        verificationStatus: 'verified',
        clusterId: 'CLU-ODI-901',
        trustScore: {
          totalScore: 98,
          imdCorrelation: 30,
          corroborationCount: 30,
          sourceCredibility: 20,
          mediaForensics: 18,
          explainability: 'Cross-validated with Paradip Doppler Radar and INSAT-3DR thermal infrared depression eye tracking.',
        },
      };
    }

    setReports((prev) => [newReport, ...prev]);
    setSelectedReport(newReport);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Universal 3-Zone Top Navigation */}
      <TopNavigation
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        lang={lang}
        setLang={setLang}
        isStreaming={isStreaming}
        setIsStreaming={setIsStreaming}
        onOpenSOS={() => {
          setEmergencyModalMode('sos');
          setEmergencyModalOpen(true);
        }}
        onOpenEmergency={() => {
          setEmergencyModalMode('directory');
          setEmergencyModalOpen(true);
        }}
        pendingCount={pendingCount}
        activeCapCount={activeCapCount}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full flex flex-col">
        {currentTab === 'map' && (
          <div className="relative w-full flex-1 flex flex-col">
            {/* Map Engine Segmented Control */}
            <div className="absolute top-3.5 right-4 z-30 flex items-center p-0.5 bg-slate-950/95 backdrop-blur-md rounded-lg border border-slate-800 shadow-xl text-xs font-mono">
              <button
                onClick={() => setMapEngine('earth')}
                className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                  mapEngine === 'earth'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Google Earth 3D</span>
              </button>
              <button
                onClick={() => setMapEngine('leaflet')}
                className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                  mapEngine === 'leaflet'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>OpenStreetMap</span>
              </button>
            </div>

            {mapEngine === 'earth' ? (
              <GoogleEarthMap
                reports={reports}
                shelters={shelters}
                selectedReport={selectedReport}
                onSelectReport={(rep) => setSelectedReport(rep)}
                lang={lang}
              />
            ) : (
              <GisMapIndia
                reports={reports}
                shelters={shelters}
                selectedReport={selectedReport}
                onSelectReport={(rep) => setSelectedReport(rep)}
                lang={lang}
              />
            )}
          </div>
        )}

        {currentTab === 'feed' && (
          <LiveIngestionFeed
            reports={reports}
            onSelectReport={(rep) => {
              setSelectedReport(rep);
              setCurrentTab('map');
            }}
            onInjectSimulatedEvent={handleInjectSimulatedEvent}
            lang={lang}
          />
        )}

        {currentTab === 'admin' && (
          <AuthorityReviewPanel
            reports={reports}
            onUpdateStatus={handleUpdateStatus}
            onGenerateCAP={handleGenerateCAP}
            lang={lang}
          />
        )}

        {currentTab === 'citizen' && (
          <CitizenPortal
            reports={reports}
            shelters={shelters}
            onSubmitReport={handleSubmitReport}
            onOpenSOS={() => {
              setEmergencyModalMode('sos');
              setEmergencyModalOpen(true);
            }}
            lang={lang}
          />
        )}

        {currentTab === 'cap' && (
          <CAPAlertsHub
            alerts={capAlerts}
            onBroadcastAlert={handleBroadcastAlert}
            lang={lang}
          />
        )}

        {currentTab === 'analytics' && (
          <BigDataAnalytics
            reports={reports}
            lang={lang}
          />
        )}
      </main>

      {/* Emergency & SOS Distress Modal */}
      <EmergencyModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
        mode={emergencyModalMode}
        emergencyServices={emergencyServices}
        sosRequests={sosRequests}
        onDispatchSOS={handleDispatchSOS}
      />
    </div>
  );
}
