import type {
  Anomaly,
  AnomalyClass,
  Priority,
  BoundingBox,
  DetectionResult,
} from '@/types/api';
import { isValidCoordinate } from './geolocationUtils';

const VALID_CLASSES: Set<AnomalyClass> = new Set([
  'unidentified_object',
  'shipwreck',
  'marine_life_cluster',
  'debris_field',
  'geological_formation',
  'pipeline_damage',
  'mine_like_contact',
]);

const VALID_PRIORITIES: Set<Priority> = new Set(['critical', 'high', 'medium', 'low']);

/**
 * Normalizes confidence scores into decimal probabilities [0.0, 1.0].
 * Safely handles percentages > 1.0 (e.g. 87 -> 0.87), nulls, NaNs, and out-of-bounds values.
 */
export function normalizeConfidence(val: any): number {
  if (val === null || val === undefined) return 0.5;
  const num = Number(val);
  if (isNaN(num) || !isFinite(num)) return 0.5;

  if (num > 1.0 && num <= 100.0) {
    return Number((num / 100.0).toFixed(4));
  }
  if (num < 0.0) return 0.0;
  if (num > 1.0) return 1.0;
  return Number(num.toFixed(4));
}

/**
 * Validates and normalizes bounding box coordinates.
 * Ensures x, y, w, h are non-negative percentages within [0, 100].
 */
export function validateBoundingBox(bbox: any, index: number): BoundingBox {
  if (!bbox || typeof bbox !== 'object') {
    return { x: 20 + (index % 5) * 12, y: 30 + (index % 4) * 15, w: 15, h: 15 };
  }

  let x = Number(bbox.x);
  let y = Number(bbox.y);
  let w = Number(bbox.w);
  let h = Number(bbox.h);

  if (isNaN(x) || !isFinite(x) || x < 0) x = 10;
  if (isNaN(y) || !isFinite(y) || y < 0) y = 10;
  if (isNaN(w) || !isFinite(w) || w <= 0) w = 15;
  if (isNaN(h) || !isFinite(h) || h <= 0) h = 15;

  // Clamp max values
  x = Math.min(x, 90);
  y = Math.min(y, 90);
  w = Math.min(w, 100 - x);
  h = Math.min(h, 100 - y);

  return {
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2)),
    w: Number(w.toFixed(2)),
    h: Number(h.toFixed(2)),
  };
}

/**
 * Validates anomaly classification name against supported class taxonomy.
 */
export function validateAnomalyClass(className: any): AnomalyClass {
  if (typeof className === 'string' && VALID_CLASSES.has(className as AnomalyClass)) {
    return className as AnomalyClass;
  }
  return 'unidentified_object';
}

/**
 * Validates priority levels.
 */
export function validateAnomalyPriority(priority: any): Priority {
  if (typeof priority === 'string' && VALID_PRIORITIES.has(priority as Priority)) {
    return priority as Priority;
  }
  return 'medium';
}

/**
 * Normalizes an individual Anomaly contact object.
 */
export function validateAnomaly(raw: any, index: number, defaultMissionId: string = 'MSN-CURRENT'): Anomaly {
  const safeId = typeof raw?.id === 'string' && raw.id.trim() ? raw.id : `ANM-GEN-${index + 1}`;
  const safeMissionId = typeof raw?.mission_id === 'string' && raw.mission_id.trim() ? raw.mission_id : defaultMissionId;
  const confidence = normalizeConfidence(raw?.confidence);
  const className = validateAnomalyClass(raw?.class_name);
  const priority = validateAnomalyPriority(raw?.priority);
  const bbox = validateBoundingBox(raw?.bbox, index);

  const rawLat = Number(raw?.latitude);
  const rawLon = Number(raw?.longitude);
  const isGeolocated = isValidCoordinate(rawLat, rawLon);

  return {
    id: safeId,
    mission_id: safeMissionId,
    class_name: className,
    confidence,
    latitude: isGeolocated ? rawLat : 0,
    longitude: isGeolocated ? rawLon : 0,
    priority,
    status: raw?.status === 'verified' ? 'verified' : raw?.status === 'rejected' ? 'rejected' : 'pending_review',
    depth_m: typeof raw?.depth_m === 'number' && !isNaN(raw.depth_m) ? raw.depth_m : 2500,
    detected_at: typeof raw?.detected_at === 'string' ? raw.detected_at : new Date().toISOString(),
    size_m: typeof raw?.size_m === 'number' && !isNaN(raw.size_m) ? raw.size_m : 5.0,
    bbox,
    has_acoustic_shadow: Boolean(raw?.has_acoustic_shadow),
    description: typeof raw?.description === 'string' ? raw.description : 'Side-scan sonar acoustic contact.',
  };
}

/**
 * Validates and normalizes an entire DetectionResult object returned from backend ML pipeline.
 */
export function validateDetectionResult(data: any, fallbackMissionId: string = 'MSN-CURRENT'): DetectionResult {
  if (!data || typeof data !== 'object') {
    return {
      status: 'error',
      image_dimensions: { width: 1024, height: 512 },
      anomalies_detected: 0,
      anomalies: [],
    };
  }

  const width = Number(data.image_dimensions?.width);
  const height = Number(data.image_dimensions?.height);
  const validWidth = !isNaN(width) && width > 0 ? width : 1024;
  const validHeight = !isNaN(height) && height > 0 ? height : 512;

  const rawAnomalies = Array.isArray(data.anomalies) ? data.anomalies : [];
  const validatedAnomalies = rawAnomalies.map((item: any, idx: number) =>
    validateAnomaly(item, idx, fallbackMissionId)
  );

  return {
    status: typeof data.status === 'string' ? data.status : 'success',
    image_dimensions: { width: validWidth, height: validHeight },
    metadata: data.metadata,
    preprocessing_metrics: data.preprocessing_metrics,
    anomalies_detected: validatedAnomalies.length,
    anomalies: validatedAnomalies,
  };
}
