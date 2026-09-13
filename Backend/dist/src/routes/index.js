"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const healthRoutes_1 = __importDefault(require("./healthRoutes"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const mission_routes_1 = __importDefault(require("./mission.routes"));
const anomaly_routes_1 = __importDefault(require("./anomaly.routes"));
const job_routes_1 = __importDefault(require("./job.routes"));
const router = (0, express_1.Router)();
router.use('/v1', healthRoutes_1.default);
router.use('/v1/auth', auth_routes_1.default);
router.use('/v1/missions', mission_routes_1.default);
router.use('/v1/anomalies', anomaly_routes_1.default);
router.use('/v1/jobs', job_routes_1.default);
exports.default = router;
