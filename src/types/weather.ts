export type EventCategory =
  | 'heavy_rainfall'
  | 'flood_inundation'
  | 'thunderstorm'
  | 'heatwave'
  | 'fog_smog'
  | 'dust_storm'
  | 'strong_winds'
  | 'cyclone'
  | 'landslide';

export type VerificationStatus =
  | 'verified'
  | 'pending'
  | 'suspicious'
  | 'duplicate';

export type DataSourceType =
  | 'social_media'
  | 'citizen_report'
  | 'imd_station'
  | 'cwc_gauge'
  | 'satellite'
  | 'sms_gateway';

export type SeverityLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface TrustScoreDetails {
  totalScore: number; // 0 - 100
  imdCorrelation: number; // 0 - 30
  corroborationCount: number; // 0 - 30
  sourceCredibility: number; // 0 - 20
  mediaForensics: number; // 0 - 20
  explainability: string;
  isFakeSuspect?: boolean;
  fakeReason?: string;
}

export interface ExifMetadata {
  dateTimeOriginal: string;
  gpsMatch: boolean;
  deviceCamera: string;
  reverseHashMatch: boolean;
  duplicateHash?: string;
}

export interface OfficialImdReading {
  stationName: string;
  distanceKm: number;
  rainfallMm?: number;
  radarDbz?: number;
  tempC?: number;
  windKmph?: number;
  statusMatch: 'consistent' | 'minor_deviation' | 'unsupported';
}

export interface WeatherReport {
  id: string;
  source: DataSourceType;
  sourceHandle: string;
  timestamp: string;
  title: string;
  content: string;
  category: EventCategory;
  severity: SeverityLevel;
  city: string;
  state: string;
  lat: number;
  lng: number;
  imageUrl?: string;
  verificationStatus: VerificationStatus;
  trustScore: TrustScoreDetails;
  clusterId?: string;
  clusterCount?: number;
  duplicateOfId?: string;
  exifMetadata?: ExifMetadata;
  officialImdReading?: OfficialImdReading;
  reviewedBy?: string;
  reviewedAt?: string;
  citizenPhoneMasked?: string;
}

export interface CAPAlert {
  id: string;
  identifier: string;
  sender: string;
  sent: string;
  status: 'Draft' | 'Approved' | 'Broadcasted';
  msgType: 'Alert' | 'Update' | 'Cancel';
  scope: 'Public';
  event: string;
  urgency: 'Immediate' | 'Expected' | 'Future';
  severity: 'Extreme' | 'Severe' | 'Moderate';
  certainty: 'Observed' | 'Likely' | 'Possible';
  headline: string;
  description: string;
  instruction: string;
  areaDesc: string;
  affectedClusterId: string;
  xmlPayload: string;
}

export interface SafeShelter {
  id: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  capacity: number;
  currentOccupancy: number;
  contact: string;
  status: 'Open' | 'Full' | 'Standby';
  hasMedicalPost: boolean;
  elevationMeters: number;
}

export interface EmergencyService {
  id: string;
  name: string;
  type: 'hospital' | 'ndrf_camp' | 'police' | 'fire_station' | 'boat_rescue';
  city: string;
  state: string;
  phone: string;
  lat: number;
  lng: number;
  distanceKm?: number;
}

export interface SOSRescueRequest {
  id: string;
  timestamp: string;
  citizenName: string;
  phoneMasked: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  peopleCount: number;
  situation: string;
  waterLevelFeet?: number;
  status: 'Active' | 'Dispatched' | 'Rescued';
}

export type Language = 'en' | 'hi';
