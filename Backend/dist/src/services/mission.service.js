"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAllMissions = fetchAllMissions;
exports.fetchMissionById = fetchMissionById;
exports.createMissionRecord = createMissionRecord;
exports.getAggregateStats = getAggregateStats;
const mission_model_1 = require("../models/mission.model");
const anomaly_model_1 = require("../models/anomaly.model");
const missionFile_service_1 = require("./missionFile.service");
async function fetchAllMissions() {
    const missions = await mission_model_1.Mission.find().sort({ createdAt: -1 });
    return missions;
}
async function fetchMissionById(id) {
    const mission = await mission_model_1.Mission.findOne({
        $or: [{ id }, { customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });
    return mission;
}
async function createMissionRecord(payload) {
    if (!payload.missionName || !payload.location) {
        throw new Error('Mission name and location are required');
    }
    const year = new Date().getFullYear();
    const count = await mission_model_1.Mission.countDocuments();
    const customId = `MSN-${year}-${String(count + 143).padStart(4, '0')}`;
    const depthMin = payload.depthMin || 0;
    const depthMax = payload.depthMax || 0;
    const depthM = depthMax > depthMin ? Math.round((depthMin + depthMax) / 2) : depthMin || 0;
    const newMission = await mission_model_1.Mission.create({
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
        await (0, missionFile_service_1.createFileMetadataFromMission)(newMission.id, payload.files);
    }
    return { id: newMission.id };
}
async function getAggregateStats() {
    // 1. total_missions: count of documents in Mission collection
    const total_missions = await mission_model_1.Mission.countDocuments();
    // 2. critical_anomalies: count of anomalies whose priority is 'critical'
    const critical_anomalies = await anomaly_model_1.AnomalyModel.countDocuments({ priority: 'critical' });
    // 3. pending_review: count of anomalies whose status is 'pending_review'
    const pending_review = await anomaly_model_1.AnomalyModel.countDocuments({ status: 'pending_review' });
    // 4. avg_confidence: average anomaly confidence calculated across MongoDB
    const avgResult = await anomaly_model_1.AnomalyModel.aggregate([
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
