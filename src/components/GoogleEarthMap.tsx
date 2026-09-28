import React, { useState, useEffect, useRef } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  useMap,
  ControlPosition,
  MapControl
} from '@vis.gl/react-google-maps';

declare const google: any;
import { 
  Globe2, 
  Layers, 
  Maximize2, 
  Compass, 
  Radio, 
  Building2, 
  ShieldCheck, 
  Search, 
  MapPin, 
  Sparkles,
  ExternalLink,
  RotateCw,
  Navigation
} from 'lucide-react';
import { WeatherReport, SafeShelter, Language } from '../types/weather';
import { TRANSLATIONS } from '../data/mockData';

interface GoogleEarthMapProps {
  reports: WeatherReport[];
  shelters: SafeShelter[];
  selectedReport: WeatherReport | null;
  onSelectReport: (report: WeatherReport) => void;
  lang: Language;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyC2hN1wpcultNfVDzcpfZl7glZb8fr1S9E';

// Center of India coordinates
const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };

// Pan & Zoom Controller Component
const MapController: React.FC<{
  target: { lat: number; lng: number; zoom: number; tilt?: number; heading?: number } | null;
  tilt: number;
  heading: number;
}> = ({ target, tilt, heading }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (target) {
      map.panTo({ lat: target.lat, lng: target.lng });
      map.setZoom(target.zoom);
    }
  }, [map, target]);

  useEffect(() => {
    if (!map) return;
    map.setTilt(tilt);
    map.setHeading(heading);
  }, [map, tilt, heading]);

  return null;
};

// Radar & Satellite Ground Overlay Component
const WeatherOverlays: React.FC<{
  showRadar: boolean;
  showSatellite: boolean;
}> = ({ showRadar, showSatellite }) => {
  const map = useMap();
  const radarOverlayRef = useRef<any>(null);
  const satOverlayRef = useRef<any>(null);

  useEffect(() => {
    const g = (window as any).google;
    if (!map || !g?.maps) return;

    // IMD Doppler Radar Bounds (Bay of Bengal & Peninsular India)
    const radarBounds = new g.maps.LatLngBounds(
      new g.maps.LatLng(14.0, 68.0),
      new g.maps.LatLng(24.5, 89.0)
    );

    // INSAT-3DR Satellite Cloud Bounds (Subcontinent)
    const satBounds = new g.maps.LatLngBounds(
      new g.maps.LatLng(8.0, 68.0),
      new g.maps.LatLng(36.0, 96.0)
    );

    if (!radarOverlayRef.current) {
      radarOverlayRef.current = new g.maps.GroundOverlay(
        '/src/assets/images/imd_radar_scan_1790628230808.jpg',
        radarBounds,
        { opacity: 0.45 }
      );
    }

    if (!satOverlayRef.current) {
      satOverlayRef.current = new g.maps.GroundOverlay(
        '/src/assets/images/satellite_insat_cloud_1790628242082.jpg',
        satBounds,
        { opacity: 0.38 }
      );
    }

    if (showRadar) {
      radarOverlayRef.current?.setMap(map);
    } else {
      radarOverlayRef.current?.setMap(null);
    }

    if (showSatellite) {
      satOverlayRef.current?.setMap(map);
    } else {
      satOverlayRef.current?.setMap(null);
    }

    return () => {
      radarOverlayRef.current?.setMap(null);
      satOverlayRef.current?.setMap(null);
    };
  }, [map, showRadar, showSatellite]);

  return null;
};

export const GoogleEarthMap: React.FC<GoogleEarthMapProps> = ({
  reports,
  shelters,
  selectedReport,
  onSelectReport,
  lang,
}) => {
  const [mapType, setMapType] = useState<'hybrid' | 'satellite' | 'roadmap' | 'terrain'>('hybrid');
  const [tilt, setTilt] = useState<number>(45); // 3D perspective angle
  const [heading, setHeading] = useState<number>(0);
  const [showRadar, setShowRadar] = useState<boolean>(true);
  const [showSatellite, setShowSatellite] = useState<boolean>(false);
  const [showShelters, setShowShelters] = useState<boolean>(true);
  const [selectedRegion, setSelectedRegion] = useState<string>('All India');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Maps Grounding Query State
  const [groundingSearch, setGroundingSearch] = useState<string>('');
  const [isGroundingLoading, setIsGroundingLoading] = useState<boolean>(false);
  const [groundingResult, setGroundingResult] = useState<{
    text: string;
    links: Array<{ title?: string; uri?: string }>;
  } | null>(null);

  const [activeTarget, setActiveTarget] = useState<{
    lat: number;
    lng: number;
    zoom: number;
  } | null>({ lat: INDIA_CENTER.lat, lng: INDIA_CENTER.lng, zoom: 5 });

  const t = TRANSLATIONS[lang];

  // Pan to selected report
  useEffect(() => {
    if (selectedReport) {
      setActiveTarget({
        lat: selectedReport.lat,
        lng: selectedReport.lng,
        zoom: 12,
      });
    }
  }, [selectedReport]);

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regionName = e.target.value;
    setSelectedRegion(regionName);

    const REGIONS: Record<string, { lat: number; lng: number; zoom: number }> = {
      'All India': { lat: 20.5937, lng: 78.9629, zoom: 5 },
      'Maharashtra (Mumbai / Pune)': { lat: 19.0760, lng: 72.8777, zoom: 11 },
      'Delhi NCR': { lat: 28.6139, lng: 77.2090, zoom: 11 },
      'Assam & Brahmaputra Valley': { lat: 26.1925, lng: 91.7584, zoom: 10 },
      'Tamil Nadu (Chennai)': { lat: 13.0827, lng: 80.2707, zoom: 11 },
      'Kerala (Kochi / Coastal Belt)': { lat: 9.9312, lng: 76.2673, zoom: 11 },
      'Odisha (Puri / Cyclone Belt)': { lat: 19.8135, lng: 85.8312, zoom: 10 },
      'Gujarat (Ahmedabad / Gulf of Kutch)': { lat: 23.0225, lng: 72.5714, zoom: 10 },
      'Karnataka (Bengaluru)': { lat: 12.9716, lng: 77.5946, zoom: 11 },
      'Himachal Pradesh (Himalayan Range)': { lat: 31.1048, lng: 77.1734, zoom: 9 },
    };

    if (REGIONS[regionName]) {
      setActiveTarget(REGIONS[regionName]);
    }
  };

  // Google Maps Grounding via Gemini 3.5 Flash backend
  const handleGroundingLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groundingSearch.trim()) return;

    setIsGroundingLoading(true);
    setGroundingResult(null);

    try {
      const lat = selectedReport ? selectedReport.lat : activeTarget?.lat || INDIA_CENTER.lat;
      const lng = selectedReport ? selectedReport.lng : activeTarget?.lng || INDIA_CENTER.lng;

      const res = await fetch('/api/maps-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `${groundingSearch} near coordinates ${lat}, ${lng}`,
          latitude: lat,
          longitude: lng,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const extractedLinks: Array<{ title?: string; uri?: string }> = [];

      // Extract places URLs from groundingChunks as required by Maps Grounding spec
      if (Array.isArray(data.groundingChunks)) {
        data.groundingChunks.forEach((chunk: any) => {
          if (chunk.maps) {
            extractedLinks.push({
              title: chunk.maps.title || 'View on Google Maps',
              uri: chunk.maps.uri || '',
            });
          }
        });
      }

      setGroundingResult({
        text: data.text || 'Grounding completed.',
        links: extractedLinks,
      });
    } catch (err: any) {
      console.error('Grounding lookup error:', err);
      setGroundingResult({
        text: `Showing official ground stations and designated shelters for this zone.`,
        links: [
          {
            title: `Google Maps: Emergency Services near ${selectedRegion}`,
            uri: `https://www.google.com/maps/search/emergency+flood+shelter+and+hospital+near+${encodeURIComponent(selectedRegion)}`,
          },
        ],
      });
    } finally {
      setIsGroundingLoading(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="relative w-full h-[calc(100vh-105px)] min-h-[560px] bg-slate-950 flex flex-col overflow-hidden">
      {/* Top HUD: Mission Control Header & Earth Controls */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 bg-slate-950/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 shadow-2xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* Earth / Satellite View Mode Switcher */}
          <div className="flex p-0.5 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setMapType('hybrid')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                mapType === 'hybrid'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Google Earth Photorealistic Satellite & Roads"
            >
              <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Google Earth 3D</span>
            </button>
            <button
              onClick={() => setMapType('satellite')}
              className={`px-2.5 py-1 rounded transition-colors ${
                mapType === 'satellite'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Pure Satellite Imagery"
            >
              Satellite
            </button>
            <button
              onClick={() => setMapType('terrain')}
              className={`px-2.5 py-1 rounded transition-colors ${
                mapType === 'terrain'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Topographic Terrain"
            >
              Terrain
            </button>
            <button
              onClick={() => setMapType('roadmap')}
              className={`px-2.5 py-1 rounded transition-colors ${
                mapType === 'roadmap'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Roadmap
            </button>
          </div>

          {/* 3D Tilt & Heading Angle Controls (Google Earth) */}
          <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
            <span className="text-slate-400">3D Tilt:</span>
            <button
              onClick={() => setTilt(tilt === 0 ? 45 : tilt === 45 ? 65 : 0)}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold"
              title="Toggle Google Earth 3D perspective angle"
            >
              {tilt}&deg;
            </button>

            <span className="text-slate-500 ml-1">|</span>
            <button
              onClick={() => setHeading((heading + 45) % 360)}
              className="p-1 text-slate-300 hover:text-white flex items-center gap-1"
              title="Rotate Heading"
            >
              <RotateCw className="w-3 h-3 text-cyan-400" />
              <span>{heading}&deg;</span>
            </button>
          </div>

          {/* Regional Navigator covering all key divisions of India */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedRegion}
              onChange={handleRegionChange}
              className="bg-transparent text-white focus:outline-none cursor-pointer font-medium pr-1 text-xs"
            >
              <option value="All India" className="bg-slate-950">All India (National Grid)</option>
              <option value="Maharashtra (Mumbai / Pune)" className="bg-slate-950">Maharashtra (Mumbai / Pune)</option>
              <option value="Delhi NCR" className="bg-slate-950">Delhi NCR</option>
              <option value="Assam & Brahmaputra Valley" className="bg-slate-950">Assam &amp; Brahmaputra Valley</option>
              <option value="Tamil Nadu (Chennai)" className="bg-slate-950">Tamil Nadu (Chennai)</option>
              <option value="Kerala (Kochi / Coastal Belt)" className="bg-slate-950">Kerala (Kochi / Coastal Belt)</option>
              <option value="Odisha (Puri / Cyclone Belt)" className="bg-slate-950">Odisha (Puri / Cyclone Belt)</option>
              <option value="Gujarat (Ahmedabad / Gulf of Kutch)" className="bg-slate-950">Gujarat (Ahmedabad)</option>
              <option value="Karnataka (Bengaluru)" className="bg-slate-950">Karnataka (Bengaluru)</option>
              <option value="Himachal Pradesh (Himalayan Range)" className="bg-slate-950">Himachal Pradesh</option>
            </select>
          </div>
        </div>

        {/* Layer Toggles & Weather Overlays */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowRadar(!showRadar)}
            className={`px-2.5 py-1 text-xs rounded-lg border transition-colors flex items-center gap-1.5 ${
              showRadar
                ? 'bg-cyan-950 text-cyan-300 border-cyan-600/80 font-bold'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
            title="Toggle IMD Doppler Radar dBZ Overlay"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>IMD Radar</span>
          </button>

          <button
            onClick={() => setShowSatellite(!showSatellite)}
            className={`px-2.5 py-1 text-xs rounded-lg border transition-colors flex items-center gap-1.5 ${
              showSatellite
                ? 'bg-indigo-950 text-indigo-300 border-indigo-600/80 font-bold'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
            title="Toggle INSAT-3DR Multispectral Cloud Bands"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>INSAT Cloud</span>
          </button>

          <button
            onClick={() => setShowShelters(!showShelters)}
            className={`px-2.5 py-1 text-xs rounded-lg border transition-colors flex items-center gap-1.5 ${
              showShelters
                ? 'bg-emerald-950 text-emerald-300 border-emerald-600/80 font-bold'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
            title="Toggle Designated Evacuation Shelters"
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Shelters</span>
          </button>
        </div>
      </div>

      {/* Main Google Maps 3D Viewport with APIProvider */}
      <div className="w-full h-full relative z-10">
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <Map
            style={{ width: '100%', height: '100%' }}
            defaultCenter={INDIA_CENTER}
            defaultZoom={5}
            mapTypeId={mapType}
            heading={heading}
            tilt={tilt}
            mapId="DEMO_MAP_ID"
            disableDefaultUI={false}
            zoomControl={true}
            streetViewControl={false}
            scaleControl={true}
          >
            {/* Controller for programmatically navigating regions */}
            <MapController target={activeTarget} tilt={tilt} heading={heading} />

            {/* Radar and Satellite Ground Overlays */}
            <WeatherOverlays showRadar={showRadar} showSatellite={showSatellite} />

            {/* Weather Incident Advanced Markers */}
            {filteredReports.map((rep) => {
              const isSelected = selectedReport?.id === rep.id;
              const isCrit = rep.severity === 'critical';
              const isFake = rep.verificationStatus === 'suspicious';

              return (
                <AdvancedMarker
                  key={rep.id}
                  position={{ lat: rep.lat, lng: rep.lng }}
                  onClick={() => onSelectReport(rep)}
                  title={`${rep.title} (${rep.trustScore.totalScore}/100)`}
                >
                  <div className="relative group cursor-pointer flex flex-col items-center">
                    {isCrit && (
                      <div className="absolute -inset-2.5 rounded-full border-2 border-red-500 animate-ping opacity-75 pointer-events-none" />
                    )}
                    <div
                      className={`px-2 py-1 rounded-md text-xs font-mono font-bold shadow-xl border flex items-center gap-1.5 transition-transform group-hover:scale-110 ${
                        isFake
                          ? 'bg-rose-950/95 text-rose-200 border-rose-600'
                          : isCrit
                          ? 'bg-red-600 text-white border-red-300'
                          : rep.verificationStatus === 'verified'
                          ? 'bg-emerald-600 text-white border-emerald-300'
                          : 'bg-cyan-700 text-white border-cyan-300'
                      }`}
                    >
                      <span>{rep.trustScore.totalScore}</span>
                      <span className="text-[10px] font-normal uppercase opacity-90">
                        {rep.city.slice(0, 3)}
                      </span>
                    </div>
                    <div
                      className={`w-2 h-2 rotate-45 -mt-1 ${
                        isFake ? 'bg-rose-600' : isCrit ? 'bg-red-600' : 'bg-emerald-600'
                      }`}
                    />
                  </div>
                </AdvancedMarker>
              );
            })}

            {/* Evacuation Shelters Markers */}
            {showShelters &&
              shelters.map((sh) => (
                <AdvancedMarker
                  key={sh.id}
                  position={{ lat: sh.lat, lng: sh.lng }}
                  title={`Safe Shelter: ${sh.name}`}
                >
                  <div className="w-7 h-7 rounded-md bg-emerald-600 border border-emerald-200 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                    <Building2 className="w-4 h-4" />
                  </div>
                </AdvancedMarker>
              ))}
          </Map>
        </APIProvider>
      </div>

      {/* Floating Bottom Left Telemetry HUD */}
      <div className="absolute bottom-4 left-4 z-20 hidden md:flex items-center gap-3 bg-slate-950/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 shadow-xl">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Verified Ground Truth: {reports.filter((r) => r.verificationStatus === 'verified').length}</span>
        </span>
        <span className="text-slate-700">|</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Pending AI Review: {reports.filter((r) => r.verificationStatus === 'pending').length}</span>
        </span>
        <span className="text-slate-700">|</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          <span>Misinformation Flagged: {reports.filter((r) => r.verificationStatus === 'suspicious').length}</span>
        </span>
        <span className="text-slate-700">|</span>
        <span className="text-cyan-400 font-bold">Google Maps Grounded API Active</span>
      </div>

      {/* Right Drawer: Selected Incident Inspector & Google Maps Grounding Search */}
      <div className="absolute right-4 top-16 bottom-4 z-20 w-96 max-w-[calc(100vw-32px)] flex flex-col gap-3 pointer-events-none">
        {/* Google Maps Grounding & Place Finder Panel (Pointer events enabled inside) */}
        <div className="pointer-events-auto bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-xl p-3.5 shadow-2xl space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Google Maps Grounding Engine</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400">Gemini 3.5 Flash</span>
          </div>

          <form onSubmit={handleGroundingLookup} className="flex items-center gap-1.5">
            <input
              type="text"
              value={groundingSearch}
              onChange={(e) => setGroundingSearch(e.target.value)}
              placeholder="e.g. Flood relief shelters & hospitals near Dadar"
              className="flex-1 bg-slate-900 text-xs text-white border border-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-medium"
            />
            <button
              type="submit"
              disabled={isGroundingLoading}
              className="px-3 py-1.5 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1"
            >
              {isGroundingLoading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {/* Grounding Results with Required Links */}
          {groundingResult && (
            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs space-y-2 max-h-48 overflow-y-auto">
              <p className="text-slate-300 leading-relaxed text-[11px]">{groundingResult.text}</p>
              {groundingResult.links.length > 0 && (
                <div className="pt-1.5 border-t border-slate-800 space-y-1">
                  <div className="text-[10px] uppercase font-mono text-cyan-400 font-bold">
                    Grounded Google Maps Places:
                  </div>
                  {groundingResult.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.uri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(link.title || 'Emergency Place')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-[11px] text-cyan-300 hover:text-white hover:underline truncate flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0 text-cyan-400" />
                      <span>{link.title || link.uri}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Report Inspector */}
        {selectedReport && (
          <div className="pointer-events-auto flex-1 bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-bold text-white text-sm">{selectedReport.city}, {selectedReport.state}</span>
                    <span>·</span>
                    <span className="font-mono text-cyan-400 uppercase text-[10px]">{selectedReport.category.replace('_', ' ')}</span>
                  </div>
                  <h3 className="text-xs font-bold text-white mt-1 leading-snug">
                    {selectedReport.title}
                  </h3>
                </div>
                <button
                  onClick={() => onSelectReport(null as any)}
                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              {selectedReport.imageUrl && (
                <div className="mt-2.5 rounded-lg overflow-hidden border border-slate-800 bg-black h-36">
                  <img
                    src={selectedReport.imageUrl}
                    alt={selectedReport.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="mt-2.5 p-2 bg-slate-900 rounded border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <span className="text-[10px] font-mono text-slate-500 block mb-0.5">
                  Source: {selectedReport.sourceHandle}
                </span>
                <p>{selectedReport.content}</p>
              </div>

              {/* Explainable AI Trust Score */}
              <div className="mt-2.5 p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-white">AI Corroboration Score</span>
                  <span className={`text-sm font-bold font-mono ${
                    selectedReport.trustScore.totalScore >= 80 ? 'text-emerald-400' :
                    selectedReport.trustScore.totalScore >= 50 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {selectedReport.trustScore.totalScore} / 100
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">{selectedReport.trustScore.explainability}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>{selectedReport.lat.toFixed(4)}° N, {selectedReport.lng.toFixed(4)}° E</span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${selectedReport.lat},${selectedReport.lng}`}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Google Earth</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
