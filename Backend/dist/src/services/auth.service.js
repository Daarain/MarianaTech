"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = loginUser;
exports.registerUser = registerUser;
exports.getUserProfile = getUserProfile;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../models/user.model");
const env_1 = require("../config/env");
async function loginUser(usernameInput, passwordInput) {
    const username = usernameInput ? usernameInput.trim().toLowerCase() : '';
    if (!username || !passwordInput) {
        throw new Error('Username and password are required');
    }
    const user = await user_model_1.User.findOne({ username, isActive: true });
    if (!user) {
        throw new Error('Invalid credentials');
    }
    const isPasswordValid = await bcryptjs_1.default.compare(passwordInput, user.passwordHash);
    if (!isPasswordValid) {
        throw new Error('Invalid credentials');
    }
    const payload = {
        id: user._id.toString(),
        username: user.username,
        name: user.name,
        role: user.role,
    };
    const options = {
        expiresIn: env_1.config.jwtExpiresIn,
    };
    const token = jsonwebtoken_1.default.sign(payload, env_1.config.jwtSecret, options);
    return {
        user: user.name,
        role: user.role,
        token,
    };
}
async function registerUser(nameInput, usernameInput, passwordInput, roleInput) {
    const name = nameInput ? nameInput.trim() : '';
    const username = usernameInput ? usernameInput.trim().toLowerCase() : '';
    const password = passwordInput ?? '';
    const requestedRole = roleInput === 'admin' ? 'admin' : 'operator';
    if (!name || !username || !password) {
        throw new Error('Name, username, and password are required');
    }
    if (username.length < 3) {
        throw new Error('Username must be at least 3 characters');
    }
    if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
    }
    const existingUser = await user_model_1.User.findOne({ username });
    if (existingUser) {
        throw new Error('Username already exists');
    }
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    const user = await user_model_1.User.create({
        name,
        username,
        passwordHash,
        role: requestedRole,
        isActive: true,
    });
    return {
        message: 'User registered successfully',
        user: {
            name: user.name,
            username: user.username,
            role: user.role,
        },
    };
}
async function getUserProfile(userId) {
    const user = await user_model_1.User.findById(userId);
    if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
    }
    return user;
}
