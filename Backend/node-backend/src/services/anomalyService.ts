import { Anomaly, IAnomaly } from '../models/Anomaly';
import { Verification } from '../models/Verification';
import { seedInitialDataIfEmpty } from '../utils/seed';

export async function getAnomaliesForMission(missionId: string): Promise<IAnomaly[]> {
  await seedInitialDataIfEmpty();
  const anomalies = await Anomaly.find({ mission_id: missionId }).sort({ confidence: -1 });
  return anomalies;
}

export async function verifyAnomalyStatus(anomalyId: string, userId?: string): Promise<IAnomaly> {
  await seedInitialDataIfEmpty();
  const anomaly = await Anomaly.findOne({ id: anomalyId });
  if (!anomaly) {
    throw new Error(`Anomaly ${anomalyId} not found`);
  }

  const prevStatus = anomaly.status;
  anomaly.status = 'verified';
  await anomaly.save();

  await Verification.create({
    anomaly_id: anomalyId,
    mission_id: anomaly.mission_id,
    user_id: userId,
    previous_status: prevStatus,
    new_status: 'verified',
    action: 'verify',
    verified_at: new Date(),
  });

  return anomaly;
}

export async function rejectAnomalyStatus(anomalyId: string, userId?: string): Promise<IAnomaly> {
  await seedInitialDataIfEmpty();
  const anomaly = await Anomaly.findOne({ id: anomalyId });
  if (!anomaly) {
    throw new Error(`Anomaly ${anomalyId} not found`);
  }

  const prevStatus = anomaly.status;
  anomaly.status = 'rejected';
  await anomaly.save();

  await Verification.create({
    anomaly_id: anomalyId,
    mission_id: anomaly.mission_id,
    user_id: userId,
    previous_status: prevStatus,
    new_status: 'rejected',
    action: 'reject',
    verified_at: new Date(),
  });

  return anomaly;
}
