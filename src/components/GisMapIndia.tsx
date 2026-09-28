import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Layers, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  Radio, 
  Eye, 
  Building2, 
  Droplets, 
  Compass,
  Maximize2
} from 'lucide-react';
import { WeatherReport, SafeShelter, Language } from '../types/weather';
import { TRANSLATIONS } from '../data/mockData';

interface GisMapIndiaProps {
  reports: WeatherReport[];
  shelters: SafeShelter[];
  selectedReport: WeatherReport | null;
  onSelectReport: (report: WeatherReport) => void;
  lang: Language;
}

// Coordinate center for Indian Subcontinent
const INDIA_CENTER: [number, number] = [20.5937, 78.9629];
const INDIA_ZOOM = 5;

// Indian States and Union Territories list for instant regional navigation
const INDIAN_REGIONS = [
  { name: 'All India', lat: 20.5937, lng: 78.9629, zoom: 5 },
  { name: 'Maharashtra (Mumbai / Pune)', lat: 19.7515, lng: 75.7139, zoom: 7 },
  { name: 'Delhi NCR', lat: 28.6139, lng: 77.2090, zoom: 10 },
  { name: 'Assam & North East', lat: 26.2006, lng: 92.9376, zoom: 7 },
  { name: 'Tamil Nadu (Chennai)', lat: 11.1271, lng: 78.6569, zoom: 7 },
  { name: 'Kerala (Kochi / Wayanad)', lat: 10.8505, lng: 76.2711, zoom: 8 },
  { name: 'Odisha (Coastal Belt)', lat: 20.9517, lng: 85.0985, zoom: 7 },
  { name: 'Gujarat (Ahmedabad)', lat: 22.2587, lng: 71.1924, zoom: 7 },
  { name: 'Karnataka (Bengaluru)', lat: 15.3173, lng: 75.7139, zoom: 7 },
  { name: 'Himachal Pradesh & J&K', lat: 31.1048, lng: 77.1734, zoom: 8 },
  { name: 'West Bengal (Kolkata)', lat: 22.9868, lng: 87.8550, zoom: 7 },
  { name: 'Rajasthan (Desert / Jodhpur)', lat: 27.0238, lng: 74.2179, zoom: 7 },
  { name: 'Andhra Pradesh & Telangana', lat: 15.9129, lng: 79.7400, zoom: 7 },
  { name: 'Bihar & Uttar Pradesh', lat: 26.8467, lng: 80.9462, zoom: 7 },
];

export const GisMapIndia: React.FC<GisMapIndiaProps> = ({
  reports,
  shelters,
  selectedReport,
  onSelectReport,
  lang,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const sheltersLayerRef = useRef<L.LayerGroup | null>(null);
  const radarOverlayRef = useRef<L.ImageOverlay | null>(null);
  const satelliteOverlayRef = useRef<L.ImageOverlay | null>(null);

  // Layer switches
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [showRadarLayer, setShowRadarLayer] = useState(true);
  const [showSatelliteLayer, setShowSatelliteLayer] = useState(false);
  const [showShelters, setShowShelters] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('All India');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const t = TRANSLATIONS[lang];

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Create Map Instance
    const map = L.map(mapContainerRef.current, {
      center: INDIA_CENTER,
      zoom: INDIA_ZOOM,
      minZoom: 4,
      maxZoom: 18,
      zoomControl: false,
    });

    // Clean OpenStreetMap tiles with dark styling (no watermarks or external API key blockage)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      className: 'osm-dark-tiles',
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    sheltersLayerRef.current = L.layerGroup().addTo(map);

    // IMD Doppler Radar Bounds (Bay of Bengal & Peninsular India)
    const radarBounds: L.LatLngBoundsExpression = [
      [14.0, 68.0],
      [24.5, 89.0],
    ];
    radarOverlayRef.current = L.imageOverlay(
      '/src/assets/images/imd_radar_scan_1790628230808.jpg',
      radarBounds,
      { opacity: 0.42, interactive: false }
    ).addTo(map);

    // INSAT-3DR Satellite Cloud Bounds
    const satBounds: L.LatLngBoundsExpression = [
      [8.0, 68.0],
      [36.0, 96.0],
    ];
    satelliteOverlayRef.current = L.imageOverlay(
      '/src/assets/images/satellite_insat_cloud_1790628242082.jpg',
      satBounds,
      { opacity: 0.38, interactive: false }
    );

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Radar Layer Visibility
  useEffect(() => {
    if (!mapInstanceRef.current || !radarOverlayRef.current) return;
    if (showRadarLayer) {
      if (!mapInstanceRef.current.hasLayer(radarOverlayRef.current)) {
        radarOverlayRef.current.addTo(mapInstanceRef.current);
      }
    } else {
      if (mapInstanceRef.current.hasLayer(radarOverlayRef.current)) {
        radarOverlayRef.current.remove();
      }
    }
  }, [showRadarLayer]);

  // Update Satellite Layer Visibility
  useEffect(() => {
    if (!mapInstanceRef.current || !satelliteOverlayRef.current) return;
    if (showSatelliteLayer) {
      if (!mapInstanceRef.current.hasLayer(satelliteOverlayRef.current)) {
        satelliteOverlayRef.current.addTo(mapInstanceRef.current);
      }
    } else {
      if (mapInstanceRef.current.hasLayer(satelliteOverlayRef.current)) {
        satelliteOverlayRef.current.remove();
      }
    }
  }, [showSatelliteLayer]);

  // Populate Markers for Reports & Shelters
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;
    markersLayerRef.current.clearLayers();

    // Filter reports
    const filteredReports = reports.filter((r) => {
      if (showVerifiedOnly && r.verificationStatus !== 'verified') return false;
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      return true;
    });

    filteredReports.forEach((rep) => {
      // Color-coding based on severity and verification status
      let borderColor = '#06b6d4'; // cyan
      let bgColor = 'rgba(6, 182, 212, 0.9)';
      let pulseRing = '';

      if (rep.verificationStatus === 'suspicious') {
        borderColor = '#f43f5e';
        bgColor = 'rgba(244, 63, 94, 0.9)';
      } else if (rep.severity === 'critical') {
        borderColor = '#ef4444';
        bgColor = 'rgba(239, 68, 68, 0.95)';
        pulseRing = '<div class="absolute -inset-2 rounded-full border-2 border-red-500 animate-ping opacity-60"></div>';
      } else if (rep.severity === 'high') {
        borderColor = '#f59e0b';
        bgColor = 'rgba(245, 158, 11, 0.9)';
      } else if (rep.verificationStatus === 'verified') {
        borderColor = '#10b981';
        bgColor = 'rgba(16, 185, 129, 0.9)';
      }

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          ${pulseRing}
          <div class="w-8 h-8 rounded-full border-2 shadow-lg flex items-center justify-center text-white font-mono text-[11px] font-bold" 
               style="background-color: ${bgColor}; border-color: ${borderColor};">
            ${rep.trustScore.totalScore}
          </div>
          <div class="absolute -bottom-1 w-2 h-2 rotate-45" style="background-color: ${borderColor};"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-weather-pin',
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([rep.lat, rep.lng], { icon: customIcon });

      const popupHtml = `
        <div class="p-1 min-w-[260px] text-xs">
          <div class="flex items-center justify-between pb-1 mb-1 border-b border-slate-700">
            <span class="font-bold text-white uppercase tracking-wider text-[11px]">${rep.city}, ${rep.state}</span>
            <span class="font-mono text-cyan-400 font-bold">${rep.trustScore.totalScore}/100 Trust</span>
          </div>
          <div class="text-slate-200 font-semibold mb-1">${rep.title}</div>
          <div class="text-slate-400 mb-2 line-clamp-2">${rep.content}</div>
          <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
            <span>${rep.sourceHandle}</span>
            <span class="capitalize text-${rep.severity === 'critical' ? 'red' : 'amber'}-400 font-bold">${rep.severity}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        onSelectReport(rep);
      });

      marker.addTo(markersLayerRef.current!);
    });

    // Shelters Layer
    if (sheltersLayerRef.current) {
      sheltersLayerRef.current.clearLayers();
      if (showShelters) {
        shelters.forEach((sh) => {
          const shelterIconHtml = `
            <div class="w-6 h-6 rounded bg-emerald-600 border border-emerald-300 text-white flex items-center justify-center shadow-md">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
          `;
          const sIcon = L.divIcon({
            className: 'shelter-pin',
            html: shelterIconHtml,
            iconSize: [24, 24],
            iconAnchor: [12, 24],
          });

          const sMarker = L.marker([sh.lat, sh.lng], { icon: sIcon });
          sMarker.bindPopup(`
            <div class="p-1 min-w-[220px] text-xs">
              <span class="text-emerald-400 font-bold block mb-1">SAFE RELIEF SHELTER</span>
              <div class="font-semibold text-white">${sh.name}</div>
              <div class="text-slate-300 mt-1">${sh.city}, ${sh.state}</div>
              <div class="mt-1 text-slate-400">Capacity: ${sh.currentOccupancy} / ${sh.capacity} (${Math.round((sh.currentOccupancy/sh.capacity)*100)}% filled)</div>
              <div class="text-[11px] text-cyan-300 font-mono mt-1">Helpline: ${sh.contact}</div>
            </div>
          `);
          sMarker.addTo(sheltersLayerRef.current!);
        });
      }
    }
  }, [reports, shelters, showVerifiedOnly, showShelters, categoryFilter, onSelectReport]);

  // Focus map on selected report if available
  useEffect(() => {
    if (selectedReport && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([selectedReport.lat, selectedReport.lng], 11, {
        duration: 1.2,
      });
    }
  }, [selectedReport]);

  // Handle Region Quick Switch
  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regionName = e.target.value;
    setSelectedRegion(regionName);
    const reg = INDIAN_REGIONS.find((r) => r.name === regionName);
    if (reg && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([reg.lat, reg.lng], reg.zoom, { duration: 1.5 });
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-110px)] min-h-[560px] bg-slate-950 flex flex-col overflow-hidden">
      {/* Map Control Floating HUD */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-wrap items-center gap-2 max-w-4xl bg-slate-900/90 backdrop-blur-md p-2 rounded-lg border border-slate-800 shadow-xl">
        {/* Region Pan-Zoom Navigator covering all India */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/80 rounded border border-slate-700">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <select
            value={selectedRegion}
            onChange={handleRegionChange}
            className="bg-transparent text-xs text-white focus:outline-none cursor-pointer pr-1 font-medium"
          >
            {INDIAN_REGIONS.map((r) => (
              <option key={r.name} value={r.name} className="bg-slate-900 text-white">
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-800/80 text-xs text-slate-200 border border-slate-700 rounded px-2.5 py-1 focus:outline-none"
        >
          <option value="all">All Events ({reports.length})</option>
          <option value="flood_inundation">Flooding / Waterlogging</option>
          <option value="heavy_rainfall">Heavy Rainfall</option>
          <option value="cyclone">Cyclone Alerts</option>
          <option value="thunderstorm">Thunderstorm / Squall</option>
          <option value="landslide">Landslides</option>
          <option value="heatwave">Heatwaves</option>
          <option value="fog_smog">Fog / Smog</option>
        </select>

        {/* Layer Toggles */}
        <button
          onClick={() => setShowRadarLayer(!showRadarLayer)}
          className={`px-2.5 py-1 text-xs rounded border transition-colors flex items-center gap-1.5 ${
            showRadarLayer
              ? 'bg-cyan-950 text-cyan-300 border-cyan-600/60'
              : 'bg-slate-800/60 text-slate-400 border-slate-700'
          }`}
          title="Toggle IMD Doppler Radar dBZ Layer"
        >
          <Radio className="w-3.5 h-3.5 text-cyan-400" />
          <span>IMD Radar dBZ</span>
        </button>

        <button
          onClick={() => setShowSatelliteLayer(!showSatelliteLayer)}
          className={`px-2.5 py-1 text-xs rounded border transition-colors flex items-center gap-1.5 ${
            showSatelliteLayer
              ? 'bg-indigo-950 text-indigo-300 border-indigo-600/60'
              : 'bg-slate-800/60 text-slate-400 border-slate-700'
          }`}
          title="Toggle INSAT-3DR Satellite Cloud Band Layer"
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>INSAT-3DR</span>
        </button>

        <button
          onClick={() => setShowShelters(!showShelters)}
          className={`px-2.5 py-1 text-xs rounded border transition-colors flex items-center gap-1.5 ${
            showShelters
              ? 'bg-emerald-950 text-emerald-300 border-emerald-600/60'
              : 'bg-slate-800/60 text-slate-400 border-slate-700'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Safe Shelters</span>
        </button>

        <button
          onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
          className={`px-2.5 py-1 text-xs rounded border transition-colors flex items-center gap-1.5 ${
            showVerifiedOnly
              ? 'bg-amber-950 text-amber-300 border-amber-600/60'
              : 'bg-slate-800/60 text-slate-400 border-slate-700'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Verified Only</span>
        </button>
      </div>

      {/* Map Stats Pill Overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] hidden sm:flex items-center gap-3 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Verified: {reports.filter((r) => r.verificationStatus === 'verified').length}</span>
        </span>
        <span className="text-slate-600">|</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>Pending: {reports.filter((r) => r.verificationStatus === 'pending').length}</span>
        </span>
        <span className="text-slate-600">|</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          <span>Suspicious: {reports.filter((r) => r.verificationStatus === 'suspicious').length}</span>
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-cyan-400">Coverage: 28 States + 8 UTs Active</span>
      </div>

      {/* Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Selected Report Floating Inspector Drawer */}
      {selectedReport && (
        <div className="absolute right-4 top-4 bottom-4 z-[1000] w-96 max-w-[calc(100vw-32px)] bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl p-4 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-bold text-white">{selectedReport.city}, {selectedReport.state}</span>
                  <span>·</span>
                  <span className="uppercase text-[10px] tracking-wide text-cyan-400 font-mono">{selectedReport.category.replace('_', ' ')}</span>
                </div>
                <h3 className="text-sm font-semibold text-white mt-1 leading-snug">
                  {selectedReport.title}
                </h3>
              </div>
              <button
                onClick={() => onSelectReport(null as any)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Photo / Media forensics evidence */}
            {selectedReport.imageUrl && (
              <div className="mt-3 relative rounded-lg overflow-hidden border border-slate-700 bg-black">
                <img
                  src={selectedReport.imageUrl}
                  alt={selectedReport.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-40 object-cover"
                />
                <div className="absolute bottom-1 right-1 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300">
                  {selectedReport.exifMetadata?.deviceCamera || 'EXIF Validated'}
                </div>
              </div>
            )}

            {/* Ground observation text */}
            <div className="mt-3 p-2.5 bg-slate-950/60 rounded border border-slate-800/80 text-xs text-slate-200">
              <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                Source: {selectedReport.sourceHandle} ({selectedReport.source.replace('_', ' ')})
              </span>
              <p>{selectedReport.content}</p>
            </div>

            {/* Explainable AI Trust Score breakdown (4-pillars) */}
            <div className="mt-3 p-3 bg-slate-950/80 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-200">AI Trust Score Engine</span>
                <span className={`text-base font-bold font-mono ${
                  selectedReport.trustScore.totalScore >= 80 ? 'text-emerald-400' :
                  selectedReport.trustScore.totalScore >= 50 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {selectedReport.trustScore.totalScore} / 100
                </span>
              </div>

              {/* 4 Pillars bars */}
              <div className="space-y-1.5 text-[11px]">
                <div>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>IMD Doppler / AWS Correlation</span>
                    <span className="font-mono text-slate-200">{selectedReport.trustScore.imdCorrelation}/30</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full rounded-full"
                      style={{ width: `${(selectedReport.trustScore.imdCorrelation / 30) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Multi-Source Corroboration</span>
                    <span className="font-mono text-slate-200">{selectedReport.trustScore.corroborationCount}/30</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{ width: `${(selectedReport.trustScore.corroborationCount / 30) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Source Credibility / History</span>
                    <span className="font-mono text-slate-200">{selectedReport.trustScore.sourceCredibility}/20</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full"
                      style={{ width: `${(selectedReport.trustScore.sourceCredibility / 20) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Media Forensics &amp; EXIF Integrity</span>
                    <span className="font-mono text-slate-200">{selectedReport.trustScore.mediaForensics}/20</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full"
                      style={{ width: `${(selectedReport.trustScore.mediaForensics / 20) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Explainability text */}
              <div className="mt-2.5 pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                <span className="font-semibold text-cyan-400">Explainable Rationale: </span>
                {selectedReport.trustScore.explainability}
              </div>
            </div>

            {/* Official IMD Station Reading if correlated */}
            {selectedReport.officialImdReading && (
              <div className="mt-3 p-2 bg-cyan-950/40 border border-cyan-800/40 rounded text-[11px]">
                <div className="text-cyan-300 font-semibold mb-1">
                  IMD Ground Station Telemetry ({selectedReport.officialImdReading.stationName})
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[10px]">
                  {selectedReport.officialImdReading.rainfallMm !== undefined && (
                    <div>Rain: {selectedReport.officialImdReading.rainfallMm} mm</div>
                  )}
                  {selectedReport.officialImdReading.radarDbz !== undefined && (
                    <div>Radar: {selectedReport.officialImdReading.radarDbz} dBZ</div>
                  )}
                  {selectedReport.officialImdReading.tempC !== undefined && (
                    <div>Temp: {selectedReport.officialImdReading.tempC} °C</div>
                  )}
                  {selectedReport.officialImdReading.windKmph !== undefined && (
                    <div>Wind: {selectedReport.officialImdReading.windKmph} km/h</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Lat: {selectedReport.lat.toFixed(4)}, Lng: {selectedReport.lng.toFixed(4)}</span>
            <span className="font-mono">{new Date(selectedReport.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};
