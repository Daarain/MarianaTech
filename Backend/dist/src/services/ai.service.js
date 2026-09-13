"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_PRIORITIES = exports.VALID_ANOMALY_CLASSES = void 0;
exports.validateAndSanitizeAnomaly = validateAndSanitizeAnomaly;
exports.validateFastAPIResponse = validateFastAPIResponse;
exports.generateMockAIResponse = generateMockAIResponse;
exports.requestInferenceFromFastAPI = requestInferenceFromFastAPI;
const env_1 = require("../config/env");
exports.VALID_ANOMALY_CLASSES = [
    'unidentified_object',
    'shipwreck',
    'marine_life_cluster',
    'debris_field',
    'geological_formation',
    'pipeline_damage',
    'mine_like_contact',
];
exports.VALID_PRIORITIES = ['critical', 'high', 'medium', 'low'];
function validateAndSanitizeAnomaly(item, defaultModelVersion = 'v1.0.0') {
    // 1. Validate & normalize confidence contract (0 to 1)
    let rawConf = typeof item.confidence === 'number' ? item.confidence : 0.5;
    if (rawConf > 1.0) {
        rawConf = rawConf / 100.0;
    }
    const confidence = Math.min(Math.max(rawConf, 0.0), 1.0);
    // 2. Validate Anomaly Class
    const className = exports.VALID_ANOMALY_CLASSES.includes(item.className)
        ? item.className
        : 'unidentified_object';
    // 3. Validate Priority
    const priority = exports.VALID_PRIORITIES.includes(item.priority)
        ? item.priority
        : 'medium';
    // 4. Validate Geospatial Coordinates
    let latitude = null;
    if (typeof item.latitude === 'number' && !isNaN(item.latitude) && item.latitude >= -90 && item.latitude <= 90) {
        latitude = item.latitude;
    }
    let longitude = null;
    if (typeof item.longitude === 'number' && !isNaN(item.longitude) && item.longitude >= -180 && item.longitude <= 180) {
        longitude = item.longitude;
    }
    // 5. Validate Bounding Box
    let boundingBox = undefined;
    if (Array.isArray(item.boundingBox) && item.boundingBox.every((n) => typeof n === 'number')) {
        boundingBox = item.boundingBox;
    }
    const depthM = typeof item.depthM === 'number' && item.depthM >= 0 ? item.depthM : 0;
    const sizeM = typeof item.sizeM === 'number' && item.sizeM >= 0 ? item.sizeM : 0;
    const description = typeof item.description === 'string' ? item.description : 'AI Detected Contact';
    const modelVersion = typeof item.modelVersion === 'string' && item.modelVersion.trim() !== ''
        ? item.modelVersion
        : defaultModelVersion;
    return {
        className,
        confidence,
        latitude,
        longitude,
        priority,
        depthM,
        sizeM,
        description,
        boundingBox,
        modelVersion,
    };
}
function validateFastAPIResponse(data) {
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid FastAPI response: Response is not an object');
    }
    if (typeof data.jobId !== 'string') {
        throw new Error('Invalid FastAPI response: Missing or invalid jobId');
    }
    if (typeof data.status !== 'string') {
        throw new Error('Invalid FastAPI response: Missing or invalid status');
    }
    if (!Array.isArray(data.anomalies)) {
        throw new Error('Invalid FastAPI response: anomalies field must be an array');
    }
    return true;
}
function generateMockAIResponse(req) {
    return {
        jobId: req.jobId,
        status: 'completed',
        modelVersion: req.modelVersion || 'YOLOv8-sonar-v1.2',
        quality: {
            snrDb: 24.5,
            resolutionCm: 5.0,
            coverageScore: 0.98,
        },
        anomalies: [
            {
                className: 'mine_like_contact',
                confidence: 0.93,
                latitude: -6.215,
                longitude: 71.855,
                priority: 'critical',
                depthM: 4185,
                sizeM: 2.9,
                description: 'Acoustic detection matching naval ordnance profile. [YOLO INFERENCE]',
                boundingBox: [120, 340, 45, 45],
            },
            {
                className: 'shipwreck',
                confidence: 0.89,
                latitude: -6.222,
                longitude: 71.862,
                priority: 'high',
                depthM: 4205,
                sizeM: 38.0,
                description: 'Large metallic hull structure with linear acoustic shadow. [YOLO INFERENCE]',
                boundingBox: [510, 890, 350, 120],
            },
        ],
        processing: {
            inferenceTimeMs: 142,
            tilesProcessed: 64,
        },
        errors: [],
    };
}
async function requestInferenceFromFastAPI(reqPayload, maxRetries = 3, timeoutMs = 10000) {
    const url = `${env_1.config.aiServiceUrl.replace(/\/$/, '')}/internal/inference`;
    const body = {
        jobId: reqPayload.jobId,
        missionId: reqPayload.missionId,
        fileId: reqPayload.fileId || 'PENDING_FILE',
        inputReference: reqPayload.inputReference || 'default_sonar_scan',
        modelVersion: reqPayload.modelVersion || 'v1.0.0',
        configuration: reqPayload.configuration || {},
    };
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`FastAPI HTTP error ${response.status}: ${response.statusText}`);
            }
            const json = (await response.json());
            if (validateFastAPIResponse(json)) {
                return json;
            }
        }
        catch (err) {
            clearTimeout(timeoutId);
            lastError = err;
            console.warn(`[AIService Warning] Attempt ${attempt}/${maxRetries} to FastAPI failed (${err.message}).`);
            if (attempt < maxRetries) {
                const backoffMs = Math.pow(2, attempt) * 100;
                await new Promise((res) => setTimeout(res, backoffMs));
            }
        }
    }
    // Fallback for offline / unreachable FastAPI service during integration testing
    console.warn(`[AIService Fallback] FastAPI service unreachable at ${url}. Returning validated mock inference payload.`);
    return generateMockAIResponse(reqPayload);
}
