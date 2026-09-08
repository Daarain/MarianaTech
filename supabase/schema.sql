-- ====================================================================
-- MARISCOPE AI — DATABASE SCHEMA (PostgreSQL + PostGIS)
-- SIH Problem Statement 26057: Automated Marine Debris & Sonar Anomaly
-- ====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. Enumerated Types
CREATE TYPE mission_status_type AS ENUM (
    'PREPARING',
    'IN_PROGRESS',
    'PROCESSING',
    'COMPLETED',
    'ARCHIVED',
    'FAILED'
);

CREATE TYPE hazard_priority_type AS ENUM (
    'CRITICAL',
    'HIGH',
    'MEDIUM',
    'LOW'
);

CREATE TYPE verification_status_type AS ENUM (
    'CONFIRMED',
    'REJECTED',
    'UNSURE',
    'PENDING'
);

CREATE TYPE anomaly_class_type AS ENUM (
    'Ghost Net',
    'Shipwreck / Hull',
    'Pipeline',
    'Cylinder / Barrel',
    'Cargo Container',
    'Unidentified Debris',
    'Acoustic Target',
    'Natural Seabed Formation',
    'Marine Life (Biological)'
);

-- 3. Missions Table
CREATE TABLE IF NOT EXISTS missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status mission_status_type DEFAULT 'PREPARING',
    vehicle_type VARCHAR(64) NOT NULL DEFAULT 'AUV',
    vehicle_name VARCHAR(128) NOT NULL,
    operator_name VARCHAR(128) NOT NULL,
    survey_region VARCHAR(128) NOT NULL,
    survey_boundary GEOMETRY(Polygon, 4326),
    sonar_frequency VARCHAR(32) DEFAULT '400kHz',
    range_m NUMERIC(6, 2) DEFAULT 100.0,
    ping_rate_hz NUMERIC(5, 2) DEFAULT 15.0,
    area_covered_sqkm NUMERIC(8, 4) DEFAULT 0.0,
    total_pings BIGINT DEFAULT 0,
    quality_score NUMERIC(5, 2) DEFAULT 0.0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_missions_boundary ON missions USING GIST (survey_boundary);
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);

-- 4. Sonar Raw & Processed Files
CREATE TABLE IF NOT EXISTS sonar_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(32) NOT NULL, -- e.g., 'XTF', 'JSF', 'GeoTIFF', 'PNG'
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    ping_start BIGINT,
    ping_end BIGINT,
    channel VARCHAR(32) DEFAULT 'PORT_STARBOARD',
    center_track GEOMETRY(LineString, 4326),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sonar_files_mission ON sonar_files(mission_id);
CREATE INDEX IF NOT EXISTS idx_sonar_files_track ON sonar_files USING GIST (center_track);

-- 5. AI Processing Pipeline Jobs
CREATE TABLE IF NOT EXISTS pipeline_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
    model_version VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'QUEUED',
    current_stage VARCHAR(64),
    progress_pct INTEGER DEFAULT 0,
    execution_time_ms INTEGER DEFAULT 0,
    quality_metrics JSONB DEFAULT '{}'::jsonb,
    pipeline_log JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 6. Anomalies & Detections (Core System of Record)
CREATE TABLE IF NOT EXISTS anomalies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    anomaly_id VARCHAR(64) NOT NULL,
    mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
    sonar_file_id UUID REFERENCES sonar_files(id) ON DELETE SET NULL,
    class anomaly_class_type NOT NULL,
    confidence NUMERIC(4, 3) NOT NULL, -- 0.000 to 1.000
    artificial_probability NUMERIC(4, 3) NOT NULL, -- 0.000 to 1.000
    priority hazard_priority_type NOT NULL DEFAULT 'MEDIUM',
    
    -- Geospatial PostGIS point (longitude, latitude)
    location GEOGRAPHY(Point, 4326) NOT NULL,
    depth_m NUMERIC(6, 2),
    
    -- Dimensions and Physical Acoustics
    estimated_length_m NUMERIC(6, 2),
    estimated_width_m NUMERIC(6, 2),
    estimated_height_m NUMERIC(6, 2),
    acoustic_shadow_length_m NUMERIC(6, 2),
    
    -- Bounding Box in image coordinates (JSON)
    bbox JSONB NOT NULL,
    segmentation_path TEXT,
    
    -- Evidence Media references
    image_url TEXT,
    crop_url TEXT,
    
    -- Multi-frame tracking
    tracking_id VARCHAR(64),
    multi_frame_hits INTEGER DEFAULT 1,
    
    -- Explainable AI details
    explainability JSONB DEFAULT '{}'::jsonb,
    marine_life_advisory JSONB DEFAULT NULL,
    
    -- Human Verification State
    verification_status verification_status_type DEFAULT 'PENDING',
    verified_by VARCHAR(128),
    verified_at TIMESTAMPTZ,
    verification_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial and Filtering Indexes
CREATE INDEX IF NOT EXISTS idx_anomalies_location ON anomalies USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_anomalies_mission ON anomalies(mission_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_priority ON anomalies(priority);
CREATE INDEX IF NOT EXISTS idx_anomalies_verification ON anomalies(verification_status);

-- 7. Verification Audit & Human-in-the-Loop Dataset
CREATE TABLE IF NOT EXISTS verification_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    anomaly_id UUID REFERENCES anomalies(id) ON DELETE CASCADE,
    operator_id VARCHAR(128) NOT NULL,
    action VARCHAR(32) NOT NULL, -- 'CONFIRMED', 'REJECTED', 'UNSURE'
    original_class anomaly_class_type,
    corrected_class anomaly_class_type,
    confidence_at_review NUMERIC(4, 3),
    notes TEXT,
    is_training_candidate BOOLEAN DEFAULT TRUE,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Model Registry & MLOps Tracking
CREATE TABLE IF NOT EXISTS models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    architecture VARCHAR(64) NOT NULL,
    version VARCHAR(32) NOT NULL,
    target_task VARCHAR(32) NOT NULL,
    mAP_50 NUMERIC(5, 4),
    precision NUMERIC(5, 4),
    recall NUMERIC(5, 4),
    inference_latency_ms INTEGER,
    weights_path TEXT NOT NULL,
    dataset_version VARCHAR(64),
    status VARCHAR(32) DEFAULT 'PRODUCTION',
    registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Edge / AUV Device Fleet
CREATE TABLE IF NOT EXISTS edge_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_name VARCHAR(128) UNIQUE NOT NULL,
    device_type VARCHAR(64) NOT NULL,
    status VARCHAR(32) DEFAULT 'ONLINE',
    firmware_version VARCHAR(32) NOT NULL,
    active_model_version VARCHAR(32) NOT NULL,
    battery_pct INTEGER DEFAULT 100,
    current_depth_m NUMERIC(6, 2) DEFAULT 0.0,
    storage_used_gb NUMERIC(6, 2) DEFAULT 0.0,
    pending_sync_items INTEGER DEFAULT 0,
    last_heartbeat TIMESTAMPTZ DEFAULT NOW()
);
