"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnomalyModel = void 0;
const mongoose_1 = require("mongoose");
const AnomalySchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true, index: true },
    customId: {
        type: String,
        default: function () {
            return this.id;
        },
    },
    missionId: {
        type: String,
        default: function () {
            return this.mission_id || this.missionId;
        },
        index: true,
    },
    processingRunId: { type: String, index: true },
    sourceFileId: { type: String, index: true },
    modelVersion: { type: String },
    className: {
        type: String,
        enum: [
            'unidentified_object',
            'shipwreck',
            'marine_life_cluster',
            'debris_field',
            'geological_formation',
            'pipeline_damage',
            'mine_like_contact',
        ],
        default: function () {
            return this.class_name || 'unidentified_object';
        },
        required: true,
    },
    confidence: { type: Number, required: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    location: {
        type: {
            type: String,
            enum: ['Point'],
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
        },
    },
    priority: {
        type: String,
        enum: ['critical', 'high', 'medium', 'low'],
        default: 'medium',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending_review', 'verified', 'rejected', 'false_positive'],
        default: 'pending_review',
        required: true,
    },
    depthM: {
        type: Number,
        default: function () {
            return this.depth_m ?? 0;
        },
        required: true,
    },
    detectedAt: { type: Date, default: Date.now },
    sizeM: { type: Number, default: 0 },
    description: { type: String, default: '' },
    boundingBox: { type: [Number], default: undefined },
    isDemoData: { type: Boolean, default: false },
}, {
    timestamps: true,
    toJSON: {
        transform(_doc, ret) {
            return {
                id: ret.id || ret.customId || ret._id.toString(),
                mission_id: ret.missionId,
                class_name: ret.className,
                confidence: ret.confidence,
                latitude: ret.latitude !== undefined && ret.latitude !== null ? ret.latitude : null,
                longitude: ret.longitude !== undefined && ret.longitude !== null ? ret.longitude : null,
                priority: ret.priority,
                status: ret.status,
                depth_m: ret.depthM,
                detected_at: ret.detectedAt ? ret.detectedAt.toISOString() : new Date().toISOString(),
                size_m: ret.sizeM,
                description: ret.description,
            };
        },
    },
});
// 2dsphere index for GeoJSON geospatial queries
AnomalySchema.index({ location: '2dsphere' });
exports.AnomalyModel = (0, mongoose_1.model)('Anomaly', AnomalySchema);
