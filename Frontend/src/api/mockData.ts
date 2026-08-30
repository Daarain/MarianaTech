export type MissionStatus = 'processing' | 'complete' | 'failed' | 'pending';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type AnomalyStatus = 'pending_review' | 'verified' | 'rejected' | 'false_positive';
export type AnomalyClass =
  | 'unidentified_object'
  | 'shipwreck'
  | 'marine_life_cluster'
  | 'debris_field'
  | 'geological_formation'
  | 'pipeline_damage'
  | 'mine_like_contact';

export interface Mission {
  id: string;
  name: string;
  date: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  status: MissionStatus;
  anomaly_count: number;
  priority: Priority;
  depth_m: number;
  area_km2: number;
  operator: string;
  sonar_type: string;
}

export interface Anomaly {
  id: string;
  mission_id: string;
  class_name: AnomalyClass;
  confidence: number;
  latitude: number | null;
  longitude: number | null;
  priority: Priority;
  status: AnomalyStatus;
  depth_m: number;
  detected_at: string;
  size_m: number;
  description: string;
}

export interface DashboardStats {
  total_missions: number;
  critical_anomalies: number;
  avg_confidence: number;
  pending_review: number;
}

const missions: Mission[] = [
  {
    id: 'MSN-2026-0142',
    name: 'Chagos Trench Survey',
    date: '2026-08-22',
    location: 'Chagos Trench, Indian Ocean',
    latitude: -6.3,
    longitude: 71.2,
    status: 'processing',
    anomaly_count: 7,
    priority: 'critical',
    depth_m: 4200,
    area_km2: 38,
    operator: 'Lt. R. Mehta',
    sonar_type: 'Side-scan 900 kHz',
  },
  {
    id: 'MSN-2026-0141',
    name: 'Carlsberg Ridge Sweep',
    date: '2026-08-20',
    location: 'Carlsberg Ridge, Indian Ocean',
    latitude: 3.8,
    longitude: 64.5,
    status: 'complete',
    anomaly_count: 12,
    priority: 'high',
    depth_m: 3100,
    area_km2: 52,
    operator: 'Cdr. A. Fernando',
    sonar_type: 'Multibeam EM 302',
  },
  {
    id: 'MSN-2026-0140',
    name: 'Seychelles Shelf Patrol',
    date: '2026-08-18',
    location: 'Seychelles Plateau, Indian Ocean',
    latitude: -4.6,
    longitude: 55.5,
    status: 'complete',
    anomaly_count: 3,
    priority: 'medium',
    depth_m: 850,
    area_km2: 21,
    operator: 'Lt. K. Pillai',
    sonar_type: 'Side-scan 600 kHz',
  },
  {
    id: 'MSN-2026-0139',
    name: 'Ninety East Ridge Scan',
    date: '2026-08-15',
    location: 'Ninety East Ridge, Indian Ocean',
    latitude: -12.4,
    longitude: 87.3,
    status: 'failed',
    anomaly_count: 0,
    priority: 'low',
    depth_m: 5200,
    area_km2: 44,
    operator: 'Lt. S. Banerjee',
    sonar_type: 'Synthetic Aperture',
  },
  {
    id: 'MSN-2026-0138',
    name: 'Mascarene Basin Recon',
    date: '2026-08-12',
    location: 'Mascarene Basin, Indian Ocean',
    latitude: -18.7,
    longitude: 62.1,
    status: 'pending',
    anomaly_count: 5,
    priority: 'high',
    depth_m: 2800,
    area_km2: 33,
    operator: 'Cdr. A. Fernando',
    sonar_type: 'Multibeam EM 710',
  },
];

const anomalyTemplates: Omit<Anomaly, 'id' | 'mission_id'>[] = [
  {
    class_name: 'unidentified_object',
    confidence: 0.94,
    latitude: -6.31,
    longitude: 71.21,
    priority: 'critical',
    status: 'pending_review',
    depth_m: 4180,
    detected_at: '2026-08-22T14:32:00Z',
    size_m: 8.2,
    description: 'Metallic cylindrical object with strong acoustic return, partial burial in sediment.',
  },
  {
    class_name: 'shipwreck',
    confidence: 0.88,
    latitude: -6.34,
    longitude: 71.18,
    priority: 'high',
    status: 'pending_review',
    depth_m: 4150,
    detected_at: '2026-08-22T15:01:00Z',
    size_m: 34.5,
    description: 'Elongated structure with superstructure features, consistent with 19th-century vessel.',
  },
  {
    class_name: 'mine_like_contact',
    confidence: 0.81,
    latitude: -6.29,
    longitude: 71.24,
    priority: 'critical',
    status: 'pending_review',
    depth_m: 4210,
    detected_at: '2026-08-22T15:14:00Z',
    size_m: 1.4,
    description: 'Spherical contact with shadow consistent with moored ordnance.',
  },
  {
    class_name: 'debris_field',
    confidence: 0.73,
    latitude: -6.32,
    longitude: 71.22,
    priority: 'medium',
    status: 'verified',
    depth_m: 4190,
    detected_at: '2026-08-22T15:28:00Z',
    size_m: 22.0,
    description: 'Scattered acoustic returns across 20m area, likely anthropogenic debris.',
  },
  {
    class_name: 'marine_life_cluster',
    confidence: 0.67,
    latitude: -6.35,
    longitude: 71.19,
    priority: 'low',
    status: 'false_positive',
    depth_m: 4100,
    detected_at: '2026-08-22T15:42:00Z',
    size_m: 5.0,
    description: 'Diffuse returns with movement pattern consistent with deep-water fish school.',
  },
  {
    class_name: 'pipeline_damage',
    confidence: 0.91,
    latitude: -6.33,
    longitude: 71.20,
    priority: 'critical',
    status: 'pending_review',
    depth_m: 4170,
    detected_at: '2026-08-22T16:02:00Z',
    size_m: 3.8,
    description: 'Discontinuity in linear feature, possible rupture with debris scatter.',
  },
  {
    class_name: 'geological_formation',
    confidence: 0.79,
    latitude: -6.30,
    longitude: 71.25,
    priority: 'low',
    status: 'rejected',
    depth_m: 4250,
    detected_at: '2026-08-22T16:18:00Z',
    size_m: 15.6,
    description: 'Rocky outcrop with regular jointing, natural geological origin confirmed.',
  },
  {
    class_name: 'unidentified_object',
    confidence: 0.85,
    latitude: -6.36,
    longitude: 71.17,
    priority: 'high',
    status: 'pending_review',
    depth_m: 4140,
    detected_at: '2026-08-22T16:35:00Z',
    size_m: 4.1,
    description: 'Box-like object with sharp edges, acoustic shadow suggests raised position.',
  },
  {
    class_name: 'shipwreck',
    confidence: 0.92,
    latitude: -6.28,
    longitude: 71.26,
    priority: 'high',
    status: 'verified',
    depth_m: 4220,
    detected_at: '2026-08-22T16:50:00Z',
    size_m: 28.3,
    description: 'Well-preserved hull, distinct bow and stern features, 2-mast configuration.',
  },
  {
    class_name: 'debris_field',
    confidence: 0.64,
    latitude: -6.37,
    longitude: 71.16,
    priority: 'medium',
    status: 'pending_review',
    depth_m: 4130,
    detected_at: '2026-08-22T17:05:00Z',
    size_m: 12.7,
    description: 'Cluster of small contacts, fishing gear or net debris suspected.',
  },
];

function generateAnomaliesForMission(missionId: string): Anomaly[] {
  return anomalyTemplates.map((tmpl, i) => ({
    ...tmpl,
    id: `ANM-${missionId.slice(-4)}-${String(i + 1).padStart(3, '0')}`,
    mission_id: missionId,
  }));
}

export const mockMissions: Mission[] = missions;

export const mockAnomalies: Record<string, Anomaly[]> = Object.fromEntries(
  missions.map((m) => [m.id, generateAnomaliesForMission(m.id)])
);

export const mockDashboardStats: DashboardStats = {
  total_missions: missions.length,
  critical_anomalies: missions.reduce(
    (acc, m) => acc + (m.priority === 'critical' ? m.anomaly_count : 0),
    0
  ),
  avg_confidence: 81,
  pending_review: 14,
};
