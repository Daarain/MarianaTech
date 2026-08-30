import { connectDatabase, disconnectDatabase } from '../config/database';
import { Mission } from '../models/mission.model';
import { AnomalyModel } from '../models/anomaly.model';

export async function seedDemoAnomalies(): Promise<void> {
  let missions = await Mission.find();

  if (missions.length === 0) {
    const demoMission = await Mission.create({
      id: 'MSN-2026-0142',
      customId: 'MSN-2026-0142',
      name: 'Chagos Trench Deep Recon',
      date: '2026-08-29',
      location: 'Chagos Trench, Indian Ocean',
      status: 'complete',
      anomalyCount: 3,
      priority: 'high',
      depthMin: 4100,
      depthMax: 4300,
      depthM: 4200,
      areaKm2: 15,
      operator: 'Lt. R. Mehta',
      sonarType: 'Side-scan 900 kHz',
    });
    missions = [demoMission];
  }

  const primaryMissionId = missions[0].id || missions[0].customId;

  const demoAnomalies = [
    {
      id: 'ANM-2026-0001',
      customId: 'ANM-2026-0001',
      missionId: primaryMissionId,
      className: 'shipwreck',
      confidence: 0.94,
      latitude: -6.214,
      longitude: 71.854,
      location: {
        type: 'Point' as const,
        coordinates: [71.854, -6.214] as [number, number],
      },
      priority: 'critical',
      status: 'pending_review',
      depthM: 4180,
      detectedAt: new Date('2026-08-29T10:14:00Z'),
      sizeM: 42.5,
      description: 'Sunken vessel acoustic profile detected with clear hull and mast structural features. [DEMO DATA]',
      isDemoData: true,
    },
    {
      id: 'ANM-2026-0002',
      customId: 'ANM-2026-0002',
      missionId: primaryMissionId,
      className: 'pipeline_damage',
      confidence: 0.88,
      latitude: -6.220,
      longitude: 71.860,
      location: {
        type: 'Point' as const,
        coordinates: [71.860, -6.220] as [number, number],
      },
      priority: 'high',
      depthM: 4210,
      detectedAt: new Date('2026-08-29T11:05:00Z'),
      sizeM: 12.0,
      description: 'Subsea communication conduit structural rupture anomaly. [DEMO DATA]',
      isDemoData: true,
    },
    {
      id: 'ANM-2026-0003',
      customId: 'ANM-2026-0003',
      missionId: primaryMissionId,
      className: 'mine_like_contact',
      confidence: 0.91,
      latitude: -6.228,
      longitude: 71.868,
      location: {
        type: 'Point' as const,
        coordinates: [71.868, -6.228] as [number, number],
      },
      priority: 'critical',
      status: 'pending_review',
      depthM: 4195,
      detectedAt: new Date('2026-08-29T11:42:00Z'),
      sizeM: 3.2,
      description: 'Cylindrical metallic acoustic reflection matching naval ordnance profile. [DEMO DATA]',
      isDemoData: true,
    },
  ];

  for (const item of demoAnomalies) {
    await AnomalyModel.findOneAndUpdate({ id: item.id }, item, { upsert: true, new: true });
    console.log(`[Seed Anomaly] Configured demo anomaly: ${item.id} (${item.className})`);
  }

  // Update mission anomaly count
  await Mission.findOneAndUpdate({ id: primaryMissionId }, { anomalyCount: demoAnomalies.length });
}

if (require.main === module) {
  (async () => {
    await connectDatabase();
    await seedDemoAnomalies();
    await disconnectDatabase();
  })();
}
