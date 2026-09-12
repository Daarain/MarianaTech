import type { Anomaly, AnomalyClass } from '@/types/api';
import { normalizeConfidence } from './confidenceUtils';

export interface ClassMetadata {
  id: string;
  label: string;
  category: 'man_made' | 'natural' | 'unidentified';
  categoryLabel: string;
  description: string;
  iconName: string;
  color: string;
  badgeStyle: string;
}

export interface ClassDistributionItem {
  classKey: string;
  label: string;
  categoryLabel: string;
  count: number;
  percentage: number;
  color: string;
}

export const SUPPORTED_CLASSES: Record<string, ClassMetadata> = {
  unidentified_object: {
    id: 'unidentified_object',
    label: 'Unidentified Object',
    category: 'unidentified',
    categoryLabel: 'Unidentified Acoustic Contact',
    description: 'Acoustic anomaly contact with high backscatter return requiring physical inspection.',
    iconName: 'HelpCircle',
    color: '#00F0FF', // Cyan
    badgeStyle: 'bg-cyan-950/80 text-cyan-400 border-cyan-500/50',
  },
  shipwreck: {
    id: 'shipwreck',
    label: 'Submerged Shipwreck',
    category: 'man_made',
    categoryLabel: 'Artificial Structural Debris',
    description: 'Elongated hull structure exhibiting distinct acoustic shadow and high structural relief.',
    iconName: 'Anchor',
    color: '#7F77DD', // Indigo
    badgeStyle: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/50',
  },
  marine_life_cluster: {
    id: 'marine_life_cluster',
    label: 'Marine Life Cluster',
    category: 'natural',
    categoryLabel: 'Natural Biological Target',
    description: 'Diffuse, low-shadow acoustic return characteristic of pelagic marine biomass.',
    iconName: 'Fish',
    color: '#00FF9D', // Emerald
    badgeStyle: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
  },
  debris_field: {
    id: 'debris_field',
    label: 'Debris Field',
    category: 'man_made',
    categoryLabel: 'Artificial Marine Debris',
    description: 'Scattered high-frequency backscatter target cluster associated with anthropogenic debris.',
    iconName: 'Layers',
    color: '#FFB800', // Amber
    badgeStyle: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
  },
  geological_formation: {
    id: 'geological_formation',
    label: 'Geological Formation',
    category: 'natural',
    categoryLabel: 'Natural Seabed Outcrop',
    description: 'Irregular bathymetric rock ridge or natural seabed topography without artificial shadow.',
    iconName: 'Mountain',
    color: '#8E8D8A', // Slate
    badgeStyle: 'bg-slate-900/80 text-slate-300 border-slate-700',
  },
  pipeline_damage: {
    id: 'pipeline_damage',
    label: 'Pipeline / Damage',
    category: 'man_made',
    categoryLabel: 'Submerged Infrastructure',
    description: 'Continuous linear metallic structure with high aspect ratio or structural fracture.',
    iconName: 'Activity',
    color: '#FF3B30', // Rose
    badgeStyle: 'bg-rose-950/80 text-rose-400 border-rose-500/50',
  },
  mine_like_contact: {
    id: 'mine_like_contact',
    label: 'Mine-Like Contact',
    category: 'man_made',
    categoryLabel: 'High-Priority Artificial Target',
    description: 'Symmetrical spherical or cylindrical contact exhibiting steep acoustic shadow drop-off.',
    iconName: 'AlertTriangle',
    color: '#FF2A6D', // Crimson
    badgeStyle: 'bg-rose-950/90 text-rose-300 border-rose-400',
  },
};

/**
 * Safely resolves class metadata for a given raw class string.
 * Handles unmapped or unknown class names without crashing.
 */
export function getClassMetadata(rawClassName?: string): ClassMetadata {
  if (!rawClassName) {
    return {
      id: 'unknown',
      label: 'Unknown Class',
      category: 'unidentified',
      categoryLabel: 'Unmapped Classification',
      description: 'Classification data is unavailable or unmapped for this contact.',
      iconName: 'HelpCircle',
      color: '#64748B',
      badgeStyle: 'bg-slate-900/80 text-slate-400 border-slate-700',
    };
  }

  const key = rawClassName.toLowerCase().trim();
  if (SUPPORTED_CLASSES[key]) {
    return SUPPORTED_CLASSES[key];
  }

  // Format unknown class safely
  return {
    id: key,
    label: `Unknown Class (${rawClassName.replace(/_/g, ' ')})`,
    category: 'unidentified',
    categoryLabel: 'Unmapped AI Category',
    description: `Target returned raw model class identifier '${rawClassName}'.`,
    iconName: 'HelpCircle',
    color: '#64748B',
    badgeStyle: 'bg-slate-900/80 text-slate-400 border-slate-700',
  };
}

/**
 * Filter detections simultaneously by class, confidence threshold, and optional search query.
 * Pure function: DOES NOT mutate raw input array.
 */
export function filterDetectionsCombined(
  anomalies: Anomaly[],
  classFilter: string = 'ALL',
  minConfidenceThreshold: number = 0,
  searchQuery: string = ''
): Anomaly[] {
  return anomalies.filter((a) => {
    // 1. Class filter check
    if (classFilter !== 'ALL') {
      const targetMeta = getClassMetadata(a.class_name);
      if (classFilter.toLowerCase() !== a.class_name.toLowerCase() && classFilter.toLowerCase() !== targetMeta.id) {
        return false;
      }
    }

    // 2. Confidence threshold check
    if (normalizeConfidence(a.confidence) < minConfidenceThreshold) {
      return false;
    }

    // 3. Search query check
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      const meta = getClassMetadata(a.class_name);
      const matchId = (a.id || '').toLowerCase().includes(query);
      const matchClass = meta.label.toLowerCase().includes(query) || (a.class_name || '').toLowerCase().includes(query);
      const matchDesc = (a.description || '').toLowerCase().includes(query);
      if (!matchId && !matchClass && !matchDesc) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Calculates classification distribution counts and percentages from an anomaly array.
 */
export function calculateClassDistribution(allAnomalies: Anomaly[]): ClassDistributionItem[] {
  const total = allAnomalies.length;
  if (total === 0) return [];

  const counts: Record<string, number> = {};

  allAnomalies.forEach((a) => {
    const meta = getClassMetadata(a.class_name);
    counts[meta.id] = (counts[meta.id] || 0) + 1;
  });

  return Object.keys(counts).map((key) => {
    const meta = getClassMetadata(key);
    const count = counts[key];
    const percentage = Math.round((count / total) * 100);
    return {
      classKey: key,
      label: meta.label,
      categoryLabel: meta.categoryLabel,
      count,
      percentage,
      color: meta.color,
    };
  }).sort((a, b) => b.count - a.count);
}
