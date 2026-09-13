"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMissionAnomaliesHandler = getMissionAnomaliesHandler;
exports.getAnomalyByIdHandler = getAnomalyByIdHandler;
exports.verifyAnomalyHandler = verifyAnomalyHandler;
exports.rejectAnomalyHandler = rejectAnomalyHandler;
exports.getAnomalyHistoryHandler = getAnomalyHistoryHandler;
exports.getAnomaliesNearHandler = getAnomaliesNearHandler;
exports.getAnomaliesWithinHandler = getAnomaliesWithinHandler;
exports.getMissionSpatialAnomaliesHandler = getMissionSpatialAnomaliesHandler;
const anomaly_service_1 = require("../services/anomaly.service");
async function getMissionAnomaliesHandler(req, res, next) {
    try {
        const { missionId } = req.params;
        const anomalies = await (0, anomaly_service_1.fetchAnomaliesByMission)(missionId);
        res.status(200).json(anomalies);
    }
    catch (error) {
        next(error);
    }
}
async function getAnomalyByIdHandler(req, res, next) {
    try {
        const { anomalyId } = req.params;
        const anomaly = await (0, anomaly_service_1.fetchAnomalyById)(anomalyId);
        if (!anomaly) {
            res.status(404).json({ error: 'Anomaly not found', statusCode: 404 });
            return;
        }
        res.status(200).json(anomaly);
    }
    catch (error) {
        next(error);
    }
}
async function verifyAnomalyHandler(req, res, next) {
    try {
        const { anomalyId } = req.params;
        const { comment, status } = req.body || {};
        const username = req.user?.name || req.user?.username || 'Cdr. A. Fernando';
        const updated = await (0, anomaly_service_1.updateVerifyAnomaly)(anomalyId, username, comment || '', status || 'verified');
        if (!updated) {
            res.status(404).json({ error: 'Anomaly not found', statusCode: 404 });
            return;
        }
        res.status(200).json(updated);
    }
    catch (error) {
        next(error);
    }
}
async function rejectAnomalyHandler(req, res, next) {
    try {
        const { anomalyId } = req.params;
        const { comment } = req.body || {};
        const username = req.user?.name || req.user?.username || 'Cdr. A. Fernando';
        const updated = await (0, anomaly_service_1.updateRejectAnomaly)(anomalyId, username, comment || '');
        if (!updated) {
            res.status(404).json({ error: 'Anomaly not found', statusCode: 404 });
            return;
        }
        res.status(200).json(updated);
    }
    catch (error) {
        next(error);
    }
}
async function getAnomalyHistoryHandler(req, res, next) {
    try {
        const { anomalyId } = req.params;
        const history = await (0, anomaly_service_1.fetchAnomalyHistory)(anomalyId);
        res.status(200).json(history);
    }
    catch (error) {
        next(error);
    }
}
/**
 * STEP 12: Geospatial Handlers
 */
async function getAnomaliesNearHandler(req, res, next) {
    try {
        const lng = parseFloat(req.query.lng);
        const lat = parseFloat(req.query.lat);
        const maxDistanceMeters = req.query.maxDistance ? parseFloat(req.query.maxDistance) : 50000;
        if (isNaN(lng) || isNaN(lat)) {
            res.status(400).json({ error: 'Invalid or missing lng/lat query parameters', statusCode: 400 });
            return;
        }
        const anomalies = await (0, anomaly_service_1.fetchAnomaliesNear)(lng, lat, maxDistanceMeters);
        res.status(200).json(anomalies);
    }
    catch (error) {
        next(error);
    }
}
async function getAnomaliesWithinHandler(req, res, next) {
    try {
        const lng = parseFloat(req.query.lng);
        const lat = parseFloat(req.query.lat);
        const radiusKm = parseFloat((req.query.radiusKm || req.query.radius));
        if (isNaN(lng) || isNaN(lat) || isNaN(radiusKm)) {
            res.status(400).json({ error: 'Invalid or missing lng/lat/radiusKm query parameters', statusCode: 400 });
            return;
        }
        const anomalies = await (0, anomaly_service_1.fetchAnomaliesWithinRadius)(lng, lat, radiusKm);
        res.status(200).json(anomalies);
    }
    catch (error) {
        next(error);
    }
}
async function getMissionSpatialAnomaliesHandler(req, res, next) {
    try {
        const { missionId } = req.params;
        const anomalies = await (0, anomaly_service_1.fetchAnomaliesInMissionArea)(missionId);
        res.status(200).json(anomalies);
    }
    catch (error) {
        next(error);
    }
}
