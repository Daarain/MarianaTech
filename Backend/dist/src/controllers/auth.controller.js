"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.register = register;
exports.logout = logout;
exports.getMe = getMe;
const auth_service_1 = require("../services/auth.service");
async function login(req, res, next) {
    try {
        const { username, password } = req.body;
        const result = await (0, auth_service_1.loginUser)(username, password);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(401).json({
            error: error.message || 'Authentication failed',
            statusCode: 401,
            timestamp: new Date().toISOString(),
        });
    }
}
async function register(req, res) {
    try {
        const { name, username, password, role } = req.body ?? {};
        const result = await (0, auth_service_1.registerUser)(name, username, password, role);
        res.status(201).json(result);
    }
    catch (error) {
        const message = error.message || 'Registration failed';
        const statusCode = message.toLowerCase().includes('exists') || message.toLowerCase().includes('already') ? 409 : 400;
        res.status(statusCode).json({
            error: message,
            statusCode,
            timestamp: new Date().toISOString(),
        });
    }
}
async function logout(_req, res) {
    res.status(200).json({
        message: 'Logged out successfully',
        timestamp: new Date().toISOString(),
    });
}
async function getMe(req, res, next) {
    try {
        if (!req.user?.id) {
            res.status(401).json({ error: 'Unauthorized', statusCode: 401 });
            return;
        }
        const user = await (0, auth_service_1.getUserProfile)(req.user.id);
        res.status(200).json({
            id: user._id,
            name: user.name,
            username: user.username,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        });
    }
    catch (error) {
        next(error);
    }
}
