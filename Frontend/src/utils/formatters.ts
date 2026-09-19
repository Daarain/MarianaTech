import type { Priority } from '@/types/api';
import { getClassMetadata } from './classificationUtils';
import { formatConfidenceLabel } from './confidenceUtils';
import { formatCoordinate } from './geolocationUtils';

export { formatCoordinate };

export function formatAnomalyClass(rawClassName?: string): string {
  if (!rawClassName) return 'Unidentified Contact';
  return getClassMetadata(rawClassName).label;
}

export function formatConfidence(val: number | null | undefined): string {
  return formatConfidenceLabel(val);
}

export function formatDepth(depth?: number | null): string {
  if (depth === null || depth === undefined || isNaN(depth)) {
    return 'Depth Unknown';
  }
  return `${Math.round(depth)}m`;
}

export function formatPriority(priority?: Priority | string): string {
  if (!priority) return '';
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}
