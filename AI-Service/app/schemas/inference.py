from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class InferenceRequest(BaseModel):
    jobId: str = Field(..., description="Unique job processing identifier")
    missionId: str = Field(..., description="Mission identifier")
    fileId: Optional[str] = Field("PENDING_FILE", description="File identifier")
    inputReference: str = Field(..., description="Sonar file storage reference or URI")
    modelVersion: Optional[str] = Field("v1.0.0", description="Target model version")
    configuration: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Custom inference parameters")

class AIAnomalyItem(BaseModel):
    className: str = Field(..., description="Detected anomaly classification")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence score")
    latitude: Optional[float] = Field(None, description="Latitude GPS coordinate")
    longitude: Optional[float] = Field(None, description="Longitude GPS coordinate")
    priority: str = Field("medium", description="Priority level: critical, high, medium, low")
    depthM: float = Field(0.0, description="Estimated depth in meters")
    sizeM: float = Field(0.0, description="Estimated size in meters")
    description: str = Field("", description="Acoustic detection description")

class QualityMetrics(BaseModel):
    snrDb: float = Field(24.5, description="Signal to Noise ratio in dB")
    resolutionCm: float = Field(5.0, description="Sonar pixel resolution in cm")
    coverageScore: float = Field(0.98, description="Acoustic area coverage score")

class ProcessingMetrics(BaseModel):
    inferenceTimeMs: int = Field(..., description="Inference execution time in milliseconds")
    tilesProcessed: int = Field(64, description="Number of image tiles processed")

class InferenceResponse(BaseModel):
    jobId: str
    status: str = Field("completed", description="Execution status: completed or failed")
    modelVersion: str
    quality: QualityMetrics
    anomalies: List[AIAnomalyItem]
    processing: ProcessingMetrics
    errors: List[str] = Field(default_factory=list)
