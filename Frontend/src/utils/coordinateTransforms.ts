import type { BoundingBox, Anomaly } from '@/types/api';

/**
 * Ensures bounding box is normalized to percentage coordinates (0-100%).
 * If bbox is missing, generates fallback relative coordinates based on index.
 */
export function getNormalizedBoundingBox(anomaly: Anomaly, index: number = 0): BoundingBox {
  if (anomaly.bbox && typeof anomaly.bbox.x === 'number') {
    let { x, y, w, h } = anomaly.bbox;
    
    // If coordinates were returned in raw pixels (>100), clamp to percentage assumption or 0-100
    if (x > 100 || y > 100 || w > 100 || h > 100) {
      x = Math.min(90, Math.max(0, (x / 1024) * 100));
      y = Math.min(90, Math.max(0, (y / 512) * 100));
      w = Math.min(50, Math.max(5, (w / 1024) * 100));
      h = Math.min(50, Math.max(5, (h / 512) * 100));
    }

    return { x, y, w, h };
  }

  // Deterministic fallback relative percentage coordinates for legacy mission database records
  const fallbackX = parseFloat((12 + (index * 23) % 65).toFixed(1));
  const fallbackY = parseFloat((15 + (index * 31) % 60).toFixed(1));
  const fallbackW = parseFloat((12 + (index * 7) % 18).toFixed(1));
  const fallbackH = parseFloat((10 + (index * 9) % 16).toFixed(1));

  return {
    x: fallbackX,
    y: fallbackY,
    w: fallbackW,
    h: fallbackH,
  };
}

/**
 * Calculates absolute pixel bounding box for a given container width and height.
 */
export function calculatePixelCoordinates(
  bbox: BoundingBox,
  containerWidth: number,
  containerHeight: number
) {
  return {
    left: (bbox.x / 100) * containerWidth,
    top: (bbox.y / 100) * containerHeight,
    width: (bbox.w / 100) * containerWidth,
    height: (bbox.h / 100) * containerHeight,
  };
}
