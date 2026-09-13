"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mission = void 0;
const mongoose_1 = require("mongoose");
const MissionFileSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    size: { type: Number, required: true },
    storagePath: { type: String },
    uploadedAt: { type: Date, default: Date.now },
}, { _id: false });
const MissionSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true, index: true },
    customId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    vessel: { type: String, default: '' },
    location: { type: String, required: true, trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    status: {
        type: String,
        enum: ['processing', 'complete', 'failed', 'pending'],
        default: 'pending',
        required: true,
    },
    anomalyCount: { type: Number, default: 0 },
    priority: {
        type: String,
        enum: ['critical', 'high', 'medium', 'low'],
        default: 'medium',
        required: true,
    },
    depthMin: { type: Number, default: 0 },
    depthMax: { type: Number, default: 0 },
    depthM: { type: Number, required: true, default: 0 },
    areaKm2: { type: Number, default: 10 },
    operator: { type: String, required: true },
    sonarType: { type: String, required: true },
    notes: { type: String, default: '' },
    files: [MissionFileSchema],
}, {
    timestamps: true,
    toJSON: {
        transform(_doc, ret) {
            return {
                id: ret.id || ret.customId || ret._id.toString(),
                name: ret.name,
                date: ret.date,
                location: ret.location,
                latitude: ret.latitude !== undefined && ret.latitude !== null ? ret.latitude : null,
                longitude: ret.longitude !== undefined && ret.longitude !== null ? ret.longitude : null,
                status: ret.status,
                anomaly_count: ret.anomalyCount ?? 0,
                priority: ret.priority ?? 'medium',
                depth_m: ret.depthM ?? 0,
                area_km2: ret.areaKm2 ?? 10,
                operator: ret.operator,
                sonar_type: ret.sonarType,
            };
        },
    },
});
exports.Mission = (0, mongoose_1.model)('Mission', MissionSchema);
