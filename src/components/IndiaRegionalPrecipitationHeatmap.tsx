import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  CloudRain, 
  Layers, 
  Info, 
  MapPin, 
  Compass, 
  ThermometerSnowflake, 
  TrendingUp, 
  Sparkles,
  Droplets
} from 'lucide-react';
import { WeatherReport } from '../types/weather';

interface IndiaRegionalPrecipitationHeatmapProps {
  reports: WeatherReport[];
}

interface StateHeatmapData {
  id: string;
  name: string;
  code: string;
  region: 'North' | 'South' | 'West' | 'East' | 'NorthEast' | 'Central';
  gridRow: number;
  gridCol: number;
  rainfallMm: number; // 24h accumulation
  radarDbz: number;
  departurePct: number; // % from IMD normal (e.g. +45% excess)
  warningColor: 'Green' | 'Yellow' | 'Orange' | 'Red';
  activeIncidentCount: number;
  hourlySeries: number[]; // 6 intervals (4h each)
}

// 28 States + 4 major UTs mapped to a clean geographic cartogram grid
const INDIAN_STATES_GRID: Omit<StateHeatmapData, 'rainfallMm' | 'radarDbz' | 'departurePct' | 'warningColor' | 'activeIncidentCount' | 'hourlySeries'>[] = [
  // Row 1: Far North
  { id: 'JK', name: 'Jammu & Kashmir', code: 'JK', region: 'North', gridRow: 1, gridCol: 3 },
  { id: 'LA', name: 'Ladakh', code: 'LA', region: 'North', gridRow: 1, gridCol: 4 },

  // Row 2: Northern Belt
  { id: 'HP', name: 'Himachal Pradesh', code: 'HP', region: 'North', gridRow: 2, gridCol: 3 },
  { id: 'PB', name: 'Punjab', code: 'PB', region: 'North', gridRow: 2, gridCol: 2 },
  { id: 'UK', name: 'Uttarakhand', code: 'UK', region: 'North', gridRow: 2, gridCol: 4 },

  // Row 3: Delhi, Haryana, Rajasthan, UP, North-East entry
  { id: 'HR', name: 'Haryana', code: 'HR', region: 'North', gridRow: 3, gridCol: 2 },
  { id: 'DL', name: 'Delhi NCR', code: 'DL', region: 'North', gridRow: 3, gridCol: 3 },
  { id: 'UP', name: 'Uttar Pradesh', code: 'UP', region: 'Central', gridRow: 3, gridCol: 4 },
  { id: 'BR', name: 'Bihar', code: 'BR', region: 'East', gridRow: 3, gridCol: 5 },
  { id: 'SK', name: 'Sikkim', code: 'SK', region: 'NorthEast', gridRow: 3, gridCol: 6 },
  { id: 'AR', name: 'Arunachal Pradesh', code: 'AR', region: 'NorthEast', gridRow: 3, gridCol: 8 },

  // Row 4: West to East
  { id: 'RJ', name: 'Rajasthan', code: 'RJ', region: 'West', gridRow: 4, gridCol: 1 },
  { id: 'MP', name: 'Madhya Pradesh', code: 'MP', region: 'Central', gridRow: 4, gridCol: 3 },
  { id: 'JH', name: 'Jharkhand', code: 'JH', region: 'East', gridRow: 4, gridCol: 5 },
  { id: 'WB', name: 'West Bengal', code: 'WB', region: 'East', gridRow: 4, gridCol: 6 },
  { id: 'AS', name: 'Assam', code: 'AS', region: 'NorthEast', gridRow: 4, gridCol: 7 },
  { id: 'NL', name: 'Nagaland', code: 'NL', region: 'NorthEast', gridRow: 4, gridCol: 8 },

  // Row 5: Central & Northeast
  { id: 'GJ', name: 'Gujarat', code: 'GJ', region: 'West', gridRow: 5, gridCol: 1 },
  { id: 'CG', name: 'Chhattisgarh', code: 'CG', region: 'Central', gridRow: 5, gridCol: 4 },
  { id: 'OD', name: 'Odisha', code: 'OD', region: 'East', gridRow: 5, gridCol: 5 },
  { id: 'ML', name: 'Meghalaya', code: 'ML', region: 'NorthEast', gridRow: 5, gridCol: 7 },
  { id: 'MN', name: 'Manipur', code: 'MN', region: 'NorthEast', gridRow: 5, gridCol: 8 },

  // Row 6: Peninsular
  { id: 'MH', name: 'Maharashtra', code: 'MH', region: 'West', gridRow: 6, gridCol: 2 },
  { id: 'TS', name: 'Telangana', code: 'TS', region: 'South', gridRow: 6, gridCol: 3 },
  { id: 'AP', name: 'Andhra Pradesh', code: 'AP', region: 'South', gridRow: 6, gridCol: 4 },
  { id: 'TR', name: 'Tripura', code: 'TR', region: 'NorthEast', gridRow: 6, gridCol: 7 },
  { id: 'MZ', name: 'Mizoram', code: 'MZ', region: 'NorthEast', gridRow: 6, gridCol: 8 },

  // Row 7: Goa, Karnataka, Tamil Nadu
  { id: 'GA', name: 'Goa', code: 'GA', region: 'West', gridRow: 7, gridCol: 1 },
  { id: 'KA', name: 'Karnataka', code: 'KA', region: 'South', gridRow: 7, gridCol: 2 },
  { id: 'TN', name: 'Tamil Nadu', code: 'TN', region: 'South', gridRow: 7, gridCol: 3 },

  // Row 8: Deep South
  { id: 'KL', name: 'Kerala', code: 'KL', region: 'South', gridRow: 8, gridCol: 2 },
];

export const IndiaRegionalPrecipitationHeatmap: React.FC<IndiaRegionalPrecipitationHeatmapProps> = ({
  reports,
}) => {
  const svgGeoRef = useRef<SVGSVGElement | null>(null);
  const svgMatrixRef = useRef<SVGSVGElement | null>(null);

  const [viewMode, setViewMode] = useState<'cartogram' | 'matrix'>('cartogram');
  const [selectedMetric, setSelectedMetric] = useState<'rainfall' | 'dbz' | 'departure'>('rainfall');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [hoveredState, setHoveredState] = useState<StateHeatmapData | null>(null);

  // Generate state-level intensity metrics dynamically correlated with real live reports
  const stateData: StateHeatmapData[] = useMemo(() => {
    return INDIAN_STATES_GRID.map((st) => {
      const stateReports = reports.filter(
        (r) => r.state.toLowerCase().includes(st.name.toLowerCase()) || st.name.toLowerCase().includes(r.state.toLowerCase())
      );

      // Baseline variations across Indian rainfall zones
      let baseRainfall = 18;
      if (st.id === 'MH') baseRainfall = 94.6; // Heavy monsoon coastal belt
      else if (st.id === 'AS' || st.id === 'ML') baseRainfall = 118.2; // High northeast rainfall
      else if (st.id === 'KL' || st.id === 'KA') baseRainfall = 82.5; // Western Ghats
      else if (st.id === 'TN') baseRainfall = 54.0; // Coastal squalls
      else if (st.id === 'OD' || st.id === 'WB') baseRainfall = 88.4; // Bay of Bengal depression
      else if (st.id === 'DL' || st.id === 'HR') baseRainfall = 14.5;
      else if (st.id === 'RJ') baseRainfall = 4.2; // Arid desert
      else if (st.id === 'HP' || st.id === 'UK') baseRainfall = 68.0; // Himalayan precipitation

      // Boost if reports exist
      const activeIncidentCount = stateReports.length;
      const criticalBoost = stateReports.filter((r) => r.severity === 'critical').length * 15;
      const rainfallMm = Math.round((baseRainfall + criticalBoost + activeIncidentCount * 4) * 10) / 10;

      // Doppler radar reflectivity (dBZ)
      const radarDbz = Math.min(58, Math.max(8, Math.round(rainfallMm * 0.45 + 12)));

      // Departure percentage from IMD normal (+/-)
      const departurePct = Math.round(((rainfallMm - 35) / 35) * 100);

      // IMD Warning Color Code
      let warningColor: StateHeatmapData['warningColor'] = 'Green';
      if (rainfallMm >= 100 || radarDbz >= 48) warningColor = 'Red';
      else if (rainfallMm >= 64.5 || radarDbz >= 38) warningColor = 'Orange';
      else if (rainfallMm >= 35.5 || radarDbz >= 26) warningColor = 'Yellow';

      // 6 time series intervals (T-24h to T-0h, 4 hours each)
      const hourlySeries = [
        Math.round(rainfallMm * 0.12),
        Math.round(rainfallMm * 0.18),
        Math.round(rainfallMm * 0.28),
        Math.round(rainfallMm * 0.42),
        Math.round(rainfallMm * 0.74),
        rainfallMm,
      ];

      return {
        ...st,
        rainfallMm,
        radarDbz,
        departurePct,
        warningColor,
        activeIncidentCount,
        hourlySeries,
      };
    });
  }, [reports]);

  // Color Scales
  const colorScaleRainfall = useMemo(() => {
    return d3
      .scaleSequential<string>(d3.interpolateBlues)
      .domain([0, 120]);
  }, []);

  const colorScaleDbz = useMemo(() => {
    return d3
      .scaleSequential<string>(d3.interpolateViridis)
      .domain([10, 56]);
  }, []);

  const colorScaleDeparture = useMemo(() => {
    return d3
      .scaleDiverging<string>(d3.interpolatePuOr)
      .domain([-60, 0, 150]);
  }, []);

  const getColorForState = (st: StateHeatmapData) => {
    if (selectedMetric === 'rainfall') {
      return colorScaleRainfall(st.rainfallMm);
    } else if (selectedMetric === 'dbz') {
      return colorScaleDbz(st.radarDbz);
    } else {
      return colorScaleDeparture(st.departurePct);
    }
  };

  // Render D3 Geographic Cartogram Heatmap
  useEffect(() => {
    if (viewMode !== 'cartogram' || !svgGeoRef.current) return;

    const width = 760;
    const height = 440;
    const svg = d3.select(svgGeoRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g').attr('transform', 'translate(30, 20)');

    const cellWidth = 72;
    const cellHeight = 44;
    const gap = 6;

    // Filter states if regional filter is set
    const filteredStates = regionFilter === 'all'
      ? stateData
      : stateData.filter((s) => s.region.toLowerCase() === regionFilter.toLowerCase());

    filteredStates.forEach((st) => {
      const x = (st.gridCol - 1) * (cellWidth + gap);
      const y = (st.gridRow - 1) * (cellHeight + gap);
      const cellColor = getColorForState(st);

      const cellGroup = g
        .append('g')
        .attr('transform', `translate(${x},${y})`)
        .attr('cursor', 'pointer')
        .on('mouseenter', () => setHoveredState(st))
        .on('mouseleave', () => setHoveredState(null));

      // Cell container rect
      cellGroup
        .append('rect')
        .attr('width', cellWidth)
        .attr('height', cellHeight)
        .attr('rx', 6)
        .attr('fill', cellColor)
        .attr('stroke', st.warningColor === 'Red' ? '#ef4444' : st.warningColor === 'Orange' ? '#f59e0b' : '#334155')
        .attr('stroke-width', st.warningColor === 'Red' ? 1.75 : 1)
        .attr('class', 'transition-all duration-150 hover:brightness-125');

      // State Code Label
      cellGroup
        .append('text')
        .attr('x', 8)
        .attr('y', 16)
        .attr('fill', '#ffffff')
        .attr('font-size', '11px')
        .attr('font-weight', '700')
        .attr('font-family', 'JetBrains Mono, monospace')
        .text(st.code);

      // Warning Indicator Pill (Circle)
      cellGroup
        .append('circle')
        .attr('cx', cellWidth - 10)
        .attr('cy', 12)
        .attr('r', 3.5)
        .attr('fill', st.warningColor === 'Red' ? '#ef4444' : st.warningColor === 'Orange' ? '#f59e0b' : st.warningColor === 'Yellow' ? '#eab308' : '#10b981');

      // Metric Value text
      let valText = `${st.rainfallMm}mm`;
      if (selectedMetric === 'dbz') valText = `${st.radarDbz}dBZ`;
      if (selectedMetric === 'departure') valText = `${st.departurePct > 0 ? '+' : ''}${st.departurePct}%`;

      cellGroup
        .append('text')
        .attr('x', 8)
        .attr('y', 33)
        .attr('fill', '#f1f5f9')
        .attr('font-size', '10px')
        .attr('font-weight', '600')
        .attr('font-family', 'JetBrains Mono, monospace')
        .text(valText);
    });

  }, [viewMode, selectedMetric, regionFilter, stateData]);

  // Render D3 24-Hour Regional Matrix Heatmap
  useEffect(() => {
    if (viewMode !== 'matrix' || !svgMatrixRef.current) return;

    const width = 760;
    const height = 480;
    const svg = d3.select(svgMatrixRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const margin = { top: 35, right: 30, bottom: 25, left: 120 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const timeIntervals = ['T-24h', 'T-20h', 'T-16h', 'T-12h', 'T-6h', 'Current (T-0h)'];

    // Select top 12 representative states across regions
    const displayStates = [
      'Maharashtra',
      'Assam',
      'Kerala',
      'Tamil Nadu',
      'Odisha',
      'Karnataka',
      'Delhi NCR',
      'Gujarat',
      'West Bengal',
      'Himachal Pradesh',
      'Uttar Pradesh',
      'Rajasthan',
    ].map((name) => stateData.find((s) => s.name === name)!).filter(Boolean);

    const xScale = d3.scaleBand().domain(timeIntervals).range([0, innerWidth]).padding(0.08);
    const yScale = d3.scaleBand().domain(displayStates.map((s) => s.name)).range([0, innerHeight]).padding(0.12);

    // Matrix Cells
    displayStates.forEach((st) => {
      st.hourlySeries.forEach((val, timeIdx) => {
        const timeLabel = timeIntervals[timeIdx];
        const x = xScale(timeLabel) || 0;
        const y = yScale(st.name) || 0;
        const w = xScale.bandwidth();
        const h = yScale.bandwidth();
        const cellColor = colorScaleRainfall(val);

        const cell = g
          .append('g')
          .attr('transform', `translate(${x},${y})`)
          .attr('cursor', 'pointer')
          .on('mouseenter', () => setHoveredState(st))
          .on('mouseleave', () => setHoveredState(null));

        cell
          .append('rect')
          .attr('width', w)
          .attr('height', h)
          .attr('rx', 4)
          .attr('fill', cellColor)
          .attr('stroke', '#1e293b')
          .attr('stroke-width', 1);

        cell
          .append('text')
          .attr('x', w / 2)
          .attr('y', h / 2 + 3.5)
          .attr('text-anchor', 'middle')
          .attr('fill', val >= 60 ? '#ffffff' : '#cbd5e1')
          .attr('font-size', '9.5px')
          .attr('font-weight', '600')
          .attr('font-family', 'JetBrains Mono, monospace')
          .text(`${val}mm`);
      });
    });

    // Y Axis (State Names)
    g.append('g')
      .selectAll('text')
      .data(displayStates)
      .enter()
      .append('text')
      .attr('x', -8)
      .attr('y', (d) => (yScale(d.name) || 0) + yScale.bandwidth() / 2 + 4)
      .attr('text-anchor', 'end')
      .attr('fill', '#e2e8f0')
      .attr('font-size', '10.5px')
      .attr('font-weight', '500')
      .text((d) => d.name);

    // X Axis (Time intervals on top)
    g.append('g')
      .selectAll('text')
      .data(timeIntervals)
      .enter()
      .append('text')
      .attr('x', (d) => (xScale(d) || 0) + xScale.bandwidth() / 2)
      .attr('y', -12)
      .attr('text-anchor', 'middle')
      .attr('fill', '#38bdf8')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text((d) => d);

  }, [viewMode, stateData, colorScaleRainfall]);

  return (
    <div className="p-5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-4">
      {/* Component Title & View Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400">
            <CloudRain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>National Precipitation Intensity Heatmap (D3.js Spatial Layer)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700/60 uppercase">
                All 28 States &amp; UTs
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Granular 24-hour rainfall accumulation and Doppler radar dBZ reflectivity over Indian meteorological divisions.
            </p>
          </div>
        </div>

        {/* View & Metric Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Cartogram / Matrix Switch */}
          <div className="flex p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('cartogram')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                viewMode === 'cartogram'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Spatial Cartogram
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                viewMode === 'matrix'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              24h Temporal Matrix
            </button>
          </div>

          {/* Metric Selector (Only active in cartogram) */}
          {viewMode === 'cartogram' && (
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="bg-slate-950 text-xs text-slate-200 border border-slate-800 rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="rainfall">24h Rainfall (mm)</option>
              <option value="dbz">Doppler Radar (dBZ)</option>
              <option value="departure">IMD Departure (%)</option>
            </select>
          )}

          {/* Regional Filter */}
          {viewMode === 'cartogram' && (
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="bg-slate-950 text-xs text-slate-200 border border-slate-800 rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Regions</option>
              <option value="north">North India</option>
              <option value="south">South India</option>
              <option value="west">West India</option>
              <option value="east">East India</option>
              <option value="northeast">North East</option>
              <option value="central">Central India</option>
            </select>
          )}
        </div>
      </div>

      {/* Inspector / Tooltip Bar */}
      <div className="min-h-[40px] flex items-center justify-between px-3.5 py-1.5 bg-slate-950/80 rounded-lg border border-slate-800 text-xs font-mono">
        {hoveredState ? (
          <div className="flex flex-wrap items-center justify-between w-full gap-2 text-slate-300">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-bold text-white text-sm">{hoveredState.name} ({hoveredState.code})</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">Region: {hoveredState.region}</span>
              <span className="text-slate-500">|</span>
              <span>24h Rainfall:</span>
              <span className="text-cyan-300 font-bold">{hoveredState.rainfallMm} mm</span>
              <span className="text-slate-500">|</span>
              <span>Doppler Radar:</span>
              <span className="text-blue-300 font-bold">{hoveredState.radarDbz} dBZ</span>
              <span className="text-slate-500">|</span>
              <span>IMD Departure:</span>
              <span className={hoveredState.departurePct >= 20 ? 'text-amber-300 font-bold' : 'text-slate-300'}>
                {hoveredState.departurePct > 0 ? '+' : ''}{hoveredState.departurePct}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">IMD Alert:</span>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  hoveredState.warningColor === 'Red'
                    ? 'bg-red-950 text-red-300 border border-red-800'
                    : hoveredState.warningColor === 'Orange'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : hoveredState.warningColor === 'Yellow'
                    ? 'bg-yellow-950 text-yellow-300 border border-yellow-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                {hoveredState.warningColor} Warning
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>Hover over any state tile or temporal cell to inspect granular 24-hour rainfall mm, radar dBZ, and IMD departure telemetry.</span>
          </div>
        )}
      </div>

      {/* D3 Heatmap SVG Container */}
      <div className="w-full overflow-x-auto flex justify-center py-1">
        {viewMode === 'cartogram' ? (
          <svg ref={svgGeoRef} className="select-none max-w-full" />
        ) : (
          <svg ref={svgMatrixRef} className="select-none max-w-full" />
        )}
      </div>

      {/* Color Scale Legend & IMD Classification Key */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 text-[11px] text-slate-400 font-mono border-t border-slate-800/80">
        {/* Dynamic Legend */}
        <div className="flex items-center gap-3">
          <span className="text-slate-300 font-semibold">Intensity Scale:</span>
          {selectedMetric === 'rainfall' ? (
            <div className="flex items-center gap-1.5">
              <div className="w-24 h-2.5 rounded bg-gradient-to-r from-blue-100 via-blue-500 to-blue-900 border border-slate-700" />
              <span>0mm &rarr; 120+ mm</span>
            </div>
          ) : selectedMetric === 'dbz' ? (
            <div className="flex items-center gap-1.5">
              <div className="w-24 h-2.5 rounded bg-gradient-to-r from-purple-700 via-emerald-500 to-yellow-300 border border-slate-700" />
              <span>10 dBZ &rarr; 56 dBZ</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="w-24 h-2.5 rounded bg-gradient-to-r from-amber-700 via-slate-700 to-purple-600 border border-slate-700" />
              <span>-60% Deficient &rarr; +150% Excess</span>
            </div>
          )}
        </div>

        {/* IMD Warning Thresholds */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>&lt;35.5mm (Moderate)</span>
          </span>
          <span className="flex items-center gap-1 text-yellow-400">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span>35.5-64.4mm (Heavy)</span>
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>64.5-115.5mm (Very Heavy)</span>
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>&gt;115.5mm (Extremely Heavy)</span>
          </span>
        </div>
      </div>
    </div>
  );
};
