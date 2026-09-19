export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | string | null;
}

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
  latitude: number;
  longitude: number;
  status: MissionStatus;
  anomaly_count: number;
  priority: Priority;
  depth_m: number;
  area_km2: number;
  operator: string;
  sonar_type: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Anomaly {
  id: string;
  mission_id: string;
  class_name: AnomalyClass;
  confidence: number;
  latitude: number;
  longitude: number;
  priority: Priority;
  status: AnomalyStatus;
  depth_m: number;
  detected_at: string;
  size_m: number;
  bbox?: BoundingBox;
  has_acoustic_shadow?: boolean;
  description: string;
}

export interface PreprocessingMetrics {
  raw_snr: number;
  mean_intensity: number;
  std_intensity: number;
  noise_reduction_factor: number;
}

export interface ImageMetadata {
  format: string;
  mode: string;
  width: number;
  height: number;
  aspect_ratio: number;
  has_exif: boolean;
  exif_data?: Record<string, string>;
}

export interface DetectionResult {
  status: string;
  image_dimensions: {
    width: number;
    height: number;
  };
  metadata?: ImageMetadata;
  preprocessing_metrics?: PreprocessingMetrics;
  anomalies_detected: number;
  anomalies: Anomaly[];
}

export interface DashboardStats {
  total_missions: number;
  critical_anomalies: number;
  avg_confidence: number;
  pending_review: number;
}

export interface CreateMissionPayload {
  missionName: string;
  date: string;
  vessel?: string;
  location: string;
  depthMin?: number;
  depthMax?: number;
  sonarType: string;
  notes?: string;
  operatorName: string;
  files?: { name: string; size: number }[];
}

export type AnalysisStatus = 'completed' | 'processing' | 'failed' | 'cancelled';

export interface AnalysisHistoryItem {
  id: string;
  dataset_id: string;
  filename: string;
  name: string;
  status: AnalysisStatus;
  created_at: string;
  completed_at?: string | null;
  model: string;
  detection_count: number;
  geolocated_count: number;
  priority: Priority;
  latitude?: number | null;
  longitude?: number | null;
  depth_m: number;
  operator: string;
  sonar_type: string;
  error?: string | null;
  anomalies?: Anomaly[];
}

export interface AnalysisHistoryStats {
  total_analyses: number;
  completed: number;
  processing: number;
  failed: number;
  cancelled: number;
  total_anomalies: number;
}

export interface AnalysisListResponse {
  items: AnalysisHistoryItem[];
  total: number;
  page: number;
  limit: number;
}


