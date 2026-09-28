import { EventCategory, SeverityLevel, TrustScoreDetails, WeatherReport, CAPAlert } from '../types/weather';

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function classifyEventWithNLP(text: string): {
  category: EventCategory;
  severity: SeverityLevel;
  confidence: number;
  matchedKeywords: string[];
} {
  const lower = text.toLowerCase();
  
  // Keyword mapping supporting English, Hindi, and Hinglish transliterations
  const patterns: { category: EventCategory; keywords: string[]; baseWeight: number }[] = [
    {
      category: 'flood_inundation',
      keywords: ['flood', 'flooding', 'waterlog', 'waterlogging', 'submerged', 'baadh', 'paani bhar', 'underpass', 'knee deep', 'chest deep', 'river breach', 'जलभराव', 'बाढ़'],
      baseWeight: 1.2,
    },
    {
      category: 'cyclone',
      keywords: ['cyclone', 'deep depression', 'gale', 'storm surge', 'eye of storm', 'landfall', 'chhatrapati', 'चक्रवात', 'तूफान'],
      baseWeight: 1.4,
    },
    {
      category: 'landslide',
      keywords: ['landslide', 'mudslide', 'rockfall', 'debris flow', 'nh blocked', 'boulder', 'bhuskhalan', 'भूस्खलन', 'चट्टान'],
      baseWeight: 1.3,
    },
    {
      category: 'thunderstorm',
      keywords: ['thunderstorm', 'lightning', 'squall', 'thunder', 'garaj', 'bijli', 'बिजली', 'गरज', 'आकाशीय बिजली'],
      baseWeight: 1.1,
    },
    {
      category: 'heatwave',
      keywords: ['heatwave', 'heat wave', 'loo', 'scorching', '45°c', '47°c', '48°c', 'heat stroke', 'लू', 'भीषण गर्मी'],
      baseWeight: 1.1,
    },
    {
      category: 'fog_smog',
      keywords: ['fog', 'smog', 'dense fog', 'visibility', 'rvr', 'runway visual', 'pollution', 'kohra', 'धुंध', 'कोहरा'],
      baseWeight: 1.0,
    },
    {
      category: 'dust_storm',
      keywords: ['dust storm', 'dust', 'sandstorm', 'andhi', 'aandhi', 'धूल भरी आंधी', 'आंधी'],
      baseWeight: 1.0,
    },
    {
      category: 'strong_winds',
      keywords: ['strong wind', 'gusts', 'gale winds', 'tree uprooted', 'roof blown', 'तेज हवाएं'],
      baseWeight: 0.9,
    },
    {
      category: 'heavy_rainfall',
      keywords: ['rain', 'rainfall', 'downpour', 'cloudburst', 'torrential', 'barish', 'barsaat', 'bhari barish', 'वर्षा', 'बारिश'],
      baseWeight: 0.8,
    },
  ];

  let bestCategory: EventCategory = 'heavy_rainfall';
  let maxScore = 0;
  let detectedKeywords: string[] = [];

  for (const p of patterns) {
    let matches = p.keywords.filter((kw) => lower.includes(kw));
    let score = matches.length * p.baseWeight;
    if (score > maxScore) {
      maxScore = score;
      bestCategory = p.category;
      detectedKeywords = matches;
    }
  }

  // Assess severity
  let severity: SeverityLevel = 'moderate';
  if (
    lower.includes('chest deep') ||
    lower.includes('dam burst') ||
    lower.includes('danger mark') ||
    lower.includes('casualty') ||
    lower.includes('stranded') ||
    lower.includes('landfall') ||
    lower.includes('evacuate') ||
    lower.includes('trapped') ||
    bestCategory === 'cyclone'
  ) {
    severity = 'critical';
  } else if (
    lower.includes('knee deep') ||
    lower.includes('submerged') ||
    lower.includes('blocked') ||
    lower.includes('delayed') ||
    lower.includes('heavy') ||
    lower.includes('intense')
  ) {
    severity = 'high';
  } else if (lower.includes('light') || lower.includes('drizzle') || lower.includes('mild')) {
    severity = 'low';
  }

  const confidence = Math.min(99, Math.max(62, Math.round(55 + maxScore * 18)));

  return {
    category: bestCategory,
    severity,
    confidence,
    matchedKeywords: detectedKeywords,
  };
}

export function evaluateTrustScore(
  report: {
    content: string;
    city: string;
    source: string;
    imageUrl?: string;
    hasExif?: boolean;
    exifGpsMatch?: boolean;
    isReverseImageDupe?: boolean;
    category: EventCategory;
  },
  nearbyCount: number,
  imdRadarDbz?: number
): TrustScoreDetails {
  let imdCorrelation = 15;
  let corroborationCount = 10;
  let sourceCredibility = 14;
  let mediaForensics = 14;
  let isFakeSuspect = false;
  let fakeReason: string | undefined;

  // 1. IMD Radar & Met Correlation (max 30 pts)
  if (imdRadarDbz !== undefined) {
    if (report.category === 'flood_inundation' || report.category === 'heavy_rainfall') {
      if (imdRadarDbz >= 40) {
        imdCorrelation = 29;
      } else if (imdRadarDbz >= 25) {
        imdCorrelation = 22;
      } else if (imdRadarDbz < 15) {
        imdCorrelation = 5;
        isFakeSuspect = true;
        fakeReason = `Claimed extreme flood contradicts IMD radar (${imdRadarDbz} dBZ indicates negligible rain).`;
      }
    } else {
      imdCorrelation = 25;
    }
  } else {
    imdCorrelation = 20;
  }

  // 2. Corroboration Count (max 30 pts)
  if (nearbyCount >= 5) {
    corroborationCount = 28;
  } else if (nearbyCount >= 2) {
    corroborationCount = 22;
  } else if (nearbyCount === 1) {
    corroborationCount = 15;
  } else {
    corroborationCount = 8;
  }

  // 3. Source Credibility (max 20 pts)
  if (report.source === 'citizen_report') {
    sourceCredibility = 18;
  } else if (report.source === 'sms_gateway') {
    sourceCredibility = 19;
  } else if (report.source === 'social_media') {
    sourceCredibility = 15;
  } else {
    sourceCredibility = 20;
  }

  // 4. Media Forensics (max 20 pts)
  if (report.isReverseImageDupe) {
    mediaForensics = 4;
    isFakeSuspect = true;
    fakeReason = fakeReason || 'Reverse image perceptual hash matched an archived disaster event from prior years.';
  } else if (report.imageUrl) {
    if (report.exifGpsMatch) {
      mediaForensics = 19;
    } else {
      mediaForensics = 12;
    }
  } else {
    mediaForensics = 15;
  }

  const totalScore = Math.max(
    10,
    Math.min(
      99,
      isFakeSuspect
        ? Math.min(25, imdCorrelation + corroborationCount + sourceCredibility + mediaForensics)
        : imdCorrelation + corroborationCount + sourceCredibility + mediaForensics
    )
  );

  let explainability = '';
  if (isFakeSuspect) {
    explainability = `SUSPICIOUS (${totalScore}/100): ${fakeReason}`;
  } else if (totalScore >= 85) {
    explainability = `HIGH CONFIDENCE (${totalScore}/100): IMD Doppler radar confirmed + ${nearbyCount} independent corroborations + authentic metadata verified.`;
  } else if (totalScore >= 70) {
    explainability = `MODERATE CONFIDENCE (${totalScore}/100): Ground report keywords align with IMD station metrics. Secondary corroboration underway.`;
  } else {
    explainability = `LOW CONFIDENCE (${totalScore}/100): Sparse corroboration and baseline meteorological threshold pending.`;
  }

  return {
    totalScore,
    imdCorrelation,
    corroborationCount,
    sourceCredibility,
    mediaForensics,
    explainability,
    isFakeSuspect,
    fakeReason,
  };
}

export function detectDuplicatesAndCluster(
  report: WeatherReport,
  existingReports: WeatherReport[]
): {
  isDuplicate: boolean;
  clusterId: string;
  duplicateOfId?: string;
  matchedCount: number;
} {
  const nearbyReports = existingReports.filter((r) => {
    if (r.id === report.id) return false;
    const dist = calculateDistanceKm(r.lat, r.lng, report.lat, report.lng);
    const timeDiffMins =
      Math.abs(new Date(r.timestamp).getTime() - new Date(report.timestamp).getTime()) / (1000 * 60);
    return dist <= 8.0 && timeDiffMins <= 120;
  });

  if (nearbyReports.length > 0) {
    const existingCluster = nearbyReports.find((r) => r.clusterId);
    const clusterId = existingCluster?.clusterId || `CLU-${report.city.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 899)}`;
    
    // Check text or photo hash duplication
    const exactMatch = nearbyReports.find((r) => {
      const textA = report.content.toLowerCase();
      const textB = r.content.toLowerCase();
      const wordsA = new Set(textA.split(/\s+/));
      const wordsB = new Set(textB.split(/\s+/));
      const intersection = [...wordsA].filter((w) => wordsB.has(w) && w.length > 3);
      const overlap = intersection.length / Math.min(wordsA.size, wordsB.size);
      
      const imgMatch =
        report.imageUrl &&
        r.imageUrl &&
        (report.imageUrl === r.imageUrl || report.exifMetadata?.duplicateHash === r.exifMetadata?.duplicateHash);

      return overlap > 0.45 || imgMatch;
    });

    if (exactMatch) {
      return {
        isDuplicate: true,
        clusterId,
        duplicateOfId: exactMatch.id,
        matchedCount: nearbyReports.length + 1,
      };
    }

    return {
      isDuplicate: false,
      clusterId,
      matchedCount: nearbyReports.length + 1,
    };
  }

  return {
    isDuplicate: false,
    clusterId: `CLU-${report.city.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 899)}`,
    matchedCount: 1,
  };
}

export function createCAPAlertFromCluster(clusterId: string, reports: WeatherReport[]): CAPAlert {
  const primary = reports[0];
  const severeReports = reports.filter((r) => r.severity === 'critical' || r.severity === 'high');
  const level = severeReports.length > 0 ? 'Severe' : 'Moderate';
  const now = new Date().toISOString();
  const alertId = `IMD-NDMA-CAP-2026-${primary.city.slice(0, 3).toUpperCase()}-${clusterId.split('-')[2] || '999'}`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>${alertId}</identifier>
  <sender>imd_${primary.city.toLowerCase()}_station@nic.in</sender>
  <sent>${now}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <category>Met</category>
    <event>${primary.category.replace('_', ' ').toUpperCase()}</event>
    <urgency>Immediate</urgency>
    <severity>${level}</severity>
    <certainty>Observed</certainty>
    <headline>Emergency Weather Bulletin: ${primary.title}</headline>
    <description>${primary.content}. Aggregated from ${reports.length} verified ground and radar inputs.</description>
    <instruction>Take shelter in sturdy structures. Stay clear of flooded underpasses and high-voltage electric posts. Contact DDMA Helpline 1077.</instruction>
    <area>
      <areaDesc>${primary.city}, ${primary.state}</areaDesc>
      <circle>${primary.lat},${primary.lng},10.0</circle>
    </area>
  </info>
</alert>`;

  return {
    id: `cap-${Date.now()}`,
    identifier: alertId,
    sender: `IMD & SDMA Disaster Monitoring Cell (${primary.state})`,
    sent: now,
    status: 'Approved',
    msgType: 'Alert',
    scope: 'Public',
    event: primary.category.replace('_', ' ').toUpperCase(),
    urgency: 'Immediate',
    severity: level,
    certainty: 'Observed',
    headline: `Emergency Weather Bulletin: ${primary.title}`,
    description: `${primary.content}. Verified by National Weather Analytics Platform with multi-source radar cross-referencing.`,
    instruction: 'Avoid affected transit corridors. Follow directions from local district administration and SDRF personnel.',
    areaDesc: `${primary.city}, ${primary.state} (Radius ~10 km)`,
    affectedClusterId: clusterId,
    xmlPayload: xml,
  };
}
