"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationHistoryModel = void 0;
const mongoose_1 = require("mongoose");
const VerificationHistorySchema = new mongoose_1.Schema({
    anomalyId: { type: String, required: true, index: true },
    user: { type: String, required: true, default: 'Operator' },
    timestamp: { type: Date, default: Date.now, required: true },
    decision: { type: String, required: true },
    comment: { type: String, default: '' },
}, {
    timestamps: true,
    toJSON: {
        transform(_doc, ret) {
            return {
                id: ret._id.toString(),
                anomalyId: ret.anomalyId,
                user: ret.user,
                timestamp: ret.timestamp ? ret.timestamp.toISOString() : new Date().toISOString(),
                decision: ret.decision,
                comment: ret.comment || '',
                createdAt: ret.createdAt,
            };
        },
    },
});
exports.VerificationHistoryModel = (0, mongoose_1.model)('VerificationHistory', VerificationHistorySchema);
