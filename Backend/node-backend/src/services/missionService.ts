import { Mission, IMission } from '../models/Mission';
import { MissionFile } from '../models/MissionFile';
import { Anomaly } from '../models/Anomaly';
import { addSonarProcessingJob } from '../queues/sonarQueue';
import { seedInitialDataIfEmpty } from '../utils/seed';

export interface CreateMissionPayload {
  missionName: string;
  date: string;
  vessel: string;
  location: string;
  depthMin: number;
  depthMax: number;
  sonarType: string;
  notes: string;
  operatorName: string;
  files: { name: string; size: number }[];
}

export interface DashboardStats {
  total_missions: number;
  critical_anomalies: number;
  avg_confidence: number;
  pending_review: number;
}

export async function getAllMissions(): Promise<IMission[]> {
  await seedInitialDataIfEmpty();
  const missions = await Mission.find().sort({ createdAt: -1 });
  return missions;
}

export async function getMissionById(id: string): Promise<IMission | null> {
  await seedInitialDataIfEmpty();
  const mission = await Mission.findOne({ id });
  return mission;
}

export async function createNewMission(payload: CreateMissionPayload): Promise<{ id: string }> {
  await seedInitialDataIfEmpty();
  
  // Generate unique mission ID: MSN-2026-XXXX
  const count = await Mission.countDocuments();
  const customId = `MSN-2026-${String(count + 143).padStart(4, '0')}`;

  const avgDepth = Math.round(((payload.depthMin || 0) + (payload.depthMax || 0)) / 2) || 1000;

  const newMission = await Mission.create({
    id: customId,
    name: payload.missionName,
    date: payload.date || new Date().toISOString().slice(0, 10),
    vessel: payload.vessel || 'Survey Vessel Mariana',
    location: payload.location,
    latitude: -6.3, // default center region if not provided
    longitude: 71.2,
    status: 'pending',
    anomaly_count: 0,
    priority: 'medium',
    depth_m: avgDepth,
    depth_min: payload.depthMin || 0,
    depth_max: payload.depthMax || 0,
    area_km2: 25,
    operator: payload.operatorName || 'Lt. R. Mehta',
    sonar_type: payload.sonarType || 'Side-scan 900 kHz',
    notes: payload.notes || '',
  });

  // Save file records
  if (payload.files && payload.files.length > 0) {
    const fileDocs = payload.files.map((f) => ({
      mission_id: customId,
      filename: f.name,
      original_name: f.name,
      size_bytes: f.size,
      storage_path: `uploads/sonar/${f.name}`,
      status: 'uploaded' as const,
    }));
    await MissionFile.insertMany(fileDocs);
  }

  // Queue background AI processing job
  await addSonarProcessingJob({
    missionId: customId,
    files: payload.files || [],
    depthMin: payload.depthMin || 0,
    depthMax: payload.depthMax || 0,
    sonarType: payload.sonarType || 'Side-scan 900 kHz',
  });

  return { id: customId };
}

export async function calculateDashboardStats(): Promise<DashboardStats> {
  await seedInitialDataIfEmpty();

  const total_missions = await Mission.countDocuments();
  
  const criticalMissions = await Mission.find({ priority: 'critical' });
  const critical_anomalies = criticalMissions.reduce((acc, m) => acc + (m.anomaly_count || 0), 0);

  const pending_review = await Anomaly.countDocuments({ status: 'pending_review' });

  const allAnomalies = await Anomaly.find({}, { confidence: 1 });
  let avg_confidence = 81;
  if (allAnomalies.length > 0) {
    const sum = allAnomalies.reduce((acc, a) => acc + (a.confidence || 0), 0);
    avg_confidence = Math.round((sum / allAnomalies.length) * 100);
  }

  return {
    total_missions,
    critical_anomalies,
    avg_confidence,
    pending_review,
  };
}
