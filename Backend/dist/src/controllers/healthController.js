"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealth = getHealth;
const healthService_1 = require("../services/healthService");
function getHealth(_req, res, next) {
    try {
        const status = (0, healthService_1.getHealthStatus)();
        res.status(200).json(status);
    }
    catch (error) {
        next(error);
    }
}
