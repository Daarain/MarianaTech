import { Mission, IMission } from '../models/mission.model';
import { AnomalyModel } from '../models/anomaly.model';
import { createFileMetadataFromMission } from './missionFile.service';

export interface CreateMissionInput {
  missionName: string;
  date: string;
  vessel?: string;
  location: string;
  depthMin?: number;
  depthMax?: number;
  sonarType: string;
  notes?: string;
  operatorName: string;
  latitude?: number | null;
  longitude?: number | null;
  files?: { name: string; size: number }[];
}

export interface DashboardStatsResponse {
  total_missions: number;
  critical_anomalies: number;
  avg_confidence: number;
  pending_review: number;
}

export async function fetchAllMissions(): Promise<IMission[]> {
  const missions = await Mission.find().sort({ createdAt: -1 });
  return missions;
}

export async function fetchMissionById(id: string): Promise<IMission | null> {
  const mission = await Mission.findOne({
    $or: [{ id }, { customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
  });
  return mission;
}

export async function createMissionRecord(payload: CreateMissionInput): Promise<{ id: string }> {
  if (!payload.missionName || !payload.location) {
    throw new Error('Mission name and location are required');
  }

  const year = new Date().getFullYear();
  const count = await Mission.countDocuments();
  const customId = `MSN-${year}-${String(count + 143).padStart(4, '0')}`;

  const depthMin = payload.depthMin || 0;
  const depthMax = payload.depthMax || 0;
  const depthM = depthMax > depthMin ? Math.round((depthMin + depthMax) / 2) : depthMin || 0;

  const newMission = await Mission.create({
    id: customId,
    customId,
    name: payload.missionName,
    date: payload.date || new Date().toISOString().slice(0, 10),
    vessel: payload.vessel || '',
    location: payload.location,
    latitude: payload.latitude !== undefined && payload.latitude !== null ? payload.latitude : null,
    longitude: payload.longitude !== undefined && payload.longitude !== null ? payload.longitude : null,
    status: 'pending',
    anomalyCount: 0,
    priority: 'low',
    depthMin,
    depthMax,
    depthM,
    areaKm2: 15,
    operator: payload.operatorName || 'Operator',
    sonarType: payload.sonarType || 'Side-scan Sonar',
    notes: payload.notes || '',
    files: (payload.files || []).map((f) => ({ name: f.name, size: f.size })),
  });

  // Create initial file metadata entries without pretending binary file was uploaded
  if (payload.files && payload.files.length > 0) {
    await createFileMetadataFromMission(newMission.id, payload.files);
  }

  return { id: newMission.id };
}

export async function getAggregateStats(): Promise<DashboardStatsResponse> {
  // 1. total_missions: count of documents in Mission collection
  const total_missions = await Mission.countDocuments();

  // 2. critical_anomalies: count of anomalies whose priority is 'critical'
  const critical_anomalies = await AnomalyModel.countDocuments({ priority: 'critical' });

  // 3. pending_review: count of anomalies whose status is 'pending_review'
  const pending_review = await AnomalyModel.countDocuments({ status: 'pending_review' });

  // 4. avg_confidence: average anomaly confidence calculated across MongoDB
  const avgResult = await AnomalyModel.aggregate([
    {
      $group: {
        _id: null,
        avgConfidence: { $avg: '$confidence' },
      },
    },
  ]);

  let rawAvg = avgResult[0]?.avgConfidence || 0;
  if (rawAvg > 0 && rawAvg <= 1) {
    rawAvg = rawAvg * 100;
  }
  const avg_confidence = Math.round(rawAvg);

  return {
    total_missions,
    critical_anomalies,
    avg_confidence,
    pending_review,
  };
}
