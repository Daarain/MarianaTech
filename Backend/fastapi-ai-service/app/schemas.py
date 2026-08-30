from pydantic import BaseModel, Field
from typing import List, Optional

class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float

class DetectedAnomalySchema(BaseModel):
    class_name: str
    confidence: float
    latitude: float
    longitude: float
    priority: str
    depth_m: float
    size_m: float
    description: str
    bounding_box: Optional[BoundingBox] = None
    tile_image_url: Optional[str] = None
    quality_score: Optional[float] = None
    natural_vs_artificial: Optional[float] = None

class ProcessingMetrics(BaseModel):
    sonar_quality_score: float
    tiles_processed: int
    duration_seconds: float

class AIProcessRequest(BaseModel):
    job_id: str
    mission_id: str
    file_id: Optional[str] = None
    file_path: Optional[str] = None
    sonar_type: Optional[str] = "Side-scan 900 kHz"
    depth_min: Optional[float] = 4100
    depth_max: Optional[float] = 4250

class AIProcessResponse(BaseModel):
    job_id: str
    status: str
    processing_metrics: ProcessingMetrics
    anomalies_detected: List[DetectedAnomalySchema]

class QualityAssessmentRequest(BaseModel):
    file_path: str
    sonar_type: Optional[str] = "Side-scan"

class QualityAssessmentResponse(BaseModel):
    quality_score: float
    signal_to_noise_ratio: float
    artifacts_detected: bool
    status: str
