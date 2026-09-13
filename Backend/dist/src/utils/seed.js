"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedInitialUsers = seedInitialUsers;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_model_1 = require("../models/user.model");
const env_1 = require("../config/env");
const database_1 = require("../config/database");
async function seedInitialUsers() {
    try {
        const adminPasswordHash = await bcryptjs_1.default.hash(env_1.config.adminInitialPassword, 10);
        await user_model_1.User.findOneAndUpdate({ username: 'admin' }, {
            name: 'Cdr. A. Fernando',
            username: 'admin',
            passwordHash: adminPasswordHash,
            role: 'admin',
            isActive: true,
        }, { upsert: true, new: true });
        console.log('[Seed] Admin user configured: Cdr. A. Fernando (username: admin)');
        const operatorPasswordHash = await bcryptjs_1.default.hash(env_1.config.operatorInitialPassword, 10);
        await user_model_1.User.findOneAndUpdate({ username: 'operator' }, {
            name: 'Lt. R. Mehta',
            username: 'operator',
            passwordHash: operatorPasswordHash,
            role: 'operator',
            isActive: true,
        }, { upsert: true, new: true });
        console.log('[Seed] Operator user configured: Lt. R. Mehta (username: operator)');
    }
    catch (error) {
        console.error('[Seed Error] Failed to seed initial users:', error.message);
    }
}
// Runnable seed script entry point if called via `npm run seed`
if (require.main === module) {
    (async () => {
        await (0, database_1.connectDatabase)();
        await seedInitialUsers();
        await (0, database_1.disconnectDatabase)();
        process.exit(0);
    })();
}
