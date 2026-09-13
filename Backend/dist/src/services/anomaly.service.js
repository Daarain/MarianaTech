"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAnomaliesByMission = fetchAnomaliesByMission;
exports.fetchAnomalyById = fetchAnomalyById;
exports.updateVerifyAnomaly = updateVerifyAnomaly;
exports.updateRejectAnomaly = updateRejectAnomaly;
exports.fetchAnomalyHistory = fetchAnomalyHistory;
exports.fetchAnomaliesNear = fetchAnomaliesNear;
exports.fetchAnomaliesWithinRadius = fetchAnomaliesWithinRadius;
exports.fetchAnomaliesInMissionArea = fetchAnomaliesInMissionArea;
const anomaly_model_1 = require("../models/anomaly.model");
const verificationHistory_model_1 = require("../models/verificationHistory.model");
async function fetchAnomaliesByMission(missionId) {
    const anomalies = await anomaly_model_1.AnomalyModel.find({ missionId }).sort({ createdAt: -1 });
    return anomalies;
}
async function fetchAnomalyById(anomalyId) {
    const anomaly = await anomaly_model_1.AnomalyModel.findOne({
        $or: [{ id: anomalyId }, { customId: anomalyId }, { _id: anomalyId.match(/^[0-9a-fA-F]{24}$/) ? anomalyId : null }],
    });
    return anomaly;
}
async function updateVerifyAnomaly(anomalyId, user, comment = '', status = 'verified') {
    const anomaly = await fetchAnomalyById(anomalyId);
    if (!anomaly) {
        return null;
    }
    anomaly.status = status;
    await anomaly.save();
    // Save audit history record without overwriting previous history
    await verificationHistory_model_1.VerificationHistoryModel.create({
        anomalyId: anomaly.id,
        user: user || 'Operator',
        timestamp: new Date(),
        decision: status,
        comment,
    });
    return anomaly;
}
async function updateRejectAnomaly(anomalyId, user, comment = '') {
    const anomaly = await fetchAnomalyById(anomalyId);
    if (!anomaly) {
        return null;
    }
    anomaly.status = 'rejected';
    await anomaly.save();
    // Save audit history record without overwriting previous history
    await verificationHistory_model_1.VerificationHistoryModel.create({
        anomalyId: anomaly.id,
        user: user || 'Operator',
        timestamp: new Date(),
        decision: 'rejected',
        comment,
    });
    return anomaly;
}
async function fetchAnomalyHistory(anomalyId) {
    const history = await verificationHistory_model_1.VerificationHistoryModel.find({
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
async function fetchAnomaliesNear(longitude, latitude, maxDistanceMeters = 50000) {
    return anomaly_model_1.AnomalyModel.find({
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
async function fetchAnomaliesWithinRadius(longitude, latitude, radiusKm) {
    const radians = radiusKm / 6378.1; // Earth radius ~6,378.1 km
    return anomaly_model_1.AnomalyModel.find({
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
async function fetchAnomaliesInMissionArea(missionId) {
    return anomaly_model_1.AnomalyModel.find({
        missionId,
        location: { $exists: true, $ne: null },
    }).sort({ createdAt: -1 });
}
