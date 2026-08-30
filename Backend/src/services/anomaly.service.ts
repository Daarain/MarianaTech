import { AnomalyModel, IAnomalyDoc, AnomalyStatusType } from '../models/anomaly.model';
import { VerificationHistoryModel, IVerificationHistoryDoc } from '../models/verificationHistory.model';

export async function fetchAnomaliesByMission(missionId: string): Promise<IAnomalyDoc[]> {
  const anomalies = await AnomalyModel.find({ missionId }).sort({ createdAt: -1 });
  return anomalies;
}

export async function fetchAnomalyById(anomalyId: string): Promise<IAnomalyDoc | null> {
  const anomaly = await AnomalyModel.findOne({
    $or: [{ id: anomalyId }, { customId: anomalyId }, { _id: anomalyId.match(/^[0-9a-fA-F]{24}$/) ? anomalyId : null }],
  });
  return anomaly;
}

export async function updateVerifyAnomaly(
  anomalyId: string,
  user: string,
  comment: string = '',
  status: AnomalyStatusType = 'verified'
): Promise<IAnomalyDoc | null> {
  const anomaly = await fetchAnomalyById(anomalyId);
  if (!anomaly) {
    return null;
  }

  anomaly.status = status;
  await anomaly.save();

  // Save audit history record without overwriting previous history
  await VerificationHistoryModel.create({
    anomalyId: anomaly.id,
    user: user || 'Operator',
    timestamp: new Date(),
    decision: status,
    comment,
  });

  return anomaly;
}

export async function updateRejectAnomaly(
  anomalyId: string,
  user: string,
  comment: string = ''
): Promise<IAnomalyDoc | null> {
  const anomaly = await fetchAnomalyById(anomalyId);
  if (!anomaly) {
    return null;
  }

  anomaly.status = 'rejected';
  await anomaly.save();

  // Save audit history record without overwriting previous history
  await VerificationHistoryModel.create({
    anomalyId: anomaly.id,
    user: user || 'Operator',
    timestamp: new Date(),
    decision: 'rejected',
    comment,
  });

  return anomaly;
}

export async function fetchAnomalyHistory(anomalyId: string): Promise<IVerificationHistoryDoc[]> {
  const history = await VerificationHistoryModel.find({
    $or: [{ anomalyId }, { anomalyId: anomalyId }],
  }).sort({ timestamp: -1 });

  return history;
}

/**
 * STEP 12: Geospatial Queries
 */

/**
 * 1. Find anomalies near a coordinate [longitude, latitude] up to maxDistanceMeters
 */
export async function fetchAnomaliesNear(
  longitude: number,
  latitude: number,
  maxDistanceMeters: number = 50000
): Promise<IAnomalyDoc[]> {
  return AnomalyModel.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude], // ALWAYS [longitude, latitude]
        },
        $maxDistance: maxDistanceMeters,
      },
    },
  });
}

/**
 * 2. Find anomalies within a radius (radiusKm) using $centerSphere
 */
export async function fetchAnomaliesWithinRadius(
  longitude: number,
  latitude: number,
  radiusKm: number
): Promise<IAnomalyDoc[]> {
  const radians = radiusKm / 6378.1; // Earth radius ~6,378.1 km
  return AnomalyModel.find({
    location: {
      $geoWithin: {
        $centerSphere: [[longitude, latitude], radians], // ALWAYS [longitude, latitude]
      },
    },
  });
}

/**
 * 3. Find anomalies belonging to a mission area with valid geospatial point location
 */
export async function fetchAnomaliesInMissionArea(missionId: string): Promise<IAnomalyDoc[]> {
  return AnomalyModel.find({
    missionId,
    location: { $exists: true, $ne: null },
  }).sort({ createdAt: -1 });
}
