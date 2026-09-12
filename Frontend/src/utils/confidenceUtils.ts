import type { Anomaly } from '@/types/api';

export interface ConfidenceSummary {
  totalCount: number;
  visibleCount: number;
  filteredCount: number;
  highCount: number; // >= 75%
  mediumCount: number; // 50% - 74%
  lowCount: number; // < 50%
  meanConfidence: number; // 0 - 100
  highestConfidence: number; // 0 - 100
  lowestConfidence: number; // 0 - 100
}

export interface ConfidenceDistributionBin {
  label: string;
  min: number;
  max: number;
  count: number;
  percentage: number;
}

/**
 * Normalizes confidence score to integer percentage (0 - 100).
 * Handles both float (0.87 -> 87%) and percentage scale (87 -> 87%).
 */
export function normalizeConfidence(val: number | null | undefined): number {
  if (val === null || val === undefined || isNaN(val)) {
    return 0;
  }
  let normalized = val;
  if (normalized > 0 && normalized <= 1.0) {
    normalized = normalized * 100;
  }
  return Math.min(100, Math.max(0, Math.round(normalized)));
}

/**
 * Formats confidence score as readable string e.g. "87%" or "Unavailable"
 */
export function formatConfidenceLabel(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) {
    return 'Unavailable';
  }
  return `${normalizeConfidence(val)}%`;
}

/**
 * Classifies confidence into qualitative category based on model threshold standards
 */
export function getConfidenceCategory(val: number | null | undefined): 'high' | 'medium' | 'low' {
  const norm = normalizeConfidence(val);
  if (norm >= 75) return 'high';
  if (norm >= 50) return 'medium';
  return 'low';
}

/**
 * Filter detections based on minimum display confidence threshold (0 - 100).
 * Pure function: DOES NOT mutate raw array.
 */
export function filterDetectionsByConfidence(
  anomalies: Anomaly[],
  minThresholdPercentage: number
): Anomaly[] {
  return anomalies.filter((a) => normalizeConfidence(a.confidence) >= minThresholdPercentage);
}

/**
 * Computes dataset confidence summary metrics from a given array of detections.
 */
export function calculateConfidenceSummary(
  allAnomalies: Anomaly[],
  minThresholdPercentage: number
): ConfidenceSummary {
  const totalCount = allAnomalies.length;
  const visible = filterDetectionsByConfidence(allAnomalies, minThresholdPercentage);
  const visibleCount = visible.length;
  const filteredCount = totalCount - visibleCount;

  if (totalCount === 0) {
    return {
      totalCount: 0,
      visibleCount: 0,
      filteredCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      meanConfidence: 0,
      highestConfidence: 0,
      lowestConfidence: 0,
    };
  }

  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let sumConfidence = 0;
  let highest = 0;
  let lowest = 100;

  allAnomalies.forEach((a) => {
    const score = normalizeConfidence(a.confidence);
    sumConfidence += score;
    if (score > highest) highest = score;
    if (score < lowest) lowest = score;

    const cat = getConfidenceCategory(a.confidence);
    if (cat === 'high') highCount++;
    else if (cat === 'medium') mediumCount++;
    else lowCount++;
  });

  const meanConfidence = Math.round(sumConfidence / totalCount);

  return {
    totalCount,
    visibleCount,
    filteredCount,
    highCount,
    mediumCount,
    lowCount,
    meanConfidence,
    highestConfidence: highest,
    lowestConfidence: totalCount > 0 ? lowest : 0,
  };
}

/**
 * Calculates histogram distribution bins (0-25%, 26-50%, 51-75%, 76-100%)
 */
export function calculateConfidenceDistribution(
  allAnomalies: Anomaly[]
): ConfidenceDistributionBin[] {
  const bins: ConfidenceDistributionBin[] = [
    { label: '0–25%', min: 0, max: 25, count: 0, percentage: 0 },
    { label: '26–50%', min: 26, max: 50, count: 0, percentage: 0 },
    { label: '51–75%', min: 51, max: 75, count: 0, percentage: 0 },
    { label: '76–100%', min: 76, max: 100, count: 0, percentage: 0 },
  ];

  const total = allAnomalies.length;
  if (total === 0) return bins;

  allAnomalies.forEach((a) => {
    const score = normalizeConfidence(a.confidence);
    for (const b of bins) {
      if (score >= b.min && score <= b.max) {
        b.count++;
        break;
      }
    }
  });

  bins.forEach((b) => {
    b.percentage = Math.round((b.count / total) * 100);
  });

  return bins;
}
