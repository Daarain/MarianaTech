"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMissions = getMissions;
exports.getMissionById = getMissionById;
exports.createMission = createMission;
exports.getDashboardStats = getDashboardStats;
const mission_service_1 = require("../services/mission.service");
async function getMissions(_req, res, next) {
    try {
        const missions = await (0, mission_service_1.fetchAllMissions)();
        res.status(200).json(missions);
    }
    catch (error) {
        next(error);
    }
}
async function getMissionById(req, res, next) {
    try {
        const mission = await (0, mission_service_1.fetchMissionById)(req.params.id);
        if (!mission) {
            res.status(404).json({ error: 'Mission not found', statusCode: 404 });
            return;
        }
        res.status(200).json(mission);
    }
    catch (error) {
        next(error);
    }
}
async function createMission(req, res, next) {
    try {
        const payload = req.body;
        const result = await (0, mission_service_1.createMissionRecord)(payload);
        res.status(201).json(result);
    }
    catch (error) {
        res.status(400).json({
            error: error.message || 'Failed to create mission',
            statusCode: 400,
        });
    }
}
async function getDashboardStats(_req, res, next) {
    try {
        const stats = await (0, mission_service_1.getAggregateStats)();
        res.status(200).json(stats);
    }
    catch (error) {
        next(error);
    }
}
