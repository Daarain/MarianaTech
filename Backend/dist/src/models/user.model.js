"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
        type: String,
        enum: ['admin', 'operator'],
        default: 'operator',
        required: true,
    },
    isActive: { type: Boolean, default: true, required: true },
}, {
    timestamps: true,
    toJSON: {
        transform(_doc, ret) {
            delete ret.passwordHash;
            delete ret.__v;
            return ret;
        },
    },
});
exports.User = (0, mongoose_1.model)('User', UserSchema);
